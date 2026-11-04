import { NextRequest, NextResponse } from 'next/server';
import { db, createClient, getClient, recordLeadConversion } from '@/lib/db';
import { error, jsonBody, sameOrigin, SESSION_COOKIE } from '@/lib/security';
import { createClinicCredential, issueClinicSession } from '@/lib/clinic-access';
import { sendWelcomeEmail, sendNewOrderAlertToAdmin } from '@/lib/clinic-mail';

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return error('Netinkama užklausos kilmė.', 403);
  try {
    const body = await jsonBody(req) as Record<string, string>;
    const { business_name, email, slug, google_review_url, phone, password, plan, delivery_address } = body;
    if (!business_name || !email || !slug || !google_review_url) {
      return error('Užpildykite visus privalomus laukelius.');
    }
    const cleanSlug = slug.toLowerCase().trim();
    const existing = getClient(cleanSlug);

    let client: any;

    if (existing) {
      // If this is our pre-provisioned demo/campaign lead claiming their account
      const isPreProvisioned = existing.is_demo === 1 || existing.subscription_status === 'demo_trial';
      const isSameEmail = existing.email.toLowerCase() === email.trim().toLowerCase();
      
      if (isPreProvisioned || isSameEmail) {
        // Upgrade existing demo client to active trial
        db().prepare(`
          UPDATE clients SET
            business_name = ?,
            email = ?,
            google_review_url = ?,
            phone = ?,
            subscription_status = 'trialing',
            is_demo = 0,
            trial_ends_at = ?
          WHERE id = ?
        `).run(
          business_name.trim(),
          email.trim().toLowerCase(),
          google_review_url.trim(),
          (phone || '').trim(),
          new Date(Date.now() + 14 * 86400000).toISOString(),
          existing.id
        );
        client = getClient(cleanSlug)!;
      } else {
        return error('Šis nuorodos vardas jau užimtas. Pasirinkite kitą.');
      }
    } else {
      // Create fresh client in 14-day trial mode
      client = createClient({
        business_name: business_name.trim(),
        email: email.trim().toLowerCase(),
        slug: cleanSlug,
        google_review_url: google_review_url.trim(),
        phone: (phone || '').trim(),
        subscription_status: 'trialing',
        trial_ends_at: new Date(Date.now() + 14 * 86400000).toISOString()
      }, false);
    }

    // Track campaign conversion if this clinic was part of a campaign
    try {
      recordLeadConversion(email.trim().toLowerCase());
      recordLeadConversion(cleanSlug);
    } catch (err) {
      console.error('Failed to record campaign conversion:', err);
    }

    // Save credentials if provided
    if (password && password.length >= 8) {
      try {
        createClinicCredential(client.id, password);
      } catch (err) {
        console.error('Failed to create clinic credential:', err);
      }
    }

    // Mark email as verified for trial access
    try {
      db().prepare('INSERT OR REPLACE INTO clinic_email_verifications(client_id, verified_at) VALUES (?,?)').run(client.id, Date.now());
    } catch (err) {
      console.error('Failed to record verification:', err);
    }

    // Save order details / stand delivery address
    try {
      db().exec(`
        CREATE TABLE IF NOT EXISTS stand_orders (
          id TEXT PRIMARY KEY,
          client_id TEXT NOT NULL,
          plan TEXT NOT NULL,
          delivery_address TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
        );
      `);
      db().prepare('INSERT INTO stand_orders (id, client_id, plan, delivery_address) VALUES (?, ?, ?, ?)').run(
        crypto.randomUUID(),
        client.id,
        plan || 'annual',
        delivery_address || ''
      );
    } catch (err) {
      console.error('Failed to save stand order record:', err);
    }

    // Issue clinic session for instant login
    const session = issueClinicSession(client.id);

    // Dispatch emails in background
    sendWelcomeEmail(client.email, client.business_name, client.slug).catch(err => console.error('Welcome email error:', err));
    sendNewOrderAlertToAdmin({
      business_name: client.business_name,
      email: client.email,
      slug: client.slug,
      phone: client.phone,
      plan: plan || 'annual',
      delivery_address: delivery_address || ''
    }).catch(err => console.error('Admin order alert error:', err));

    const res = NextResponse.json({
      ok: true,
      slug: client.slug,
      url: `/admin?clinic=${encodeURIComponent(client.slug)}#onboarding`
    }, { status: 201 });

    // Set authentication session cookie
    res.cookies.set(SESSION_COOKIE, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 8 * 3600,
      sameSite: 'lax'
    });

    return res;
  } catch (err) {
    console.error('Checkout registration error:', err);
    return error('Nepavyko sukurti paskyros. Toks el. paštas arba nuorodos vardas jau naudojamas.', 409);
  }
}
