const { createPrivateKey } = require('node:crypto');

const PROJECT = 'wingchun-academy';
const READER = 'wingchun-privacy-reader@wingchun-academy.iam.gserviceaccount.com';

// Server-only. Never return parser/crypto errors, which may include secret input.
function readerServiceAccount(env) {
  try {
    if (env.WINGCHUN_PRIVACY_PROJECT !== PROJECT ||
        env.FIRESTORE_EMULATOR_HOST || env.FIREBASE_AUTH_EMULATOR_HOST) throw Error();
    const raw = env.WINGCHUN_FIREBASE_READER_JSON;
    if (typeof raw !== 'string' || raw.length > 32768) throw Error();
    const value = JSON.parse(raw);
    if (!value || value.type !== 'service_account' || value.project_id !== PROJECT ||
        value.client_email !== READER || typeof value.private_key !== 'string') throw Error();
    const key = createPrivateKey(value.private_key);
    if (key.asymmetricKeyType !== 'rsa' || key.asymmetricKeyDetails.modulusLength < 2048) throw Error();
    // Whitelist fields: no caller-controlled token URI or impersonation settings.
    return { projectId: PROJECT, clientEmail: READER, privateKey: value.private_key };
  } catch {
    throw new Error('PRIVACY_READER_CREDENTIAL_INVALID');
  }
}

module.exports = { readerServiceAccount };
