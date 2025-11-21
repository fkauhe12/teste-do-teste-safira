const admin = require('firebase-admin');
const path = require('path');

// carrega serviceAccountKey.json na MESMA pasta
const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://safiraproject-30-default-rtdb.firebaseio.com"
});

async function setAdmin(uid) {
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log('Custom claim { admin: true } definida para', uid);
    console.log('Peça ao usuário para fazer logout/login.');
  } catch (err) {
    console.error('Erro ao setar claim:', err);
    process.exit(1);
  }
}

const uid = process.argv[2];
if (!uid) {
  console.error('Uso: node scripts/set-admin-claim.js <USER_UID>');
  process.exit(1);
}

setAdmin(uid).then(() => process.exit(0));
