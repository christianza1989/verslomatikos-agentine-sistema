import { NextRequest, NextResponse } from 'next/server';
import { currentPrincipal, error } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const principal = await currentPrincipal();
  if (!principal) return error('Reikalingas prisijungimas.', 401);

  try {
    const { prompt, clinicName = 'Klinika', patientName = 'Klientas' } = await req.json();
    const cleanPrompt = (prompt || '').trim().toLowerCase();

    let botResponse = '';
    let suggestedAction: 'offer_slots' | 'confirm_booking' | 'opt_out' | 'general' = 'general';
    let suggestedSlots: string[] = [];

    if (cleanPrompt.includes('ketvirtadien') || cleanPrompt.includes('rytoj') || cleanPrompt.includes('kada') || cleanPrompt.includes('laik')) {
      botResponse = `Sveiki, ${patientName}! Šį ketvirtadienį turime laisvus laikus: 17:30 arba 18:15 pas gyd. specialistą. Kuris laikas Jums būtų patogesnis?`;
      suggestedAction = 'offer_slots';
      suggestedSlots = ['Ketvirtadienį 17:30', 'Ketvirtadienį 18:15', 'Penktadienį 11:00'];
    } else if (cleanPrompt.includes('17:30') || cleanPrompt.includes('18:15') || cleanPrompt.includes('tinka') || cleanPrompt.includes('registruok')) {
      botResponse = `Puiku! Užregistravome Jus ${cleanPrompt.includes('18:15') ? 'ketvirtadienį 18:15' : 'ketvirtadienį 17:30'}. Registracijos patvirtinimas ir priminimas atsiųstas į Jūsų telefoną. Lauksime atvykstant!`;
      suggestedAction = 'confirm_booking';
    } else if (cleanPrompt.includes('neaktualu') || cleanPrompt.includes('atsisakau') || cleanPrompt.includes('stop')) {
      botResponse = `Supratome, ačiū už atsakymą! Daugiau Jūsų netrukdysime. Gražios dienos!`;
      suggestedAction = 'opt_out';
    } else if (cleanPrompt.includes('kain') || cleanPrompt.includes('kiek')) {
      botResponse = `Profilaktinės burnos higienos procedūros kaina su apnašų šalinimu ir poliravimu yra 65–85 €. Taip pat atliekama nemokama pirminė apžiūra. Ar norėtumėte rezervuoti laiką?`;
      suggestedAction = 'offer_slots';
      suggestedSlots = ['Taip, noriu registruotis', 'Kokie laikai šią savaitę?'];
    } else {
      botResponse = `Sveiki! Dėkojame už atsakymą. Norime pasiūlyti Jums patogiausią vizito laiką. Ar Jums labiau tiktų pirmoje ar antroje dienos pusėje?`;
      suggestedAction = 'offer_slots';
      suggestedSlots = ['Pirmoje dienos pusėje (iki 14:00)', 'Antroje dienos pusėje (po 17:00)'];
    }

    return NextResponse.json({
      ok: true,
      botResponse,
      suggestedAction,
      suggestedSlots,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Simuliatoriaus klaida.';
    return error(msg, 500);
  }
}
