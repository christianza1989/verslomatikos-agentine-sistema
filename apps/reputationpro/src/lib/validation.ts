import { z } from 'zod';
import { rekvizitaiReviewUrl } from './review-platforms.ts';
export function validGoogleUrl(value: string) {
  try {
    const u=new URL(value); if(u.protocol!=='https:'||u.username||u.password||u.port)return false;
    if(['g.page','maps.app.goo.gl','maps.google.com'].includes(u.hostname))return true;
    if(u.hostname==='search.google.com')return u.pathname==='/local/writereview';
    return ['google.com','www.google.com'].includes(u.hostname)&&/^\/maps(?:\/|$)/.test(u.pathname);
  } catch { return false; }
}
// Public review destination: Google, or Rekvizitai.lt for businesses without a Google profile (Etapas R).
export function validReviewUrl(value: string) { return validGoogleUrl(value) || !!rekvizitaiReviewUrl(value); }
/** Stored form of a review link: Rekvizitai company/review URLs become the canonical review page. */
export function normalizeReviewUrl(value: string) { return rekvizitaiReviewUrl(value) || value.trim(); }
// True only for links that open the business's own review form directly (not a Maps search):
// Google writereview?placeid / g.page review links, or a Rekvizitai.lt review page.
// Used for honest "Susieta" badges and onboarding checks.
export function isDirectReviewUrl(value: string|null|undefined) {
  if(!value)return false;
  if(rekvizitaiReviewUrl(value))return true;
  try {
    const u=new URL(value);
    if(u.hostname==='search.google.com'&&u.pathname==='/local/writereview')return !!u.searchParams.get('placeid');
    if(u.hostname==='g.page')return /^\/r\/[^/]+\/review\/?$/.test(u.pathname);
    return false;
  } catch { return false; }
}
// `writereview?q=…` (no placeid) makes Google answer "400. That's an error." – such links were
// produced by an old resolver fallback. Serve a Maps search instead, which always opens.
export function usableReviewUrl(value: string, businessName: string) {
  const rekvizitai = rekvizitaiReviewUrl(value);
  if (rekvizitai) return rekvizitai;
  try {
    const u=new URL(value);
    if(u.hostname==='search.google.com'&&u.pathname==='/local/writereview'&&!u.searchParams.get('placeid')){
      return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(u.searchParams.get('q')||businessName);
    }
  } catch { /* keep as is */ }
  return value;
}
// ROADMAP K5: who receives customer notes. The account email always does; up to 3 more
// addresses (reception, administrator, manager) can be added in the dashboard.
const EMAIL_RE = /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[a-z]{2,}$/i;
export const MAX_NOTIFY_EMAILS = 3;
export function parseNotifyEmails(value: string | null | undefined) {
  return [...new Set((value || '').split(/[,;\s]+/).map((e) => e.trim().toLowerCase()).filter((e) => EMAIL_RE.test(e) && e.length <= 254))].slice(0, MAX_NOTIFY_EMAILS);
}
export function notifyRecipients(client: { email: string; notify_emails?: string | null }, root?: { email: string } | null) {
  // Branches: the account's main email always receives notes; a branch without its own email has a
  // ".invalid" placeholder that is never emailed.
  const own = client.email.trim().toLowerCase();
  const list = [...(root ? [root.email.trim().toLowerCase()] : []), own, ...parseNotifyEmails(client.notify_emails)];
  return [...new Set(list)].filter((e) => e && !e.endsWith('.invalid'));
}
// Branch (filialas) create/edit form. Email is optional: notes always reach the account email too.
export const branchSchema = z.object({
  business_name: z.string().trim().min(2, 'Įrašykite filialo pavadinimą.').max(120),
  location_label: z.string().trim().max(120).optional().default(''),
  google_review_url: z.string().trim().max(2000).refine(validReviewUrl, 'Įveskite Google arba Rekvizitai.lt atsiliepimų nuorodą (https://…).').transform(normalizeReviewUrl),
  email: z.string().trim().toLowerCase().max(254).refine((v) => v === '' || EMAIL_RE.test(v), 'Patikrinkite el. pašto adresą.').optional().default(''),
  phone: z.string().trim().max(40).optional().default(''),
  slug: z.string().trim().min(3).max(70).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Nuorodos vardas: mažosios raidės, skaičiai ir brūkšneliai.').optional(),
});
export const notifyEmailsSchema = z.array(z.string().trim().toLowerCase().max(254).regex(EMAIL_RE, 'Patikrinkite el. pašto adresą.')).max(MAX_NOTIFY_EMAILS);
export const clinicSchema=z.object({
  business_name:z.string().trim().min(2).max(120),
  email:z.email().trim().toLowerCase().max(254),
  slug:z.string().trim().min(3).max(70).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  google_review_url:z.string().max(2000).refine(validReviewUrl,'Įveskite Google atsiliepimų arba Rekvizitai.lt atsiliepimų nuorodą (https://…).').transform(normalizeReviewUrl),
  phone:z.string().trim().max(40).optional()
});
export const feedbackSchema=z.object({
  slug:z.string().min(3).max(70), rating:z.number().int().min(1).max(5),
  feedback_text:z.string().trim().min(10,'Parašykite bent 10 simbolių.').max(3000),
  customer_name:z.string().trim().max(100).default(''),
  customer_phone:z.string().trim().max(40).default(''),
  consent:z.literal(true), website:z.string().max(0).optional(),
  submission_id:z.uuid()
});
