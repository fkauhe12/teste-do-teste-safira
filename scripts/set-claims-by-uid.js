// scripts/set-claims-by-uid.js
const admin = require("firebase-admin");
const path = require("path");

const serviceAccount = require(path.join(__dirname, "serviceAccountKey.json"));

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

async function setClaimsByUid(uid, claimName, value) {
  const user = await admin.auth().getUser(uid); // pega usuário pelo UID
  const claims = user.customClaims || {};
  claims[claimName] = value;
  await admin.auth().setCustomUserClaims(user.uid, claims);
  console.log(`Claims atualizadas para UID ${uid}:`, claims);
}

const uid = process.argv[2];
const claimName = process.argv[3];
const value = process.argv[4] === "true";

if (!uid || !claimName) {
  console.log("Uso: node set-claims-by-uid.js UID admin true");
  process.exit(1);
}

setClaimsByUid(uid, claimName, value).then(() => process.exit());