# TULA MARKET

A modern, glassmorphism-inspired multi-vendor e-commerce marketplace for local businesses.

## Structure
- assets/css/styles.css — Core visual design and responsive layout
- assets/js/app.js — Shared UI interactions and layout injection
- firebase/ — Firebase configuration and placeholder modules
- pages/ — Marketing and dashboard pages

## Run Locally
Open index.html in a browser, or serve the workspace with a lightweight static server.

## Deploy Firebase Security Rules
From the project root, deploy the included ownership rules with:

```bash
firebase deploy --only firestore:rules
```

The rules require authenticated vendor ownership for product reads, creates, updates, and deletes. Public product reads are limited to products whose status is `Active`.

## Cloudinary Image Uploads
Set `cloudName` and `uploadPreset` in `firebase/firebase-config.js` using a Cloudinary unsigned upload preset. Product images are compressed in the browser before upload and their Cloudinary URLs are stored in Firestore.

## Branded Email Delivery
Use `tulastech@gmail.com` as the reply-to/support address and `TULA MARKET` as the sender name in Firebase Authentication email templates. Order confirmations and payment receipts require a trusted server-side mail provider or Firebase Extension after payment verification; SMTP credentials must never be exposed in browser code.

## Firebase Functions and Paystack
The `functions/` directory contains secure Paystack transaction initialization and signature-verified webhook handling. Install dependencies and set the Paystack secret before deploying:

```bash
cd functions
npm install
firebase functions:secrets:set PAYSTACK_SECRET_KEY
firebase deploy --only functions
```

Use Paystack test secret keys during development. Configure the deployed `paystackWebhook` URL in the Paystack dashboard. The frontend must call `initializePaystackTransaction`; the secret key must remain in Functions secrets.

## Demo Data Switch
The bundled sample stores and products remain in the source as optional demo records, but demo mode is disabled by default. Only vendor-created persisted data is shown. To explicitly disable demo mode in the current browser, run:

```js
localStorage.setItem('tula-demo-data', 'disabled');
```

Remove that key or set it to any other value to restore the local demo catalog.

## Next Steps
- Connect the Firebase project configuration in firebase/firebase-config.js
- Replace placeholders with real authentication and Firestore operations
- Expand the UI into richer vendor, admin, and checkout flows
