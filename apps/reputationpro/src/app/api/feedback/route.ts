import { NextRequest, NextResponse } from 'next/server';
import { db, getClient } from '@/lib/db';
import { feedbackSchema } from '@/lib/validation';
import { sameOrigin, error, jsonBody, rateLimit } from '@/lib/security';
import { canCollectFeedback } from '@/lib/entitlements';
import { sendFeedbackAlert } from '@/lib/clinic-mail';

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return error('Netinkama užklausos kilmė.', 403);
  try {
    const result = feedbackSchema.safeParse(await jsonBody(req));
    if (!result.success) return error(result.error.issues[0]?.message || 'Patikrinkite formą.');
    const data = result.data, client = getClient(data.slug);
    if (!client || !canCollectFeedback(client)) return error('Įmonė nerasta.', 404);
    if (db().prepare('SELECT 1 FROM internal_feedback WHERE id=? AND client_id=?').get(data.submission_id, client.id)) {
      return NextResponse.json({ ok: true });
    }
    if (!rateLimit(`feedback:${client.id}`, 30, 60000)) return error('Per daug žinučių. Pabandykite po minutės.', 429);
    
    db().prepare('INSERT INTO internal_feedback(id,client_id,rating,feedback_text,customer_name,customer_phone) VALUES (?,?,?,?,?,?)')
      .run(data.submission_id, client.id, data.rating, data.feedback_text, data.customer_name || '', data.customer_phone || '');

    // Send instant manager email alert for 1-3★ reviews
    if (client.email) {
      sendFeedbackAlert(client.email, client.business_name, {
        rating: data.rating,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        feedback_text: data.feedback_text,
        slug: client.slug
      }).catch(err => console.error('Background alert error:', err));
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return error('Nepavyko pateikti žinutės. Bandykite dar kartą.');
  }
}
