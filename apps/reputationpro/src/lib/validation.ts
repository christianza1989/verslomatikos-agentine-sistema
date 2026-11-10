import { z } from 'zod';
export function validGoogleUrl(value: string) {
  try {
    const u=new URL(value); if(u.protocol!=='https:'||u.username||u.password||u.port)return false;
    if(['g.page','maps.app.goo.gl','maps.google.com'].includes(u.hostname))return true;
    if(u.hostname==='search.google.com')return u.pathname==='/local/writereview';
    return ['google.com','www.google.com'].includes(u.hostname)&&/^\/maps(?:\/|$)/.test(u.pathname);
  } catch { return false; }
}
// True only for links that open the business's own "write a review" form directly
// (not a Maps search). Used for honest "Susieta" badges and onboarding checks.
export function isDirectReviewUrl(value: string|null|undefined) {
  if(!value)return false;
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
  try {
    const u=new URL(value);
    if(u.hostname==='search.google.com'&&u.pathname==='/local/writereview'&&!u.searchParams.get('placeid')){
      return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(u.searchParams.get('q')||businessName);
    }
  } catch { /* keep as is */ }
  return value;
}
export const clinicSchema=z.object({
  business_name:z.string().trim().min(2).max(120),
  email:z.email().trim().toLowerCase().max(254),
  slug:z.string().trim().min(3).max(70).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  google_review_url:z.string().max(2000).refine(validGoogleUrl,'Įveskite HTTPS Google Maps arba g.page nuorodą.'),
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
