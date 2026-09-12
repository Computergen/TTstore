const crypto = require('crypto');
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const admin = require('firebase-admin');

admin.initializeApp();

const paystackSecretKey = defineSecret('PAYSTACK_SECRET_KEY');
const db = admin.firestore();

function sendJson(response, status, body) {
  response.status(status).set('Content-Type', 'application/json').send(JSON.stringify(body));
}

function getBearerToken(request) {
  const header = request.get('Authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

function isValidAmount(amount) {
  return Number.isInteger(amount) && amount > 0 && amount <= 100000000000;
}

exports.initializePaystackTransaction = onRequest(
  { cors: true, secrets: [paystackSecretKey], region: 'us-central1' },
  async (request, response) => {
    if (request.method !== 'POST') return sendJson(response, 405, { error: 'Method not allowed.' });

    try {
      const token = getBearerToken(request);
      if (!token) return sendJson(response, 401, { error: 'Authentication required.' });
      const decodedToken = await admin.auth().verifyIdToken(token);
      const { orderId, email, amount, callbackUrl } = request.body || {};
      if (!orderId || !/^order_[a-zA-Z0-9_-]+$/.test(orderId) || !email || !/^\S+@\S+\.\S+$/.test(email) || !isValidAmount(amount)) {
        return sendJson(response, 400, { error: 'Invalid payment details.' });
      }
      const orderReference = db.collection('orders').doc(orderId);
      const orderSnapshot = await orderReference.get();
      if (!orderSnapshot.exists || orderSnapshot.data().customerId !== decodedToken.uid) {
        return sendJson(response, 403, { error: 'Order access denied.' });
      }
      const order = orderSnapshot.data();
      const expectedAmount = Math.round(Number(order.total || 0) * 100);
      if (!isValidAmount(expectedAmount) || amount !== expectedAmount || email.toLowerCase() !== String(order.customerEmail || order.receiptEmail || '').toLowerCase()) {
        return sendJson(response, 400, { error: 'Payment details do not match the order.' });
      }
      const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: { Authorization: `Bearer ${paystackSecretKey.value()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, amount: expectedAmount, currency: 'NGN', reference: orderId, callback_url: callbackUrl })
      });
      const result = await paystackResponse.json();
      if (!paystackResponse.ok || !result.status) {
        logger.error('Paystack initialization failed', { result });
        return sendJson(response, 502, { error: 'Payment provider could not initialize the transaction.' });
      }
      await orderReference.update({ paymentStatus: 'Processing', paymentReference: orderId, updatedAt: new Date().toISOString() });
      return sendJson(response, 200, { authorizationUrl: result.data.authorization_url, accessCode: result.data.access_code, reference: result.data.reference });
    } catch (error) {
      logger.error('Payment initialization error', error);
      return sendJson(response, 500, { error: 'Unable to initialize payment.' });
    }
  }
);

exports.paystackWebhook = onRequest(
  { cors: false, secrets: [paystackSecretKey], region: 'us-central1' },
  async (request, response) => {
    if (request.method !== 'POST') return sendJson(response, 405, { error: 'Method not allowed.' });
    const signature = request.get('x-paystack-signature') || '';
    const rawBody = request.rawBody || Buffer.from(JSON.stringify(request.body || {}));
    const expectedSignature = crypto.createHmac('sha512', paystackSecretKey.value()).update(rawBody).digest('hex');
    const signatureBuffer = Buffer.from(signature);
    const expectedSignatureBuffer = Buffer.from(expectedSignature);
    if (!signature || signatureBuffer.length !== expectedSignatureBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer)) {
      return sendJson(response, 401, { error: 'Invalid signature.' });
    }

    try {
      const event = request.body || {};
      if (event.event === 'charge.success' && event.data?.reference) {
        const orderReference = db.collection('orders').doc(event.data.reference);
        const orderSnapshot = await orderReference.get();
        if (orderSnapshot.exists) {
          await orderReference.update({ paymentStatus: 'Paid', orderStatus: 'Confirmed', paymentReference: event.data.reference, paidAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        }
      }
      return sendJson(response, 200, { received: true });
    } catch (error) {
      logger.error('Paystack webhook error', error);
      return sendJson(response, 500, { error: 'Webhook processing failed.' });
    }
  }
);

