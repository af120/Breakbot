import { $, $$ } from './utils.js';

export function initGallery() {
  const lightbox = $('#lightbox');
  const lightboxImg = $('#lightboxImg');
  const lightboxCap = $('#lightboxCaption');
  const lightboxClose = $('#lightboxClose');
  
  if (!lightbox) return;

  let lastFocusedElement = null;

  function openLightbox(src, alt, caption) {
    lastFocusedElement = document.activeElement;
    
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightboxCap.textContent = caption || '';
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Accessibility: Set focus to close button
    lightbox.setAttribute('aria-hidden', 'false');
    setTimeout(() => {
        if(lightboxClose) lightboxClose.focus();
    }, 100);
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    
    // Accessibility: Restore focus
    if (lastFocusedElement) {
        lastFocusedElement.focus();
    }
  }

  $$('.gallery-item').forEach((item) => {
    // Make gallery items keyboard accessible
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    
    item.addEventListener('click', () => {
      const img = $('img', item);
      openLightbox(img.src, img.alt, item.dataset.caption || '');
    });
    
    item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            item.click();
        }
    });
  });

  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
  }
  
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });
  
  // Basic focus trap for lightbox
  lightbox.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' && lightbox.classList.contains('active')) {
          e.preventDefault(); // Just keep focus on close button since it's the only interactive element
          if (lightboxClose) lightboxClose.focus();
      }
  });
}
