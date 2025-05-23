/**
 * chat-message controller
 */

import { factories } from '@strapi/strapi';
import axios from 'axios';
import utils from '@strapi/utils';
const { ValidationError, ApplicationError } = utils.errors;
import { sendMessageToChatGPT } from '../services/chatbot/index';
import { sendMessageToGemini } from '../services/chatbot/index';

export default factories.createCoreController('api::chat-message.chat-message', ({ strapi }) => ({
  async sendMessage(ctx: any) {
    const { conversation_id, message, model_id } = ctx.request.body;
    const user_id = ctx.state.user.id;
    if (!message || !user_id || !model_id) {
      return ctx.badRequest('Message, user id and model are required');
    }

    try {
      // Get the AI model details
      const ai_model = await strapi.documents('api::ai-model.ai-model').findOne({
        documentId: model_id,
      });
      if (!ai_model) {
        return ctx.notFound('Model not found');
      }
      // Check user's subscription status
      const now = Date.now();
      const subscriptionData = await strapi.services['api::subscription.subscription'].find({
        filters: { users_permissions_user: user_id }
      });
      // User is considered a subscription user if at least one subscription is active
      let isSubscriptionUser = false;
      if (subscriptionData && subscriptionData.results && subscriptionData.results.length > 0) {
        isSubscriptionUser = subscriptionData.results.some((sub: any) => {
          return new Date(sub.nextPurchaseDate).getTime() > now;
        });
      }

      // Define daily limits for free users; subscription users are unlimited
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
          users_permissions_user: user_id,
          createdAt: { $gte: todayStart.toISOString(), $lte: todayEnd.toISOString() }
        }
      });
      const conversationCountToday = todayConversations.results?.length || 0;
      if (!isSubscriptionUser && !conversation_id && conversationCountToday >= conversationLimit) {
        return ctx.badRequest('Free users are allowed only 3 conversations per day');
      }

      // Collect conversation IDs for today's conversations
      const conversationIds = todayConversations.results?.map((conv: any) => conv.id) || [];
      // Query all user messages (sender 'user') in today's conversations
      const userMessagesToday = await strapi.query('api::chat-message.chat-message').findMany({
        where: {
          sender: 'user',
          createdAt: { $gte: todayStart.toISOString(), $lte: todayEnd.toISOString() },
          conversation: { $in: conversationIds }
        }
      });
      const userMessageCount = userMessagesToday ? userMessagesToday.length : 0;
      if (!isSubscriptionUser && userMessageCount >= messageLimit) {
        return ctx.badRequest('Free users are allowed only 10 chat messages per day across all conversations');
      }

      let conversation;
      if (conversation_id) {
        // Retrieve the existing conversation for the user
        conversation = await strapi.documents('api::conversation.conversation').findOne({
          documentId: conversation_id,
          users_permissions_user: user_id
        });
        if (!conversation) {
          return ctx.notFound('Conversation not found');
        }
      } else {
        // Create a new conversation if conversation_id is not provided
        conversation = await strapi.services['api::conversation.conversation'].create({
          data: {
            users_permissions_user: ctx.state.user,
            is_active: true,
            ai_model: ai_model.documentId
          }
        });
      }

      // Retrieve all messages for this conversation
      const historyMessages = await strapi.query('api::chat-message.chat-message').findMany({
        where: { conversation: conversation.id },
      });
      const { model_name, api_key, llm } = ai_model;
      if (!model_name || !api_key) {
        return ctx.badRequest('Model name and API key are required');
      }

      // Send conversation messages to ChatGPT and get a response
      var botResponse: any;
      switch(llm) {
        case 'gemini':
          botResponse = await sendMessageToGemini(historyMessages, message, { model_name, api_key })
          break
        case 'openai':
          botResponse = await sendMessageToChatGPT(historyMessages, message, { model_name, api_key });
          break
        default:
          break
      }
      
      // Create the user's chat message
      await strapi.services['api::chat-message.chat-message'].create({
        data: {
          conversation: conversation,
          message: message,
          sender: 'user',
          embedding: {},
        },
      });

      // Create the bot's chat message with the response
      const finalMessage = await strapi.services['api::chat-message.chat-message'].create({
        data: {
          conversation: conversation,
          message: botResponse,
          sender: 'bot',
        },
        populate: ['conversation']
      });

      ctx.send({ 
        data: finalMessage, 
        success: true 
      });
    } catch (err) {
      console.error(err);
      throw new ApplicationError('Internal Server Error', err.message);
    }
  },
}));

// Helper functions (getEmbedding, findRelatedMessages, cosineSimilarity) remain unchanged
async function getEmbedding(message: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  const data = {
    model: 'text-embedding-ada-002', // Embedding model
    input: message,
  };

  try {
    const response = await axios.post('https://api.openai.com/v1/embeddings', data, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data.data[0].embedding;
  } catch (error) {
    console.error('Error calling OpenAI Embedding API:', error);
    throw new Error('Failed to fetch embedding from OpenAI');
  }
}

async function findRelatedMessages(userMessageEmbedding: number[], conversation_id: number) {
  const response = await strapi.services['api::chat-message.chat-message'].find({
    where: { conversation: conversation_id },
  });

  const allMessages = response.results;

  if (!Array.isArray(allMessages)) {
    console.error('Expected allMessages to be an array but got:', allMessages);
    return [];
  }

  var relevantMessages: any[] = [];
  var chatMessagesForGPT: any[] = [];
  for (let i = 0; i < allMessages.length; i++) {
    const msg = allMessages[i];

    if (msg.sender === 'user' && msg.embedding) {
      const similarity = cosineSimilarity(userMessageEmbedding, msg.embedding);

      if (similarity > 0.8) {  // Only include messages with high similarity
        relevantMessages.push(msg);
        chatMessagesForGPT.push({
          role: 'user',
          content: msg.message,
        });

        if (i + 1 < allMessages.length && allMessages[i + 1].sender === 'bot') {
          const botMsg = allMessages[i + 1];
          chatMessagesForGPT.push({
            role: 'assistant',
            content: botMsg.message,
          });
        }
      }
    } else if (msg.sender === 'bot') {
      chatMessagesForGPT.push({
        role: 'assistant',
        content: msg.message,
      });
    }
  }
  return chatMessagesForGPT;
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, val, index) => sum + val * vecB[index], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));

  return dotProduct / (magnitudeA * magnitudeB);
}