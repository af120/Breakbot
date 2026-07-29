/**
 * Ember & Oak — Restaurant Website
 * All interactive behavior: menu tabs, mobile nav, lightbox,
 * form validation, scroll reveal, scroll spy, parallax, back-to-top.
 */
(function () {
  'use strict';

  // ============================================================
  //  MENU DATA
  // ============================================================
  const menuData = {
    starters: [
      {
        name: 'Artisan Charcuterie Board',
        price: '$24',
        desc: 'Cured meats, aged cheeses, honeycomb, cornichons, and house-baked crackers',
        tags: ['Shareable'],
        img: 'images/appetizer-platter.jpg',
      },
      {
        name: 'Seared Diver Scallops',
        price: '$22',
        desc: 'Pan-seared scallops with cauliflower purée, brown butter, and crispy capers',
        tags: ['Gluten Free'],
        img: 'images/hero-dish.jpg',
      },
      {
        name: 'Burrata & Heirloom Tomato',
        price: '$18',
        desc: 'Creamy burrata with vine-ripened tomatoes, basil oil, and aged balsamic',
        tags: ['Vegetarian'],
        img: 'images/appetizer-platter.jpg',
      },
      {
        name: 'Wagyu Beef Tartare',
        price: '$26',
        desc: 'Hand-cut wagyu with quail egg yolk, shallots, capers, and truffle aioli',
        tags: ["Chef's Pick"],
        img: 'images/steak-entree.jpg',
      },
    ],
    mains: [
      {
        name: 'Dry-Aged Ribeye',
        price: '$58',
        desc: '45-day dry-aged prime ribeye, herb butter, roasted root vegetables, red wine jus',
        tags: ['Signature'],
        img: 'images/steak-entree.jpg',
      },
      {
        name: 'Pan-Seared Salmon',
        price: '$42',
        desc: 'Atlantic salmon, saffron risotto, blistered cherry tomatoes, micro herb salad',
        tags: ['Gluten Free'],
        img: 'images/hero-dish.jpg',
      },
      {
        name: 'Truffle Mushroom Risotto',
        price: '$34',
        desc: 'Arborio rice, wild mushroom medley, black truffle shavings, aged parmesan',
        tags: ['Vegetarian'],
        img: 'images/appetizer-platter.jpg',
      },
      {
        name: 'Roasted Duck Breast',
        price: '$46',
        desc: 'Cherry-glazed duck breast, sweet potato purée, wilted greens, port reduction',
        tags: ["Chef's Pick"],
        img: 'images/steak-entree.jpg',
      },
    ],
    desserts: [
      {
        name: 'Chocolate Lava Cake',
        price: '$16',
        desc: 'Valrhona dark chocolate fondant, gold leaf, raspberry coulis, vanilla bean gelato',
        tags: ['Signature'],
        img: 'images/dessert-chocolate.jpg',
      },
      {
        name: 'Crème Brûlée',
        price: '$14',
        desc: 'Classic Madagascar vanilla custard with a caramelized sugar crust',
        tags: ['Gluten Free'],
        img: 'images/dessert-chocolate.jpg',
      },
      {
        name: 'Tiramisu',
        price: '$15',
        desc: 'Espresso-soaked ladyfingers, mascarpone cream, cocoa dust, Amaretto drizzle',
        tags: [],
        img: 'images/dessert-chocolate.jpg',
      },
      {
        name: 'Seasonal Fruit Tart',
        price: '$14',
        desc: 'Buttery pastry shell, vanilla pastry cream, fresh seasonal berries, mint',
        tags: ['Vegetarian'],
        img: 'images/dessert-chocolate.jpg',
      },
    ],
    drinks: [
      {
        name: 'Ember Old Fashioned',
        price: '$18',
        desc: 'Smoked bourbon, demerara syrup, Angostura bitters, flamed orange peel',
        tags: ['Signature'],
        img: 'images/appetizer-platter.jpg',
      },
      {
        name: 'Rosemary Gin Fizz',
        price: '$16',
        desc: 'London dry gin, fresh lemon, rosemary syrup, egg white, sparkling water',
        tags: [],
        img: 'images/hero-dish.jpg',
      },
      {
        name: 'Midnight Espresso Martini',
        price: '$17',
        desc: 'Vodka, fresh espresso, coffee liqueur, vanilla, dark chocolate shavings',
        tags: ['Popular'],
        img: 'images/dessert-chocolate.jpg',
      },
      {
        name: 'Garden Spritz',
        price: '$15',
        desc: 'Aperol, elderflower liqueur, Prosecco, cucumber, fresh basil',
        tags: [],
        img: 'images/appetizer-platter.jpg',
      },
    ],
  };

  // ============================================================
  //  DOM REFERENCES
  // ============================================================
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const navbar      = $('#navbar');
  const navLinks    = $('#navLinks');
  const navToggle   = $('#navToggle');
  const navOverlay  = $('#navOverlay');
  const backToTop   = $('#backToTop');
  const menuGrid    = $('#menuGrid');
  const lightbox    = $('#lightbox');
  const lightboxImg = $('#lightboxImg');
  const lightboxCap = $('#lightboxCaption');
  const contactForm = $('#contactForm');
  const newsletter  = $('#newsletterForm');
  const successToast = $('#successToast');

  // ============================================================
  //  1. NAVBAR SCROLL EFFECT
  // ============================================================
  function onScroll() {
    const y = window.scrollY;
    navbar.classList.toggle('scrolled', y > 60);
    backToTop.classList.toggle('visible', y > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load

  // ============================================================
  //  2. SCROLL SPY — highlight active nav link
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
  //  3. MOBILE NAVIGATION
  // ============================================================
  function openMobileNav() {
    navToggle.classList.add('active');
    navLinks.classList.add('open');
    navOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileNav() {
    navToggle.classList.remove('active');
    navLinks.classList.remove('open');
    navOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  navToggle.addEventListener('click', () => {
    navLinks.classList.contains('open') ? closeMobileNav() : openMobileNav();
  });

  navOverlay.addEventListener('click', closeMobileNav);

  // Close nav on any link click
  $$('a', navLinks).forEach((link) => {
    link.addEventListener('click', closeMobileNav);
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (navLinks.classList.contains('open')) closeMobileNav();
      if (lightbox.classList.contains('active')) closeLightbox();
    }
  });

  // ============================================================
  //  4. MENU TABS + RENDERING
  // ============================================================
  function renderMenu(category) {
    const items = menuData[category];
    if (!items) return;

    // Animate out
    menuGrid.style.opacity = '0';
    menuGrid.style.transform = 'translateY(16px)';

    setTimeout(() => {
      menuGrid.innerHTML = items
        .map(
          (item) => `
        <div class="menu-item">
          <div class="menu-item-image">
            <img src="${item.img}" alt="${item.name}" loading="lazy" width="90" height="90">
          </div>
          <div class="menu-item-info">
            <div class="menu-item-header">
              <h4 class="menu-item-name">${item.name}</h4>
              <span class="menu-item-price">${item.price}</span>
            </div>
            <p class="menu-item-desc">${item.desc}</p>
            ${
              item.tags.length
                ? `<div class="menu-item-tags">${item.tags
                    .map((t) => `<span class="menu-item-tag">${t}</span>`)
                    .join('')}</div>`
                : ''
            }
          </div>
        </div>`
        )
        .join('');

      // Animate in
      requestAnimationFrame(() => {
        menuGrid.style.opacity = '1';
        menuGrid.style.transform = 'translateY(0)';
      });
    }, 250);
  }

  $('#menuTabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.menu-tab');
    if (!tab) return;

    $$('.menu-tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    renderMenu(tab.dataset.category);
  });

  renderMenu('starters'); // default

  // ============================================================
  //  5. GALLERY LIGHTBOX
  // ============================================================
  function openLightbox(src, alt, caption) {
    lightboxImg.src = src;
    lightboxImg.alt = alt;
    lightboxCap.textContent = caption || '';
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  $$('.gallery-item').forEach((item) => {
    item.addEventListener('click', () => {
      const img = $('img', item);
      openLightbox(img.src, img.alt, item.dataset.caption || '');
    });
  });

  $('#lightboxClose').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // ============================================================
  //  6. SCROLL REVEAL (IntersectionObserver)
  // ============================================================
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

  $$('.reveal').forEach((el) => revealObserver.observe(el));

  // ============================================================
  //  7. BACK TO TOP
  // ============================================================
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ============================================================
  //  8. CONTACT FORM — validation + submit
  // ============================================================
  function showToast(message) {
    successToast.querySelector('span').textContent = message;
    successToast.classList.add('show');
    setTimeout(() => successToast.classList.remove('show'), 4000);
  }

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
    return valid;
  }

  if (contactForm) {
    const fields = $$('input, select, textarea', contactForm);

    // Live validation: clear error on input
    fields.forEach((f) => {
      f.addEventListener('input', () => f.classList.remove('error'));
      f.addEventListener('change', () => f.classList.remove('error'));
    });

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      let allValid = true;
      fields.forEach((f) => {
        if (!validateField(f)) allValid = false;
      });

      if (!allValid) return;

      // Simulate submit
      const btn = $('.form-submit', contactForm);
      const original = btn.innerHTML;
      btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
             stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
        Confirmed!
      `;
      btn.style.background = '#2d8a4e';
      btn.style.pointerEvents = 'none';

      showToast('Reservation confirmed! We look forward to seeing you.');

      setTimeout(() => {
        btn.innerHTML = original;
        btn.style.background = '';
        btn.style.pointerEvents = '';
        contactForm.reset();
      }, 3500);
    });
  }

  // ============================================================
  //  9. NEWSLETTER FORM
  // ============================================================
  if (newsletter) {
    newsletter.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = $('button', newsletter);
      const orig = btn.textContent;
      btn.textContent = '✓ Subscribed!';
      btn.style.background = '#2d8a4e';

      showToast('Thanks for subscribing! Check your inbox for a welcome treat.');

      setTimeout(() => {
        btn.textContent = orig;
        btn.style.background = '';
        newsletter.reset();
      }, 3000);
    });
  }

  // ============================================================
  //  10. SET MINIMUM DATE ON RESERVATION DATE PICKER
  // ============================================================
  const dateInput = $('#resDate');
  if (dateInput) {
    dateInput.setAttribute('min', new Date().toISOString().split('T')[0]);
  }

  // ============================================================
  //  11. HERO PARALLAX (subtle, performance-friendly)
  // ============================================================
  const heroBg = $('.hero-bg img');
  let ticking = false;

  if (heroBg) {
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            const y = window.scrollY;
            if (y < window.innerHeight * 1.2) {
              heroBg.style.transform = `scale(${1.05 + y * 0.0001}) translateY(${y * 0.15}px)`;
            }
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true }
    );
  }
})();
