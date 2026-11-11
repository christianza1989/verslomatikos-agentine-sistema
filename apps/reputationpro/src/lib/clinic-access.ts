import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { db } from './db.ts';

export type Principal = {role:'owner'} | {role:'clinic';clientId:string};
// A clinic login (the account's main profile) may manage that profile and its branches (filialai).
export function canAccessClient(principal: Principal | null, clientId:string) {
  if(!principal)return false;
  if(principal.role==='owner' || principal.clientId===clientId)return true;
  const row=db().prepare('SELECT parent_id FROM clients WHERE id=?').get(clientId) as {parent_id:string|null}|undefined;
  return !!row && row.parent_id===principal.clientId;
}
export function validClinicPassword(password:string) {
  return password.length>=8 && password.length<=128 && Buffer.byteLength(password,'utf8')<=512;
}
function digest(password:string,salt:Buffer) { return scryptSync(password,salt,64); }
function tokenHash(token:string) { return createHash('sha256').update(token).digest('hex'); }

// Called inside the same transaction as client creation; credentials never
// become part of the Client object passed to browser components.
export function createClinicCredential(clientId:string,password:string) {
  if(!validClinicPassword(password))throw new Error('Invalid clinic password');
  const salt=randomBytes(16),hash=digest(password,salt);
  db().prepare('INSERT INTO clinic_credentials(client_id,password_salt,password_hash) VALUES (?,?,?)').run(clientId,salt.toString('hex'),hash.toString('hex'));
}
// Create or replace the password in one statement (used by account claiming).
export function setClinicPassword(clientId:string,password:string) {
  if(!validClinicPassword(password))throw new Error('Invalid clinic password');
  const salt=randomBytes(16),hash=digest(password,salt);
  db().prepare(`INSERT INTO clinic_credentials(client_id,password_salt,password_hash) VALUES (?,?,?)
    ON CONFLICT(client_id) DO UPDATE SET password_salt=excluded.password_salt,password_hash=excluded.password_hash`).run(clientId,salt.toString('hex'),hash.toString('hex'));
}
export function replaceClinicPassword(clientId:string,password:string) {
  if(!validClinicPassword(password))throw new Error('Invalid clinic password');
  const salt=randomBytes(16),hash=digest(password,salt);
  db().prepare('UPDATE clinic_credentials SET password_salt=?,password_hash=? WHERE client_id=?').run(salt.toString('hex'),hash.toString('hex'),clientId);
  db().prepare('DELETE FROM clinic_sessions WHERE client_id=?').run(clientId);
}
export function verifyClinicPassword(clientId:string,password:string) {
  const row=db().prepare('SELECT password_salt,password_hash FROM clinic_credentials WHERE client_id=?').get(clientId) as {password_salt:string;password_hash:string}|undefined;
  if(!row || !validClinicPassword(password))return false;
  const actual=digest(password,Buffer.from(row.password_salt,'hex'));
  const expected=Buffer.from(row.password_hash,'hex');
  return expected.length===actual.length && timingSafeEqual(actual,expected);
}
type AccountRow={id:string;subscription_status:string;stripe_subscription_id:string|null;is_demo:number;verified_at:number|null};
// Login requires: a claimed (non-demo) profile, a verified email and either an
// active trial/subscription or a Stripe subscription record (so canceled customers
// can still reach billing). Demo profiles can never log in; they are claimed only
// through a one-time claim token (src/lib/claim.ts).
export function accountActive(row:Omit<AccountRow,'id'>) {
  if(row.is_demo)return false;
  if(!row.verified_at)return false;
  if(['trialing','active'].includes(row.subscription_status))return true;
  return !!row.stripe_subscription_id && !['pending','incomplete','incomplete_expired'].includes(row.subscription_status);
}
const ACCOUNT_COLUMNS='c.id,c.subscription_status,c.stripe_subscription_id,c.is_demo,v.verified_at';
export function authenticateClinic(email:string,password:string) {
  const row=db().prepare(`SELECT ${ACCOUNT_COLUMNS}
    FROM clients c JOIN clinic_credentials a ON a.client_id=c.id
    LEFT JOIN clinic_email_verifications v ON v.client_id=c.id
    WHERE c.email=?`).get(email.toLowerCase()) as AccountRow|undefined;
  // Do a scrypt operation even for a missing email to reduce account probing.
  if(!row){digest(password,Buffer.alloc(16));return null;}
  if(!verifyClinicPassword(row.id,password))return null;
  return accountActive(row)?row.id:null;
}
export function issueClinicSession(clientId:string) {
  const token=randomBytes(32).toString('hex'),expiresAt=Date.now()+8*60*60*1000;
  const sql=db();sql.prepare('DELETE FROM clinic_sessions WHERE expires_at<?').run(Date.now());
  sql.prepare('INSERT INTO clinic_sessions(token_hash,client_id,expires_at) VALUES (?,?,?)').run(tokenHash(token),clientId,expiresAt);
  return {token,expiresAt};
}
export function clinicSession(token:string) {
  const row=db().prepare(`SELECT ${ACCOUNT_COLUMNS}
    FROM clinic_sessions s
    JOIN clinic_credentials a ON a.client_id=s.client_id JOIN clients c ON c.id=s.client_id
    LEFT JOIN clinic_email_verifications v ON v.client_id=c.id
    WHERE s.token_hash=? AND s.expires_at>?`).get(tokenHash(token),Date.now()) as AccountRow|undefined;
  return row && accountActive(row) ? row.id : null;
}
export function revokeClinicSession(token:string) { db().prepare('DELETE FROM clinic_sessions WHERE token_hash=?').run(tokenHash(token)); }
