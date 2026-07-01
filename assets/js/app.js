/*
  TULA MARKET - Global interactions and UI enhancements
  Extends the marketplace into a vendor-first commerce platform while preserving existing flows.
*/
function getBasePath() {
  const pathname = window.location.pathname;
  if (pathname.includes('/pages/')) return '../';
  if (pathname.includes('/store/')) return '../../';
  return '';
}

const basePath = getBasePath();

const commerceData = {
  stores: [
    {
      slug: 'jamosky',
      name: 'Jamosky Studio',
      tagline: 'Luxury fashion and bespoke essentials',
      description: 'A refined storefront for contemporary designers, private fittings, and curated collections.',
      rating: 4.9,
      followers: 1820,
      featured: true,
      new: true,
      category: 'Fashion',
      location: 'Lagos',
      banner: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80',
      logo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
      accent: '#d4af37',
      featuredProducts: ['Studio Knit Set', 'Midnight Tote', 'Velvet Elixir']
    },
    {
      slug: 'glamorous-morgan',
      name: 'Glamorous Morgan',
      tagline: 'Beauty rituals and premium gifting',
      description: 'A polished beauty brand with artisanal skincare, luxury bundles, and concierge styling.',
      rating: 4.8,
      followers: 1240,
      featured: true,
      category: 'Beauty',
      location: 'Abuja',
      banner: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
      logo: 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?auto=format&fit=crop&w=200&q=80',
      accent: '#f3a7b5',
      featuredProducts: ['Velvet Elixir', 'Glow Serum', 'Signature Box']
    },
    {
      slug: 'gods-favour-pharmacy',
      name: 'Gods Favour Pharmacy',
      tagline: 'Wellness essentials and everyday care',
      description: 'Modern health products and trusted care for families and professionals.',
      rating: 4.7,
      followers: 960,
      category: 'Wellness',
      location: 'Port Harcourt',
      banner: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80',
      logo: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=200&q=80',
      accent: '#7ec8e3',
      featuredProducts: ['Daily Care Kit', 'Immune Boost', 'Hydration Pack']
    },
    {
      slug: 'aurora-atelier',
      name: 'Aurora Atelier',
      tagline: 'Curated accessories and statement pieces',
      description: 'Statement accessories, fine detailing, and private capsule drops for discerning shoppers.',
      rating: 4.9,
      followers: 2140,
      featured: true,
      new: true,
      category: 'Accessories',
      location: 'Ibadan',
      banner: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80',
      logo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
      accent: '#d7b56d',
      featuredProducts: ['Signature Chronograph', 'Platinum Pendant', 'Velvet Runner']
    }
  ],
  products: [
    { name: 'Studio Knit Set', price: 220, vendor: 'Jamosky Studio', slug: 'jamosky', category: 'Fashion', rating: 4.9, image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80' },
    { name: 'Midnight Tote', price: 340, vendor: 'Jamosky Studio', slug: 'jamosky', category: 'Accessories', rating: 4.8, image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80' },
    { name: 'Digital Timepiece', price: 650, vendor: 'Aurora Atelier', slug: 'aurora-atelier', category: 'Electronics', rating: 4.9, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80' },
    { name: 'Velvet Elixir', price: 140, vendor: 'Glamorous Morgan', slug: 'glamorous-morgan', category: 'Beauty', rating: 4.7, image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80' },
    { name: 'Glow Serum', price: 95, vendor: 'Glamorous Morgan', slug: 'glamorous-morgan', category: 'Beauty', rating: 4.8, image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80' },
    { name: 'Daily Care Kit', price: 78, vendor: 'Gods Favour Pharmacy', slug: 'gods-favour-pharmacy', category: 'Wellness', rating: 4.6, image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80' }
  ],
  categories: [
    { name: 'Fashion', count: '24 stores' },
    { name: 'Beauty', count: '16 stores' },
    { name: 'Wellness', count: '11 stores' },
    { name: 'Accessories', count: '8 stores' }
  ],
  metrics: {
    followers: 4820,
    storeReviews: 318,
    featuredStores: 4,
    growth: '+18% this month'
  }
};

window.tulaCommerceData = commerceData;

function getCurrentSession() {
  return window.tulaAuth?.getSession?.() || null;
}

function getHeaderMarkup() {
  const session = getCurrentSession();
  const role = session?.role || 'guest';
  const isLoggedIn = Boolean(session);
  const displayName = session?.name || session?.email || 'Member';

  let navLinks = `
    <a href="${basePath}index.html">Home</a>
    <a href="${basePath}pages/about.html">About</a>
    <a href="${basePath}pages/shop.html">Shop</a>
    <a href="${basePath}pages/product.html">Product</a>
    <a href="${basePath}pages/cart.html">Cart</a>
    <a href="${basePath}pages/contact.html">Contact</a>
  `;

  if (role === 'customer') {
    navLinks += `<a href="${basePath}pages/customer-dashboard.html">Dashboard</a>`;
  } else if (role === 'vendor') {
    navLinks += `<a href="${basePath}pages/vendor-dashboard.html">Vendor Hub</a>`;
  } else if (role === 'admin') {
    navLinks += `<a href="${basePath}pages/admin-dashboard.html">Admin</a>`;
  }

  let authActions = `
    <button class="icon-btn" id="themeToggle" aria-label="Toggle theme">☼</button>
    <a class="btn btn-primary" href="${basePath}pages/login.html">Sign In</a>
    <a class="btn btn-secondary" href="${basePath}pages/register.html">Register</a>
  `;

  if (isLoggedIn) {
    const dashboardLink = role === 'vendor'
      ? `<a class="btn btn-primary" href="${basePath}pages/vendor-dashboard.html">${role === 'vendor' ? 'My Store' : 'Dashboard'}</a>`
      : role === 'admin'
        ? `<a class="btn btn-primary" href="${basePath}pages/admin-dashboard.html">Admin Console</a>`
        : `<a class="btn btn-primary" href="${basePath}pages/customer-dashboard.html">My Dashboard</a>`;

    authActions = `
      <button class="icon-btn" id="themeToggle" aria-label="Toggle theme">☼</button>
      <span class="pill">${displayName}</span>
      ${dashboardLink}
      <button class="btn btn-secondary" id="signOutBtn" type="button">Sign Out</button>
    `;
  }

  return `
    <div class="container header-inner">
      <a class="brand" href="${basePath}index.html">
        <span class="brand-mark">T</span>
        <span>TULA MARKET</span>
      </a>
      <nav class="nav-links" aria-label="Primary navigation">
        ${navLinks}
      </nav>
      <div class="header-actions">
        ${authActions}
        <button class="icon-btn mobile-toggle" id="mobileToggle" aria-label="Open menu">☰</button>
      </div>
    </div>`;
}

const footerMarkup = `
  <div class="container footer-grid">
    <div>
      <div class="brand" style="margin-bottom: 10px;">
        <span class="brand-mark">T</span>
        <span>TULA MARKET</span>
      </div>
      <p class="muted">Luxury commerce for local businesses, crafted with a premium glassmorphism experience.</p>
    </div>
    <div>
      <h4>Explore</h4>
      <div class="footer-links">
        <a href="${basePath}pages/shop.html">Shop</a>
        <a href="${basePath}pages/about.html">About</a>
        <a href="${basePath}pages/faq.html">FAQ</a>
      </div>
    </div>
    <div>
      <h4>Support</h4>
      <div class="footer-links">
        <a href="${basePath}pages/contact.html">Contact</a>
        <a href="${basePath}pages/privacy.html">Privacy</a>
        <a href="${basePath}pages/terms.html">Terms</a>
      </div>
    </div>
    <div>
      <h4>Community</h4>
      <div class="footer-links">
        <a href="${basePath}pages/vendor-dashboard.html">Vendor Hub</a>
        <a href="${basePath}pages/customer-dashboard.html">Customer Hub</a>
        <a href="${basePath}pages/admin-dashboard.html">Admin Console</a>
      </div>
    </div>
  </div>
  <div class="container" style="padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.08); margin-top: 18px;">
    <p>© <span id="year"></span> TULA'S TECH. All rights reserved.</p>
  </div>`;

function injectLayout() {
  const header = document.querySelector('[data-header]');
  const footer = document.querySelector('[data-footer]');
  if (header) header.innerHTML = getHeaderMarkup();
  if (footer) footer.innerHTML = footerMarkup;
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
  const signOutBtn = document.getElementById('signOutBtn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', () => {
      if (window.tulaAuth?.signOut) {
        window.tulaAuth.signOut();
      }
      window.location.href = `${basePath}index.html`;
    });
  }
}

function highlightActiveNav() {
  const links = document.querySelectorAll('.nav-links a');
  const current = window.location.pathname.split('/').pop();
  links.forEach((link) => {
    const linkPath = link.getAttribute('href').split('/').pop();
    if (linkPath === current) link.classList.add('active');
  });
}

function setupTheme() {
  const saved = localStorage.getItem('tula-theme');
  if (saved === 'light') document.body.classList.add('light');
  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      document.body.classList.toggle('light');
      localStorage.setItem('tula-theme', document.body.classList.contains('light') ? 'light' : 'dark');
    });
  }
}

function setupNavigation() {
  const mobileToggle = document.getElementById('mobileToggle');
  const nav = document.querySelector('.nav-links');
  if (mobileToggle && nav) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = nav.style.display === 'flex';
      nav.style.display = isOpen ? 'none' : 'flex';
      nav.style.position = 'absolute';
      nav.style.top = '70px';
      nav.style.right = '16px';
      nav.style.flexDirection = 'column';
      nav.style.padding = '14px';
      nav.style.background = 'rgba(10,10,10,0.95)';
      nav.style.border = '1px solid rgba(255,255,255,0.12)';
      nav.style.borderRadius = '16px';
    });
  }
}

function setupRipple() {
  document.querySelectorAll('.btn, .icon-btn, .chip').forEach((item) => {
    item.addEventListener('click', (event) => {
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const rect = item.getBoundingClientRect();
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;
      item.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });
}

function setupReveal() {
  const elements = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.15 });
  elements.forEach((el) => observer.observe(el));
}

function hideLoader() {
  const loader = document.querySelector('.loading-screen');
  if (loader) {
    setTimeout(() => loader.classList.add('hidden'), 500);
    setTimeout(() => loader.remove(), 900);
  }
}

function showMessage(element, message, success = true) {
  if (!element) return;
  element.textContent = message;
  element.style.color = success ? '#D4AF37' : '#f07c7c';
}

function protectRoutes() {
  const path = window.location.pathname;
  const session = window.tulaAuth?.getSession?.();
  if (path.includes('/pages/admin-dashboard.html')) {
    if (session?.role !== 'admin') {
      window.location.replace(`${basePath}admin/login.html`);
      return;
    }
  }
  if (path.includes('/pages/vendor-dashboard.html') || path.includes('/pages/vendor-onboarding.html')) {
    if (!session || !['vendor', 'admin'].includes(session.role)) {
      window.location.replace(`${basePath}pages/login.html`);
      return;
    }
  }
  if (path.includes('/pages/customer-dashboard.html')) {
    if (!session || !['customer', 'admin', 'vendor'].includes(session.role)) {
      window.location.replace(`${basePath}pages/login.html`);
      return;
    }
  }
  if ((path.includes('/pages/login.html') || path.includes('/pages/register.html')) && session) {
    if (session.role === 'admin') {
      window.location.replace(`${basePath}pages/admin-dashboard.html`);
    } else if (session.role === 'vendor') {
      window.location.replace(`${basePath}pages/vendor-dashboard.html`);
    } else {
      window.location.replace(`${basePath}pages/shop.html`);
    }
  }
  if (path.includes('/admin/login.html') && session?.role === 'admin') {
    window.location.replace(`${basePath}pages/admin-dashboard.html`);
  }
}

function setupAuthForms() {
  const registerCustomerBtn = document.getElementById('registerBtn');
  const registerVendorBtn = document.getElementById('registerVendorBtn');

  const handleRegistration = async (role) => {
    const email = document.getElementById('registerEmail')?.value.trim();
    const password = document.getElementById('registerPassword')?.value;
    const name = document.getElementById('registerName')?.value.trim();
    const messageElement = document.getElementById('registerMessage');
    if (!email || !password || !name) {
      showMessage(messageElement, 'Please complete all registration fields.', false);
      return;
    }
    showMessage(messageElement, 'Creating your account...', true);
    const result = await window.tulaAuth.signUp(email, password, role, name);
    if (result.success) {
      if (role === 'vendor') {
        showMessage(messageElement, 'Your store application is ready. Complete onboarding to launch your storefront.', true);
        setTimeout(() => {
          window.location.href = `${basePath}pages/vendor-onboarding.html`;
        }, 1200);
      } else {
        showMessage(messageElement, 'Registration successful — welcome to TULA MARKET!', true);
        setTimeout(() => {
          window.location.href = `${basePath}pages/shop.html`;
        }, 1200);
      }
    } else {
      showMessage(messageElement, result.message || 'Unable to complete registration.');
    }
  };

  if (registerCustomerBtn) {
    registerCustomerBtn.addEventListener('click', () => handleRegistration('customer'));
  }
  if (registerVendorBtn) {
    registerVendorBtn.addEventListener('click', () => handleRegistration('vendor'));
  }

  const loginPage = window.location.pathname.endsWith('/login.html') || window.location.pathname.endsWith('login.html');
  if (loginPage) {
    const loginBtn = document.getElementById('loginBtn') || document.querySelector('main .btn-primary');
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    if (loginBtn && loginEmail && loginPassword) {
      loginBtn.addEventListener('click', async () => {
        const email = loginEmail.value.trim();
        const password = loginPassword.value;
        const result = await window.tulaAuth.signIn(email, password);
        if (result.success) {
          if (result.role === 'admin') {
            window.location.href = `${basePath}pages/admin-dashboard.html`;
          } else if (result.role === 'vendor') {
            window.location.href = `${basePath}pages/vendor-dashboard.html`;
          } else {
            window.location.href = `${basePath}pages/shop.html`;
          }
        } else {
          showMessage(document.getElementById('loginMessage') || document.querySelector('.muted'), result.message || 'Unable to sign in.', false);
        }
      });
    }
  }

  const adminLoginBtn = document.getElementById('adminLoginBtn');
  if (adminLoginBtn) {
    adminLoginBtn.addEventListener('click', async () => {
      const email = document.getElementById('adminEmail')?.value.trim();
      const password = document.getElementById('adminPassword')?.value;
      const messageElement = document.getElementById('adminMessage');
      showMessage(messageElement, 'Verifying admin access...', true);
      const result = await window.tulaAuth.signInAdmin(email, password);
      if (result.success) {
        showMessage(messageElement, 'Admin access granted.', true);
        setTimeout(() => {
          window.location.href = `${basePath}pages/admin-dashboard.html`;
        }, 800);
      } else {
        showMessage(messageElement, result.message || 'Admin access denied.', false);
      }
    });
  }

  const onboardingForm = document.getElementById('vendorOnboardingForm');
  if (onboardingForm) {
    onboardingForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const payload = {
        storeName: document.getElementById('storeName')?.value.trim(),
        storeCategory: document.getElementById('storeCategory')?.value.trim(),
        storeDescription: document.getElementById('storeDescription')?.value.trim(),
        storePhone: document.getElementById('storePhone')?.value.trim(),
        storeWhatsapp: document.getElementById('storeWhatsapp')?.value.trim(),
        storeEmail: document.getElementById('storeEmail')?.value.trim(),
        storeAddress: document.getElementById('storeAddress')?.value.trim(),
        storeHours: document.getElementById('storeHours')?.value.trim(),
        storeSocial: document.getElementById('storeSocial')?.value.trim(),
        storeBanner: document.getElementById('storeBanner')?.value.trim(),
        storeLogo: document.getElementById('storeLogo')?.value.trim(),
        slug: window.tulaAuth?.getSession?.()?.storeSlug || null
      };
      const messageElement = document.getElementById('onboardingMessage');
      if (!payload.storeName || !payload.storeDescription) {
        showMessage(messageElement, 'Please add a store name and description to continue.', false);
        return;
      }
      showMessage(messageElement, 'Saving your storefront details...', true);
      const result = await window.tulaFirestore.saveDocument('stores', payload);
      if (result.success) {
        const session = window.tulaAuth?.getSession?.();
        if (session && !session.storeSlug && result.store?.slug) {
          const nextSession = { ...session, storeSlug: result.store.slug };
          localStorage.setItem('tula-auth-session', JSON.stringify(nextSession));
        }
        showMessage(messageElement, 'Your storefront is ready. You can now manage it from your dashboard.', true);
        setTimeout(() => {
          window.location.href = `${basePath}pages/vendor-dashboard.html`;
        }, 1000);
      } else {
        showMessage(messageElement, result.message || 'Unable to save store details.', false);
      }
    });
  }
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function getStoreBySlug(slug) {
  return commerceData.stores.find((store) => store.slug === slug) || commerceData.stores[0];
}

function getStoreSlugFromLocation() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('slug')) return params.get('slug');
  const segments = window.location.pathname.split('/').filter(Boolean);
  const storeIndex = segments.indexOf('store');
  if (storeIndex >= 0 && segments[storeIndex + 1]) return segments[storeIndex + 1];
  return 'jamosky';
}

function buildStoreCards(stores, compact = false) {
  return stores.map((store) => `
    <article class="store-card">
      <div class="store-card-banner" style="background-image: url('${store.banner}')"></div>
      <div class="store-card-body">
        <div class="store-card-head">
          <div class="store-avatar" style="background: ${store.accent};">${store.name.charAt(0)}</div>
          <div>
            <h3>${store.name}</h3>
            <p class="meta">${store.category} • ${store.location}</p>
          </div>
        </div>
        <p class="store-card-copy">${store.tagline}</p>
        <div class="store-stats-inline">
          <span>★ ${store.rating}</span>
          <span>${store.followers} followers</span>
        </div>
        ${compact ? '' : `<p class="meta">Featured products: ${store.featuredProducts.join(', ')}</p>`}
        <a class="btn btn-secondary" href="${basePath}store/${store.slug}/">Visit store</a>
      </div>
    </article>
  `).join('');
}

function buildProductCards(products) {
  return products.map((product) => `
    <article class="product-card">
      <div class="image-frame"><img src="${product.image}" alt="${product.name}" /></div>
      <span class="badge">${product.vendor}</span>
      <h3>${product.name}</h3>
      <p class="meta">${product.category}</p>
      <div class="rating">★★★★★</div>
      <p class="price">$${product.price}</p>
    </article>
  `).join('');
}

function renderHomepageDiscovery() {
  const featuredGrid = document.getElementById('featuredStoresGrid');
  const topGrid = document.getElementById('topStoresGrid');
  const newGrid = document.getElementById('newStoresGrid');
  const categoryGrid = document.getElementById('storeCategoriesGrid');
  if (featuredGrid) featuredGrid.innerHTML = buildStoreCards(commerceData.stores.filter((store) => store.featured));
  if (topGrid) topGrid.innerHTML = buildStoreCards(commerceData.stores.filter((store) => store.rating >= 4.8));
  if (newGrid) newGrid.innerHTML = buildStoreCards(commerceData.stores.filter((store) => store.new));
  if (categoryGrid) categoryGrid.innerHTML = commerceData.categories.map((category) => `
    <article class="category-card">
      <h3>${category.name}</h3>
      <p class="meta">${category.count}</p>
    </article>
  `).join('');
}

function renderShopPage() {
  const productGrid = document.getElementById('shopProductsGrid');
  const storeGrid = document.getElementById('storeDiscoveryGrid');
  if (productGrid) productGrid.innerHTML = buildProductCards(commerceData.products);
  if (storeGrid) storeGrid.innerHTML = buildStoreCards(commerceData.stores);
}

function renderStorePage() {
  const container = document.getElementById('storePageContent');
  if (!container) return;
  const slug = getStoreSlugFromLocation();
  const store = getStoreBySlug(slug);
  document.title = `${store.name} | TULA MARKET`;
  container.innerHTML = `
    <section class="store-hero reveal">
      <img src="${store.banner}" alt="${store.name} banner" />
      <div class="store-hero-overlay">
        <div class="store-hero-content">
          <div class="store-avatar large" style="background: ${store.accent};">${store.name.charAt(0)}</div>
          <div>
            <h1 class="page-title">${store.name}</h1>
            <p class="page-copy">${store.description}</p>
            <div class="pill-row">
              <span class="pill">★ ${store.rating}</span>
              <span class="pill">${store.followers} followers</span>
              <span class="pill">${store.location}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section class="grid grid-2 reveal">
      <article class="glass-card">
        <div class="panel-header"><h3>About this store</h3><span class="badge">Vendor-first</span></div>
        <p class="muted">${store.description}</p>
        <ul class="action-list">
          <li><strong>Business hours:</strong> Mon–Sat 9:00 AM – 8:00 PM</li>
          <li><strong>Contact:</strong> hello@${store.slug}.com • WhatsApp available</li>
          <li><strong>Policies:</strong> Secure checkout, quick returns, and verified stock</li>
        </ul>
      </article>
      <article class="glass-card">
        <div class="panel-header"><h3>Featured products</h3><span class="badge">Curated</span></div>
        <ul class="action-list">
          ${store.featuredProducts.map((product) => `<li>${product}</li>`).join('')}
        </ul>
      </article>
    </section>
    <section class="section reveal">
      <div class="section-header">
        <div>
          <h2 class="section-title">Store highlights</h2>
          <p class="section-subtitle">A premium storefront built to feel like a branded destination.</p>
        </div>
      </div>
      <div class="grid grid-3">
        <article class="glass-card"><h3>Branding</h3><p class="muted">Custom storefront colors, banners, and polished presentation.</p></article>
        <article class="glass-card"><h3>Reviews</h3><p class="muted">Verified shopper feedback and trust signals stay visible.</p></article>
        <article class="glass-card"><h3>Discovery</h3><p class="muted">The marketplace continues to surface this store to interested shoppers.</p></article>
      </div>
    </section>
  `;
}

function renderVendorDashboard() {
  const panel = document.getElementById('vendorStorePanel');
  if (!panel) return;
  const store = commerceData.stores[0];
  panel.innerHTML = `
    <article class="glass-card">
      <div class="panel-header"><h3>Store Management</h3><span class="badge">Live</span></div>
      <ul class="action-list">
        <li><strong>Store settings</strong> — Branding, policies, and social links</li>
        <li><strong>SEO</strong> — Friendly URL and store metadata ready</li>
        <li><strong>Announcements</strong> — Promote launches and special offers</li>
      </ul>
    </article>
    <article class="glass-card">
      <div class="panel-header"><h3>${store.name}</h3><span class="badge">Featured</span></div>
      <p class="muted">${store.tagline}</p>
      <div class="pill-row">
        <span class="pill">${store.rating} rating</span>
        <span class="pill">${store.followers} followers</span>
      </div>
    </article>
  `;
}

function renderAdminDashboard() {
  const panel = document.getElementById('adminStorePanel');
  if (!panel) return;
  panel.innerHTML = `
    <div class="dashboard-grid reveal">
      <article class="stat-card"><h3>Featured Stores</h3><p class="price">${commerceData.metrics.featuredStores}</p><p class="muted">Highlighted in discovery</p></article>
      <article class="stat-card"><h3>Followers</h3><p class="price">${commerceData.metrics.followers}</p><p class="muted">Across vendor storefronts</p></article>
      <article class="stat-card"><h3>Store Reviews</h3><p class="price">${commerceData.metrics.storeReviews}</p><p class="muted">Positive feedback</p></article>
      <article class="stat-card"><h3>Growth</h3><p class="price">${commerceData.metrics.growth}</p><p class="muted">Vendor expansion</p></article>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Store</th><th>Status</th><th>Category</th><th>Followers</th></tr></thead>
        <tbody>
          ${commerceData.stores.map((store) => `<tr><td>${store.name}</td><td>${store.featured ? 'Featured' : 'Active'}</td><td>${store.category}</td><td>${store.followers}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function setupShopSearch() {
  const searchInput = document.getElementById('storeSearch');
  if (!searchInput) return;
  const productGrid = document.getElementById('shopProductsGrid');
  const storeGrid = document.getElementById('storeDiscoveryGrid');
  const applyQuery = () => {
    const query = searchInput.value.trim().toLowerCase();
    const filteredProducts = commerceData.products.filter((product) => {
      return !query || [product.name, product.vendor, product.category].some((value) => value.toLowerCase().includes(query));
    });
    const filteredStores = commerceData.stores.filter((store) => {
      return !query || [store.name, store.tagline, store.category, store.location].some((value) => value.toLowerCase().includes(query));
    });
    if (productGrid) productGrid.innerHTML = buildProductCards(filteredProducts);
    if (storeGrid) storeGrid.innerHTML = buildStoreCards(filteredStores);
  };
  searchInput.addEventListener('input', applyQuery);
  applyQuery();
}

document.addEventListener('DOMContentLoaded', () => {
  protectRoutes();
  injectLayout();
  highlightActiveNav();
  setupTheme();
  setupNavigation();
  setupRipple();
  setupReveal();
  setupAuthForms();
  setupShopSearch();
  renderHomepageDiscovery();
  renderShopPage();
  renderStorePage();
  renderVendorDashboard();
  renderAdminDashboard();
  hideLoader();
});
