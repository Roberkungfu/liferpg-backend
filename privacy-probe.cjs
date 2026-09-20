// Read-only, one-shot connection probe. No AI calls and no account mutations.
const { randomUUID } = require('node:crypto');
const http = require('node:http');
const { readerServiceAccount } = require('./privacy-reader-credential.cjs');

async function runProbe(services, marker) {
  await services.db.doc(`accountAccess/${marker}`).get();
  await services.db.doc(`accountDeletionRequests/${marker}`).get();
  try { await services.auth.getUser(marker); }
  catch (error) { if (error.code !== 'auth/user-not-found') throw error; }
}

async function main() {
  let app;
  let timer;
  try {
    const { initializeApp, cert, deleteApp } = require('firebase-admin/app');
    app = initializeApp({ projectId: 'wingchun-academy',
      credential: cert(readerServiceAccount(process.env)) }, 'readonly-probe');
    const services = { db: require('firebase-admin/firestore').getFirestore(app),
      auth: require('firebase-admin/auth').getAuth(app) };
    await Promise.race([
      runProbe(services, `privacy-probe-${randomUUID()}`),
      new Promise((_, reject) => { timer = setTimeout(() => reject(Error('TIMEOUT')), 30000); }),
    ]);
    clearTimeout(timer);
    await deleteApp(app);
    console.log('PRIVACY_PROBE_OK: Firestore reads and Auth lookup succeeded; no writes performed.');
    // Private-only health endpoint; never returns credentials or user data.
    http.createServer((req, res) => {
      res.writeHead(req.url === '/health' ? 200 : 404, { 'Content-Type': 'application/json' });
      res.end(req.url === '/health' ? '{"status":"ok","readOnly":true}' : '{}');
    }).listen(Number(process.env.PORT || 8080), '0.0.0.0');
  } catch {
    clearTimeout(timer);
    console.error('PRIVACY_PROBE_FAILED: check configured reader credential, project and IAM permissions.');
    process.exit(1);
  }
}

if (require.main === module) main();
module.exports = { runProbe };
