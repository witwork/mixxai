import type { Context } from 'koa';

export default (plugin: any) => {
  // Save the original controller for /users/me
  const originalMe = plugin.controllers.user.me;

  // Override the /users/me controller
  plugin.controllers.user.me = async (ctx: Context) => {
    // Call the original controller to get the basic profile
    await originalMe(ctx);
    // Ensure that the profile is an object
    const userProfile = (ctx.body as Record<string, any>) || {};
    const userId = ctx.state.user?.id;
    if (!userId) {
      ctx.throw(401, 'Unauthorized');
    }

    // Query the subscription info for the user
    const subscriptionData = await strapi.services['api::subscription.subscription'].find({
      filters: { users_permissions_user: userId }
    });
    const now = Date.now();
    // Determine if the user is a subscription user (has at least one active subscription)
    let isSubscriptionUser = false;
    if (subscriptionData && subscriptionData.results && subscriptionData.results.length > 0) {
      isSubscriptionUser = subscriptionData.results.some((sub: any) => {
        return new Date(sub.nextPurchaseDate).getTime() > now;
      });
    }

    // Define daily limits
    // For free users: 3 conversations and 10 chat messages total (across all conversations)
    // For subscription users, we assume unlimited (you can change these values if needed)
    const conversationLimit = isSubscriptionUser ? Infinity : 3;
    const messageLimit = isSubscriptionUser ? Infinity : 10;

    // Compute today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Query today's conversations for the user
    const todayConversations = await strapi.services['api::conversation.conversation'].find({
      filters: {
        users_permissions_user: userId,
        createdAt: { $gte: todayStart.toISOString(), $lte: todayEnd.toISOString() }
      }
    });
    const conversationCountToday = todayConversations.results?.length || 0;
    const conversationsRemaining =
      conversationLimit === Infinity ? 'Unlimited' : Math.max(0, conversationLimit - conversationCountToday);

    // Query all user chat messages (sender: 'user') across all conversations created today
    // We first collect the conversation IDs from todayConversations
    const conversationIds = todayConversations.results?.map((conv: any) => conv.id) || [];
    const userMessagesToday = await strapi.query('api::chat-message.chat-message').findMany({
      where: {
        sender: 'user',
        createdAt: { $gte: todayStart.toISOString(), $lte: todayEnd.toISOString() },
        conversation: { $in: conversationIds }
      }
    });
    const userMessageCount = userMessagesToday ? userMessagesToday.length : 0;
    const chatMessagesRemaining = messageLimit === Infinity ? 'Unlimited' : Math.max(0, messageLimit - userMessageCount);

    // Extend the profile response with daily limits info
    ctx.body = {
      ...userProfile,
      // subscriptions: subscriptionData?.results, # currently no need to return subscription data
      subscriptionStatus: isSubscriptionUser ? 'active' : 'expired',
      subscriptionActive: isSubscriptionUser,
      conversationsRemaining,
      chatMessagesRemaining
    };

    return ctx.body;
  };

  // Add a new method to block a user
  plugin.controllers.user.blockUser = async (ctx: any) => {
    try {
      // Verify if the user is authenticated (has an access token)
      if (!ctx.state.user) {
        return ctx.unauthorized('You need to be logged in to perform this action');
      }

      // Get user information from the token
      const { documentId } = ctx.state.user;

      // Find the user by documentId and check if the userId matches the token
      const user = await strapi.documents('plugin::users-permissions.user').findOne({
        documentId: documentId
      });

      if (!user) {
        return ctx.notFound('User not found');
      }

      // Update the status to blocked
      await strapi.documents('plugin::users-permissions.user').update({
        documentId,
        data: { blocked: true }
      });

      // Return the result
      ctx.send({
        message: 'User has been successfully blocked',
        code: 200,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          blocked: true
        }
      });
    } catch (err) {
      ctx.throw(500, err);
    }
  };

  // Controller to unblock a user
  plugin.controllers.user.unblockUser = async (ctx) => {
    try {
      const { documentId } = ctx.params;

      // Verify if the user is authenticated (has an access token)
      if (!ctx.state.user) {
        return ctx.unauthorized('You need to be logged in to perform this action');
      }

      // Get user information from the token
      const userIdFromToken = ctx.state.user.id;

      // Find the user by documentId and check if the userId matches the token
      const user = await strapi.documents('plugin::users-permissions.user').findOne({
        documentId
      });

      if (!user) {
        return ctx.notFound('User not found');
      }

      if (user.id !== userIdFromToken) {
        return ctx.unauthorized('You do not have permission to unblock this user');
      }

      // Update the status to unblocked
      await strapi.query('plugin::users-permissions.user').update({
        where: { id: userIdFromToken },
        data: { blocked: false }
      });

      ctx.send({
        code: 200,
        message: 'User has been successfully unblocked',
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          blocked: false
        }
      });
    } catch (err) {
      ctx.throw(500, err);
    }
  };

  // Update the route to use the standard user authentication policy
  plugin.routes['content-api'].routes.push({
    method: 'POST',
    path: '/users/block',
    handler: 'user.blockUser'
  });

  // Update the route to use the standard user authentication policy
  plugin.routes['content-api'].routes.push({
    method: 'PUT',
    path: '/users/:documentId/unblock',
    handler: 'user.unblockUser'
  });

  // Save the original callback function
  const originalCallback = plugin.controllers.auth.callback;

  // Override the callback function (handle login)
  plugin.controllers.auth.callback = async (ctx: Context) => {
    // Call the original callback to authenticate and create token
    await originalCallback(ctx);

    // Get the original response data
    const response = ctx.body as any; // Type assertion to any to avoid TypeScript errors
    
    console.log('Original auth response:', response); // Log the original response for debugging
    
    // Check if login was successful and format the response
    if (response) {
      // Format the response to match OTP login format
      ctx.body = {
        data: {
          jwt: response.jwt || response.token, // Try both possible property names
          user: response.user || response.data,
        },
        code: 200,
        message: 'success',
      };
      
      const responseData = response.data as any; // Add type assertion
      
      // If we still don't have a JWT, try to get it from other places
      if (!ctx.body.data.jwt && responseData && responseData.token) {
        ctx.body.data.jwt = responseData.token;
      }
      
      // Ensure we have user data
      if (!ctx.body.data.user && responseData && responseData.user) {
        ctx.body.data.user = responseData.user;
      }
    }
    
    return ctx.body;
  };

  return plugin;
};