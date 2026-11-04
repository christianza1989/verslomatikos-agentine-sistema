import { error } from '@/lib/security';

// Previously issued registration links cannot start checkout while registration is closed.
export async function POST() { return error('Registracija laikinai sustabdyta.',503); }
