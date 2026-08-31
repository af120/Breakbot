export const $ = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

export function showToast(message, type = 'success') {
  const toast = $('#successToast');
  if (!toast) return;
  
  const span = toast.querySelector('span');
  if (span) span.textContent = message;
  
  // Update icon based on type
  const svg = toast.querySelector('svg');
  if (svg) {
    if (type === 'error') {
      svg.innerHTML = '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>';
      toast.style.backgroundColor = 'var(--color-error)';
    } else {
      svg.innerHTML = '<path d="M20 6L9 17l-5-5"/>';
      toast.style.backgroundColor = '';
    }
  }

  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD' // Should be configurable later
  }).format(amount);
}
