/*
  Firestore helper module for product, vendor, order, and profile queries.
  These helpers stay backward-compatible while preparing the app for future Firestore-backed data.
*/
function readLocalCommerceData() {
  try {
    return JSON.parse(localStorage.getItem('tula-commerce-data') || 'null');
  } catch (error) {
    return null;
  }
}

function writeLocalCommerceData(data) {
  localStorage.setItem('tula-commerce-data', JSON.stringify(data));
}

async function ensureFirestoreReady() {
  if (window.tulaFirebaseReady && window.tulaFirebaseFirestore) {
    return { success: true };
  }
  const result = await window.tulaFirebaseInitialize?.();
  return result || { success: false, message: 'Firestore is not ready.' };
}

window.tulaFirestore = {
  async getCollection(name) {
    const data = window.tulaCommerceData || readLocalCommerceData() || { stores: [], products: [] };
    if (name === 'stores') return data.stores || [];
    if (name === 'products') return data.products || [];
    return [];
  },
  async saveDocument(path, payload) {
    const firestoreReady = await ensureFirestoreReady();
    if (firestoreReady.success && window.tulaFirebaseFirestore) {
      try {
        if (path === 'stores') {
          const session = window.tulaAuth?.getSession?.();
          const storeName = payload.storeName || 'New Store';
          const slug = payload.slug || session?.storeSlug || storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          const normalizedStore = {
            slug,
            name: storeName,
            tagline: payload.storeDescription || 'New storefront',
            description: payload.storeDescription || 'A premium storefront created with TULA MARKET.',
            rating: 4.8,
            followers: 0,
            featured: false,
            new: true,
            category: payload.storeCategory || 'General',
            location: payload.storeAddress || 'Online',
            banner: payload.storeBanner || 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80',
            logo: payload.storeLogo || 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
            accent: '#d4af37',
            featuredProducts: [],
            contact: payload.storePhone || '',
            whatsapp: payload.storeWhatsapp || '',
            email: payload.storeEmail || '',
            hours: payload.storeHours || '',
            social: payload.storeSocial || '',
            address: payload.storeAddress || ''
          };
          const docId = slug || `store_${Date.now()}`;
          await window.tulaFirebaseFirestore.collection(path).doc(docId).set(normalizedStore, { merge: true });
          return { success: true, message: 'Store saved to Firestore.', store: normalizedStore };
        }

        const docId = payload.id || `doc_${Date.now()}`;
        await window.tulaFirebaseFirestore.collection(path).doc(docId).set(payload, { merge: true });
        return { success: true, message: 'Document saved to Firestore.' };
      } catch (error) {
        console.warn('Firestore save failed:', error);
        return { success: false, message: error.message || 'Unable to save to Firestore.' };
      }
    }

    if (path === 'stores') {
      const data = window.tulaCommerceData || readLocalCommerceData() || { stores: [], products: [] };
      const storeName = payload.storeName || 'New Store';
      const slug = payload.slug || (window.tulaAuth?.getSession?.()?.storeSlug) || storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const normalizedStore = {
        slug,
        name: storeName,
        tagline: payload.storeDescription || 'New storefront',
        description: payload.storeDescription || 'A premium storefront created with TULA MARKET.',
        rating: 4.8,
        followers: 0,
        featured: false,
        new: true,
        category: payload.storeCategory || 'General',
        location: payload.storeAddress || 'Online',
        banner: payload.storeBanner || 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80',
        logo: payload.storeLogo || 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
        accent: '#d4af37',
        featuredProducts: [],
        contact: payload.storePhone || '',
        whatsapp: payload.storeWhatsapp || '',
        email: payload.storeEmail || '',
        hours: payload.storeHours || '',
        social: payload.storeSocial || '',
        address: payload.storeAddress || ''
      };
      const existingIndex = (data.stores || []).findIndex((store) => store.slug === slug || store.name === storeName);
      if (existingIndex >= 0) {
        data.stores[existingIndex] = { ...data.stores[existingIndex], ...normalizedStore };
      } else {
        data.stores = [...(data.stores || []), normalizedStore];
      }
      if (window.tulaCommerceData) {
        window.tulaCommerceData.stores = data.stores;
      }
      writeLocalCommerceData(data);
      return { success: true, message: 'Store data prepared for sync.', store: normalizedStore };
    }
    return { success: false, message: 'Firestore is not configured yet.' };
  }
};
