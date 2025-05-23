/**
 * subscription controller
 */

import { factories } from '@strapi/strapi';
import axios from 'axios';
import type { Context } from 'koa';

// Helper function to process the subscription verification and creation/update
async function processSubscription(ctx: Context, appleURL: string) {
  const user = ctx.state.user;
  if (!user) return ctx.unauthorized('Unauthorized');

  const { receiptData, platform = 'ios' } = ctx.request.body as {
    receiptData?: string;
    platform?: string;
  };

  if (!receiptData) return ctx.badRequest('Missing receiptData');

  try {
    const postData = {
      'receipt-data': receiptData,
      'password': process.env.APPLE_SHARED_SECRET,
      'exclude-old-transactions': true
    };

    // Call Apple using the provided URL (production or sandbox)
    const response = await axios.post(appleURL, postData);
    const data = response.data;

    if (data.status !== 0) {
      return ctx.notFound('Invalid Apple receipt');
    }

    const latest = data.latest_receipt_info?.[0];
    if (!latest) return ctx.notFound('No receipt info found');

    // Calculate purchase and expiration dates from the receipt
    const purchaseDate = new Date(parseInt(latest.purchase_date_ms, 10));
    const nextPurchaseDate = new Date(parseInt(latest.expires_date_ms, 10));
    const now = Date.now();
    const isExpired = nextPurchaseDate.getTime() < now;

    // Use original_transaction_id as the unique key for subscription
    const appleSubscriptionId = latest.original_transaction_id;

    // Find the user's subscription using the unique subscriptionId
    const existingSubscriptions = await strapi.services['api::subscription.subscription'].find({
      filters: {
        users_permissions_user: user.id,
        subscriptionId: appleSubscriptionId
      }
    });

    // If a subscription record exists, check its expiration
    if (
      existingSubscriptions &&
      existingSubscriptions.results &&
      existingSubscriptions.results.length > 0
    ) {
      const subscriptionRecord = existingSubscriptions.results[0];
      if (new Date(subscriptionRecord.nextPurchaseDate).getTime() < now) {
        return ctx.send({
          data: {
            expired: true,
            subscription: subscriptionRecord,
            message: 'Subscription already expired'
          },
          success: true
        });
      } else {
        const updated = await strapi.services['api::subscription.subscription'].update(subscriptionRecord.id, {
          data: {
            platform,
            purchaseDate,
            nextPurchaseDate,
            receipt: receiptData,
            subscriptionId: appleSubscriptionId
          }
        });
        return ctx.send({
          data: {
            expired: false,
            subscription: updated
          },
          success: true
        });
      }
    } else {
      // Create a new subscription if none exists
      const created = await strapi.services['api::subscription.subscription'].create({
        data: {
          platform,
          purchaseDate,
          nextPurchaseDate,
          receipt: receiptData,
          subscriptionId: appleSubscriptionId,
          users_permissions_user: user.id
        }
      });
      return ctx.send({
        data: {
          expired: isExpired,
          subscription: created
        },
        success: true
      });
    }
  } catch (err) {
    console.error('Error verifying subscription:', err);
    return ctx.internalServerError('Failed to create subscription');
  }
}

export default factories.createCoreController('api::subscription.subscription', ({ strapi }) => ({
  // Endpoint for production environment
  async createProd(ctx: Context) {
    const prodAppleURL = 'https://buy.itunes.apple.com/verifyReceipt';
    return processSubscription(ctx, prodAppleURL);
  },
  // Endpoint for sandbox environment
  async createSandbox(ctx: Context) {
    const sandboxAppleURL = 'https://sandbox.itunes.apple.com/verifyReceipt';
    return processSubscription(ctx, sandboxAppleURL);
  }
}));