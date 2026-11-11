// Where a business's customers leave their public review (ROADMAP Etapas R, 2026-11-11).
// The destination lives in clients.google_review_url (historical name = "public review link");
// the platform is derived from the link itself, so pasting a Google link later switches the
// whole funnel to Google automatically.
//  - google:     search.google.com/local/writereview?placeid=…, g.page/r/…/review, Maps links
//  - rekvizitai: https://rekvizitai.vz.lt/imone/{company}/atsiliepimai/ – for businesses without
//                a Google Business Profile. The form there needs no registration.
export type ReviewPlatform = 'google' | 'rekvizitai';

const REKVIZITAI_HOSTS = new Set(['rekvizitai.vz.lt', 'www.rekvizitai.vz.lt', 'rekvizitai.lt', 'www.rekvizitai.lt']);

/** Canonical Rekvizitai.lt review page for a pasted company or review URL, or null if it is not one. */
export function rekvizitaiReviewUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const u = new URL(value.trim());
    if (u.protocol !== 'https:' || u.username || u.password || u.port || !REKVIZITAI_HOSTS.has(u.hostname)) return null;
    const m = u.pathname.match(/^\/imone\/([a-z0-9_]{2,120})(?:\/(?:atsiliepimai\/?)?)?$/);
    return m ? `https://rekvizitai.vz.lt/imone/${m[1]}/atsiliepimai/` : null;
  } catch { return null; }
}

export function reviewPlatform(url: string | null | undefined): ReviewPlatform {
  return rekvizitaiReviewUrl(url) ? 'rekvizitai' : 'google';
}

/** Customer-facing wording per platform. Never say "Google" to customers of a Rekvizitai business. */
export const PLATFORM_COPY: Record<ReviewPlatform, {
  name: string; button: string; ask: string; hint: string | null; shareLabel: string; linkLabel: string;
}> = {
  google: {
    name: 'Google',
    button: 'Rašyti atsiliepimą Google',
    ask: 'Ar galėtumėte pasidalinti savo patirtimi „Google“? Tai užtruks mažiau nei minutę, o Jūsų atsiliepimas padės kitiems mus atrasti.',
    hint: null,
    shareLabel: 'Įvertinkite mus Google',
    linkLabel: 'Google atsiliepimų nuoroda',
  },
  rekvizitai: {
    name: 'Rekvizitai.lt',
    button: 'Rašyti atsiliepimą Rekvizitai.lt',
    ask: 'Ar galėtumėte pasidalinti savo patirtimi Rekvizitai.lt? Tai užtruks apie minutę, o Jūsų atsiliepimas padės kitiems mus atrasti.',
    hint: 'Atsidariusiame puslapyje spauskite „Parašykite savo atsiliepimą“. Registruotis nereikia.',
    shareLabel: 'Įvertinkite mus',
    linkLabel: 'Rekvizitai.lt atsiliepimų nuoroda',
  },
};

export const platformCopy = (url: string | null | undefined) => PLATFORM_COPY[reviewPlatform(url)];
