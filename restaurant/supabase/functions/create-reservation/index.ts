import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Need service role to bypass RLS for insert
    )

    const body = await req.json()
    // Verify Turnstile in a real production setup here
    
    // Generate unique code
    const dateStr = body.reservation_date.replace(/-/g, '').substring(2);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const reservation_code = \`EO-\${dateStr}-\${random}\`;

    // 1. Double-booking check (Transaction-like or atomic check could be done via a Postgres function)
    // For this edge function, we rely on get_available_slots to check again
    const { data: slots, error: slotsError } = await supabaseClient.rpc('get_available_slots', {
      p_date: body.reservation_date,
      p_party_size: body.party_size
    });

    if (slotsError) throw slotsError;
    
    // Check if requested time is still in available slots
    const requestedTimeStr = body.reservation_time.substring(0, 5); // "17:30"
    if (!slots.some(s => s.available_time === requestedTimeStr)) {
        throw new Error("Sorry, this time slot is no longer available.");
    }

    // 2. Insert Reservation
    const cancellation_token = crypto.randomUUID();
    
    const { data, error } = await supabaseClient
      .from('reservations')
      .insert({
        ...body,
        reservation_code,
        cancellation_token
      })
      .select()
      .single()

    if (error) throw error;

    // 3. Send email via Resend or another provider (stubbed here)
    // await fetch('https://api.resend.com/emails', { ... })

    return new Response(
      JSON.stringify({ success: true, reservation_code: data.reservation_code }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
