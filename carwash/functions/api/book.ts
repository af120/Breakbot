import { v4 as uuidv4 } from 'uuid';

export async function onRequestPost(context: any) {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    const { name, phone, date, time, vehicle_type, service_id } = body;

    // Basic Validation
    if (!phone || !date || !time || !vehicle_type || !service_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }
    
    // Sanitize and Validate Phone (Basic regex for Iraqi numbers like 0750 xxx xxxx)
    const phoneClean = phone.replace(/[^0-9]/g, '');
    if (phoneClean.length < 10 || phoneClean.length > 15) {
      return new Response(JSON.stringify({ error: 'Invalid phone number format' }), { status: 400 });
    }

    // Check for rapid duplicate submissions from same phone for same date
    const duplicate = await env.DB.prepare(
      `SELECT id FROM reservations r 
       JOIN customers c ON r.customer_id = c.id 
       WHERE c.phone = ? AND r.date = ?`
    ).bind(phoneClean, date).first();

    if (duplicate) {
      return new Response(JSON.stringify({ error: 'You already have a booking on this date' }), { status: 429 });
    }

    // Generate unique reference (e.g. CW-XXXX)
    const reference = 'CW-' + Math.random().toString(36).substr(2, 6).toUpperCase();

    // Transaction logic (simulated with batch since D1 doesn't fully support interactive transactions yet)
    const customerId = uuidv4();
    const vehicleId = uuidv4();
    const reservationId = uuidv4();
    const resServiceId = uuidv4();

    // Fetch service price (fallback to default if not found)
    const service = await env.DB.prepare('SELECT default_price FROM services WHERE id = ?').bind(service_id).first();
    const price = service ? service.default_price : 15000;

    await env.DB.batch([
      // Upsert Customer
      env.DB.prepare('INSERT INTO customers (id, name, phone) VALUES (?, ?, ?) ON CONFLICT(phone) DO UPDATE SET name=excluded.name').bind(customerId, name || 'Guest', phoneClean),
      
      // Get the true customer ID after upsert (could be existing)
      // For simplicity in this demo, we'll assume the insert is fine, but properly we'd query it.
      // D1 doesn't have RETURNING for UPSERT easily yet in all bindings. Let's just do it manually:
    ]);

    // Let's do it safely without batch due to UPSERT limitation
    let dbCustomer = await env.DB.prepare('SELECT id FROM customers WHERE phone = ?').bind(phoneClean).first();
    if (!dbCustomer) {
      await env.DB.prepare('INSERT INTO customers (id, name, phone) VALUES (?, ?, ?)').bind(customerId, name || 'Guest', phoneClean).run();
      dbCustomer = { id: customerId };
    }

    await env.DB.batch([
      env.DB.prepare('INSERT INTO vehicles (id, customer_id, type) VALUES (?, ?, ?)').bind(vehicleId, dbCustomer.id, vehicle_type),
      env.DB.prepare('INSERT INTO reservations (id, reference, customer_id, vehicle_id, date, time, status) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(reservationId, dbCustomer.id, vehicleId, date, time, 'pending'),
      env.DB.prepare('INSERT INTO reservation_services (id, reservation_id, service_id, price_at_booking) VALUES (?, ?, ?, ?)').bind(resServiceId, reservationId, service_id, price)
    ]);

    return new Response(JSON.stringify({ 
      success: true, 
      reference,
      message: 'Booking confirmed' 
    }), { status: 201 });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
