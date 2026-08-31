/**
 * Ember & Oak — Restaurant Website Entry Point
 */
import { initNavigation } from './js/navigation.js';
import { initMenu } from './js/menu.js';
import { initGallery } from './js/gallery.js';
import { initReservations } from './js/reservations.js';
import { initNewsletter } from './js/newsletter.js';
import { initAccessibility } from './js/accessibility.js';
import { getRestaurantSettings } from './js/api.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize UI components
  initAccessibility();
  initNavigation();
  initGallery();
  initReservations();
  initNewsletter();

  // Async data loading
  await initMenu();
  
  // Try to load restaurant settings if backend is connected
  try {
    const settings = await getRestaurantSettings();
    if (settings) {
      // Update basic details if present in DB
      // Note: Full dynamic content replacement would go here.
      // For now, we rely on the DB just for settings where needed, 
      // but keep fallback HTML content to prevent flash of empty content.
      // e.g. if (settings.phone) updatePhoneLinks(settings.phone);
    }
  } catch (err) {
    console.log("Using local/fallback settings.");
  }
});
