import { subscribeNewsletter, isDemoMode } from './api.js';
import { $, showToast } from './utils.js';

export function initNewsletter() {
  const newsletterForm = $('#newsletterForm');
  if (!newsletterForm) return;

  newsletterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('button', newsletterForm);
    const emailInput = $('input[type="email"]', newsletterForm);
    const origText = btn.textContent;
    
    const email = emailInput.value.trim();
    if (!email) return;

    btn.textContent = 'Subscribing...';
    btn.disabled = true;

    try {
      // In a real app with Turnstile, we'd grab the token here
      const turnstileToken = "dummy_token_for_now";
      await subscribeNewsletter(email, turnstileToken);

      btn.textContent = '✓ Subscribed!';
      btn.style.background = 'var(--color-success)';

      const isDemo = isDemoMode();
      const msg = isDemo 
        ? 'Newsletter backend not configured. This is a demo simulation.' 
        : 'Thanks for subscribing! Check your inbox for a welcome treat.';
      
      showToast(msg);

      setTimeout(() => {
        btn.textContent = origText;
        btn.style.background = '';
        btn.disabled = false;
        newsletterForm.reset();
      }, 4000);

    } catch (error) {
      console.error("Newsletter subscription failed:", error);
      btn.textContent = origText;
      btn.disabled = false;
      showToast("Subscription failed. Please try again later.", 'error');
    }
  });
}
