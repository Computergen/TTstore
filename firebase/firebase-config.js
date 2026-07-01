/*
  Firebase configuration for TULA MARKET.
  The app now initializes the real Firebase SDK when the browser loads.
*/
const firebaseConfig = {
  apiKey: 'AIzaSyDahkctt58vRwIRlVtdJ3nr9G-aXel7qTg',
  authDomain: 'tulamarket-9d9c5.firebaseapp.com',
  projectId: 'tulamarket-9d9c5',
  storageBucket: 'tulamarket-9d9c5.appspot.com',
  messagingSenderId: '809189723612',
  appId: 'G-MF7ZDJCYH2'
};

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Unable to load ${src}`)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error(`Unable to load ${src}`));
    document.head.appendChild(script);
  });
}

async function initializeFirebase() {
  if (window.tulaFirebaseReady && window.firebase) {
    return { success: true, message: 'Firebase already initialized.' };
  }

  try {
    await Promise.all([
      loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js'),
      loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js'),
      loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js')
    ]);

    if (!window.firebase) {
      throw new Error('Firebase SDK failed to load.');
    }

    if (!window.firebase.apps.length) {
      window.firebase.initializeApp(firebaseConfig);
    }

    window.tulaFirebaseApp = window.firebase.apps[0];
    window.tulaFirebaseAuth = window.firebase.auth();
    window.tulaFirebaseFirestore = window.firebase.firestore();
    window.tulaFirebaseReady = true;
    window.tulaFirebaseError = '';
    return { success: true, message: 'Firebase initialized successfully.' };
  } catch (error) {
    window.tulaFirebaseReady = false;
    window.tulaFirebaseError = error.message || 'Unable to initialize Firebase.';
    return { success: false, message: window.tulaFirebaseError };
  }
}

window.tulaFirebaseConfig = firebaseConfig;
window.tulaFirebaseReady = false;
window.tulaFirebaseInitialize = initializeFirebase;
window.tulaFirebaseInitialize();
