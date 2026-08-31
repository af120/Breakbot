import { getMenuCategories, getMenuItems, isDemoMode } from './api.js';
import { $, $$ } from './utils.js';

// Fallback demo data
const demoMenuData = {
  starters: [
    { name: 'Artisan Charcuterie Board', price: 24, desc: 'Cured meats, aged cheeses, honeycomb, cornichons, and house-baked crackers', tags: ['Shareable'], img_url: 'images/appetizer-platter.jpg' },
    { name: 'Seared Diver Scallops', price: 22, desc: 'Pan-seared scallops with cauliflower purée, brown butter, and crispy capers', tags: ['Gluten Free'], img_url: 'images/hero-dish.jpg' },
    { name: 'Burrata & Heirloom Tomato', price: 18, desc: 'Creamy burrata with vine-ripened tomatoes, basil oil, and aged balsamic', tags: ['Vegetarian'], img_url: 'images/appetizer-platter.jpg' },
    { name: 'Wagyu Beef Tartare', price: 26, desc: 'Hand-cut wagyu with quail egg yolk, shallots, capers, and truffle aioli', tags: ["Chef's Pick"], img_url: 'images/steak-entree.jpg' },
  ],
  mains: [
    { name: 'Dry-Aged Ribeye', price: 58, desc: '45-day dry-aged prime ribeye, herb butter, roasted root vegetables, red wine jus', tags: ['Signature'], img_url: 'images/steak-entree.jpg' },
    { name: 'Pan-Seared Salmon', price: 42, desc: 'Atlantic salmon, saffron risotto, blistered cherry tomatoes, micro herb salad', tags: ['Gluten Free'], img_url: 'images/hero-dish.jpg' },
    { name: 'Truffle Mushroom Risotto', price: 34, desc: 'Arborio rice, wild mushroom medley, black truffle shavings, aged parmesan', tags: ['Vegetarian'], img_url: 'images/appetizer-platter.jpg' },
    { name: 'Roasted Duck Breast', price: 46, desc: 'Cherry-glazed duck breast, sweet potato purée, wilted greens, port reduction', tags: ["Chef's Pick"], img_url: 'images/steak-entree.jpg' },
  ],
  desserts: [
    { name: 'Chocolate Lava Cake', price: 16, desc: 'Valrhona dark chocolate fondant, gold leaf, raspberry coulis, vanilla bean gelato', tags: ['Signature'], img_url: 'images/dessert-chocolate.jpg' },
    { name: 'Crème Brûlée', price: 14, desc: 'Classic Madagascar vanilla custard with a caramelized sugar crust', tags: ['Gluten Free'], img_url: 'images/dessert-chocolate.jpg' },
    { name: 'Tiramisu', price: 15, desc: 'Espresso-soaked ladyfingers, mascarpone cream, cocoa dust, Amaretto drizzle', tags: [], img_url: 'images/dessert-chocolate.jpg' },
    { name: 'Seasonal Fruit Tart', price: 14, desc: 'Buttery pastry shell, vanilla pastry cream, fresh seasonal berries, mint', tags: ['Vegetarian'], img_url: 'images/dessert-chocolate.jpg' },
  ],
  drinks: [
    { name: 'Ember Old Fashioned', price: 18, desc: 'Smoked bourbon, demerara syrup, Angostura bitters, flamed orange peel', tags: ['Signature'], img_url: 'images/appetizer-platter.jpg' },
    { name: 'Rosemary Gin Fizz', price: 16, desc: 'London dry gin, fresh lemon, rosemary syrup, egg white, sparkling water', tags: [], img_url: 'images/hero-dish.jpg' },
    { name: 'Midnight Espresso Martini', price: 17, desc: 'Vodka, fresh espresso, coffee liqueur, vanilla, dark chocolate shavings', tags: ['Popular'], img_url: 'images/dessert-chocolate.jpg' },
    { name: 'Garden Spritz', price: 15, desc: 'Aperol, elderflower liqueur, Prosecco, cucumber, fresh basil', tags: [], img_url: 'images/appetizer-platter.jpg' },
  ],
};

let menuCategories = [];
let menuItems = [];

export async function initMenu() {
  const menuTabsContainer = $('#menuTabs');
  const menuGrid = $('#menuGrid');
  if (!menuTabsContainer || !menuGrid) return;

  try {
    if (!isDemoMode()) {
      menuCategories = await getMenuCategories();
      const rawItems = await getMenuItems();
      
      // Organize items by category slug
      menuCategories.forEach(cat => {
        demoMenuData[cat.slug] = rawItems
          .filter(item => item.category_id === cat.id)
          .map(item => ({
            name: item.name,
            price: item.price,
            desc: item.description,
            img_url: item.image_url || 'images/hero-dish.jpg',
            tags: item.menu_item_tags ? item.menu_item_tags.map(t => t.tag) : []
          }));
      });
      
      // Render tabs dynamically if we got data from API
      if (menuCategories.length > 0) {
        menuTabsContainer.innerHTML = menuCategories.map((cat, index) => `
          <button class="menu-tab ${index === 0 ? 'active' : ''}" data-category="${cat.slug}" role="tab" aria-selected="${index === 0 ? 'true' : 'false'}" aria-controls="menuGrid" id="tab-${cat.slug}">
            ${cat.name}
          </button>
        `).join('');
      }
    }
  } catch (error) {
    console.error("Error loading menu data:", error);
    // Show fallback error in grid
    menuGrid.innerHTML = `<div class="menu-error">We're unable to load the online menu right now. Please try again shortly.</div>`;
    return;
  }

  // Event listener for tabs
  menuTabsContainer.addEventListener('click', (e) => {
    const tab = e.target.closest('.menu-tab');
    if (!tab) return;

    $$('.menu-tab', menuTabsContainer).forEach((t) => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    renderMenu(tab.dataset.category);
  });

  // Keyboard navigation for tabs (Accessibility)
  menuTabsContainer.addEventListener('keydown', (e) => {
    const tabs = $$('.menu-tab', menuTabsContainer);
    let currentIndex = tabs.findIndex(t => t.classList.contains('active'));
    
    if (e.key === 'ArrowRight') {
      currentIndex = (currentIndex + 1) % tabs.length;
      tabs[currentIndex].focus();
      tabs[currentIndex].click();
    } else if (e.key === 'ArrowLeft') {
      currentIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      tabs[currentIndex].focus();
      tabs[currentIndex].click();
    } else if (e.key === 'Home') {
      tabs[0].focus();
      tabs[0].click();
    } else if (e.key === 'End') {
      tabs[tabs.length - 1].focus();
      tabs[tabs.length - 1].click();
    }
  });

  // Initial render
  const firstTab = $('.menu-tab', menuTabsContainer);
  if (firstTab) {
    renderMenu(firstTab.dataset.category);
  }
}

function renderMenu(categorySlug) {
  const menuGrid = $('#menuGrid');
  const items = demoMenuData[categorySlug] || [];

  if (items.length === 0) {
     menuGrid.innerHTML = `<p class="menu-empty">No items available in this category.</p>`;
     return;
  }

  // Animate out
  menuGrid.style.opacity = '0';
  menuGrid.style.transform = 'translateY(16px)';

  setTimeout(() => {
    menuGrid.innerHTML = items
      .map(
        (item) => `
      <div class="menu-item">
        <div class="menu-item-image">
          <img src="${item.img_url || item.img}" alt="${item.name}" loading="lazy" width="90" height="90">
        </div>
        <div class="menu-item-info">
          <div class="menu-item-header">
            <h4 class="menu-item-name">${item.name}</h4>
            <span class="menu-item-price">$${Number(item.price).toFixed(2).replace(/\.00$/, '')}</span>
          </div>
          <p class="menu-item-desc">${item.desc}</p>
          ${
            item.tags && item.tags.length
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
