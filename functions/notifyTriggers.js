/**
 * Example Firebase Cloud Functions (Node.js) to create `notifications` documents
 * when certain events happen. This is a sample file — adapt to your project and
 * deploy with `firebase deploy --only functions`.
 *
 * Two examples provided:
 * 1) onProductStatusChange: when a product doc gains a `status` change,
 *    create a notification for subscribed users or owner.
 * 2) scheduledCartCheck: scheduled function (pub/sub) that checks carts for
 *    items older than a threshold and writes notifications for the user.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

// 1) Firestore trigger: product status changed
exports.onProductStatusChange = functions.firestore
  .document('produtos/{productId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data() || {};
    const after = change.after.data() || {};
    if (before.status === after.status) return null;

    const productId = context.params.productId;
    const status = after.status;

    // Example: notify product owner (if stored) or broadcast to subscribed users
    const ownerId = after.ownerId;
    const payload = {
      userId: ownerId || null,
      productId,
      title: 'Atualização de produto',
      body: `O produto "${after.nome || 'item'}" mudou para: ${status}`,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // If ownerId is present, write a notification for them
    if (ownerId) {
      return db.collection('notifications').add(payload);
    }

    // Otherwise, optionally broadcast (be careful with fan-out!)
    return null;
  });

// 2) Scheduled function: notify users with stale cart items
// Install the scheduler in Firebase console and set region accordingly.
exports.scheduledCartCheck = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const cutoff = Date.now() - 1000 * 60 * 60 * 24; // 24 hours
  // This implementation assumes carts are stored in `carts/{uid}/items` with `addedAt` timestamp
  const usersSnap = await db.collection('carts').get();
  const writes = [];
  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const itemsSnap = await db.collection(`carts/${uid}/items`).where('addedAt', '<=', new Date(cutoff)).get();
    if (!itemsSnap.empty) {
      const payload = {
        userId: uid,
        title: 'Itens na sacola',
        body: 'Você tem itens na sacola há mais tempo — aproveite antes que acabem!',
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      writes.push(db.collection('notifications').add(payload));
    }
  }
  return Promise.all(writes);
});
