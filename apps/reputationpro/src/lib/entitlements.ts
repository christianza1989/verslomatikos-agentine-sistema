import { getClientById, type Client } from './db.ts';

// Preserve the already-published Verslomatika demonstration while requiring
// verified Stripe subscription events for newly registered real customers.
export function canCollectFeedback(client:Client): boolean {
  if (client.archived_at) return false;
  // Branches (filialai) share the main profile's subscription/trial.
  if (client.parent_id) { const root = getClientById(client.parent_id); return !!root && !root.parent_id && canCollectFeedback(root); }
  const isTrialActive = !!client.trial_ends_at && new Date(client.trial_ends_at).getTime() > Date.now();
  return (
    !!client.is_demo ||
    client.slug === 'verslomatika' ||
    client.slug === 'memocasting' ||
    client.subscription_status === 'trialing' ||
    client.subscription_status === 'demo_trial' ||
    client.subscription_status === 'active' ||
    isTrialActive ||
    (!!client.stripe_subscription_id && ['trialing','active','past_due'].includes(client.subscription_status))
  );
}
