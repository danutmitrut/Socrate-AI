import Stripe from 'stripe';
import { updateUserSubscription } from '../../lib/db.js';
import { updateMailerliteSubscriber } from '../../lib/mailerlite.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Disable body parsing for webhook verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to read raw body
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(Buffer.from(data));
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const signature = req.headers['stripe-signature'];
  let event;

  try {
    const rawBody = await getRawBody(req);

    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = parseInt(session.metadata.userId);

        if (session.mode === 'subscription') {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);

          // Calculate subscription end date (current_period_end is Unix timestamp in seconds)
          const subscriptionEndDate = subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default: 30 days from now

          // Update user subscription in database
          await updateUserSubscription(userId, {
            stripeCustomerId: session.customer,
            stripeSubscriptionId: subscription.id,
            subscriptionEndsAt: subscriptionEndDate
          });

          // Update Mailerlite with paid status
          const customer = await stripe.customers.retrieve(session.customer);
          await updateMailerliteSubscriber(customer.email, {
            subscription_type: 'paid',
            subscription_date: new Date().toISOString()
          }).catch(err => console.error('Mailerlite update error:', err));

          console.log(`Subscription created for user ${userId}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;

        // Skip if no subscription (one-time payment)
        if (!invoice.subscription) {
          console.log('Invoice payment succeeded but no subscription found - skipping');
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);

        // Skip if no userId in metadata
        if (!subscription.metadata || !subscription.metadata.userId) {
          console.log('Subscription has no userId metadata - skipping');
          break;
        }

        const userId = parseInt(subscription.metadata.userId);

        // Calculate subscription end date
        const subscriptionEndDate = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        // Renew subscription
        await updateUserSubscription(userId, {
          stripeCustomerId: invoice.customer,
          stripeSubscriptionId: subscription.id,
          subscriptionEndsAt: subscriptionEndDate
        });

        console.log(`Subscription renewed for user ${userId}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = parseInt(subscription.metadata.userId);

        // Mark subscription as expired (handled by checkUserLimit function)
        console.log(`Subscription canceled for user ${userId}`);
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}
