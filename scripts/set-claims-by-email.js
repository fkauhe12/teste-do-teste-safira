// scripts/set-claims-by-email.js
const admin = require("firebase-admin");
const path = require("path");

const serviceAccount = require(path.join(__dirname, "serviceAccountKey.json"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

async function setClaimsByEmail(email, claimName, value) {
  const user = await admin.auth().getUserByEmail(email);
  const claims = user.customClaims || {};
  claims[claimName] = value;
  await admin.auth().setCustomUserClaims(user.uid, claims);
  console.log(`Claims atualizadas para ${email}:`, claims);
}

const email = process.argv[2];
const claimName = process.argv[3];
const value = process.argv[4] === "true";

if (!email || !claimName) {
  console.log('Uso: node set-claims-by-email.js email@x.com Admin true');
  process.exit(1);
}

setClaimsByEmail(email, claimName, value).then(() => process.exit());
    