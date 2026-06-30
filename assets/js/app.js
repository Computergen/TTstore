/*
  TULA MARKET - Global interactions and UI enhancements
  This script handles loading, navigation, theme toggling, reveal animations, and reusable layout injection.
*/
const basePath = window.location.pathname.includes('/pages/') ? '../' : '';

const headerMarkup = `
  <div class="container header-inner">
    <a class="brand" href="${basePath}index.html">
      <span class="brand-mark">T</span>
      <span>TULA MARKET</span>
    </a>
    <nav class="nav-links" aria-label="Primary navigation">
      <a href="${basePath}index.html">Home</a>
      <a href="${basePath}pages/about.html">About</a>
      <a href="${basePath}pages/shop.html">Shop</a>
      <a href="${basePath}pages/product.html">Product</a>
      <a href="${basePath}pages/cart.html">Cart</a>
      <a href="${basePath}pages/contact.html">Contact</a>
      <a href="${basePath}pages/register.html">Register</a>
    </nav>
    <div class="header-actions">
      <button class="icon-btn" id="themeToggle" aria-label="Toggle theme">☼</button>
      <a class="btn btn-primary" href="${basePath}pages/login.html">Sign In</a>
      <a class="btn btn-secondary" href="${basePath}pages/register.html">Register</a>
      <button class="icon-btn mobile-toggle" id="mobileToggle" aria-label="Open menu">☰</button>
    </div>
  </div>`;

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
  if (header) header.innerHTML = headerMarkup;
  if (footer) footer.innerHTML = footerMarkup;
  document.getElementById('year').textContent = new Date().getFullYear();
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

function setupAuthForms() {
  const registerBtn = document.getElementById('registerBtn');
  if (registerBtn) {
    registerBtn.addEventListener('click', async () => {
      const email = document.getElementById('registerEmail')?.value.trim();
      const password = document.getElementById('registerPassword')?.value;
      const name = document.getElementById('registerName')?.value.trim();
      const role = document.getElementById('registerRole')?.value;
      const messageElement = document.getElementById('registerMessage');
      if (!email || !password || !name) {
        showMessage(messageElement, 'Please complete all registration fields.', false);
        return;
      }
      showMessage(messageElement, 'Creating your account...', true);
      const result = await window.tulaAuth.signUp(email, password);
      if (result.success) {
        showMessage(messageElement, 'Registration successful — welcome to TULA MARKET!', true);
        setTimeout(() => {
          window.location.href = `${basePath}pages/login.html`;
        }, 1200);
      } else {
        showMessage(messageElement, result.message || 'Unable to complete registration.');
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  injectLayout();
  highlightActiveNav();
  setupTheme();
  setupNavigation();
  setupRipple();
  setupReveal();
  setupAuthForms();
  hideLoader();
});
