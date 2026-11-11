// Ways a client shares their review page (ROADMAP D5). Each channel gets its own link
// `/r/{slug}?s={id}` so the dashboard can show which channel brings ratings
// (review_events.source). Shared by server routes and client components – no imports.

export const QR_CHANNELS = [
  { id: 'stovelis', label: 'Stovelis ir plakatas', short: 'Stovelis / plakatas' },
  { id: 'kvitas', label: 'Kvitai ir sąskaitos', short: 'Kvitai / sąskaitos' },
  { id: 'vizitine', label: 'Vizitinės kortelės', short: 'Vizitinės' },
  { id: 'lipdukai', label: 'Lipdukai ant prekių ir pakuočių', short: 'Lipdukai' },
  { id: 'parasas', label: 'El. pašto parašas', short: 'El. parašas' },
  { id: 'sms', label: 'SMS ir žinutės po vizito', short: 'SMS / žinutės' },
  { id: 'svetaine', label: 'Svetainė', short: 'Svetainė' },
  { id: 'nuoroda', label: 'Tiesioginė nuoroda', short: 'Nuoroda' },
] as const;

export type QrChannelId = (typeof QR_CHANNELS)[number]['id'];
const IDS = new Set<string>(QR_CHANNELS.map((c) => c.id));

/** Accept only known channel ids (anything else is stored as unknown/null). */
export function cleanChannel(value: unknown): QrChannelId | null {
  return typeof value === 'string' && IDS.has(value) ? (value as QrChannelId) : null;
}

export function channelUrl(base: string, slug: string, channel?: QrChannelId | null) {
  const url = `${base.replace(/\/$/, '')}/r/${encodeURIComponent(slug)}`;
  return channel ? `${url}?s=${channel}` : url;
}

export function channelLabel(id: string | null) {
  return QR_CHANNELS.find((c) => c.id === id)?.short || 'Kita / be žymos';
}
