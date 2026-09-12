/*
  TULA MARKET - Global interactions and UI enhancements
  Extends the marketplace into a vendor-first commerce platform while preserving existing flows.
*/
function getBasePath() {
  const pathname = window.location.pathname;
  if (pathname.includes('/vendor/dashboard/')) return '../../';
  if (pathname.includes('/pages/')) return '../';
  if (pathname.includes('/store/')) return /\/store\/index\.html$/.test(pathname) ? '../' : '../../';
  return '';
}

const basePath = getBasePath();

function formatCurrency(amount) {
  return `₦${Number(amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const DELIVERY_FEE = 1000;
const FREE_DELIVERY_THRESHOLD = 50000;

function calculateDeliveryFee(subtotal) {
  return subtotal > FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
}

function readCart() {
  try {
    return JSON.parse(localStorage.getItem('tula-cart') || '[]');
  } catch (error) {
    return [];
  }
}

function writeCart(cart) {
  localStorage.setItem('tula-cart', JSON.stringify(cart));
}

function getCartStock(item) {
  return Math.max(0, Number(item.stockQuantity ?? item.stock ?? 0));
}

function addProductToCart(product, quantity = 1) {
  const session = getCurrentSession();
  if (!session?.uid || session.role !== 'customer') {
    return { success: false, requiresLogin: true, message: 'Please sign in as a customer before adding items to your cart.' };
  }
  const cart = readCart();
  const key = getProductKey(product);
  const existing = cart.find((item) => getProductKey(item) === key);
  const stock = getCartStock(product);
  const nextQuantity = Math.min((existing?.quantity || 0) + quantity, stock);
  if (!stock || nextQuantity <= 0) return { success: false, message: 'This product is out of stock.' };
  const cartItem = { ...product, quantity: nextQuantity };
  if (existing) cart[cart.indexOf(existing)] = cartItem;
  else cart.push(cartItem);
  writeCart(cart);
  return { success: true, message: `${getProductName(product)} added to your cart.` };
}

async function createOrderFingerprint(userId, items, address) {
  const source = JSON.stringify({
    userId: userId || 'guest',
    address: String(address || '').trim().toLowerCase(),
    items: items.map((item) => ({ productId: getProductKey(item), quantity: item.quantity }))
  });
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source));
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function findExistingOrder(orderFingerprint, userId) {
  if (!orderFingerprint || !userId || !window.tulaFirebaseFirestore) return null;
  const snapshot = await window.tulaFirebaseFirestore.collection('orders')
    .where('customerId', '==', userId)
    .limit(50)
    .get();
  const match = snapshot.docs.find((doc) => doc.data().orderFingerprint === orderFingerprint);
  return match ? { orderId: match.id, ...match.data() } : null;
}

function getVendorDashboardPath() {
  return `${basePath}vendor/dashboard/`;
}

function getPublicStoreHref(slug) {
  const session = getCurrentSession();
  const normalized = String(slug || session?.storeSlug || 'store').trim();
  const storePath = `${basePath}pages/store.html?slug=${encodeURIComponent(normalized || 'store')}`;
  return storePath;
}

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
    { name: 'Studio Knit Set', price: 220, vendor: 'Jamosky Studio', slug: 'jamosky', category: 'Fashion', rating: 4.9, image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80', stock: 18 },
    { name: 'Midnight Tote', price: 340, vendor: 'Jamosky Studio', slug: 'jamosky', category: 'Accessories', rating: 4.8, image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80', stock: 14 },
    { name: 'Silk Statement Scarf', price: 180, vendor: 'Jamosky Studio', slug: 'jamosky', category: 'Accessories', rating: 4.7, image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80', stock: 9 },
    { name: 'Linen Signature Shirt', price: 260, vendor: 'Jamosky Studio', slug: 'jamosky', category: 'Fashion', rating: 4.9, image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80', stock: 12 },
    { name: 'Digital Timepiece', price: 650, vendor: 'Aurora Atelier', slug: 'aurora-atelier', category: 'Electronics', rating: 4.9, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80', stock: 7 },
    { name: 'Platinum Pendant', price: 480, vendor: 'Aurora Atelier', slug: 'aurora-atelier', category: 'Jewelry', rating: 5, image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80', stock: 11 },
    { name: 'Velvet Runner', price: 180, vendor: 'Aurora Atelier', slug: 'aurora-atelier', category: 'Footwear', rating: 4.8, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80', stock: 15 },
    { name: 'Signature Frame', price: 320, vendor: 'Aurora Atelier', slug: 'aurora-atelier', category: 'Home', rating: 4.7, image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80', stock: 8 },
    { name: 'Velvet Elixir', price: 140, vendor: 'Glamorous Morgan', slug: 'glamorous-morgan', category: 'Beauty', rating: 4.7, image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80', stock: 21 },
    { name: 'Glow Serum', price: 95, vendor: 'Glamorous Morgan', slug: 'glamorous-morgan', category: 'Beauty', rating: 4.8, image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80', stock: 26 },
    { name: 'Silk Ritual Set', price: 210, vendor: 'Glamorous Morgan', slug: 'glamorous-morgan', category: 'Beauty', rating: 4.9, image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=800&q=80', stock: 13 },
    { name: 'Luxe Glow Kit', price: 175, vendor: 'Glamorous Morgan', slug: 'glamorous-morgan', category: 'Beauty', rating: 4.8, image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80', stock: 17 },
    { name: 'Daily Care Kit', price: 78, vendor: 'Gods Favour Pharmacy', slug: 'gods-favour-pharmacy', category: 'Wellness', rating: 4.6, image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80', stock: 31 },
    { name: 'Immune Boost', price: 64, vendor: 'Gods Favour Pharmacy', slug: 'gods-favour-pharmacy', category: 'Wellness', rating: 4.7, image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80', stock: 24 },
    { name: 'Hydration Pack', price: 52, vendor: 'Gods Favour Pharmacy', slug: 'gods-favour-pharmacy', category: 'Wellness', rating: 4.5, image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80', stock: 29 },
    { name: 'Family Wellness Box', price: 110, vendor: 'Gods Favour Pharmacy', slug: 'gods-favour-pharmacy', category: 'Wellness', rating: 4.6, image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=800&q=80', stock: 18 }
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
commerceData.stores = commerceData.stores.map((store) => ({ ...store, isDemo: true }));
commerceData.products = commerceData.products.map((product) => ({ status: 'Active', ...product }));
commerceData.products = commerceData.products.map((product) => ({ ...product, isDemo: true }));

function isDemoDataEnabled() {
  return window.TULA_MARKET_CONFIG?.demoData !== false && localStorage.getItem('tula-demo-data') !== 'disabled';
}

function getMarketplaceStores() {
  let persistedStores = [];
  try {
    persistedStores = JSON.parse(localStorage.getItem('tula-commerce-data') || '{"stores":[]}').stores || [];
  } catch (error) {
    persistedStores = [];
  }
  const storesBySlug = new Map((isDemoDataEnabled() ? commerceData.stores : []).map((store) => [store.slug, store]));
  publicFirestoreStores.forEach((store) => storesBySlug.set(store.slug, store));
  persistedStores.filter((store) => store.vendorId && !store.isDemo).forEach((store) => storesBySlug.set(store.slug, store));
  return Array.from(storesBySlug.values());
}

function getCurrentSession() {
  return window.tulaAuth?.getSession?.() || null;
}

function shortenEmail(email, maxLocalLength = 12) {
  const value = String(email || '');
  const separator = value.indexOf('@');
  if (separator <= 0 || separator === value.length - 1) return value;
  const localPart = value.slice(0, separator);
  const domain = value.slice(separator + 1);
  const shortenedLocal = localPart.length > maxLocalLength ? `${localPart.slice(0, maxLocalLength)}...` : localPart;
  return `${shortenedLocal}@${domain}`;
}

function getBrandLogoSrc() {
  const isLightTheme = document.body.classList.contains('light') || localStorage.getItem('tula-theme') === 'light';
  return `${basePath}images/${isLightTheme ? 'tmlogo.jpeg' : 'tmlogo2.jpg'}`;
}

function getFooterBrandLogoSrc() {
  const isLightTheme = document.body.classList.contains('light') || localStorage.getItem('tula-theme') === 'light';
  return `${basePath}images/${isLightTheme ? 'footerlogo2.jpeg' : 'footerlogo.jpeg'}`;
}

function applyBrandLogoTheme() {
  document.querySelectorAll('.brand-logo').forEach((logo) => {
    const isFooterLogo = logo.closest('.brand-footer');
    logo.src = isFooterLogo ? getFooterBrandLogoSrc() : getBrandLogoSrc();
    logo.alt = 'TULA MARKET logo';
  });
}

function getHeaderMarkup() {
  const session = getCurrentSession();
  const role = session?.role || 'guest';
  const isLoggedIn = Boolean(session);
  const fullIdentity = session?.name || session?.email || 'Member';
  const displayName = session?.name && session.name !== session.email ? session.name : shortenEmail(session?.email || fullIdentity);
  const cartCount = role === 'customer' ? readCart().reduce((total, item) => total + Number(item.quantity || 1), 0) : 0;
  const cartLink = `<a class="icon-btn cart-link" href="${basePath}pages/cart.html" aria-label="Open shopping cart" title="Open shopping cart"><span aria-hidden="true">🛒</span>${cartCount ? `<span class="cart-count">${cartCount}</span>` : ''}</a>`;

  let navLinks = `
    <a href="${basePath}index.html">Home</a>
    <a href="${basePath}pages/about.html">About</a>
    <a href="${basePath}pages/shop.html">Shop</a>
    <a href="${basePath}pages/product.html">Product</a>
    <a href="${basePath}pages/contact.html">Contact</a>
  `;

  if (role === 'customer') {
    navLinks += `<a href="${basePath}pages/customer-dashboard.html">Dashboard</a>`;
  } else if (role === 'vendor') {
    navLinks += `<a href="${getVendorDashboardPath()}">Vendor Hub</a>`;
  } else if (role === 'admin') {
    navLinks += `<a href="${basePath}pages/admin-dashboard.html">Admin</a>`;
  }

  let authActions = `
    <button class="icon-btn" id="themeToggle" aria-label="Toggle theme">☼</button>
    ${cartLink}
    <a class="btn btn-primary" href="${basePath}pages/login.html">Sign In</a>
    <a class="btn btn-secondary" href="${basePath}pages/register.html">Register</a>
  `;

  if (isLoggedIn) {
    authActions = `
      <button class="icon-btn" id="themeToggle" aria-label="Toggle theme">☼</button>
      ${role === 'customer' ? cartLink : ''}
      <span class="pill header-identity" title="${fullIdentity}">${displayName}</span>
      <button class="btn btn-secondary" id="signOutBtn" type="button">Sign Out</button>
    `;
  }

  return `
    <div class="container header-inner">
      <a class="brand" href="${basePath}index.html" aria-label="TULA MARKET home">
        <img class="brand-mark brand-logo" src="${getBrandLogoSrc()}" alt="TULA MARKET logo" />
      </a>
      <nav class="nav-links" id="primaryNav" aria-label="Primary navigation">
        ${navLinks}
      </nav>
      <div class="header-actions">
        ${authActions}
        <button class="icon-btn mobile-toggle" id="mobileToggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="primaryNav"><span></span><span></span><span></span></button>
      </div>
    </div>`;
}

const footerMarkup = `
  <div class="container footer-grid">
    <div>
      <div class="brand brand-footer" style="margin-bottom: 10px;">
        <img class="brand-mark brand-logo" src="${getFooterBrandLogoSrc()}" alt="TULA MARKET logo" />
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
        <a href="${basePath}pages/cookie-policy.html">Cookie Notice</a>
      </div>
    </div>
    <div>
      <h4>Community</h4>
      <div class="footer-links">
        <a href="${basePath}pages/vendor-agreement.html">Vendor Agreement</a>
        <a href="${getVendorDashboardPath()}">Vendor Hub</a>
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
  applyBrandLogoTheme();
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

function setupCookieConsent() {
  const consentKey = 'tula-cookie-consent';
  const existing = document.getElementById('tula-cookie-banner');
  if (existing) existing.remove();

  const consent = localStorage.getItem(consentKey);
  if (consent) return;

  const banner = document.createElement('div');
  banner.id = 'tula-cookie-banner';
  banner.style.position = 'fixed';
  banner.style.left = '16px';
  banner.style.right = '16px';
  banner.style.bottom = '16px';
  banner.style.zIndex = '2000';
  banner.style.padding = '18px 20px';
  banner.style.borderRadius = '18px';
  banner.style.background = 'rgba(23,36,58,0.96)';
  banner.style.border = '1px solid rgba(255,255,255,0.12)';
  banner.style.boxShadow = '0 18px 42px rgba(0,0,0,0.28)';
  banner.style.color = '#f8eedf';
  banner.style.display = 'flex';
  banner.style.flexWrap = 'wrap';
  banner.style.gap = '14px';
  banner.style.alignItems = 'center';
  banner.style.justifyContent = 'space-between';

  banner.innerHTML = `
    <div style="max-width: 760px; line-height: 1.5;">
      <strong style="display:block; margin-bottom:6px; font-size: 0.96rem;">Cookie notice</strong>
      <span style="font-size: 0.9rem; color: rgba(248,238,223,0.82);">
        We use cookies and local storage to remember your preferences, cart items, and session. By using TULA MARKET, you agree to our
        <a href="${basePath}pages/cookie-policy.html" style="color: #e2c98f; text-decoration: underline;">Cookie Notice</a>
        and <a href="${basePath}pages/privacy.html" style="color: #e2c98f; text-decoration: underline;">Privacy Policy</a>.
      </span>
    </div>
    <div style="display:flex; gap:10px; flex-wrap:wrap;">
      <button type="button" data-cookie-choice="accept" style="padding:10px 16px; border-radius: 999px; background: linear-gradient(135deg, #0e5b4d, #12715d); border: none; color: white; font-weight: 700; cursor:pointer;">Accept</button>
      <button type="button" data-cookie-choice="decline" style="padding:10px 16px; border-radius: 999px; background: rgba(248,238,223,0.12); border: 1px solid rgba(248,238,223,0.18); color: white; font-weight: 700; cursor:pointer;">Decline</button>
    </div>
  `;

  const onChoice = (choice) => {
    localStorage.setItem(consentKey, choice);
    banner.remove();
  };

  banner.querySelectorAll('[data-cookie-choice]').forEach((button) => {
    button.addEventListener('click', () => onChoice(button.dataset.cookieChoice));
  });

  document.body.appendChild(banner);
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
  const savedTheme = localStorage.getItem('tula-theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light');
  } else {
    document.body.classList.remove('light');
  }
  applyBrandLogoTheme();

  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      document.body.classList.toggle('light');
      const nextTheme = document.body.classList.contains('light') ? 'light' : 'dark';
      localStorage.setItem('tula-theme', nextTheme);
      applyBrandLogoTheme();
    });
  }
}

function setupNavigation() {
  const mobileToggle = document.getElementById('mobileToggle');
  const nav = document.querySelector('.nav-links');
  if (mobileToggle && nav) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      mobileToggle.classList.toggle('is-open', isOpen);
      mobileToggle.setAttribute('aria-expanded', String(isOpen));
      mobileToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    });
    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      mobileToggle.classList.remove('is-open');
      mobileToggle.setAttribute('aria-expanded', 'false');
      mobileToggle.setAttribute('aria-label', 'Open menu');
    }));
  }
}

function setupPasswordToggles() {
  document.querySelectorAll('input[type="password"]').forEach((input) => {
    if (input.parentElement.classList.contains('password-field')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'password-field';
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);
    const toggle = document.createElement('button');
    toggle.className = 'password-toggle';
    toggle.type = 'button';
    toggle.textContent = 'Show';
    toggle.setAttribute('aria-label', 'Show password');
    toggle.addEventListener('click', () => {
      const isVisible = input.type === 'text';
      input.type = isVisible ? 'password' : 'text';
      toggle.textContent = isVisible ? 'Show' : 'Hide';
      toggle.setAttribute('aria-label', `${isVisible ? 'Show' : 'Hide'} password`);
    });
    wrapper.appendChild(toggle);
  });
}

function getPaystackPublicKey() {
  const configuredKey = window.TULA_PAYSTACK_PUBLIC_KEY || window.TULA_MARKET_CONFIG?.paystack?.publicKey || localStorage.getItem('tula-paystack-public-key');
  return String(configuredKey || '').trim();
}

function openPaystackCheckout(order, name, email, message) {
  const publicKey = getPaystackPublicKey();
  if (!publicKey || publicKey.includes('your_public_key_here')) {
    showMessage(message, 'Paystack is not configured yet. Add your public key before checkout.', false);
    showToast('Paystack public key missing.', false);
    console.warn('Paystack public key is missing. Set window.TULA_PAYSTACK_PUBLIC_KEY or localStorage["tula-paystack-public-key"].');
    return;
  }

  if (!window.PaystackPop) {
    showMessage(message, 'Paystack is not ready. Please refresh and try again.', false);
    showToast('Paystack failed to load.', false);
    return;
  }

  const amountInKobo = Math.round(Number(order.total || 0) * 100);
  const handler = window.PaystackPop.setup({
    key: publicKey,
    email,
    amount: amountInKobo,
    currency: 'NGN',
    ref: order.orderId,
    metadata: {
      custom_fields: [
        { display_name: 'Customer Name', variable_name: 'customer_name', value: name },
        { display_name: 'Order ID', variable_name: 'order_id', value: order.orderId }
      ]
    },
    callback: function(response) {
      const paymentOrder = {
        ...order,
        paymentStatus: 'Paid',
        paymentReference: response.reference,
        orderStatus: 'Confirmed',
        paidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('tula-pending-order', JSON.stringify(paymentOrder));
      localStorage.setItem('tula-last-payment', JSON.stringify({ ...paymentOrder, paymentGateway: 'paystack' }));
      showMessage(message, `Payment successful! Reference: ${response.reference}`, true);
      showToast('Payment successful. Thank you!', true);
      writeCart([]);
    },
    onClose: function() {
      showMessage(message, 'Payment window closed. Your order remains pending.', true);
      showToast('Payment window closed.', true);
    }
  });

  handler.openIframe();
}

function setupCheckout() {
  const form = document.getElementById('checkoutForm');
  if (!form) return;
  const session = getCurrentSession();
  const cart = readCart().map((item) => ({ ...item, quantity: Math.min(Math.max(1, Number(item.quantity || 1)), getCartStock(item)) })).filter((item) => item.quantity > 0);
  const items = cart;
  const subtotal = items.reduce((total, item) => total + Number(item.price || 0) * Number(item.quantity || 1), 0);
  const delivery = calculateDeliveryFee(subtotal);
  const fee = Math.round(subtotal * 0.02 * 100) / 100;
  const total = subtotal + delivery + fee;
  document.getElementById('checkoutName').value = session?.name || '';
  document.getElementById('checkoutEmail').value = session?.email || '';
  document.getElementById('checkoutItems').innerHTML = items.map((item) => `<div class="checkout-item"><span>${item.name || item.productName} × ${item.quantity || 1}</span><strong>${formatCurrency(Number(item.price || 0) * Number(item.quantity || 1))}</strong></div>`).join('');
  document.getElementById('checkoutSubtotal').textContent = formatCurrency(subtotal);
  document.getElementById('checkoutDelivery').textContent = delivery ? formatCurrency(delivery) : 'Free';
  document.getElementById('checkoutFee').textContent = formatCurrency(fee);
  document.getElementById('checkoutTotal').textContent = formatCurrency(total);
  let isSubmitting = false;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    const name = document.getElementById('checkoutName').value.trim();
    const email = document.getElementById('checkoutEmail').value.trim();
    const address = document.getElementById('checkoutAddress').value.trim();
    const message = document.getElementById('checkoutMessage');
    if (!items.length) {
      showMessage(message, 'Your cart is empty. Add a product before checkout.', false);
      showToast('Your cart is empty.', false);
      return;
    }
    if (!session?.uid) {
      showMessage(message, 'Please sign in before placing an order.', false);
      return;
    }
    if (items.some((item) => Number(item.quantity) > getCartStock(item))) {
      showMessage(message, 'One or more items exceed the available stock. Please update your cart.', false);
      return;
    }
    if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !address) {
      showMessage(message, 'Complete your name, valid email, and delivery address.', false);
      return;
    }
    isSubmitting = true;
    const button = document.getElementById('placeOrderBtn');
    button.disabled = true;
    button.textContent = 'Preparing order...';
    showMessage(message, 'Preparing your secure checkout...', true);
    const order = {
      orderId: `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      orderFingerprint: await createOrderFingerprint(session?.uid, items, address),
      customerId: session?.uid || null,
      customerName: name,
      customerEmail: email,
      deliveryAddress: address,
      items,
      vendorIds: [...new Set(items.map((item) => item.vendorId).filter(Boolean))],
      subtotal,
      deliveryFee: delivery,
      transactionFee: fee,
      total,
      paymentMethod: document.getElementById('paymentMethod').value,
      paymentStatus: 'Pending',
      orderStatus: 'Pending Payment',
      receiptEmail: email,
      paymentReference: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem('tula-pending-order', JSON.stringify(order));

      if (window.tulaFirebaseFirestore && window.tulaFirebaseFirestore.collection) {
        const existingOrder = await findExistingOrder(order.orderFingerprint, session?.uid);
        if (existingOrder) {
          showMessage(message, `This order has already been created as #${existingOrder.orderId}.`, true);
          return;
        }
        await window.tulaFirebaseFirestore.collection('orders').doc(order.orderId).set(order, { merge: true });
      }

      if (window.tulaNotifications && session?.uid) {
        await window.tulaNotifications.createNotification(
          session.uid,
          `Order #${order.orderId.substring(0, 8).toUpperCase()} created. Proceeding to payment.`,
          'info',
          'pages/orders.html'
        );
      }

      showMessage(message, 'Order prepared. Redirecting to payment...', true);
      showToast('Order prepared for payment.', true);

      if (order.paymentMethod === 'paystack') {
        openPaystackCheckout(order, name, email, message);
      } else {
        showMessage(message, 'Cash on delivery order placed. We will contact you shortly.', true);
        showToast('Order placed for cash on delivery.', true);
      }
    } catch (error) {
      showMessage(message, 'Unable to prepare your order. Please try again.', false);
      showToast('Unable to prepare your order.', false);
    } finally {
      isSubmitting = false;
      button.disabled = false;
      button.textContent = 'Continue to Payment';
    }
  });
}

function setupCartPage() {
  const itemsContainer = document.getElementById('cartItems');
  if (!itemsContainer) return;
  let cart = readCart().map((item) => ({ ...item, quantity: Math.min(Math.max(1, Number(item.quantity || 1)), getCartStock(item)) })).filter((item) => item.quantity > 0);
  writeCart(cart);
  const subtotal = cart.reduce((total, item) => total + Number(item.price || 0) * Number(item.quantity || 1), 0);
  const delivery = cart.length ? calculateDeliveryFee(subtotal) : 0;
  document.getElementById('cartSubtotal').textContent = formatCurrency(subtotal);
  document.getElementById('cartDelivery').textContent = delivery ? formatCurrency(delivery) : 'Free';
  document.getElementById('cartTotal').textContent = formatCurrency(subtotal + delivery);
  const checkoutLink = document.getElementById('cartCheckoutLink');
  if (!cart.length) {
    checkoutLink.setAttribute('aria-disabled', 'true');
    checkoutLink.classList.add('is-disabled');
    checkoutLink.addEventListener('click', (event) => event.preventDefault());
    return;
  }
  itemsContainer.innerHTML = cart.map((item) => `<div class="cart-item"><div><strong>${item.name || item.productName}</strong><div class="cart-item-controls"><button type="button" data-cart-action="decrease" data-cart-key="${getProductKey(item)}" aria-label="Decrease quantity">−</button><span>${item.quantity || 1}</span><button type="button" data-cart-action="increase" data-cart-key="${getProductKey(item)}" aria-label="Increase quantity">+</button><button type="button" data-cart-action="remove" data-cart-key="${getProductKey(item)}">Remove</button></div></div><strong>${formatCurrency(Number(item.price || 0) * Number(item.quantity || 1))}</strong></div>`).join('');
  itemsContainer.querySelectorAll('[data-cart-action]').forEach((button) => button.addEventListener('click', () => {
    const key = button.dataset.cartKey;
    const action = button.dataset.cartAction;
    const nextCart = readCart();
    const item = nextCart.find((entry) => getProductKey(entry) === key);
    if (!item) return;
    if (action === 'remove') item.quantity = 0;
    if (action === 'decrease') item.quantity = Number(item.quantity || 1) - 1;
    if (action === 'increase') item.quantity = Math.min(Number(item.quantity || 1) + 1, getCartStock(item));
    writeCart(nextCart.filter((entry) => entry.quantity > 0));
    setupCartPage();
  }));
}

async function renderCustomerOrders() {
  const table = document.getElementById('customerOrdersTable');
  if (!table) return;
  const message = document.getElementById('customerOrdersMessage');
  const details = document.getElementById('customerOrderDetails');
  const session = getCurrentSession();
  if (!session?.uid) {
    table.innerHTML = '<tr><td colspan="4"><div class="empty-state"><strong>Sign in to view your orders.</strong><p class="muted">Your order history is securely linked to your account.</p><a class="btn btn-primary" href="login.html">Sign In</a></div></td></tr>';
    return;
  }
  try {
    let orders = [];
    if (window.tulaFirebaseFirestore) {
      const snapshot = await window.tulaFirebaseFirestore.collection('orders').where('customerId', '==', session.uid).get();
      orders = snapshot.docs.map((doc) => ({ orderId: doc.id, ...doc.data() }));
    }
    const localOrder = JSON.parse(localStorage.getItem('tula-pending-order') || 'null');
    if (localOrder?.customerId === session.uid && !orders.some((order) => order.orderId === localOrder.orderId)) orders.push(localOrder);
    orders.sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));
    const selectedId = new URLSearchParams(window.location.search).get('id');
    const selectedOrder = orders.find((order) => order.orderId === selectedId);
    if (selectedOrder) {
      details.innerHTML = `<section class="order-receipt"><div class="section-header"><div><p class="eyebrow">Order receipt</p><h2 class="section-title">#${selectedOrder.orderId}</h2></div><button class="btn btn-secondary" type="button" onclick="window.print()">Print Receipt</button></div><div class="order-tracking"><span class="tracking-step complete">Order placed</span><span class="tracking-step ${selectedOrder.paymentStatus !== 'Pending' ? 'complete' : ''}">Payment ${selectedOrder.paymentStatus === 'Pending' ? 'pending' : 'confirmed'}</span><span class="tracking-step ${selectedOrder.orderStatus === 'Delivered' ? 'complete' : ''}">${selectedOrder.orderStatus || 'Processing'}</span></div><div class="receipt-facts"><span><strong>Email</strong>${selectedOrder.receiptEmail || selectedOrder.customerEmail}</span><span><strong>Delivery address</strong>${selectedOrder.deliveryAddress}</span><span><strong>Delivery fee</strong>${selectedOrder.deliveryFee ? formatCurrency(selectedOrder.deliveryFee) : 'Free'}</span><span><strong>Payment reference</strong>${selectedOrder.paymentReference || 'Pending payment'}</span><span><strong>Total</strong>${formatCurrency(selectedOrder.total)}</span></div></section>`;
    }
    table.innerHTML = orders.length ? orders.map((order) => `<tr><td>#${order.orderId}</td><td>${formatProductDate(order.createdAt)}</td><td><span class="status-badge">${order.orderStatus || 'Pending'}</span></td><td>${formatCurrency(order.total)}</td><td><a class="btn btn-secondary" href="orders.html?id=${encodeURIComponent(order.orderId)}">Receipt</a></td></tr>`).join('') : '<tr><td colspan="5"><div class="empty-state"><strong>No orders yet.</strong><p class="muted">Completed purchases will appear here.</p><a class="btn btn-secondary" href="shop.html">Continue Shopping</a></div></td></tr>';
  } catch (error) {
    const errorMessage = getFirebaseAccessMessage(error, 'We could not load your orders.');
    table.innerHTML = `<tr><td colspan="5"><div class="empty-state error-state"><strong>${errorMessage}</strong><p class="muted">Check your connection and try again.</p><button id="retryCustomerOrders" class="btn btn-secondary" type="button">Retry</button></div></td></tr>`;
    showMessage(message, errorMessage, false);
    document.getElementById('retryCustomerOrders')?.addEventListener('click', () => renderCustomerOrders());
  }
}

async function renderVendorOrders() {
  const table = document.getElementById('vendorOrdersTable');
  if (!table) return;
  const session = getCurrentSession();
  const count = document.getElementById('vendorOrdersCount');
  const message = document.getElementById('vendorOrdersMessage');
  if (!session?.vendorId) {
    table.innerHTML = '<tr><td colspan="5"><div class="empty-state"><strong>Vendor access required.</strong><p class="muted">Sign in with a vendor account to view orders.</p></div></td></tr>';
    return;
  }
  try {
    let orders = [];
    if (window.tulaFirebaseFirestore) {
      const snapshot = await window.tulaFirebaseFirestore.collection('orders').where('vendorIds', 'array-contains', session.vendorId).get();
      orders = snapshot.docs.map((doc) => ({ orderId: doc.id, ...doc.data() }));
    }
    const localOrder = JSON.parse(localStorage.getItem('tula-pending-order') || 'null');
    if (localOrder?.vendorIds?.includes(session.vendorId) && !orders.some((order) => order.orderId === localOrder.orderId)) orders.push(localOrder);
    orders.sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));
    count.textContent = `${orders.length} order${orders.length === 1 ? '' : 's'}`;
    table.innerHTML = orders.length ? orders.map((order) => `<tr><td>#${order.orderId}</td><td>${formatProductDate(order.createdAt)}</td><td>${order.customerName || order.customerEmail || 'Customer'}</td><td>${formatCurrency(order.total)}</td><td><select class="vendor-order-status" data-order-id="${order.orderId}" data-current-status="${order.orderStatus || 'Pending Payment'}"><option>Pending Payment</option><option>Processing</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option></select></td></tr>`).join('') : '<tr><td colspan="5"><div class="empty-state"><strong>No orders yet.</strong><p class="muted">Customer orders will appear here when shoppers purchase from your store.</p></div></td></tr>';
    table.querySelectorAll('.vendor-order-status').forEach((select) => {
      select.value = select.dataset.currentStatus;
      select.addEventListener('change', async () => {
        const order = orders.find((item) => item.orderId === select.dataset.orderId);
        if (!order || !window.tulaFirebaseFirestore) return;
        select.disabled = true;
        try {
          await window.tulaFirebaseFirestore.collection('orders').doc(order.orderId).update({ orderStatus: select.value, updatedAt: new Date().toISOString() });
          showMessage(message, `Order #${order.orderId} updated.`, true);
        } catch (error) {
          select.value = select.dataset.currentStatus;
          showMessage(message, getFirebaseAccessMessage(error, 'Unable to update order status.'), false);
        } finally {
          select.disabled = false;
        }
      });
    });
  } catch (error) {
    table.innerHTML = `<tr><td colspan="5"><div class="empty-state error-state"><strong>${getFirebaseAccessMessage(error, 'We could not load vendor orders.')}</strong></div></td></tr>`;
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
    setTimeout(() => loader.classList.add('hidden'), 150);
    setTimeout(() => loader.remove(), 500);
  }
}

function showMessage(element, message, success = true) {
  if (!element) return;
  element.textContent = message;
  element.style.color = success ? '#D4AF37' : '#f07c7c';
  element.setAttribute('role', success ? 'status' : 'alert');
  element.setAttribute('aria-live', success ? 'polite' : 'assertive');
  element.setAttribute('aria-atomic', 'true');
}

function showToast(message, success = true) {
  let stack = document.getElementById('toastStack');
  if (!stack) {
    stack = document.createElement('div');
    stack.id = 'toastStack';
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${success ? 'toast-success' : 'toast-error'}`;
  toast.setAttribute('role', 'status');
  toast.textContent = message;
  stack.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('visible'));
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 250);
  }, 4200);
}

async function retryAsync(operation, attempts = 2) {
  let lastError;
  for (let attempt = 0; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
    }
  }
  throw lastError;
}

function compressImage(file, maxDimension = 1600, quality = 0.82) {
  if (!file.type.startsWith('image/') || !window.createImageBitmap) return Promise.resolve(file);
  return createImageBitmap(file).then((image) => {
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    image.close();
    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob ? new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }) : file), 'image/jpeg', quality));
  }).catch(() => file);
}

async function uploadImageToCloudinary(file, folder) {
  const config = window.TULA_MARKET_CONFIG?.cloudinary;
  if (!config?.cloudName || config.cloudName.startsWith('YOUR_') || !config.uploadPreset || config.uploadPreset.startsWith('YOUR_')) {
    throw new Error('Cloudinary is not configured. Add your cloud name and unsigned upload preset.');
  }
  const body = new FormData();
  body.append('file', file);
  body.append('upload_preset', config.uploadPreset);
  body.append('folder', folder);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/upload`, { method: 'POST', body });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || 'Cloudinary image upload failed.');
  return { url: result.secure_url, deleteToken: result.delete_token || null };
}

async function deleteCloudinaryImage(deleteToken) {
  if (!deleteToken) return;
  const config = window.TULA_MARKET_CONFIG?.cloudinary;
  if (!config?.cloudName) return;
  const body = new URLSearchParams({ token: deleteToken });
  await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/delete_by_token`, { method: 'POST', body });
}

function validateProductInput(product) {
  const requiredText = ['productName', 'shortDescription', 'fullDescription', 'category', 'sku'];
  if (requiredText.some((field) => !String(product[field] || '').trim())) {
    return 'Complete all required product text fields.';
  }
  if (requiredText.some((field) => String(product[field]).length > 5000)) {
    return 'Product text fields are too long.';
  }
  if (!Number.isFinite(product.price) || product.price < 0) {
    return 'Enter a valid non-negative price.';
  }
  if (product.discountPrice !== null && product.discountPrice !== undefined && (!Number.isFinite(product.discountPrice) || product.discountPrice < 0)) {
    return 'Enter a valid discount price.';
  }
  if (!Number.isInteger(product.stockQuantity) || product.stockQuantity < 0) {
    return 'Stock quantity must be a non-negative whole number.';
  }
  if (!['Draft', 'Active', 'Hidden', 'Out of Stock', 'Archived'].includes(product.status)) {
    return 'Select a valid product status.';
  }
  return '';
}

function getFirebaseAccessMessage(error, fallback) {
  if (error?.code === 'permission-denied') {
    return 'You are not authorized to access this product.';
  }
  return error?.message || fallback;
}

function protectRoutes() {
  const path = window.location.pathname;
  const session = window.tulaAuth?.getSession?.();
  if (path.includes('/pages/cart.html') || path.includes('/pages/checkout.html')) {
    if (!session || session.role !== 'customer') {
      window.location.replace(`${basePath}pages/login.html`);
      return;
    }
  }
  if (path.includes('/pages/admin-dashboard.html')) {
    if (session?.role !== 'admin') {
      window.location.replace(`${basePath}admin/login.html`);
      return;
    }
  }
  if (path.includes('/vendor/dashboard') || path.includes('/pages/vendor-dashboard.html')) {
    if (!session || !['vendor', 'admin'].includes(session.role)) {
      window.location.replace(`${basePath}pages/login.html`);
      return;
    }
  }
  if (path.includes('/pages/vendor-product.html')) {
    if (!session || session.role !== 'vendor') {
      window.location.replace(`${basePath}pages/login.html`);
      return;
    }
  }
  if (path.includes('/pages/vendor-product-view.html')) {
    if (!session || session.role !== 'vendor') {
      window.location.replace(`${basePath}pages/login.html`);
      return;
    }
  }
  if (path.includes('/pages/vendor-onboarding.html')) {
    if (session && !['vendor', 'admin'].includes(session.role) && session.pendingVendorOnboarding) {
      return;
    }
    if (session && !['vendor', 'admin'].includes(session.role)) {
      return;
    }
  }
  if (path.includes('/pages/customer-dashboard.html')) {
    if (!session || !['customer', 'admin', 'vendor'].includes(session.role)) {
      window.location.replace(`${basePath}pages/login.html`);
      return;
    }
  }
  if (path.includes('/pages/orders.html')) {
    if (!session || !['customer', 'vendor', 'admin'].includes(session.role)) {
      window.location.replace(`${basePath}pages/login.html`);
      return;
    }
  }
  if ((path.includes('/pages/login.html') || path.includes('/pages/register.html')) && session) {
    if (session.role === 'admin') {
      window.location.replace(`${basePath}pages/admin-dashboard.html`);
    } else if (session.role === 'vendor') {
      window.location.replace(getVendorDashboardPath());
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
  const registerProfilePicture = document.getElementById('registerProfilePicture');
  const registerProfilePicturePreview = document.getElementById('registerProfilePicturePreview');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  registerProfilePicture?.addEventListener('change', () => {
    const file = registerProfilePicture.files?.[0];
    if (!file) {
      registerProfilePicturePreview.innerHTML = '';
      return;
    }
    if (!file.type.startsWith('image/')) {
      registerProfilePicture.value = '';
      registerProfilePicturePreview.innerHTML = '<span class="muted">Choose an image file.</span>';
      return;
    }
    registerProfilePicturePreview.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="Selected profile picture" />`;
  });

  const handleRegistration = async (role) => {
    const email = document.getElementById('registerEmail')?.value.trim();
    const password = document.getElementById('registerPassword')?.value;
    const confirmPassword = document.getElementById('registerConfirmPassword')?.value;
    const name = document.getElementById('registerName')?.value.trim();
    const storeName = document.getElementById('registerStoreName')?.value.trim();
    const profilePicture = registerProfilePicture?.files?.[0];
    const messageElement = document.getElementById('registerMessage');
    const button = role === 'vendor' ? registerVendorBtn : registerCustomerBtn;

    if (!email || !password || !confirmPassword || !name || (role === 'vendor' && !storeName)) {
      showMessage(messageElement, 'Please complete all required registration fields.', false);
      return;
    }
    if (!emailRegex.test(email)) {
      showMessage(messageElement, 'Please enter a valid email address.', false);
      return;
    }
    if (password.length < 8) {
      showMessage(messageElement, 'Password must be at least 8 characters long.', false);
      return;
    }
    if (password !== confirmPassword) {
      showMessage(messageElement, 'Passwords do not match. Please try again.', false);
      return;
    }

    button.disabled = true;
    showMessage(messageElement, 'Creating your account...', true);
    let profileImageUrl = '';
    try {
      if (profilePicture) {
        showMessage(messageElement, 'Uploading your profile picture...', true);
        const compressedPicture = await compressImage(profilePicture, 800, 0.84);
        const uploadedPicture = await uploadImageToCloudinary(compressedPicture, 'tula-market/profile-pictures');
        profileImageUrl = uploadedPicture.url;
      }
    } catch (error) {
      button.disabled = false;
      showMessage(messageElement, error.message || 'Unable to upload your profile picture.', false);
      return;
    }
    const result = await window.tulaAuth.signUp(email, password, role, name, storeName, profileImageUrl);
    button.disabled = false;

    if (result.success) {
      if (role === 'vendor') {
        showMessage(messageElement, 'Your customer account is ready. Complete vendor registration to launch your storefront.', true);
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
      showMessage(messageElement, result.message || 'Unable to complete registration.', false);
    }
  };

  if (registerCustomerBtn) {
    registerCustomerBtn.addEventListener('click', () => handleRegistration('customer'));
  }
  if (registerVendorBtn) {
    registerVendorBtn.addEventListener('click', async () => {
      const email = document.getElementById('registerEmail')?.value.trim();
      const password = document.getElementById('registerPassword')?.value;
      const confirmPassword = document.getElementById('registerConfirmPassword')?.value;
      const name = document.getElementById('registerName')?.value.trim();
      const profilePicture = document.getElementById('registerProfilePicture')?.files?.[0];
      const messageElement = document.getElementById('registerMessage');

      if (!email || !password || !confirmPassword || !name) {
        showMessage(messageElement, 'Please complete the account fields before starting vendor registration.', false);
        return;
      }
      if (!emailRegex.test(email)) {
        showMessage(messageElement, 'Please enter a valid email address.', false);
        return;
      }
      if (password.length < 8) {
        showMessage(messageElement, 'Password must be at least 8 characters long.', false);
        return;
      }
      if (password !== confirmPassword) {
        showMessage(messageElement, 'Passwords do not match. Please try again.', false);
        return;
      }

      const storeName = document.getElementById('registerStoreName')?.value.trim();
      if (!storeName) {
        showMessage(messageElement, 'Enter your store name before starting vendor registration.', false);
        return;
      }

      registerVendorBtn.disabled = true;
      showMessage(messageElement, 'Creating your vendor account...', true);
      let profileImageUrl = '';
      try {
        if (profilePicture) {
          showMessage(messageElement, 'Uploading your profile picture...', true);
          const compressedPicture = await compressImage(profilePicture, 800, 0.84);
          const uploadedPicture = await uploadImageToCloudinary(compressedPicture, 'tula-market/profile-pictures');
          profileImageUrl = uploadedPicture.url;
        }
      } catch (error) {
        registerVendorBtn.disabled = false;
        showMessage(messageElement, error.message || 'Unable to upload your profile picture.', false);
        return;
      }
      const result = await window.tulaAuth.signUp(email, password, 'vendor', name, storeName, profileImageUrl);
      registerVendorBtn.disabled = false;

      if (result.success) {
        showMessage(messageElement, 'Vendor account created. Complete your storefront registration.', true);
        setTimeout(() => {
          window.location.href = `${basePath}pages/vendor-onboarding.html`;
        }, 800);
      } else {
        showMessage(messageElement, result.message || 'Unable to create your account.', false);
      }
    });
  }

  const loginPage = window.location.pathname.endsWith('/login.html') || window.location.pathname.endsWith('login.html');
  const forgotPasswordPage = window.location.pathname.endsWith('/forgot-password.html') || window.location.pathname.endsWith('forgot-password.html');
  if (loginPage) {
    const loginBtn = document.getElementById('loginBtn') || document.querySelector('main .btn-primary');
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    if (loginBtn && loginEmail && loginPassword) {
      loginBtn.addEventListener('click', async () => {
        const email = loginEmail.value.trim();
        const password = loginPassword.value;
        const messageElement = document.getElementById('loginMessage') || document.querySelector('.muted');
        if (!email || !password) {
          showMessage(messageElement, 'Enter your email and password.', false);
          return;
        }
        loginBtn.disabled = true;
        showMessage(messageElement, 'Signing in...', true);
        try {
          const result = await window.tulaAuth.signIn(email, password);
          if (result.success) {
            if (result.role === 'admin') {
              window.location.href = `${basePath}pages/admin-dashboard.html`;
            } else if (result.role === 'vendor') {
              window.location.href = getVendorDashboardPath();
            } else {
              window.location.href = `${basePath}pages/shop.html`;
            }
          } else {
            showMessage(messageElement, result.message || 'Unable to sign in.', false);
            showToast(result.message || 'Unable to sign in.', false);
          }
        } catch (error) {
          console.error('Login failed:', error);
          showMessage(messageElement, 'Unable to sign in. Check Firebase configuration and try again.', false);
          showToast('Unable to sign in. Check Firebase configuration and try again.', false);
        } finally {
          loginBtn.disabled = false;
        }
      });
    }
  }

  if (forgotPasswordPage) {
    const forgotForm = document.getElementById('forgotPasswordForm');
    const forgotBtn = document.getElementById('forgotBtn');
    const forgotEmail = document.getElementById('forgotEmail');
    const forgotMessage = document.getElementById('forgotMessage');
    if (forgotForm && forgotBtn && forgotEmail) {
      let isResetting = false;
      forgotForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (isResetting) return;
        const email = forgotEmail.value.trim();
        if (!email) {
          showMessage(forgotMessage, 'Please enter the email address on your account.', false);
          return;
        }
        if (!emailRegex.test(email)) {
          showMessage(forgotMessage, 'Please enter a valid email address.', false);
          return;
        }
        isResetting = true;
        forgotBtn.disabled = true;
        forgotBtn.textContent = 'Sending...';
        showMessage(forgotMessage, 'Sending password reset email...', true);
        try {
          const result = await window.tulaAuth.resetPassword(email);
          showMessage(forgotMessage, result.message || 'Unable to send reset email.', result.success);
          showToast(result.message || 'Unable to send reset email.', result.success);
          if (result.success) forgotForm.reset();
        } catch (error) {
          showMessage(forgotMessage, 'Unable to send reset email. Please try again.', false);
          showToast('Unable to send reset email. Please try again.', false);
        } finally {
          isResetting = false;
          forgotBtn.disabled = false;
          forgotBtn.textContent = 'Send Reset Link';
        }
      });
    }
  }

  const resetPasswordPage = window.location.pathname.endsWith('/reset-password.html') || window.location.pathname.endsWith('reset-password.html');
  if (resetPasswordPage) {
    const resetForm = document.getElementById('resetPasswordForm');
    const resetPassword = document.getElementById('resetPassword');
    const resetConfirmPassword = document.getElementById('resetConfirmPassword');
    const resetMessage = document.getElementById('resetMessage');
    const resetButton = document.getElementById('resetPasswordBtn');
    const code = new URLSearchParams(window.location.search).get('oobCode');
    let resetCodeIsValid = false;
    window.tulaAuth.verifyPasswordResetCode(code).then((result) => {
      if (result.success) {
        resetCodeIsValid = true;
        document.getElementById('resetAccountEmail').textContent = result.email;
        return;
      }
      showMessage(resetMessage, result.message, false);
      showToast(result.message, false);
      resetButton.disabled = true;
    });
    resetForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!resetCodeIsValid || resetButton.disabled) return;
      if (resetPassword.value !== resetConfirmPassword.value) {
        showMessage(resetMessage, 'Passwords do not match.', false);
        return;
      }
      resetButton.disabled = true;
      resetButton.textContent = 'Updating...';
      try {
        const result = await window.tulaAuth.confirmPasswordReset(code, resetPassword.value);
        showMessage(resetMessage, result.message, result.success);
        showToast(result.message, result.success);
        if (result.success) {
          resetForm.reset();
          setTimeout(() => { window.location.href = `${basePath}pages/login.html`; }, 1400);
        } else {
          resetButton.disabled = false;
        }
      } catch (error) {
        showMessage(resetMessage, 'Unable to update your password. Please request a new link.', false);
        showToast('Unable to update your password. Please request a new link.', false);
        resetButton.disabled = false;
      } finally {
        resetButton.textContent = 'Update Password';
      }
    });
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

  const productForm = document.getElementById('vendorProductForm');
  if (productForm) {
    const productMessage = document.getElementById('productFormMessage');
    const uploadButton = document.getElementById('uploadProductBtn');
    const imageInput = document.getElementById('productImages');
    const preview = document.getElementById('productImagePreview');
    let isUploading = false;

    const renderImagePreview = (files) => {
      if (!preview) return;
      (preview._objectUrls || []).forEach((url) => URL.revokeObjectURL(url));
      const items = Array.from(files || []).slice(0, 8);
      preview._objectUrls = items.map((file) => URL.createObjectURL(file));
      preview.innerHTML = items.length
        ? items.map((file, index) => `<span class="image-preview-item"><img src="${preview._objectUrls[index]}" alt="${file.name}" /><span>${file.name}</span></span>`).join('')
        : '<span class="muted">No images selected yet.</span>';
    };

    imageInput?.addEventListener('change', (event) => {
      renderImagePreview(event.target.files);
    });

    productForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (isUploading) return;
      const session = window.tulaAuth?.getSession?.();
      if (!session || session.role !== 'vendor') {
        showMessage(productMessage, 'Only vendors can upload products.', false);
        return;
      }
      if (!session.vendorId || !session.storeSlug) {
        showMessage(productMessage, 'Complete vendor registration before creating a product.', false);
        return;
      }

      const productName = document.getElementById('productName')?.value.trim();
      const shortDescription = document.getElementById('shortDescription')?.value.trim();
      const fullDescription = document.getElementById('fullDescription')?.value.trim();
      const category = document.getElementById('category')?.value.trim();
      const subcategory = document.getElementById('subcategory')?.value.trim();
      const brand = document.getElementById('brand')?.value.trim();
      const price = Number(document.getElementById('price')?.value || 0);
      const discountPrice = Number(document.getElementById('discountPrice')?.value || 0);
      const stockQuantity = Number(document.getElementById('stockQuantity')?.value || 0);
      const sku = document.getElementById('sku')?.value.trim();
      const condition = document.getElementById('condition')?.value;
      const availability = document.getElementById('availability')?.value;
      const shippingWeight = document.getElementById('shippingWeight')?.value.trim();
      const dimensions = document.getElementById('dimensions')?.value.trim();
      const deliveryAvailable = document.getElementById('deliveryAvailable')?.value;
      const productStatus = document.getElementById('productStatus')?.value || 'Draft';
      const tags = document.getElementById('tags')?.value.trim();
      const keywords = document.getElementById('keywords')?.value.trim();
      const files = Array.from(imageInput?.files || []);

      if (!productName || !shortDescription || !fullDescription || !category || !subcategory || !brand || !sku || !condition || !availability || !shippingWeight || !dimensions || !deliveryAvailable) {
        showMessage(productMessage, 'Please complete all required product fields.', false);
        return;
      }
      const inputError = validateProductInput({ productName, shortDescription, fullDescription, category, sku, price, discountPrice: discountPrice || null, stockQuantity, status: productStatus });
      if (inputError) {
        showMessage(productMessage, inputError, false);
        return;
      }
      if (!files.length || files.length > 8) {
        showMessage(productMessage, 'Please upload between 1 and 8 product images.', false);
        return;
      }
      if (files.some((file) => file.size > 15 * 1024 * 1024)) {
        showMessage(productMessage, 'Each image must be smaller than 15 MB.', false);
        return;
      }
      if (!files.every((file) => file.type.startsWith('image/'))) {
        showMessage(productMessage, 'Only image files are allowed.', false);
        return;
      }

      uploadButton.disabled = true;
      isUploading = true;
      uploadButton.textContent = 'Uploading...';
      showMessage(productMessage, 'Uploading product images...', true);

      try {
        const compressedFiles = await Promise.all(files.map((file) => compressImage(file)));
        const uploadedImages = await Promise.all(compressedFiles.map((file) => uploadImageToCloudinary(file, `tula-market/${session.vendorId}/${session.storeSlug}`)));
        const uploadedUrls = uploadedImages.map((image) => image.url);

        const productData = {
          productId: `product_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          productName,
          shortDescription,
          fullDescription,
          category,
          subcategory,
          brand,
          price,
          discountPrice: discountPrice || null,
          stockQuantity,
          sku,
          condition,
          availability,
          shippingWeight,
          dimensions,
          deliveryAvailable,
          tags: tags ? tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
          keywords: keywords ? keywords.split(',').map((keyword) => keyword.trim()).filter(Boolean) : [],
          featuredImage: uploadedUrls[0],
          additionalImages: uploadedUrls.slice(1),
          imageDeleteTokens: uploadedImages.map((image) => image.deleteToken || null),
          vendorId: session.vendorId,
          storeSlug: session.storeSlug,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: productStatus
        };

        if (!window.tulaFirebaseFirestore) {
          throw new Error('Firestore is not ready.');
        }

        await window.tulaFirebaseFirestore.collection('products').doc(productData.productId).set(productData, { merge: true });

        const commerceDataEntry = JSON.parse(localStorage.getItem('tula-commerce-data') || '{"stores":[],"products":[]}');
        commerceDataEntry.products = [
          ...(commerceDataEntry.products || []),
          {
            ...productData,
            name: productData.productName,
            image: productData.featuredImage,
            vendor: session.storeName || session.name || 'Vendor Store',
            slug: session.storeSlug,
            category: productData.category,
            rating: 4.8,
            stock: productData.stockQuantity
          }
        ];
        localStorage.setItem('tula-commerce-data', JSON.stringify(commerceDataEntry));

        // Create vendor notification
        if (window.tulaNotifications && session?.uid) {
          await window.tulaNotifications.createNotification(
            session.uid,
            `Product "${productData.productName}" uploaded successfully and saved as Draft.`,
            'success'
          );
        }

        showMessage(productMessage, 'Product uploaded successfully. Your product is saved as Draft.', true);
        showToast('Product uploaded successfully.', true);
        productForm.reset();
        renderImagePreview([]);
      } catch (error) {
        console.error('Product upload failed:', error);
        showMessage(productMessage, getFirebaseAccessMessage(error, 'Unable to upload product. Please try again.'), false);
        showToast(getFirebaseAccessMessage(error, 'Unable to upload product. Please try again.'), false);
      } finally {
        isUploading = false;
        uploadButton.disabled = false;
        uploadButton.textContent = 'Upload Product';
      }
    });
  }

  const onboardingForm = document.getElementById('vendorOnboardingForm');
  if (onboardingForm) {
    [['storeLogo', 'storeLogoPreview'], ['storeBanner', 'storeBannerPreview']].forEach(([inputId, previewId]) => {
      const input = document.getElementById(inputId);
      const preview = document.getElementById(previewId);
      input?.addEventListener('change', () => {
        const file = input.files?.[0];
        if (!file) {
          preview.innerHTML = '';
          return;
        }
        if (!file.type.startsWith('image/')) {
          input.value = '';
          preview.innerHTML = '<span class="muted">Choose an image file.</span>';
          return;
        }
        preview.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="Selected ${inputId === 'storeLogo' ? 'store logo' : 'store banner'}" />`;
      });
    });

    onboardingForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const messageElement = document.getElementById('onboardingMessage');
      const session = window.tulaAuth?.getSession?.();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      const businessName = document.getElementById('businessName')?.value.trim();
      const storeDisplayName = document.getElementById('storeDisplayName')?.value.trim();
      const businessCategory = document.getElementById('businessCategory')?.value.trim();
      const businessDescription = document.getElementById('businessDescription')?.value.trim();
      const businessPhone = document.getElementById('businessPhone')?.value.trim();
      const businessEmail = document.getElementById('businessEmail')?.value.trim();
      const country = document.getElementById('country')?.value.trim();
      const state = document.getElementById('state')?.value.trim();
      const city = document.getElementById('city')?.value.trim();
      const address = document.getElementById('address')?.value.trim();
      const ownerName = document.getElementById('ownerName')?.value.trim();
      const ownerPhone = document.getElementById('ownerPhone')?.value.trim();
      const ownerEmail = document.getElementById('ownerEmail')?.value.trim();
      const ownerPicture = document.getElementById('ownerPicture')?.value.trim();
      const storeLogoFile = document.getElementById('storeLogo')?.files?.[0];
      const storeBannerFile = document.getElementById('storeBanner')?.files?.[0];
      const shippingPolicy = document.getElementById('shippingPolicy')?.value.trim() || 'Standard shipping will be confirmed after order placement.';
      const returnPolicy = document.getElementById('returnPolicy')?.value.trim() || 'Returns are reviewed on a case-by-case basis as indicated in the marketplace policies.';
      const refundPolicy = document.getElementById('refundPolicy')?.value.trim() || 'Refund requests are reviewed after the return and inspection process.';
      const deliveryAvailable = document.getElementById('deliveryAvailable')?.value || 'yes';
      const deliveryLocations = document.getElementById('deliveryLocations')?.value.trim() || 'Local and regional delivery';
      const agreeTerms = document.getElementById('agreeTerms')?.checked;
      const agreeRules = document.getElementById('agreeRules')?.checked;
      const agreePrivacy = document.getElementById('agreePrivacy')?.checked;
      const pendingDraft = JSON.parse(localStorage.getItem('tula-vendor-signup-draft') || 'null');
      const ownerUid = session?.uid || pendingDraft?.uid || null;

      if (!businessName || !storeDisplayName || !businessCategory || !businessPhone || !businessEmail || !country || !state || !city || !address || !ownerName) {
        showMessage(messageElement, 'Please complete the required business and owner details to continue.', false);
        return;
      }
      if (!emailRegex.test(businessEmail) || (ownerEmail && !emailRegex.test(ownerEmail))) {
        showMessage(messageElement, 'Please enter valid email addresses for the business and owner where provided.', false);
        return;
      }
      if (!agreeTerms || !agreeRules || !agreePrivacy) {
        showMessage(messageElement, 'You must agree to the TTStore Terms, Marketplace Rules, and Privacy Policy.', false);
        return;
      }
      if (!session) {
        const pendingDraft = JSON.parse(localStorage.getItem('tula-vendor-signup-draft') || 'null');
        if (!pendingDraft?.email || !pendingDraft?.password) {
          showMessage(messageElement, 'Please create your vendor account first before completing registration.', false);
          return;
        }
      }
      if (session && !['vendor', 'admin'].includes(session.role) && !session.pendingVendorOnboarding) {
        showMessage(messageElement, 'Create a vendor account before completing vendor registration.', false);
        return;
      }
      const storedVendorProfiles = JSON.parse(localStorage.getItem('tula-vendor-profiles') || '[]');
      if (ownerUid && storedVendorProfiles.some((profile) => profile.ownerUid === ownerUid)) {
        showMessage(messageElement, 'This user already owns a vendor account.', false);
        return;
      }

      const vendorId = session?.vendorId || generateVendorId();
      const storeSlug = session?.storeSlug || generateUniqueStoreSlug(storeDisplayName, ownerUid || undefined);
      let storeLogo;
      let storeBanner;
      try {
        showMessage(messageElement, 'Uploading your store branding...', true);
        const [compressedLogo, compressedBanner] = await Promise.all([
          compressImage(storeLogoFile, 800, 0.86),
          compressImage(storeBannerFile, 1600, 0.86)
        ]);
        const [uploadedLogo, uploadedBanner] = await Promise.all([
          uploadImageToCloudinary(compressedLogo, `tula-market/${vendorId}/branding`),
          uploadImageToCloudinary(compressedBanner, `tula-market/${vendorId}/branding`)
        ]);
        storeLogo = uploadedLogo.url;
        storeBanner = uploadedBanner.url;
      } catch (error) {
        showMessage(messageElement, error.message || 'Unable to upload your store branding.', false);
        return;
      }
      const vendorProfile = {
        vendorId,
        storeSlug,
        businessName,
        storeDisplayName,
        businessCategory,
        businessDescription: businessDescription || '',
        businessPhone,
        businessEmail,
        location: {
          country,
          state,
          city,
          address
        },
        owner: {
          name: ownerName,
          phone: ownerPhone || '',
          email: ownerEmail || '',
          profilePicture: ownerPicture || ''
        },
        branding: {
          logo: storeLogo || '',
          banner: storeBanner || ''
        },
        businessDetails: {
          productType: 'physical',
          yearsInBusiness: '0',
          physicalStore: 'no',
          deliveryAvailable,
          deliveryLocations
        },
        policies: { shipping: shippingPolicy, returns: returnPolicy, refunds: refundPolicy },
        verification: { status: 'pending', verified: false },
        plan: 'standard',
        socials: {
          instagram: '',
          facebook: '',
          tiktok: '',
          whatsapp: ''
        },
        agreements: {
          terms: agreeTerms,
          rules: agreeRules,
          privacy: agreePrivacy
        },
        ownerUid: ownerUid || null,
        ownerEmail: ownerEmail || businessEmail,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      showMessage(messageElement, 'Submitting vendor registration...', true);
      try {
        let completedSession = session;
        if (session?.pendingVendorOnboarding) {
          const accountResult = await window.tulaAuth.completeVendorSignUp();
          if (!accountResult.success) throw new Error(accountResult.message);
          vendorProfile.ownerUid = accountResult.uid;
          vendorProfile.vendorId = accountResult.vendorId;
          vendorProfile.storeSlug = accountResult.storeSlug;
          completedSession = window.tulaAuth.getSession();
        }

        saveVendorIdentityProfile(vendorProfile);

        const canUseFirestore = Boolean(window.tulaFirebaseFirestore && window.tulaFirebaseAuth?.currentUser);
        if (canUseFirestore) {
          try {
            await window.tulaFirebaseFirestore.collection('vendors').doc(vendorProfile.vendorId).set(vendorProfile, { merge: true });
            await window.tulaFirebaseFirestore.collection('stores').doc(vendorProfile.storeSlug).set({
              slug: vendorProfile.storeSlug,
              vendorId: vendorProfile.vendorId,
              name: storeDisplayName,
              businessName,
              description: businessDescription,
              category: businessCategory,
              location: [city, country].filter(Boolean).join(', ') || 'Online',
              banner: storeBanner,
              logo: storeLogo,
              contact: businessPhone,
              email: businessEmail,
              verified: false,
              verificationStatus: 'pending',
              plan: 'standard',
              policies: { shipping: shippingPolicy, returns: returnPolicy, refunds: refundPolicy },
              shipping: { deliveryAvailable, deliveryLocations },
              updatedAt: new Date().toISOString()
            }, { merge: true });
            if (ownerUid || completedSession?.uid) {
              const firestoreUserId = ownerUid || completedSession.uid;
              await window.tulaFirebaseFirestore.collection('users').doc(firestoreUserId).set({
                role: 'vendor',
                vendorId: vendorProfile.vendorId,
                storeSlug: vendorProfile.storeSlug,
                name: ownerName,
                storeName: storeDisplayName,
                vendorProfileComplete: true
              }, { merge: true });
            }
          } catch (firestoreError) {
            console.warn('Firestore vendor write blocked or denied:', firestoreError);
            showMessage(messageElement, 'Vendor profile saved locally. Firestore permissions are blocking the cloud sync, but your store can still continue in this browser.', true);
          }
        }

        const updatedSession = {
          ...(completedSession || session || {}),
          role: 'vendor',
          vendorId: vendorProfile.vendorId,
          storeSlug: vendorProfile.storeSlug,
          name: ownerName,
          storeName: storeDisplayName,
          email: ownerEmail || businessEmail || (completedSession?.email || session?.email || pendingDraft?.email || ''),
          pendingVendorOnboarding: false
        };
        localStorage.setItem('tula-auth-session', JSON.stringify(updatedSession));
        showMessage(messageElement, 'Vendor registration complete. Redirecting to your dashboard...', true);
        setTimeout(() => {
          window.location.href = getVendorDashboardPath();
        }, 1200);
      } catch (error) {
        console.warn('Vendor registration failed:', error);
        if (session?.pendingVendorOnboarding) {
          const firebaseUser = window.tulaFirebaseAuth?.currentUser;
          if (firebaseUser) {
            await firebaseUser.delete().catch(() => {});
          }
          window.tulaAuth.clearLocalAccountData(vendorProfile.ownerUid, vendorProfile.ownerEmail);
          window.tulaAuth.signOut();
          showMessage(messageElement, error.message || 'Vendor registration could not be completed. No account was created.', false);
        } else {
          saveVendorIdentityProfile(vendorProfile);
          showMessage(messageElement, error.message || 'Vendor registration could not be completed locally. Please try again.', false);
        }
      }
    });
  }
}

function setupNewsletterForm() {
  const form = document.querySelector('.newsletter-form');
  if (!form) return;
  const message = document.getElementById('newsletterMessage');
  const button = form.querySelector('button[type="submit"]');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (button) button.disabled = true;
    if (message) message.textContent = 'Joining the TULA circle...';
    try {
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString()
      });
      if (!response.ok) throw new Error('Newsletter signup failed.');
      form.reset();
      if (message) message.textContent = 'You are on the TULA circle list.';
      showToast('You are on the TULA circle list.', true);
    } catch (error) {
      if (message) message.textContent = 'Unable to subscribe right now. Please try again.';
      showToast('Unable to subscribe right now.', false);
    } finally {
      if (button) button.disabled = false;
    }
  });
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function generateVendorId() {
  const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomCode = window.crypto?.randomUUID
    ? window.crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()
    : Math.random().toString(36).slice(2, 8).toUpperCase();
  return `TT-VND-${dateCode}-${randomCode}`;
}

function generateUniqueStoreSlug(baseName, ownerUid) {
  const raw = slugify(baseName || 'tulas-market-store');
  const base = raw || `store-${Date.now()}`;
  const existing = JSON.parse(localStorage.getItem('tula-vendor-profiles') || '[]');
  const usedSlugs = new Set(existing.map((vendor) => vendor.storeSlug).filter(Boolean));
  if (!usedSlugs.has(base)) {
    return base;
  }
  const suffix = ownerUid ? ownerUid.slice(-4) : Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

function saveVendorIdentityProfile(vendorProfile) {
  const existing = JSON.parse(localStorage.getItem('tula-vendor-profiles') || '[]');
  const index = existing.findIndex((vendor) => vendor.ownerUid === vendorProfile.ownerUid || vendor.vendorId === vendorProfile.vendorId);
  if (index >= 0) {
    existing[index] = vendorProfile;
  } else {
    existing.push(vendorProfile);
  }
  localStorage.setItem('tula-vendor-profiles', JSON.stringify(existing));

  const store = {
    slug: vendorProfile.storeSlug,
    vendorId: vendorProfile.vendorId,
    name: vendorProfile.storeDisplayName || vendorProfile.businessName,
    tagline: vendorProfile.businessDescription || 'Premium storefront',
    description: vendorProfile.businessDescription || 'Premium storefront created on TULA MARKET.',
    rating: 4.8,
    followers: 0,
    featured: false,
    new: true,
    category: vendorProfile.businessCategory || 'General',
    location: [vendorProfile.location?.city, vendorProfile.location?.country].filter(Boolean).join(', ') || 'Online',
    banner: vendorProfile.branding?.banner || 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80',
    logo: vendorProfile.branding?.logo || 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
    accent: '#d4af37',
    featuredProducts: [],
    contact: vendorProfile.businessPhone || vendorProfile.businessEmail || '',
    email: vendorProfile.businessEmail || '',
    businessName: vendorProfile.businessName || vendorProfile.storeDisplayName,
    vendorId: vendorProfile.vendorId,
    verified: vendorProfile.verification?.verified === true,
    verificationStatus: vendorProfile.verification?.status || 'pending',
    plan: vendorProfile.plan || 'standard',
    policies: vendorProfile.policies || {},
    shipping: vendorProfile.businessDetails || {}
  };

  const persisted = JSON.parse(localStorage.getItem('tula-commerce-data') || '{"stores":[],"products":[]}');
  const existingStores = persisted.stores || [];
  const storeIndex = existingStores.findIndex((item) => item.slug === store.slug || item.name === store.name);
  if (storeIndex >= 0) {
    existingStores[storeIndex] = { ...existingStores[storeIndex], ...store };
  } else {
    existingStores.push(store);
  }
  persisted.stores = existingStores;
  localStorage.setItem('tula-commerce-data', JSON.stringify(persisted));
  if (window.tulaCommerceData) {
    window.tulaCommerceData.stores = existingStores;
  }
}

function getStoreBySlug(slug) {
  const normalizedSlug = String(slug || '').trim();
  const persistedProfiles = JSON.parse(localStorage.getItem('tula-vendor-profiles') || '[]');
  const profile = persistedProfiles.find((vendor) => String(vendor.storeSlug || '').toLowerCase() === normalizedSlug.toLowerCase() || String(vendor.vendorId || '').toLowerCase() === normalizedSlug.toLowerCase());
  if (profile) {
    return {
      slug: profile.storeSlug,
      name: profile.storeDisplayName || profile.businessName,
      tagline: profile.businessDescription || 'Premium storefront',
      description: profile.businessDescription || 'Premium storefront created on TULA MARKET.',
      rating: 4.8,
      followers: 0,
      featured: false,
      new: true,
      category: profile.businessCategory || 'General',
      location: [profile.location?.city, profile.location?.country].filter(Boolean).join(', ') || 'Online',
      banner: profile.branding?.banner || 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80',
      logo: profile.branding?.logo || 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
      accent: '#d4af37',
      featuredProducts: [],
      contact: profile.businessPhone || profile.businessEmail || '',
      email: profile.businessEmail || '',
      businessName: profile.businessName || profile.storeDisplayName,
      vendorId: profile.vendorId,
      verified: profile.verification?.verified === true,
      verificationStatus: profile.verification?.status || 'pending',
      plan: profile.plan || 'standard',
      policies: profile.policies || {},
      shipping: profile.businessDetails || {}
    };
  }

  const storedData = JSON.parse(localStorage.getItem('tula-commerce-data') || 'null');
  const storedStore = storedData?.stores?.find((store) => String(store.slug || '').toLowerCase() === normalizedSlug.toLowerCase() && store.vendorId);
  if (storedStore) return storedStore;

  const session = getCurrentSession();
  if (session?.storeSlug && String(session.storeSlug).toLowerCase() === normalizedSlug.toLowerCase()) {
    return {
      slug: session.storeSlug,
      name: session.storeName || session.name || 'Your Store',
      tagline: 'Your storefront is ready for products.',
      description: 'Your storefront is ready for products and customer orders.',
      rating: 4.8,
      followers: 0,
      featured: false,
      new: true,
      category: 'General',
      location: 'Online',
      banner: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80',
      logo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
      accent: '#d4af37',
      featuredProducts: [],
      contact: session.email || '',
      email: session.email || '',
      businessName: session.storeName || session.name || 'Your Store',
      vendorId: session.vendorId || null,
      verified: false,
      verificationStatus: 'pending',
      plan: 'standard',
      policies: {},
      shipping: {}
    };
  }

  return getMarketplaceStores().find((store) => String(store.slug || '').toLowerCase() === normalizedSlug.toLowerCase()) || commerceData.stores.find((store) => String(store.slug || '').toLowerCase() === normalizedSlug.toLowerCase()) || null;
}

async function getPublicStore(slug) {
  const localStore = getStoreBySlug(slug);
  if (!window.tulaFirebaseFirestore && window.tulaFirebaseInitialize) {
    try {
      await window.tulaFirebaseInitialize();
    } catch (error) {
      console.warn('Firebase initialization failed for public store:', error);
    }
  }
  if (window.tulaFirebaseFirestore) {
    try {
      const storeDocument = await window.tulaFirebaseFirestore.collection('stores').doc(slug).get();
      if (storeDocument.exists) return { ...localStore, ...storeDocument.data(), slug };
    } catch (error) {
      console.warn('Unable to read public store:', error);
    }
  }
  return localStore?.slug === slug ? localStore : null;
}

async function getPublicStoreProducts(slug) {
  const localProducts = getPublicProducts().filter((product) => product.slug === slug || product.storeSlug === slug);
  if (isDemoDataEnabled() === false) {
    commerceData.products
      .filter((product) => product.status === 'Active' && (product.slug === slug || product.storeSlug === slug))
      .forEach((product) => localProducts.push(product));
  }
  if (!window.tulaFirebaseFirestore && window.tulaFirebaseInitialize) {
    try {
      await window.tulaFirebaseInitialize();
    } catch (error) {
      console.warn('Firebase initialization failed for public products:', error);
    }
  }
  if (window.tulaFirebaseFirestore) {
    try {
      const snapshot = await window.tulaFirebaseFirestore.collection('products')
        .where('storeSlug', '==', slug)
        .where('status', '==', 'Active')
        .get();
      const remoteProducts = snapshot.docs.map((doc) => ({ productId: doc.id, ...doc.data() }));
      const byId = new Map(localProducts.map((product) => [getProductKey(product), product]));
      remoteProducts.forEach((product) => byId.set(getProductKey(product), product));
      return Array.from(byId.values());
    } catch (error) {
      console.warn('Unable to read public store products:', error);
    }
  }
  return localProducts;
}

function getVendorStore() {
  const session = getCurrentSession();
  if (!session?.storeSlug) return null;
  const existingStore = getStoreBySlug(session.storeSlug);
  if (existingStore?.slug === session.storeSlug) return existingStore;
  const store = {
    slug: session.storeSlug,
    name: session.storeName || session.name || 'Your Store',
    description: 'A new storefront ready for your products and customers.',
    tagline: 'Your new marketplace storefront',
    category: 'General',
    location: 'Online',
    contact: session.email || '',
    email: session.email || '',
    banner: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1400&q=80',
    logo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=240&q=80',
    accent: '#d4af37',
    featuredProducts: []
  };
  const data = JSON.parse(localStorage.getItem('tula-commerce-data') || '{"stores":[],"products":[]}');
  data.stores = [...(data.stores || []), store];
  localStorage.setItem('tula-commerce-data', JSON.stringify(data));
  return store;
}

function getLocalVendorProducts(vendorId) {
  const data = JSON.parse(localStorage.getItem('tula-commerce-data') || '{"products":[]}');
  return (data.products || []).filter((product) => product.vendorId === vendorId);
}

async function getVendorProducts(vendorId) {
  let products = getLocalVendorProducts(vendorId);
  if (window.tulaFirebaseFirestore && vendorId) {
    try {
      const snapshot = await retryAsync(() => window.tulaFirebaseFirestore.collection('products').where('vendorId', '==', vendorId).get());
      const remoteProducts = snapshot.docs.map((doc) => ({ productId: doc.id, ...doc.data() }));
      const byId = new Map(products.map((product) => [product.productId, product]));
      remoteProducts.forEach((product) => byId.set(product.productId, product));
      products = Array.from(byId.values());
    } catch (error) {
      console.warn('Unable to read vendor products from Firestore:', error);
      throw error;
    }
  }
  return products;
}

function formatProductDate(value) {
  if (!value) return 'Not available';
  const date = value.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleDateString();
}

function getProductAvailability(product) {
  return product.availability || (Number(product.stockQuantity ?? product.stock ?? 0) > 0 ? 'In Stock' : 'Out of Stock');
}

function getProductStock(product) {
  return product.stockQuantity ?? product.stock ?? 0;
}

function getProductName(product) {
  return product.productName || product.name || 'Unnamed product';
}

function getProductKey(product) {
  return product.productId || `${product.slug || 'store'}-${slugify(getProductName(product))}`;
}

function getPublicProducts() {
  let localProducts = [];
  try {
    localProducts = JSON.parse(localStorage.getItem('tula-commerce-data') || '{"products":[]}').products || [];
  } catch (error) {
    localProducts = [];
  }
  const byId = new Map((isDemoDataEnabled() ? commerceData.products : []).map((product) => [product.productId || `${product.slug}-${product.name}`, product]));
  publicFirestoreProducts.forEach((product) => byId.set(getProductKey(product), product));
  localProducts.forEach((product) => byId.set(product.productId || `${product.slug}-${product.name}`, product));
  return Array.from(byId.values()).filter((product) => product.status === 'Active');
}

let publicFirestoreProducts = [];
let publicFirestoreStores = [];

async function refreshPublicStores() {
  if (!window.tulaFirebaseFirestore && window.tulaFirebaseInitialize) {
    try {
      await window.tulaFirebaseInitialize();
    } catch (error) {
      console.warn('Firebase initialization failed for marketplace stores:', error);
    }
  }
  if (!window.tulaFirebaseFirestore) return;
  try {
    const snapshot = await window.tulaFirebaseFirestore.collection('stores').get();
    publicFirestoreStores = snapshot.docs.map((doc) => ({
      ...doc.data(),
      slug: doc.data().slug || doc.id,
      featuredProducts: Array.isArray(doc.data().featuredProducts) ? doc.data().featuredProducts : []
    }));
    renderHomepageDiscovery();
    renderShopPage();
    refreshShopCategoryOptions();
    document.getElementById('shopCategory')?.dispatchEvent(new Event('change'));
  } catch (error) {
    console.warn('Unable to refresh marketplace stores:', error);
  }
}

async function refreshPublicProducts() {
  if (!window.tulaFirebaseFirestore && window.tulaFirebaseInitialize) {
    try {
      await window.tulaFirebaseInitialize();
    } catch (error) {
      console.warn('Firebase initialization failed for marketplace products:', error);
    }
  }
  if (!window.tulaFirebaseFirestore) return;
  try {
    const snapshot = await window.tulaFirebaseFirestore.collection('products').where('status', '==', 'Active').get();
    publicFirestoreProducts = snapshot.docs.map((doc) => ({ productId: doc.id, ...doc.data() }));
    renderHomepageDiscovery();
    renderShopPage();
    refreshShopCategoryOptions();
    document.getElementById('shopCategory')?.dispatchEvent(new Event('change'));
    if (document.getElementById('storePageContent')) renderStorePage();
    if (document.getElementById('publicProductPageContent')) renderPublicProductPage();
  } catch (error) {
    console.warn('Unable to refresh marketplace products:', error);
  }
}

function renderVendorProductsPage() {
  const container = document.getElementById('vendorProductsContent');
  if (!container) return;
  const session = getCurrentSession();
  const vendorId = session?.vendorId;
  if (!vendorId) {
    container.innerHTML = '<div class="empty-state"><strong>Vendor profile required.</strong><p class="muted">Complete vendor registration before viewing products.</p></div>';
    return;
  }

  const controls = {
    search: document.getElementById('vendorProductSearch'),
    category: document.getElementById('vendorProductCategory'),
    availability: document.getElementById('vendorProductAvailability'),
    status: document.getElementById('vendorProductStatus'),
    sort: document.getElementById('vendorProductSort')
  };
  const table = document.getElementById('vendorProductsTable');
  const count = document.getElementById('vendorProductsCount');
  const notice = document.getElementById('vendorProductsNotice');
  let products = [];

  const bindStockControls = () => {
    table.querySelectorAll('.vendor-stock-save').forEach((button) => button.addEventListener('click', async () => {
      const product = products.find((item) => item.productId === button.dataset.productId);
      const input = table.querySelector(`.vendor-stock-input[data-product-id="${button.dataset.productId}"]`);
      const stockQuantity = Number(input?.value);
      if (!product || !Number.isInteger(stockQuantity) || stockQuantity < 0) {
        showMessage(notice, 'Enter a whole number of zero or more for stock.', false);
        return;
      }
      button.disabled = true;
      try {
        const updatedAt = new Date().toISOString();
        const updatedProduct = { ...product, stockQuantity, stock: stockQuantity, updatedAt };
        if (window.tulaFirebaseFirestore) {
          await window.tulaFirebaseFirestore.collection('products').doc(product.productId).update({ stockQuantity, stock: stockQuantity, updatedAt });
        }
        const localData = JSON.parse(localStorage.getItem('tula-commerce-data') || '{"products":[]}');
        const localIndex = (localData.products || []).findIndex((item) => item.productId === product.productId && item.vendorId === vendorId);
        if (localIndex >= 0) localData.products[localIndex] = { ...localData.products[localIndex], ...updatedProduct };
        localStorage.setItem('tula-commerce-data', JSON.stringify(localData));
        Object.assign(product, updatedProduct);
        showMessage(notice, `${getProductName(product)} stock updated.`, true);
        render();
      } catch (error) {
        showMessage(notice, getFirebaseAccessMessage(error, 'Unable to update stock quantity.'), false);
      } finally {
        button.disabled = false;
      }
    }));
  };

  if (new URLSearchParams(window.location.search).get('deleted') === '1') {
    showMessage(notice, 'Product deleted successfully.', true);
    showToast('Product deleted successfully.', true);
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const render = () => {
    const query = controls.search.value.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const matchesSearch = !query || [getProductName(product), product.sku, product.category].some((value) => String(value || '').toLowerCase().includes(query));
      const matchesCategory = !controls.category.value || product.category === controls.category.value;
      const matchesAvailability = !controls.availability.value || getProductAvailability(product) === controls.availability.value;
      const matchesStatus = !controls.status.value || (product.status || 'Draft') === controls.status.value;
      return matchesSearch && matchesCategory && matchesAvailability && matchesStatus;
    });
    const sort = controls.sort.value;
    filtered.sort((left, right) => {
      if (sort === 'oldest') return new Date(left.createdAt || 0) - new Date(right.createdAt || 0);
      if (sort === 'alphabetical') return getProductName(left).localeCompare(getProductName(right));
      if (sort === 'price') return Number(left.price || 0) - Number(right.price || 0);
      return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
    });
    count.textContent = `${filtered.length} product${filtered.length === 1 ? '' : 's'}`;
    table.innerHTML = filtered.length ? filtered.map((product) => `
      <tr>
        <td><a class="vendor-product-preview" href="../../pages/vendor-product-view.html?id=${encodeURIComponent(product.productId)}"><img src="${product.featuredImage || product.image || ''}" alt="${getProductName(product)}" /><span>${getProductName(product)}</span></a></td>
        <td class="price">${formatCurrency(product.price)}</td>
        <td><div class="vendor-stock-control"><input class="vendor-stock-input" type="number" min="0" step="1" value="${getProductStock(product)}" data-product-id="${product.productId}" aria-label="Stock quantity for ${getProductName(product)}" /><button class="vendor-stock-save" type="button" data-product-id="${product.productId}">Save</button></div></td>
        <td><span class="status-badge">${product.status || 'Draft'}</span></td>
        <td>${formatProductDate(product.createdAt)}</td>
      </tr>`).join('') : '<tr><td colspan="5"><div class="empty-state"><strong>No matching products.</strong><p class="muted">Try changing your search or filters.</p></div></td></tr>';
    bindStockControls();
  };

  getVendorProducts(vendorId).then((loadedProducts) => {
    products = loadedProducts;
    const categories = [...new Set(products.map((product) => product.category).filter(Boolean))].sort();
    controls.category.innerHTML = '<option value="">All Categories</option>' + categories.map((category) => `<option value="${category}">${category}</option>`).join('');
    render();
  }).catch((error) => {
    const message = getFirebaseAccessMessage(error, 'We could not load your products.');
    showToast(message, false);
    table.innerHTML = `<tr><td colspan="5"><div class="empty-state error-state"><strong>${message}</strong><p class="muted">Check your connection and try again.</p><button id="retryVendorProducts" class="btn btn-secondary" type="button">Retry</button></div></td></tr>`;
    document.getElementById('retryVendorProducts')?.addEventListener('click', () => renderVendorProductsPage());
  });
  Object.values(controls).forEach((control) => control.addEventListener('input', render));
}

async function renderVendorProductView() {
  const container = document.getElementById('vendorProductViewContent');
  if (!container) return;
  const session = getCurrentSession();
  const productId = new URLSearchParams(window.location.search).get('id');
  let product = null;
  try {
    product = (session?.vendorId && productId)
      ? (await getVendorProducts(session.vendorId)).find((item) => item.productId === productId)
      : null;
  } catch (error) {
    const message = getFirebaseAccessMessage(error, 'We could not load this product.');
    container.innerHTML = `<div class="empty-state error-state"><strong>${message}</strong><p class="muted">Check your connection and try again.</p><button id="retryVendorProduct" class="btn btn-secondary" type="button">Retry</button></div>`;
    document.getElementById('retryVendorProduct')?.addEventListener('click', () => renderVendorProductView());
    return;
  }
  if (!product) {
    container.innerHTML = '<div class="empty-state"><strong>Product not found.</strong><p class="muted">This product does not belong to your vendor account.</p></div>';
    return;
  }
  const name = getProductName(product);
  document.title = `${name} | Vendor Product View`;
  container.innerHTML = `
    <div class="product-detail-layout">
      <div class="product-detail-image"><img src="${product.featuredImage || product.image || ''}" alt="${name}" /></div>
      <div>
        <p class="eyebrow">Product detail</p><h1 class="page-title">${name}</h1>
        <div class="pill-row"><span class="status-badge">${product.status || 'Draft'}</span><span class="pill">${getProductAvailability(product)}</span><span class="pill">${product.category || 'Uncategorised'}</span></div>
        <p class="product-detail-price">${formatCurrency(product.price)}</p>
        <p class="page-copy">${product.shortDescription || ''}</p>
        <div class="product-detail-facts"><span><strong>Stock</strong>${getProductStock(product)}</span><span><strong>SKU</strong>${product.sku || 'Not available'}</span><span><strong>Created</strong>${formatProductDate(product.createdAt)}</span></div>
        <div class="hero-actions"><button id="editProductBtn" class="btn btn-primary" type="button">Edit Product</button><button id="deleteProductBtn" class="btn btn-danger" type="button">Delete Product</button></div>
      </div>
    </div>
    ${(product.additionalImages || []).length ? `<div class="product-detail-gallery">${product.additionalImages.map((image, index) => `<img src="${image}" alt="${name} image ${index + 2}" />`).join('')}</div>` : ''}
    <section class="vendor-section product-detail-section"><h2 class="section-title">Product Information</h2><dl class="product-detail-list">
      <div><dt>Full Description</dt><dd>${product.fullDescription || 'Not provided'}</dd></div><div><dt>Subcategory</dt><dd>${product.subcategory || 'Not provided'}</dd></div><div><dt>Brand</dt><dd>${product.brand || 'Not provided'}</dd></div><div><dt>Discount Price</dt><dd>${product.discountPrice ? formatCurrency(product.discountPrice) : 'Not provided'}</dd></div><div><dt>Condition</dt><dd>${product.condition || 'Not provided'}</dd></div><div><dt>Shipping Weight</dt><dd>${product.shippingWeight || 'Not provided'}</dd></div><div><dt>Dimensions</dt><dd>${product.dimensions || 'Not provided'}</dd></div><div><dt>Delivery Available</dt><dd>${product.deliveryAvailable || 'Not provided'}</dd></div><div><dt>Tags</dt><dd>${(product.tags || []).join(', ') || 'None'}</dd></div><div><dt>Keywords</dt><dd>${(product.keywords || []).join(', ') || 'None'}</dd></div><div><dt>Vendor ID</dt><dd>${product.vendorId || 'Not provided'}</dd></div><div><dt>Store Slug</dt><dd>${product.storeSlug || 'Not provided'}</dd></div><div><dt>Last Updated</dt><dd>${formatProductDate(product.updatedAt)}</dd></div>
    </dl></section>
    <section id="editProductPanel" class="vendor-section product-edit-panel" hidden>
      <div class="section-header"><div><p class="eyebrow">Inventory update</p><h2 class="section-title">Edit Product</h2></div></div>
      <form id="editVendorProductForm" class="product-edit-form" novalidate>
        <div class="form-grid"><div class="form-group"><label for="editProductName">Product Name *</label><input id="editProductName" value="${product.productName || product.name || ''}" required /></div><div class="form-group"><label for="editCategory">Category *</label><input id="editCategory" value="${product.category || ''}" required /></div></div>
        <div class="form-group"><label for="editShortDescription">Short Description *</label><input id="editShortDescription" value="${product.shortDescription || ''}" required /></div>
        <div class="form-group"><label for="editFullDescription">Full Description *</label><textarea id="editFullDescription" rows="4" required>${product.fullDescription || ''}</textarea></div>
        <div class="form-grid"><div class="form-group"><label for="editSubcategory">Subcategory</label><input id="editSubcategory" value="${product.subcategory || ''}" /></div><div class="form-group"><label for="editBrand">Brand</label><input id="editBrand" value="${product.brand || ''}" /></div></div>
        <div class="form-grid"><div class="form-group"><label for="editPrice">Price *</label><input id="editPrice" type="number" min="0" step="0.01" value="${product.price ?? ''}" required /></div><div class="form-group"><label for="editDiscountPrice">Discount Price</label><input id="editDiscountPrice" type="number" min="0" step="0.01" value="${product.discountPrice ?? ''}" /></div></div>
        <div class="form-grid"><div class="form-group"><label for="editStockQuantity">Stock *</label><input id="editStockQuantity" type="number" min="0" step="1" value="${getProductStock(product)}" required /></div><div class="form-group"><label for="editStatus">Status *</label><select id="editStatus" required><option value="Draft" ${product.status === 'Draft' || !product.status ? 'selected' : ''}>Draft</option><option value="Active" ${product.status === 'Active' ? 'selected' : ''}>Active</option><option value="Hidden" ${product.status === 'Hidden' ? 'selected' : ''}>Hidden</option><option value="Out of Stock" ${product.status === 'Out of Stock' ? 'selected' : ''}>Out of Stock</option><option value="Archived" ${product.status === 'Archived' ? 'selected' : ''}>Archived</option></select></div></div>
        <div class="form-grid"><div class="form-group"><label for="editAvailability">Availability *</label><select id="editAvailability" required><option value="In Stock" ${getProductAvailability(product) === 'In Stock' ? 'selected' : ''}>In Stock</option><option value="Out of Stock" ${getProductAvailability(product) === 'Out of Stock' ? 'selected' : ''}>Out of Stock</option><option value="Preorder" ${getProductAvailability(product) === 'Preorder' ? 'selected' : ''}>Preorder</option></select></div><div class="form-group"><label for="editDeliveryAvailable">Delivery Available</label><select id="editDeliveryAvailable"><option value="yes" ${product.deliveryAvailable === 'yes' ? 'selected' : ''}>Yes</option><option value="no" ${product.deliveryAvailable === 'no' ? 'selected' : ''}>No</option></select></div></div>
        <div class="form-grid"><div class="form-group"><label for="editShippingWeight">Shipping Weight</label><input id="editShippingWeight" value="${product.shippingWeight || ''}" /></div><div class="form-group"><label for="editDimensions">Dimensions</label><input id="editDimensions" value="${product.dimensions || ''}" /></div></div>
        <div class="form-group"><label for="editTags">Tags</label><input id="editTags" value="${(product.tags || []).join(', ')}" /></div>
        <div class="form-group"><label for="editProductImages">Replace or add images</label><input id="editProductImages" type="file" accept="image/*" multiple /><small class="muted">Select new images to add. Uncheck existing images to remove them.</small><div id="editProductImagePreview" class="image-preview-grid"></div></div>
        <div class="edit-image-grid">${[product.featuredImage, ...(product.additionalImages || [])].filter(Boolean).map((image, index) => `<label class="edit-image-item"><img src="${image}" alt="${name} image ${index + 1}" /><span><input type="checkbox" class="keep-product-image" value="${image}" checked /> Keep image</span></label>`).join('') || '<p class="muted">No uploaded images remain.</p>'}</div>
        <div class="hero-actions"><button id="saveProductEditsBtn" class="btn btn-primary" type="submit">Save Changes</button><button id="cancelProductEditsBtn" class="btn btn-secondary" type="button">Cancel</button></div>
        <p id="editProductMessage" class="muted" role="status"></p>
      </form>
    </section>
    <div id="deleteProductModal" class="confirmation-modal" hidden role="dialog" aria-modal="true" aria-labelledby="deleteProductTitle">
      <div class="confirmation-modal-card"><h2 id="deleteProductTitle">Delete Product</h2><p>Are you sure you want to delete this product?</p><div class="hero-actions"><button id="cancelDeleteProductBtn" class="btn btn-secondary" type="button">Cancel</button><button id="confirmDeleteProductBtn" class="btn btn-danger" type="button">Delete Product</button></div><p id="deleteProductMessage" class="muted" role="status"></p></div>
    </div>`;

  const editPanel = document.getElementById('editProductPanel');
  const editImageInput = document.getElementById('editProductImages');
  const editImagePreview = document.getElementById('editProductImagePreview');
  let isSaving = false;
  editImageInput?.addEventListener('change', () => {
    const files = Array.from(editImageInput.files || []);
    editImagePreview.innerHTML = files.map((file) => `<span class="image-preview-item"><img src="${URL.createObjectURL(file)}" alt="${file.name}" /><span>${file.name}</span></span>`).join('');
  });
  const deleteModal = document.getElementById('deleteProductModal');
  const deleteButton = document.getElementById('deleteProductBtn');
  const cancelDeleteButton = document.getElementById('cancelDeleteProductBtn');
  const confirmDeleteButton = document.getElementById('confirmDeleteProductBtn');
  let isDeleting = false;
  deleteButton?.addEventListener('click', () => {
    if (!isDeleting) deleteModal.hidden = false;
  });
  cancelDeleteButton?.addEventListener('click', () => {
    if (!isDeleting) deleteModal.hidden = true;
  });
  confirmDeleteButton?.addEventListener('click', async () => {
    if (isDeleting) return;
    const currentSession = getCurrentSession();
    const message = document.getElementById('deleteProductMessage');
    if (!currentSession || currentSession.role !== 'vendor' || currentSession.vendorId !== product.vendorId) {
      showMessage(message, 'You do not own this product.', false);
      return;
    }
    isDeleting = true;
    deleteButton.disabled = true;
    confirmDeleteButton.disabled = true;
    confirmDeleteButton.textContent = 'Deleting...';
    showMessage(message, 'Deleting product and associated images...', true);
    try {
      const imageUrls = [product.featuredImage, ...(product.additionalImages || [])].filter(Boolean);
      if (!window.tulaFirebaseFirestore) throw new Error('Firestore is not ready.');
      await window.tulaFirebaseFirestore.collection('products').doc(product.productId).delete();
      await Promise.all((product.imageDeleteTokens || []).filter(Boolean).map((token) => deleteCloudinaryImage(token).catch((cleanupError) => {
        console.warn('Product image cleanup failed after deletion:', cleanupError);
      })));
      const localData = JSON.parse(localStorage.getItem('tula-commerce-data') || '{"products":[]}');
      localData.products = (localData.products || []).filter((item) => !(item.productId === product.productId && item.vendorId === currentSession.vendorId));
      localStorage.setItem('tula-commerce-data', JSON.stringify(localData));
      
      // Create vendor notification for product deletion
      if (window.tulaNotifications && currentSession?.uid) {
        await window.tulaNotifications.createNotification(
          currentSession.uid,
          `Product "${product.productName}" has been deleted.`,
          'warning'
        );
      }
      
      window.location.href = '../../vendor/dashboard/products.html?deleted=1';
    } catch (error) {
      console.error('Product deletion failed:', error);
      const errorMessage = getFirebaseAccessMessage(error, 'Unable to delete product. Please try again.');
      showMessage(message, errorMessage, false);
      showToast(errorMessage, false);
      isDeleting = false;
      deleteButton.disabled = false;
      confirmDeleteButton.disabled = false;
      confirmDeleteButton.textContent = 'Delete Product';
    }
  });
  document.getElementById('editProductBtn')?.addEventListener('click', () => {
    editPanel.hidden = false;
    editPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  document.getElementById('cancelProductEditsBtn')?.addEventListener('click', () => {
    editPanel.hidden = true;
  });
  document.getElementById('editVendorProductForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (isSaving) return;
    const currentSession = getCurrentSession();
    const message = document.getElementById('editProductMessage');
    const saveButton = document.getElementById('saveProductEditsBtn');
    if (!currentSession || currentSession.role !== 'vendor' || currentSession.vendorId !== product.vendorId) {
      showMessage(message, 'You do not own this product.', false);
      return;
    }

    const newFiles = Array.from(document.getElementById('editProductImages')?.files || []);
    const keptImages = Array.from(document.querySelectorAll('.keep-product-image:checked')).map((input) => input.value);
    if (newFiles.length > 8 || !newFiles.every((file) => file.type.startsWith('image/'))) {
      showMessage(message, 'Choose up to 8 image files only.', false);
      return;
    }
    if (newFiles.some((file) => file.size > 15 * 1024 * 1024)) {
      showMessage(message, 'Each image must be smaller than 15 MB.', false);
      return;
    }
    saveButton.disabled = true;
    isSaving = true;
    saveButton.textContent = 'Saving...';
    showMessage(message, 'Saving product changes...', true);
    try {
      let uploadedUrls = [];
      let uploadedDeleteTokens = [];
      if (newFiles.length) {
        const compressedFiles = await Promise.all(newFiles.map((file) => compressImage(file)));
        const uploadedImages = await Promise.all(compressedFiles.map((file) => uploadImageToCloudinary(file, `tula-market/${currentSession.vendorId}/${currentSession.storeSlug}`)));
        uploadedUrls = uploadedImages.map((image) => image.url);
        uploadedDeleteTokens = uploadedImages.map((image) => image.deleteToken || null);
      }
      const imageUrls = [...keptImages, ...uploadedUrls];
      const existingImages = [product.featuredImage, ...(product.additionalImages || [])].filter(Boolean);
      const keptTokens = keptImages.map((image) => product.imageDeleteTokens?.[existingImages.indexOf(image)] || null);
      const updatedProduct = {
        ...product,
        productName: document.getElementById('editProductName').value.trim(),
        name: document.getElementById('editProductName').value.trim(),
        shortDescription: document.getElementById('editShortDescription').value.trim(),
        fullDescription: document.getElementById('editFullDescription').value.trim(),
        category: document.getElementById('editCategory').value.trim(),
        subcategory: document.getElementById('editSubcategory').value.trim(),
        brand: document.getElementById('editBrand').value.trim(),
        price: Number(document.getElementById('editPrice').value),
        discountPrice: Number(document.getElementById('editDiscountPrice').value) || null,
        stockQuantity: Number(document.getElementById('editStockQuantity').value),
        stock: Number(document.getElementById('editStockQuantity').value),
        availability: document.getElementById('editAvailability').value,
        deliveryAvailable: document.getElementById('editDeliveryAvailable').value,
        shippingWeight: document.getElementById('editShippingWeight').value.trim(),
        dimensions: document.getElementById('editDimensions').value.trim(),
        tags: document.getElementById('editTags').value.split(',').map((tag) => tag.trim()).filter(Boolean),
        status: document.getElementById('editStatus').value,
        featuredImage: imageUrls[0] || '',
        image: imageUrls[0] || '',
        additionalImages: imageUrls.slice(1),
        imageDeleteTokens: [...keptTokens, ...uploadedDeleteTokens],
        updatedAt: new Date().toISOString(),
        vendorId: currentSession.vendorId,
        storeSlug: currentSession.storeSlug
      };
      const inputError = validateProductInput(updatedProduct);
      if (inputError) throw new Error(inputError);
      if (!window.tulaFirebaseFirestore) throw new Error('Firestore is not ready.');
      await window.tulaFirebaseFirestore.collection('products').doc(product.productId).set(updatedProduct, { merge: true });
      const localData = JSON.parse(localStorage.getItem('tula-commerce-data') || '{"products":[]}');
      const localIndex = (localData.products || []).findIndex((item) => item.productId === product.productId && item.vendorId === currentSession.vendorId);
      if (localIndex >= 0) localData.products[localIndex] = updatedProduct;
      else localData.products = [...(localData.products || []), updatedProduct];
      localStorage.setItem('tula-commerce-data', JSON.stringify(localData));
      
      // Create vendor notification for product update
      if (window.tulaNotifications && currentSession?.uid) {
        await window.tulaNotifications.createNotification(
          currentSession.uid,
          `Product "${updatedProduct.productName}" has been updated.`,
          'info'
        );
      }
      
      showMessage(message, 'Product updated successfully.', true);
      showToast('Product updated successfully.', true);
      setTimeout(() => renderVendorProductView(), 700);
    } catch (error) {
      console.error('Product update failed:', error);
      const errorMessage = getFirebaseAccessMessage(error, 'Unable to save product changes.');
      showMessage(message, errorMessage, false);
      showToast(errorMessage, false);
    } finally {
      isSaving = false;
      saveButton.disabled = false;
      saveButton.textContent = 'Save Changes';
    }
  });
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
        <a class="btn btn-secondary" href="${getPublicStoreHref(store.slug)}">Visit store</a>
      </div>
    </article>
  `).join('');
}

function buildProductCards(products) {
  return products.map((product) => `
    <a class="product-card" href="${basePath}pages/product.html?id=${encodeURIComponent(getProductKey(product))}">
      <div class="image-frame"><img src="${product.image || product.featuredImage || ''}" alt="${getProductName(product)}" /></div>
      <span class="badge">${product.vendor || 'Marketplace product'}</span>
      <h3>${getProductName(product)}</h3>
      <p class="meta">${product.category}</p>
      <div class="rating">${'★'.repeat(Math.min(5, Math.round(product.rating || 4.8)))}${'☆'.repeat(Math.max(0, 5 - Math.min(5, Math.round(product.rating || 4.8))))}</div>
      <p class="price">${formatCurrency(product.price)}</p>
      <div class="store-stats-inline">
        <span>${product.stock ?? 0} left</span>
        <span>★ ${product.rating || 4.8}</span>
      </div>
    </a>
  `).join('');
}

function renderHomepageDiscovery() {
  const featuredGrid = document.getElementById('featuredStoresGrid');
  const topGrid = document.getElementById('topStoresGrid');
  const newGrid = document.getElementById('newStoresGrid');
  const categoryGrid = document.getElementById('storeCategoriesGrid');
  const featuredProductsGrid = document.getElementById('featuredProductsGrid');
  const topVendorsGrid = document.getElementById('topVendorsGrid');
  const popularCategoriesGrid = document.getElementById('popularCategoriesGrid');
  const stores = getMarketplaceStores();
  if (featuredGrid) featuredGrid.innerHTML = buildStoreCards(stores.filter((store) => store.featured));
  if (topGrid) topGrid.innerHTML = buildStoreCards(stores.filter((store) => store.rating >= 4.8));
  if (newGrid) newGrid.innerHTML = buildStoreCards(stores.filter((store) => store.new));
  if (categoryGrid) {
    const categories = [...new Set(stores.map((store) => store.category).filter(Boolean))];
    categoryGrid.innerHTML = categories.length ? categories.map((category) => `<a class="category-card" href="${basePath}pages/shop.html?category=${encodeURIComponent(category)}"><h3>${category}</h3><p class="meta">Browse active products</p></a>`).join('') : '<div class="empty-state"><strong>No categories yet.</strong><p class="muted">Categories appear as vendors join.</p></div>';
  }
  if (featuredProductsGrid) featuredProductsGrid.innerHTML = getPublicProducts().length ? buildProductCards(getPublicProducts().slice(0, 4)) : '<div class="empty-state"><strong>No products yet.</strong><p class="muted">Vendor products will appear here when they become active.</p></div>';
  if (topVendorsGrid) topVendorsGrid.innerHTML = stores.length ? stores.slice(0, 4).map((store) => `<a class="vendor-card" href="${getPublicStoreHref(store.slug)}"><h3>${store.name}</h3><p class="meta">${store.category || 'Marketplace vendor'} • ${store.rating || 'New'} rating</p></a>`).join('') : '<div class="empty-state"><strong>No vendors yet.</strong><p class="muted">Join the marketplace to open a storefront.</p></div>';
  if (popularCategoriesGrid) popularCategoriesGrid.innerHTML = stores.length ? [...new Set(stores.map((store) => store.category).filter(Boolean))].slice(0, 4).map((category) => `<a class="category-card" href="${basePath}pages/shop.html?category=${encodeURIComponent(category)}"><h3>${category}</h3><p class="meta">Browse active products</p></a>`).join('') : '<div class="empty-state"><strong>No categories yet.</strong><p class="muted">Categories appear as vendors join.</p></div>';
}

function renderShopPage() {
  const productGrid = document.getElementById('shopProductsGrid');
  const storeGrid = document.getElementById('storeDiscoveryGrid');
  if (productGrid) productGrid.innerHTML = buildProductCards(getPublicProducts());
  if (storeGrid) storeGrid.innerHTML = buildStoreCards(getMarketplaceStores());
}

async function renderStorePage() {
  const container = document.getElementById('storePageContent');
  if (!container) return;
  const slug = String(getStoreSlugFromLocation() || '').trim();
  const fallbackStoreName = slug ? slug.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ') : 'New Vendor Store';
  const fallbackStore = {
    slug: slug || 'store',
    name: fallbackStoreName,
    description: 'This storefront is being prepared. Add brand details, products, and policies to launch a complete vendor experience.',
    tagline: 'Premium storefront in progress',
    category: 'General',
    location: 'Online',
    contact: '',
    email: '',
    banner: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80',
    logo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
    accent: '#d4af37',
    rating: 4.8,
    followers: 0,
    verified: false,
    plan: 'standard',
    policies: {},
    shipping: { deliveryAvailable: 'no' },
    businessName: fallbackStoreName,
    productCount: 0
  };

  if (!slug) {
    const store = fallbackStore;
    const storeProducts = [];
    const shippingPolicy = 'Shipping details will be available when the vendor adds their delivery information.';
    const returnPolicy = 'Returns will be shared once the vendor completes their storefront settings.';
    const refundPolicy = 'Refund policy will be added when this vendor activates their storefront.';
    const deliveryStatus = 'Delivery information not yet published.';
    container.innerHTML = `
      <section class="store-hero reveal">
        <img src="${store.banner}" alt="${store.name} banner" />
        <div class="store-hero-overlay">
          <div class="store-hero-content">
            <div class="store-avatar large" style="background: ${store.accent};"><img src="${store.logo}" alt="${store.name} logo" /></div>
            <div>
              <div class="store-hero-kicker">Official storefront</div>
              <h1 class="page-title">${store.name}</h1>
              <p class="page-copy">${store.description}</p>
              <div class="pill-row"><span class="pill">${store.category}</span><span class="pill">${store.location}</span></div>
              <div class="hero-actions store-hero-actions"><a class="btn btn-primary" href="${basePath}pages/shop.html">Browse marketplace</a></div>
            </div>
          </div>
        </div>
      </section>
      <section class="store-stat-strip reveal" aria-label="Store highlights">
        <div><span>Rating</span><strong>★ ${store.rating}</strong></div>
        <div><span>Community</span><strong>${Number(store.followers || 0).toLocaleString()} followers</strong></div>
        <div><span>Catalog</span><strong>${storeProducts.length} active products</strong></div>
        <div><span>Response</span><strong>Vendor onboarding</strong></div>
      </section>
      <section class="store-information grid grid-2 reveal">
        <article class="glass-card"><div class="panel-header"><h3>About this store</h3><div class="store-badges">${store.verified ? '<span class="verified-badge">Verified Vendor</span>' : ''}${store.plan === 'premium' ? '<span class="premium-badge">Premium</span>' : ''}</div></div><p class="muted">${store.description}</p><ul class="action-list"><li><strong>Business Name:</strong> ${store.businessName || store.name}</li><li><strong>Categories:</strong> ${store.category}</li><li><strong>Location:</strong> ${store.location}</li></ul></article>
        <article class="glass-card store-catalog-intro"><div class="panel-header"><div><p class="eyebrow">Curated for you</p><h3>Store catalog</h3></div><span id="storeProductCount" class="badge">0 active</span></div><p class="muted">This vendor has not published products yet.</p><a class="text-link" href="${basePath}pages/shop.html">Explore the marketplace <span aria-hidden="true">→</span></a></article>
      </section>
      <section class="store-trust-grid grid grid-3 reveal"><article class="glass-card"><h3>Shipping</h3><p class="muted">${deliveryStatus}</p><p class="muted">${shippingPolicy}</p></article><article class="glass-card"><h3>Returns</h3><p class="muted">${returnPolicy}</p></article><article class="glass-card"><h3>Refunds</h3><p class="muted">${refundPolicy}</p></article></section>
      <section id="storeCatalog" class="store-catalog-section reveal"><div class="section-header"><div><p class="eyebrow">Shop ${store.name}</p><h2 class="section-title">Active Products</h2></div></div><div id="storeProductsGrid" class="grid grid-3"><div class="empty-state"><strong>No products yet.</strong><p class="muted">This store is still setting up its catalog.</p></div></div></section>
    `;
    return;
  }

  const matchedStore = await getPublicStore(slug);
  const store = matchedStore?.slug === slug ? matchedStore : getVendorStore() || matchedStore || fallbackStore;
  if (!store) {
    const fallback = fallbackStore;
    const storeProducts = [];
    const shippingPolicy = 'Shipping details will be available when the vendor adds their delivery information.';
    const returnPolicy = 'Returns will be shared once the vendor completes their storefront settings.';
    const refundPolicy = 'Refund policy will be added when this vendor activates their storefront.';
    const deliveryStatus = 'Delivery information not yet published.';
    container.innerHTML = `
      <section class="store-hero reveal">
        <img src="${fallback.banner}" alt="${fallback.name} banner" />
        <div class="store-hero-overlay">
          <div class="store-hero-content">
            <div class="store-avatar large" style="background: ${fallback.accent};"><img src="${fallback.logo}" alt="${fallback.name} logo" /></div>
            <div>
              <div class="store-hero-kicker">Official storefront</div>
              <h1 class="page-title">${fallback.name}</h1>
              <p class="page-copy">${fallback.description}</p>
              <div class="pill-row"><span class="pill">${fallback.category}</span><span class="pill">${fallback.location}</span></div>
              <div class="hero-actions store-hero-actions"><a class="btn btn-primary" href="${basePath}pages/shop.html">Browse marketplace</a></div>
            </div>
          </div>
        </div>
      </section>
      <section class="store-stat-strip reveal" aria-label="Store highlights">
        <div><span>Rating</span><strong>★ ${fallback.rating}</strong></div>
        <div><span>Community</span><strong>${Number(fallback.followers || 0).toLocaleString()} followers</strong></div>
        <div><span>Catalog</span><strong>${storeProducts.length} active products</strong></div>
        <div><span>Response</span><strong>Vendor onboarding</strong></div>
      </section>
      <section class="store-information grid grid-2 reveal">
        <article class="glass-card"><div class="panel-header"><h3>About this store</h3><div class="store-badges">${fallback.verified ? '<span class="verified-badge">Verified Vendor</span>' : ''}${fallback.plan === 'premium' ? '<span class="premium-badge">Premium</span>' : ''}</div></div><p class="muted">${fallback.description}</p><ul class="action-list"><li><strong>Business Name:</strong> ${fallback.businessName || fallback.name}</li><li><strong>Categories:</strong> ${fallback.category}</li><li><strong>Location:</strong> ${fallback.location}</li></ul></article>
        <article class="glass-card store-catalog-intro"><div class="panel-header"><div><p class="eyebrow">Curated for you</p><h3>Store catalog</h3></div><span id="storeProductCount" class="badge">0 active</span></div><p class="muted">This vendor has not published products yet.</p><a class="text-link" href="${basePath}pages/shop.html">Explore the marketplace <span aria-hidden="true">→</span></a></article>
      </section>
      <section class="store-trust-grid grid grid-3 reveal"><article class="glass-card"><h3>Shipping</h3><p class="muted">${deliveryStatus}</p><p class="muted">${shippingPolicy}</p></article><article class="glass-card"><h3>Returns</h3><p class="muted">${returnPolicy}</p></article><article class="glass-card"><h3>Refunds</h3><p class="muted">${refundPolicy}</p></article></section>
      <section id="storeCatalog" class="store-catalog-section reveal"><div class="section-header"><div><p class="eyebrow">Shop ${fallback.name}</p><h2 class="section-title">Active Products</h2></div></div><div id="storeProductsGrid" class="grid grid-3"><div class="empty-state"><strong>No products yet.</strong><p class="muted">This store is still setting up its catalog.</p></div></div></section>
    `;
    return;
  }

  const storeProducts = await getPublicStoreProducts(store.slug);
  const shippingPolicy = store?.policies?.shipping || 'The vendor has not provided a shipping policy yet.';
  const returnPolicy = store?.policies?.returns || 'The vendor has not provided a return policy yet.';
  const refundPolicy = store?.policies?.refunds || 'The vendor has not provided a refund policy yet.';
  const deliveryStatus = store?.shipping?.deliveryAvailable === 'yes' ? `Delivery available${store.shipping?.deliveryLocations ? ` in ${store.shipping.deliveryLocations}` : ''}.` : 'Delivery information unavailable.';
  document.title = `${store.name} | TULA MARKET`;
  container.innerHTML = `
    <section class="store-hero reveal">
      <img src="${store.banner}" alt="${store.name} banner" />
      <div class="store-hero-overlay">
        <div class="store-hero-content">
          <div class="store-avatar large" style="background: ${store.accent};"><img src="${store.logo}" alt="${store.name} logo" /></div>
          <div>
            <div class="store-hero-kicker">Official storefront</div>
            <h1 class="page-title">${store.name}</h1>
            <p class="page-copy">${store.description}</p>
            <div class="pill-row"><span class="pill">${store.category}</span><span class="pill">${store.location}</span></div>
            <div class="hero-actions store-hero-actions"><a class="btn btn-primary" href="#storeCatalog">Browse products</a>${store.email ? `<a class="btn btn-secondary" href="mailto:${store.email}">Contact store</a>` : ''}</div>
          </div>
        </div>
      </div>
    </section>
    <section class="store-stat-strip reveal" aria-label="Store highlights">
      <div><span>Rating</span><strong>★ ${store.rating || 'New'}</strong></div>
      <div><span>Community</span><strong>${Number(store.followers || 0).toLocaleString()} followers</strong></div>
      <div><span>Catalog</span><strong>${storeProducts.length} active products</strong></div>
      <div><span>Response</span><strong>Local vendor</strong></div>
    </section>
    <section class="store-information grid grid-2 reveal">
      <article class="glass-card"><div class="panel-header"><h3>About this store</h3><div class="store-badges">${store.verified ? '<span class="verified-badge">Verified Vendor</span>' : ''}${store.plan === 'premium' ? '<span class="premium-badge">Premium</span>' : ''}</div></div><p class="muted">${store.description}</p><ul class="action-list"><li><strong>Business Name:</strong> ${store.businessName || store.name}</li><li><strong>Categories:</strong> ${store.category || 'General'}</li><li><strong>Contact:</strong> ${store.contact || store.email || 'Contact details unavailable'}</li><li><strong>Location:</strong> ${store.location || 'Online'}</li></ul></article>
      <article class="glass-card store-catalog-intro"><div class="panel-header"><div><p class="eyebrow">Curated for you</p><h3>Store catalog</h3></div><span id="storeProductCount" class="badge">${storeProducts.length} active</span></div><p class="muted">Browse every active product from ${store.name}, with fresh stock and local service behind every order.</p><a class="text-link" href="#storeCatalog">Explore the collection <span aria-hidden="true">→</span></a></article>
    </section>
    <section class="store-trust-grid grid grid-3 reveal"><article class="glass-card"><h3>Shipping</h3><p class="muted">${deliveryStatus}</p><p class="muted">${shippingPolicy}</p></article><article class="glass-card"><h3>Returns</h3><p class="muted">${returnPolicy}</p></article><article class="glass-card"><h3>Refunds</h3><p class="muted">${refundPolicy}</p></article></section>
    <section id="storeCatalog" class="store-catalog-section reveal"><div class="section-header"><div><p class="eyebrow">Shop ${store.name}</p><h2 class="section-title">Active Products</h2></div></div><div class="store-product-controls"><label class="vendor-search"><span>Search</span><input id="storeProductSearch" type="search" placeholder="Search products" /></label><label><span>Category</span><select id="storeProductCategory"><option value="">All Categories</option></select></label><label><span>Sort</span><select id="storeProductSort"><option value="newest">Newest</option><option value="price">Price</option><option value="alphabetical">Alphabetical</option></select></label></div><div id="storeProductsGrid" class="grid grid-3"></div></section>
  `;

  const search = document.getElementById('storeProductSearch');
  const category = document.getElementById('storeProductCategory');
  const sort = document.getElementById('storeProductSort');
  const grid = document.getElementById('storeProductsGrid');
  const count = document.getElementById('storeProductCount');
  const categories = [...new Set(storeProducts.map((product) => product.category).filter(Boolean))].sort();
  category.innerHTML = '<option value="">All Categories</option>' + categories.map((item) => `<option value="${item}">${item}</option>`).join('');
  const renderProducts = () => {
    const query = search.value.trim().toLowerCase();
    const visibleProducts = storeProducts.filter((product) => (!query || [getProductName(product), product.category].some((value) => String(value || '').toLowerCase().includes(query))) && (!category.value || product.category === category.value));
    visibleProducts.sort((left, right) => {
      if (sort.value === 'alphabetical') return getProductName(left).localeCompare(getProductName(right));
      if (sort.value === 'price') return Number(left.price || 0) - Number(right.price || 0);
      return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
    });
    count.textContent = `${visibleProducts.length} active`;
    grid.innerHTML = visibleProducts.length ? buildProductCards(visibleProducts) : '<div class="empty-state"><strong>No active products found.</strong><p class="muted">Try a different search or category.</p></div>';
  };
  [search, category, sort].forEach((control) => control.addEventListener('input', renderProducts));
  renderProducts();
}

function renderPublicProductPage() {
  const container = document.getElementById('publicProductPageContent');
  if (!container) return;
  const productKey = new URLSearchParams(window.location.search).get('id');
  const product = getPublicProducts().find((item) => getProductKey(item) === productKey);
  if (!product) {
    container.innerHTML = '<div class="empty-state"><strong>Product unavailable.</strong><p class="muted">This product is not currently active or could not be found.</p></div>';
    return;
  }
  const name = getProductName(product);
  document.title = `${name} | TULA MARKET`;
  const stock = getCartStock(product);
  container.innerHTML = `<div class="product-detail-layout"><div class="product-detail-image"><img src="${product.featuredImage || product.image || ''}" alt="${name}" /></div><div><p class="eyebrow">${product.vendor || 'Marketplace product'}</p><h1 class="page-title">${name}</h1><div class="pill-row"><span class="status-badge">Active</span><span class="pill">${product.category || 'General'}</span></div><p class="product-detail-price">${formatCurrency(product.price)}</p><p class="page-copy">${product.shortDescription || product.fullDescription || ''}</p><div class="product-detail-facts"><span><strong>Stock</strong>${stock}</span><span><strong>Brand</strong>${product.brand || 'Not provided'}</span><span><strong>SKU</strong>${product.sku || 'Not available'}</span></div><div class="product-purchase-controls"><label for="productQuantity">Quantity</label><input id="productQuantity" type="number" min="1" max="${stock}" value="1" ${stock ? '' : 'disabled'} /><button id="addToCartBtn" class="btn btn-primary" type="button" ${stock ? '' : 'disabled'}>${stock ? 'Add to Cart' : 'Out of Stock'}</button></div><p id="productCartMessage" class="muted" role="status"></p></div></div>${(product.additionalImages || []).length ? `<div class="product-detail-gallery">${product.additionalImages.map((image, index) => `<img src="${image}" alt="${name} image ${index + 2}" />`).join('')}</div>` : ''}<section class="vendor-section product-detail-section"><h2 class="section-title">Product Description</h2><p class="page-copy">${product.fullDescription || product.shortDescription || 'No description provided.'}</p></section>`;
  document.getElementById('addToCartBtn')?.addEventListener('click', () => {
    const quantityInput = document.getElementById('productQuantity');
    const quantity = Math.min(Math.max(1, Number(quantityInput.value || 1)), stock);
    quantityInput.value = quantity;
    const result = addProductToCart(product, quantity);
    showMessage(document.getElementById('productCartMessage'), result.message, result.success);
    if (result.success) showToast(result.message, true);
    if (result.requiresLogin) {
      setTimeout(() => { window.location.href = `${basePath}pages/login.html`; }, 900);
    }
  });
}

async function renderVendorDashboard() {
  const dashboard = document.getElementById('vendorDashboardContent');
  if (!dashboard) return;
  const session = getCurrentSession();
  const store = getVendorStore();
  if (!session?.uid) {
    dashboard.innerHTML = '<div class="empty-state error-state"><strong>Vendor session unavailable.</strong><p class="muted">Please sign in again to open your store dashboard.</p><a class="btn btn-primary" href="../../pages/login.html">Sign In</a></div>';
    return;
  }
  if (!store) {
    dashboard.innerHTML = '<div class="empty-state error-state"><strong>Store profile unavailable.</strong><p class="muted">Complete vendor registration before opening your store dashboard.</p><a class="btn btn-primary" href="../../pages/vendor-onboarding.html">Complete Registration</a></div>';
    return;
  }
  let products;
  try {
    products = await getVendorProducts(session.vendorId);
  } catch (error) {
    console.warn('Unable to load vendor dashboard products:', error);
    dashboard.innerHTML = `<div class="empty-state error-state"><strong>We could not load your store.</strong><p class="muted">${getFirebaseAccessMessage(error, 'Check your connection and try again.')}</p><button class="btn btn-secondary" type="button" onclick="window.location.reload()">Try Again</button></div>`;
    return;
  }
  const inStock = products.filter((product) => getProductStock(product) > 0).length;
  const productMarkup = products.length
    ? `<div class="grid grid-3">${buildProductCards(products)}</div>`
    : `<div class="empty-state"><strong>No products yet.</strong><p class="muted">This store has not uploaded any products yet.</p></div>`;

  const publicStoreHref = getPublicStoreHref(store.slug);

  dashboard.innerHTML = `
    <div class="vendor-dashboard-head">
      <div>
        <p class="eyebrow">Vendor workspace</p>
        <h1 class="page-title">Welcome, ${session?.name || store.name || 'Vendor'}</h1>
        <p class="page-copy">Keep your storefront ready for its next customer.</p>
      </div>
      <div class="hero-actions">
        <a class="btn btn-primary" href="../../pages/vendor-product.html">Create Product</a>
        <a class="btn btn-secondary" href="${publicStoreHref}">View public store</a>
      </div>
    </div>
    <div class="vendor-stat-grid">
      <article class="vendor-stat"><span>Total Products</span><strong>${products.length}</strong><small>Products in your inventory</small></article>
      <article class="vendor-stat"><span>Products in Stock</span><strong>${inStock}</strong><small>Available to shoppers</small></article>
      <article class="vendor-stat"><span>Out of Stock</span><strong>${Math.max(products.length - inStock, 0)}</strong><small>Needs attention</small></article>
      <article class="vendor-stat"><span>Orders</span><strong>0</strong><small>All-time orders</small></article>
      <article class="vendor-stat"><span>Revenue</span><strong>--</strong><small>Placeholder</small></article>
    </div>
    <section class="vendor-section">
      <div class="section-header"><div><p class="eyebrow">Activity</p><h2 class="section-title">Notifications</h2></div><button id="vendorClearNotifBtn" class="btn btn-secondary" style="font-size: 0.85rem;">Clear All</button></div>
      <div id="vendorNotificationsList" class="notification-list"></div>
      <div id="vendorNoNotifications" class="empty-state"><strong>All caught up!</strong><p class="muted">Activity and updates will appear here.</p></div>
    </section>
    <section class="vendor-section">
      <div class="section-header">
        <div>
          <p class="eyebrow">Inventory</p>
          <h2 class="section-title">Recent Products</h2>
        </div>
        <span class="badge">${products.length} total</span>
      </div>
      ${productMarkup}
    </section>
    <section class="vendor-store-preview">
      <div class="section-header">
        <div>
          <p class="eyebrow">Public storefront</p>
          <h2 class="section-title">${store.name}</h2>
          <p class="section-subtitle">Your store is automatically available at <strong>/store/${store.slug}</strong></p>
        </div>
        <a class="btn btn-secondary" href="${publicStoreHref}">Open store</a>
      </div>
      <div class="vendor-branding-preview">
        <img class="vendor-branding-banner" src="${store.banner || ''}" alt="${store.name} store banner" />
        <div class="vendor-branding-identity">
          <img class="vendor-branding-logo" src="${store.logo || ''}" alt="${store.name} logo" />
          <div><strong>${store.name}</strong><p class="muted">Your uploaded store branding is live on the public storefront.</p></div>
        </div>
      </div>
    </section>
    <section id="store-settings" class="vendor-section dashboard-placeholder">
      <div class="section-header"><div><p class="eyebrow">Storefront</p><h2 class="section-title">Store Settings</h2></div><a class="btn btn-secondary" href="../../pages/vendor-onboarding.html">Open store profile</a></div>
      <ul class="action-list"><li><strong>Store URL:</strong> /store/${store.slug}</li><li><strong>Category:</strong> ${store.category || 'General'}</li><li><strong>Location:</strong> ${store.location || 'Online'}</li><li><strong>Branding:</strong> Logo and banner are active</li></ul>
    </section>
    <section id="profile" class="vendor-section dashboard-placeholder">
      <div class="section-header"><div><p class="eyebrow">Account</p><h2 class="section-title">Profile</h2></div></div>
      <ul class="action-list"><li><strong>Name:</strong> ${session?.name || 'Vendor'}</li><li><strong>Email:</strong> ${session?.email || 'Not available'}</li><li><strong>Vendor ID:</strong> ${session?.vendorId || 'Not available'}</li></ul>
    </section>
  `;
  if (window.location.hash) {
    requestAnimationFrame(() => document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }));
  }
  
  // Load vendor notifications
  loadVendorNotifications(session?.uid);
}

async function loadVendorNotifications(userId) {
  if (!userId) return;
  
  const notifsList = document.getElementById('vendorNotificationsList');
  const noNotifications = document.getElementById('vendorNoNotifications');
  
  if (!notifsList) return;

  const renderNotifications = (notifications) => {
    if (notifications.length === 0) {
      notifsList.innerHTML = '';
      noNotifications.style.display = 'block';
      return;
    }

    noNotifications.style.display = 'none';
    notifsList.innerHTML = notifications.map(notif => {
      const typeIcon = {
        'success': '✓',
        'error': '✕',
        'warning': '⚠',
        'info': 'ℹ'
      }[notif.type] || 'ℹ';

      return `
        <div class="notification-item notification-${notif.type}" data-id="${notif.id}">
          <div class="notification-content">
            <span class="notification-icon">${typeIcon}</span>
            <p class="notification-message">${notif.message}</p>
          </div>
          <button class="notification-close" data-id="${notif.id}">×</button>
        </div>
      `;
    }).join('');

    // Add close handlers
    document.querySelectorAll('.notification-close').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const notifId = e.target.dataset.id;
        await window.tulaNotifications.deleteNotification(userId, notifId);
        e.target.closest('.notification-item')?.remove();
        
        if (notifsList.children.length === 0) {
          notifsList.innerHTML = '';
          noNotifications.style.display = 'block';
        }
      });
    });
  };

  // Subscribe to real-time updates
  if (window.tulaNotifications?.subscribeToNotifications) {
    const unsubscribe = await window.tulaNotifications.subscribeToNotifications(
      userId,
      renderNotifications
    );
    // Store for cleanup
    window.vendorNotificationUnsubscribe = unsubscribe;
  } else {
    // Fallback: load once
    const notifications = await window.tulaNotifications.getNotifications(userId);
    renderNotifications(notifications);
  }

  // Clear all button
  const clearBtn = document.getElementById('vendorClearNotifBtn');
  if (clearBtn) {
    clearBtn.onclick = async () => {
      await window.tulaNotifications.clearAll(userId);
      loadVendorNotifications(userId);
    };
  }
}

function renderAdminDashboard() {
  const panel = document.getElementById('adminStorePanel');
  if (!panel) return;
  panel.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Store</th><th>Status</th><th>Category</th><th>Followers</th></tr></thead>
        <tbody>
          ${getMarketplaceStores().length ? getMarketplaceStores().map((store) => `<tr><td>${store.name}</td><td>${store.featured ? 'Featured' : 'Active'}</td><td>${store.category || 'General'}</td><td>${store.followers || 0}</td></tr>`).join('') : '<tr><td colspan="4"><div class="empty-state"><strong>No stores yet.</strong><p class="muted">Vendor storefronts will appear here after onboarding.</p></div></td></tr>'}
        </tbody>
      </table>
    </div>
  `;
}

function refreshShopCategoryOptions() {
  const categorySelect = document.getElementById('shopCategory');
  if (!categorySelect) return;
  const selectedCategory = categorySelect.value || new URLSearchParams(window.location.search).get('category') || '';
  const categories = [...new Set([
    ...getPublicProducts().map((product) => product.category),
    ...getMarketplaceStores().map((store) => store.category)
  ].filter(Boolean))].sort();
  categorySelect.innerHTML = '<option value="">All Categories</option>' + categories
    .map((category) => `<option value="${category}">${category}</option>`)
    .join('');
  categorySelect.value = categories.includes(selectedCategory) ? selectedCategory : '';
}

function setupShopSearch() {
  const searchInput = document.getElementById('storeSearch');
  if (!searchInput) return;
  const productGrid = document.getElementById('shopProductsGrid');
  const storeGrid = document.getElementById('storeDiscoveryGrid');
  const categorySelect = document.getElementById('shopCategory');
  const availabilitySelect = document.getElementById('shopAvailability');
  const ratingSelect = document.getElementById('shopRating');
  const sortSelect = document.getElementById('shopSort');
  const productResultsCount = document.getElementById('productResultsCount');
  const storeResultsCount = document.getElementById('storeResultsCount');
  refreshShopCategoryOptions();

  const applyQuery = () => {
    const products = getPublicProducts();
    const stores = getMarketplaceStores();
    const query = searchInput.value.trim().toLowerCase();
    const selectedCategory = categorySelect?.value || '';
    const minimumRating = Number(ratingSelect?.value || 0);
    const selectedAvailability = availabilitySelect?.value || '';
    const filteredProducts = products.filter((product) => {
      const searchable = [product.name, product.productName, product.vendor, product.category, product.brand, ...(product.tags || []), ...(product.keywords || [])];
      const stock = Number(product.stockQuantity ?? product.stock ?? 0);
      const availability = stock > 0 ? 'In Stock' : 'Out of Stock';
      return (!query || searchable.some((value) => String(value || '').toLowerCase().includes(query)));
    }).filter((product) => {
      const stock = Number(product.stockQuantity ?? product.stock ?? 0);
      return (!selectedCategory || product.category === selectedCategory)
        && (!selectedAvailability || (stock > 0 ? 'In Stock' : 'Out of Stock') === selectedAvailability)
        && Number(product.rating || 0) >= minimumRating;
    });
    const filteredStores = stores.filter((store) => {
      return (!query || [store.name, store.tagline, store.category, store.location].some((value) => String(value || '').toLowerCase().includes(query)))
        && (!selectedCategory || store.category === selectedCategory)
        && Number(store.rating || 0) >= minimumRating;
    });

    filteredProducts.sort((left, right) => {
      if (sortSelect?.value === 'price-low') return Number(left.price || 0) - Number(right.price || 0);
      if (sortSelect?.value === 'price-high') return Number(right.price || 0) - Number(left.price || 0);
      if (sortSelect?.value === 'rating') return Number(right.rating || 0) - Number(left.rating || 0);
      if (sortSelect?.value === 'newest') return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
      return Number(right.featured || 0) - Number(left.featured || 0) || Number(right.rating || 0) - Number(left.rating || 0);
    });

    if (productGrid) productGrid.innerHTML = buildProductCards(filteredProducts);
    if (storeGrid) storeGrid.innerHTML = buildStoreCards(filteredStores);
    if (productResultsCount) productResultsCount.textContent = `${filteredProducts.length} product${filteredProducts.length === 1 ? '' : 's'} found`;
    if (storeResultsCount) storeResultsCount.textContent = `${filteredStores.length} store${filteredStores.length === 1 ? '' : 's'} found`;
    if (productGrid && !filteredProducts.length) productGrid.innerHTML = '<div class="empty-state"><strong>No matching products.</strong><p class="muted">Try changing your search or filters.</p></div>';
    if (storeGrid && !filteredStores.length) storeGrid.innerHTML = '<div class="empty-state"><strong>No matching stores.</strong><p class="muted">Try changing your search or filters.</p></div>';
  };
  searchInput.addEventListener('input', applyQuery);
  [categorySelect, availabilitySelect, ratingSelect, sortSelect].filter(Boolean).forEach((control) => control.addEventListener('change', applyQuery));
  applyQuery();
}

document.addEventListener('DOMContentLoaded', () => {
  protectRoutes();
  injectLayout();
  highlightActiveNav();
  setupTheme();
  setupNavigation();
  setupPasswordToggles();
  setupCheckout();
  setupCartPage();
  setupCookieConsent();
  renderCustomerOrders();
  setupRipple();
  setupReveal();
  setupAuthForms();
  setupNewsletterForm();
  setupShopSearch();
  renderHomepageDiscovery();
  renderShopPage();
  renderStorePage();
  renderPublicProductPage();
  refreshPublicStores();
  refreshPublicProducts();
  renderVendorDashboard();
  renderVendorOrders();
  renderVendorProductsPage();
  renderVendorProductView();
  renderAdminDashboard();
  hideLoader();
});

window.addEventListener('tula-firebase-ready', () => {
  refreshPublicStores();
  renderHomepageDiscovery();
  renderShopPage();
  renderStorePage();
  renderPublicProductPage();
  renderVendorDashboard();
  renderVendorOrders();
  renderVendorProductsPage();
});
