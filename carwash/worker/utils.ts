export function generateId() {
  return crypto.randomUUID();
}
export function generateBookingRef() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
export function formatIQD(amount: number) {
  return new Intl.NumberFormat('en-IQ', { style: 'currency', currency: 'IQD', maximumFractionDigits: 0 }).format(amount);
}
export function getBaghdadTime() {
  return new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Baghdad"}));
}
export function validateIraqiPhone(phone: string) {
  const regex = /^(07[3-9][0-9]{8})$/;
  return regex.test(phone);
}
export async function createAuditLog(db: any, action: string, userId: string, userName: string, recordType: string, recordId: string, oldValue: any, newValue: any, reason: string = '') {
  await db.prepare(`
    INSERT INTO audit_logs (id, action, user_id, user_name, record_type, record_id, old_value, new_value, reason, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    generateId(), action, userId, userName, recordType, recordId,
    oldValue ? JSON.stringify(oldValue) : null,
    newValue ? JSON.stringify(newValue) : null,
    reason,
    new Date().toISOString()
  ).run();
}
