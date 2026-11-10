import { randomBytes, createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import nodemailer from 'nodemailer';
import { db } from './db.ts';

type Purpose = 'verify' | 'reset';
const digest = (token: string) => createHash('sha256').update(token).digest('hex');

// Lookup order: REPUTATION_SMTP_CONFIG, the app's private file, then the shared
// configs/email_credentials.json the Python campaign sender already uses
// (format: smtp_host, smtp_port, use_ssl, email, password).
function getSmtpConfig() {
  // Test/verification instances must never email real leads.
  if (process.env.REPUTATION_MAIL_DISABLED === 'true') return null;
  const candidates = [
    process.env.REPUTATION_SMTP_CONFIG,
    path.resolve(process.cwd(), 'data/operations/reputation-private/smtp.json'),
    path.resolve(process.cwd(), '../../configs/email_credentials.json'),
  ].filter((p): p is string => !!p);
  const configPath = candidates.find((p) => existsSync(p));
  if (!configPath) return null;
  try {
    const raw = JSON.parse(readFileSync(configPath, 'utf8')) as {
      smtp_host: string;
      smtp_port: number;
      smtp_secure?: boolean;
      use_ssl?: boolean;
      email: string;
      password: string;
    };
    if (!raw.smtp_host || !raw.smtp_port || !raw.email || !raw.password) return null;
    return { ...raw, smtp_secure: raw.smtp_secure ?? raw.use_ssl };
  } catch {
    return null;
  }
}

export function issueEmailToken(clientId: string, purpose: Purpose) {
  const token = randomBytes(32).toString('hex'), sql = db();
  sql.exec('BEGIN IMMEDIATE');
  try {
    sql.prepare('DELETE FROM clinic_email_tokens WHERE expires_at<? OR (client_id=? AND purpose=?)').run(Date.now(), clientId, purpose);
    sql.prepare('INSERT INTO clinic_email_tokens(token_hash,client_id,purpose,expires_at) VALUES (?,?,?,?)').run(digest(token), clientId, purpose, Date.now() + 30 * 60 * 1000);
    sql.exec('COMMIT'); return token;
  } catch (e) { sql.exec('ROLLBACK'); throw e; }
}

export function tokenClient(token: string, purpose: Purpose) {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const row = db().prepare('SELECT client_id FROM clinic_email_tokens WHERE token_hash=? AND purpose=? AND expires_at>?').get(digest(token), purpose, Date.now()) as { client_id: string } | undefined;
  return row?.client_id || null;
}

export function consumeEmailToken(token: string, purpose: Purpose) {
  if (!/^[a-f0-9]{64}$/.test(token)) return false;
  return !!db().prepare('DELETE FROM clinic_email_tokens WHERE token_hash=? AND purpose=? AND expires_at>?').run(digest(token), purpose, Date.now()).changes;
}

export async function sendAccountEmail(to: string, purpose: Purpose, url: string) {
  const cfg = getSmtpConfig();
  if (!cfg) throw new Error('Account email is not configured');
  const transporter = nodemailer.createTransport({ host: cfg.smtp_host, port: cfg.smtp_port, secure: cfg.smtp_secure ?? cfg.smtp_port === 465, auth: { user: cfg.email, pass: cfg.password }, requireTLS: true, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000 });
  const subject = purpose === 'verify' ? 'Patvirtinkite ReputationPro el. paštą' : 'ReputationPro slaptažodžio atkūrimas';
  const action = purpose === 'verify' ? 'Patvirtinkite el. paštą ir tęskite registraciją' : 'Pasirinkite naują slaptažodį';
  await transporter.sendMail({ from: { name: 'Verslomatika', address: cfg.email }, to, subject, text: `${action}:\n${url}\n\nNuoroda galioja 30 minučių. Jei užklausos neteikėte, ignoruokite šį laišką.` });
}

// Activation link for a pre-provisioned lead that reached /checkout without its token.
// Returns false when SMTP is not configured so the caller can say so honestly.
export async function sendClaimEmail(to: string, businessName: string, url: string) {
  const cfg = getSmtpConfig();
  if (!cfg) return false;
  const transporter = nodemailer.createTransport({ host: cfg.smtp_host, port: cfg.smtp_port, secure: cfg.smtp_secure ?? cfg.smtp_port === 465, auth: { user: cfg.email, pass: cfg.password }, requireTLS: true, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000 });
  await transporter.sendMail({
    from: { name: 'Tomas | Verslomatika', address: cfg.email }, to,
    subject: `${businessName}: Jūsų ReputationPro paskyros aktyvavimas`,
    text: `Laba diena,\n\nkažkas (tikėtina, Jūs) norėjo aktyvuoti „${businessName}“ ReputationPro paskyrą. Ji jau paruošta: atsiliepimų puslapis, QR kodas ir Google nuoroda.\n\nAktyvuoti (užtruks 1 min., 14 d. nemokamai, be kortelės):\n${url}\n\nNuoroda galioja 30 dienų ir veikia vieną kartą. Jei to neprašėte, tiesiog ignoruokite šį laišką.\n\nTomas\nVerslomatika`
  });
  return true;
}

// Security notice: the claimant chose a different login email than the address we contacted.
export async function sendLoginEmailChangedNotice(previous: string, businessName: string, newEmail: string) {
  const cfg = getSmtpConfig();
  if (!cfg) return false;
  const transporter = nodemailer.createTransport({ host: cfg.smtp_host, port: cfg.smtp_port, secure: cfg.smtp_secure ?? cfg.smtp_port === 465, auth: { user: cfg.email, pass: cfg.password }, requireTLS: true, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000 });
  await transporter.sendMail({
    from: { name: 'ReputationPro', address: cfg.email }, to: previous,
    subject: `${businessName}: ReputationPro paskyra aktyvuota`,
    text: `Laba diena,\n\n„${businessName}“ ReputationPro paskyra ką tik aktyvuota. Prisijungimo el. paštas: ${newEmail}.\n\nJei paskyrą aktyvavote Jūs ar Jūsų kolega, nieko daryti nereikia. Jei ne, tiesiog atsakykite į šį laišką ir paskyrą užrakinsime.\n\nReputationPro · Verslomatika`
  });
  return true;
}

export async function sendFeedbackAlert(
  to: string,
  businessName: string,
  data: {
    rating: number;
    customer_name?: string | null;
    customer_phone?: string | null;
    feedback_text: string;
    slug: string;
  }
) {
  try {
    const cfg = getSmtpConfig();
    if (!cfg) {
      console.warn('sendFeedbackAlert: SMTP not configured. Notification skipped.');
      return;
    }
    const transporter = nodemailer.createTransport({
      host: cfg.smtp_host,
      port: cfg.smtp_port,
      secure: cfg.smtp_secure ?? (cfg.smtp_port === 465),
      auth: { user: cfg.email, pass: cfg.password },
      requireTLS: true,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    });

    const appUrl = process.env.APP_URL || 'https://reputacija.verslomatika.lt';
    const clientInfo = [
      data.customer_name?.trim(),
      data.customer_phone?.trim() ? `(${data.customer_phone.trim()})` : null
    ].filter(Boolean).join(' ') || 'Nenurodytas';

    const subject = `🚨 Dėmesio: Gautas naujas privatus atsiliepimas iš kliento (${data.rating}★)`;
    const text = `🚨 Dėmesio: Gautas naujas privatus atsiliepimas iš kliento!\n\n` +
      `Įmonė: ${businessName}\n` +
      `Įvertinimas: ${data.rating}★\n` +
      `Klientas: ${clientInfo}\n` +
      `Žinutė: ${data.feedback_text}\n\n` +
      `Prisijunkite prie pulto: ${appUrl}/admin\n\n` +
      `Vadovo patarimas: perskambinkite klientui per 15 minučių, išspręskite problemą ir išsaugokite klientą.`;

    await transporter.sendMail({
      from: { name: 'ReputationPro Skydas', address: cfg.email },
      to,
      subject,
      text
    });
  } catch (error) {
    console.error('sendFeedbackAlert error:', error);
  }
}

export async function sendWelcomeEmail(to: string, businessName: string, slug: string) {
  try {
    const cfg = getSmtpConfig();
    if (!cfg) return;
    const transporter = nodemailer.createTransport({
      host: cfg.smtp_host,
      port: cfg.smtp_port,
      secure: cfg.smtp_secure ?? (cfg.smtp_port === 465),
      auth: { user: cfg.email, pass: cfg.password },
      requireTLS: true,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    });
    const appUrl = process.env.APP_URL || 'https://reputacija.verslomatika.lt';
    const reviewUrl = `${appUrl}/r/${slug}`;
    const adminUrl = `${appUrl}/admin`;

    const subject = `Sveikiname pradėjus ReputationPro 14 d. nemokamą bandymą – ${businessName}`;
    const text = `Sveiki,\n\n` +
      `Dėkojame, kad pasirinkote „ReputationPro“ savo verslo reputacijos stiprinimui ir 5★ Google atsiliepimų augimui.\n\n` +
      `Jūsų 14 dienų nemokamas bandymas sėkmingai aktyvuotas!\n\n` +
      `Jūsų klientų atsiliepimų nuoroda (naudokite su QR kodu):\n${reviewUrl}\n\n` +
      `Jūsų valdymo pultas (vadovo dėžutė ir QR kodo atsisiuntimas):\n${adminUrl}\n\n` +
      `Jei kils klausimų, tiesiog atsakykite į šį el. laišką.\n\n` +
      `Sėkmės,\n` +
      `ReputationPro komanda • Verslomatika`;

    await transporter.sendMail({
      from: { name: 'ReputationPro', address: cfg.email },
      to,
      subject,
      text
    });
  } catch (err) {
    console.error('sendWelcomeEmail error:', err);
  }
}

export async function sendNewOrderAlertToAdmin(data: {
  business_name: string;
  email: string;
  slug: string;
  phone?: string;
  plan: string;
  delivery_address?: string;
}) {
  try {
    const cfg = getSmtpConfig();
    if (!cfg) return;
    const transporter = nodemailer.createTransport({
      host: cfg.smtp_host,
      port: cfg.smtp_port,
      secure: cfg.smtp_secure ?? (cfg.smtp_port === 465),
      auth: { user: cfg.email, pass: cfg.password },
      requireTLS: true,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    });
    const appUrl = process.env.APP_URL || 'https://reputacija.verslomatika.lt';
    const subject = `🎉 Nauja ReputationPro registracija: ${data.business_name} (${data.plan.toUpperCase()})`;
    const text = `Gauta nauja registracija sistemoje!\n\n` +
      `Įmonė: ${data.business_name}\n` +
      `Planas: ${data.plan}\n` +
      `El. paštas: ${data.email}\n` +
      `Telefonas: ${data.phone || 'Nenurodytas'}\n` +
      `Pristatymo adresas: ${data.delivery_address || 'Nenurodytas'}\n` +
      `Kliento nuoroda: ${appUrl}/r/${data.slug}\n\n` +
      `Valdymo pultas: ${appUrl}/admin?clinic=${data.slug}`;

    await transporter.sendMail({
      from: { name: 'ReputationPro Sistema', address: cfg.email },
      to: 'tomas@verslomatika.lt',
      subject,
      text
    });
  } catch (err) {
    console.error('sendNewOrderAlertToAdmin error:', err);
  }
}
