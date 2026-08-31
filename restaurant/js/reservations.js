import { checkAvailability, createReservation, isDemoMode } from './api.js';
import { $, $$, showToast } from './utils.js';

export function initReservations() {
  const contactForm = $('#contactForm');
  const dateInput = $('#resDate');
  const guestsInput = $('#resGuests');
  const timeSelect = $('#resTime');
  const submitBtn = $('#submitBtn');

  if (!contactForm) return;

  // Set minimum date to today
  if (dateInput) {
    // We should technically use restaurant timezone, but local is ok for the picker min date
    const today = new Date();
    dateInput.setAttribute('min', today.toISOString().split('T')[0]);
  }

  // Handle availability checking
  async function updateAvailability() {
    const date = dateInput.value;
    const guests = guestsInput.value;

    if (!date || !guests) return;

    // Show loading state in time select
    timeSelect.innerHTML = '<option value="" disabled selected>Checking availability...</option>';
    timeSelect.disabled = true;

    try {
      const availableTimes = await checkAvailability(date, parseInt(guests, 10));
      
      if (availableTimes.length === 0) {
        timeSelect.innerHTML = '<option value="" disabled selected>No times available</option>';
      } else {
        timeSelect.innerHTML = '<option value="" disabled selected>Select time</option>' + 
          availableTimes.map(time => {
            // Format time for display (e.g., "17:30" to "5:30 PM")
            const [hourStr, min] = time.split(':');
            const hour = parseInt(hourStr, 10);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            return `<option value="${time}">${displayHour}:${min} ${ampm}</option>`;
          }).join('');
        timeSelect.disabled = false;
      }
    } catch (error) {
      console.error("Error checking availability:", error);
      timeSelect.innerHTML = '<option value="" disabled selected>Error loading times</option>';
    }
  }

  dateInput.addEventListener('change', updateAvailability);
  guestsInput.addEventListener('change', updateAvailability);

  // Validation helper
  function validateField(input) {
    let valid = true;
    const val = input.value.trim();

    if (input.hasAttribute('required') && !val) {
      valid = false;
    }

    if (input.type === 'email' && val) {
      valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    }

    if (input.type === 'tel' && val) {
      valid = /^[\d\s\-\+\(\)]{7,}$/.test(val);
    }

    input.classList.toggle('error', !valid);
    if (!valid) {
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.removeAttribute('aria-invalid');
    }
    return valid;
  }

  const fields = $$('input, select, textarea', contactForm);

  // Live validation: clear error on input
  fields.forEach((f) => {
    f.addEventListener('input', () => {
      f.classList.remove('error');
      f.removeAttribute('aria-invalid');
    });
    f.addEventListener('change', () => {
      f.classList.remove('error');
      f.removeAttribute('aria-invalid');
    });
  });

  // Submit Handler
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    let allValid = true;
    let firstInvalid = null;
    
    fields.forEach((f) => {
      if (!validateField(f)) {
        allValid = false;
        if (!firstInvalid) firstInvalid = f;
      }
    });

    if (!allValid) {
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Set loading state
    const originalBtnHTML = submitBtn.innerHTML;
    const originalWidth = submitBtn.offsetWidth;
    submitBtn.style.width = \`\${originalWidth}px\`; // preserve width
    submitBtn.innerHTML = '<span class="spinner"></span> Checking...';
    submitBtn.disabled = true;

    // Collect data
    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData.entries());

    try {
      const result = await createReservation({
        customer_name: data.name,
        email: data.email,
        phone: data.phone,
        reservation_date: data.date,
        reservation_time: data.time,
        party_size: parseInt(data.guests, 10),
        occasion: data.occasion,
        special_requests: data.notes
      });

      // Success state
      submitBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
             stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
        Confirmed
      `;
      submitBtn.style.background = 'var(--color-success)';
      
      const isDemo = isDemoMode();
      const msg = isDemo 
        ? 'Reservation service has not yet been configured. This is a demo simulation.' 
        : \`Your reservation request has been received. Ref: \${result.reservation_code}\`;
      
      showToast(msg);

      setTimeout(() => {
        submitBtn.innerHTML = originalBtnHTML;
        submitBtn.style.background = '';
        submitBtn.style.width = '';
        submitBtn.disabled = false;
        contactForm.reset();
        
        // Reset time select
        timeSelect.innerHTML = '<option value="" disabled selected>Select time</option>';
        timeSelect.disabled = false; // keep enabled so user can re-select if needed, though they need date first
      }, 4000);

    } catch (error) {
      console.error("Reservation submission failed:", error);
      submitBtn.innerHTML = originalBtnHTML;
      submitBtn.disabled = false;
      submitBtn.style.width = '';
      
      showToast(error.message || "Failed to submit reservation. Please try again or call us.", 'error');
    }
  });
}
