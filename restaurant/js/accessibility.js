export function initAccessibility() {
  // Add keyboard focus visible class for better focus outlines
  document.body.addEventListener('mousedown', function() {
    document.body.classList.add('using-mouse');
  });

  document.body.addEventListener('keydown', function(event) {
    if (event.key === 'Tab') {
      document.body.classList.remove('using-mouse');
    }
  });
}
