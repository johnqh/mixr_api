import { Hono } from 'hono';
import { requireAuth, type AuthUser } from '../middleware/auth';
import {
  getSubscriptionHelper,
  getTestMode,
} from '../middleware/subscription';

type Variables = {
  user: AuthUser;
};

const app = new Hono<{ Variables: Variables }>();

/**
 * GET /api/v1/users/:userId/subscriptions
 *
 * Get user subscription status (requires Firebase auth).
 */
app.get('/:userId/subscriptions', requireAuth, async (c) => {
  const requestedUserId = c.req.param('userId');
  const authUser = c.get('user') as AuthUser;

  if (authUser.uid !== requestedUserId) {
    return c.json(
      { success: false, error: 'You can only access your own subscription' },
      403
    );
  }

  const subHelper = getSubscriptionHelper();
  if (!subHelper) {
    return c.json(
      { success: false, error: 'Subscription service not configured' },
      500
    );
  }

  try {
    const testMode = getTestMode(c);
    const subscriptionInfo = await subHelper.getSubscriptionInfo(
      requestedUserId,
      testMode
    );
    return c.json({
      success: true,
      data: {
        hasSubscription: subscriptionInfo.entitlements.length > 0,
        entitlements: subscriptionInfo.entitlements,
        subscriptionStartedAt: subscriptionInfo.subscriptionStartedAt,
        platform: subscriptionInfo.platform,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return c.json(
      { success: false, error: 'Failed to fetch subscription status' },
      500
    );
  }
});

export default app;
