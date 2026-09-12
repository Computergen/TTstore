/* TULA MARKET API client. Firebase remains available until each flow is migrated. */
(function initializeTulaApi() {
  const configuredBase = window.TULA_MARKET_CONFIG?.apiBaseUrl || window.TULA_API_URL || 'http://localhost:3000/api/v1';
  const baseUrl = configuredBase.replace(/\/$/, '');

  async function request(path, options = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.error || 'The request could not be completed.');
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  window.tulaApi = {
    baseUrl,
    request,
    async register(data) { return request('/auth/register', { method: 'POST', body: JSON.stringify(data) }); },
    async login(email, password) { return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); },
    async logout() { return request('/auth/logout', { method: 'POST' }); },
    async me() { return request('/auth/me'); },
    async getProducts() { return request('/catalog/products'); },
    async getStores() { return request('/catalog/stores'); }
  };
})();
