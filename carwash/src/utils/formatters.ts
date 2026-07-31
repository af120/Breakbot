export function formatIQD(amount: number): string {
  if (!amount && amount !== 0) return '0 IQD';
  return Number(amount).toLocaleString('en-US') + ' IQD';
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB');
}

export function formatTime(timeStr: string): string {
  if (!timeStr) return '';
  return timeStr.substring(0, 5);
}

export function generateWhatsAppUrl(phone: string, message: string): string {
  const cleaned = phone.replace(/[^0-9]/g, '');
  const intl = cleaned.startsWith('0') ? '964' + cleaned.substring(1) : cleaned;
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
}

export function generateCallUrl(phone: string): string {
  return `tel:${phone}`;
}

export function generateMapsUrl(lat: string, lng: string): string {
  if (!lat || !lng) return '#';
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export const statusColors: Record<string, string> = {
  pending: 'badge-pending',
  confirmed: 'badge-confirmed',
  alternative_suggested: 'badge-warning',
  arrived: 'badge-info',
  waiting: 'badge-warning',
  washing: 'badge-info',
  interior_cleaning: 'badge-info',
  drying: 'badge-info',
  ready: 'badge-success',
  completed: 'badge-completed',
  cancelled: 'badge-cancelled',
  no_show: 'badge-danger',
};

export function getLocalizedName(item: any, prefix: string, lang: string) {
  if (!item) return '';
  return item[`${prefix}_${lang}`] || item[`${prefix}_en`] || item[prefix] || '';
}
