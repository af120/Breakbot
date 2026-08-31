import { $, $$ } from './utils.js';

export function initNavigation() {
  const navbar = $('#navbar');
  const navLinks = $('#navLinks');
  const navToggle = $('#navToggle');
  const navOverlay = $('#navOverlay');
  const backToTop = $('#backToTop');
  const lightbox = $('#lightbox');

  // ============================================================
  //  NAVBAR SCROLL EFFECT
  // ============================================================
  function onScroll() {
    const y = window.scrollY;
    if(navbar) navbar.classList.toggle('scrolled', y > 60);
    if(backToTop) backToTop.classList.toggle('visible', y > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load

  // ============================================================
  //  SCROLL SPY — highlight active nav link
  // ============================================================
  const sections = $$('section[id]');
  const navItems = $$('#navLinks a[href^="#"]').filter(
    (a) => !a.classList.contains('nav-reserve-btn')
  );

  function updateScrollSpy() {
    const scrollY = window.scrollY + window.innerHeight / 3;
    let currentId = '';
    
    sections.forEach((sec) => {
      if (sec.offsetTop <= scrollY) {
        currentId = sec.id;
      }
    });

    navItems.forEach((a) => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + currentId);
    });
  }

  window.addEventListener('scroll', updateScrollSpy, { passive: true });
  updateScrollSpy();

  // ============================================================
  //  MOBILE NAVIGATION
  // ============================================================
  let lastFocusedElement = null;

  function openMobileNav() {
    lastFocusedElement = document.activeElement;
    navToggle.classList.add('active');
    navToggle.setAttribute('aria-expanded', 'true');
    navLinks.classList.add('open');
    navOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    
    // Focus first link
    const firstLink = navLinks.querySelector('a');
    if (firstLink) setTimeout(() => firstLink.focus(), 100);
  }

  function closeMobileNav() {
    navToggle.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');
    navLinks.classList.remove('open');
    navOverlay.classList.remove('open');
    document.body.style.overflow = '';
    
    if (lastFocusedElement) {
        lastFocusedElement.focus();
    }
  }

  if (navToggle) {
      navToggle.addEventListener('click', () => {
        navLinks.classList.contains('open') ? closeMobileNav() : openMobileNav();
      });
  }

  if (navOverlay) {
      navOverlay.addEventListener('click', closeMobileNav);
  }

  // Close nav on any link click
  $$('a', navLinks).forEach((link) => {
    link.addEventListener('click', closeMobileNav);
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (navLinks && navLinks.classList.contains('open')) closeMobileNav();
    }
  });

  // ============================================================
  //  BACK TO TOP
  // ============================================================
  if (backToTop) {
      backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
  }

  // ============================================================
  //  SCROLL REVEAL (IntersectionObserver)
  // ============================================================
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );

  $$('.reveal').forEach((el) => {
    if (prefersReducedMotion) {
        el.classList.add('visible'); // Show immediately if reduced motion
    } else {
        revealObserver.observe(el);
    }
  });

  // ============================================================
  //  HERO PARALLAX (subtle, performance-friendly)
  // ============================================================
  const heroBg = $('.hero-bg img');
  let ticking = false;

  if (heroBg && !prefersReducedMotion) {
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            const y = window.scrollY;
            if (y < window.innerHeight * 1.2) {
              heroBg.style.transform = \`scale(\${1.05 + y * 0.0001}) translateY(\${y * 0.15}px)\`;
            }
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true }
    );
  }
}
