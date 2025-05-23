import { factories } from '@strapi/strapi';
const util = require('util');
import utils from '@strapi/utils';
const { ValidationError, ApplicationError } = utils.errors;

export default factories.createCoreController('api::conversation.conversation', ({ strapi }) => ({

  async getConversationList(ctx) {
    
    if (!ctx.state.user) {
      return ctx.unauthorized('You must be logged in to access this resource');
    }

    const { documentId: user_id } = ctx.state.user; // Lấy user_id từ context
    let { page = 1, pageSize = 10 } = ctx.query;

    if (!user_id) {
      return ctx.badRequest('User ID is required');
    }

    const parsedPage = Number(page);
    const parsedPageSize = Number(pageSize);

    if (isNaN(parsedPage) || isNaN(parsedPageSize) || parsedPage < 1 || parsedPageSize < 1) {
      return ctx.badRequest('Invalid pagination parameters');
    }

    try {
      console.log('user: ', ctx.state.user)
      const start = (parsedPage - 1) * parsedPageSize;
      const limit = parsedPageSize;

      const conversations = await strapi.documents('api::conversation.conversation').findMany({
        filters: {
          users_permissions_user: {
            documentId: user_id,
          },
          is_active: true,
        },
        populate: {
          chat_messages: {
            sort: 'updatedAt:desc',
          },
        },
        sort: 'updatedAt:desc',
        limit: limit,
        start: start,
      });

      const result = conversations.map((conversation) => {
        const lastMessage = conversation.chat_messages[0];

        return {
          id: conversation.id,
          documentId: conversation.documentId,
          lastMessage: lastMessage ? {
            sender: lastMessage.sender,
            message: lastMessage.message,
          } : null,
          updateAt: conversation.updatedAt,
        };
      });

      ctx.send({ 
        data: result,
        success: true
      });
    } catch (err) {
      console.error(err);
      throw new ApplicationError('Error fetching conversation list: ' + err.message);
    }
  },

  async getConversationDetails(ctx: any) {
    
    if (!ctx.state.user) {
      return ctx.unauthorized('You must be logged in to access this resource');
    }
    
    const { documentId: user_id } = ctx.state.user;
    const { id: conversation_id } = ctx.request.params;
    let { page = 1, pageSize = 10 } = ctx.query;
    
    if (!conversation_id || !user_id) {
      throw new ApplicationError('Conversation ID and user ID are required');
    }

    const parsedPage = Number(page);
    const parsedPageSize = Number(pageSize);

    if (isNaN(parsedPage) || isNaN(parsedPageSize) || parsedPage < 1 || parsedPageSize < 1) {
      return ctx.badRequest('Invalid pagination parameters');
    }

    try {
      const conversation = await strapi.documents('api::conversation.conversation').findOne({
        documentId: conversation_id,
        filters: {
          users_permissions_user: {
            documentId: user_id,
          },
          is_active: true,
        },
        populate: {
          ai_model: {
            fields: "id, model_name, title",
          },
        },
        fields: 'id'
      });

      if(!conversation) {
        return ctx.notFound('Conversation not found or you do not have permission to access it');
      }

      const start = (parsedPage - 1) * parsedPageSize;
      const limit = parsedPageSize;

      const messages = await strapi.documents('api::chat-message.chat-message').findMany({
        filters: {
          conversation: {
            documentId: conversation_id,
          },
        },
        sort: 'updatedAt:desc',
        fields: 'id,documentId,message,sender,updatedAt',
        limit: limit,
        start: start,
      });

      ctx.send({ 
        data: {
          conversation: {
            ...conversation,
            chat_messages: messages,
          }
        },
        success: true,
      });

    } catch (err) {
      console.error(err);
      throw new ApplicationError('Error fetching conversation list: ' + err.message);
    }
  },

  async deleteConversation(ctx: any) {
    if (!ctx.state.user) {
      return ctx.unauthorized('You must be logged in to perform this action');
    }
  
    const { documentId: user_id } = ctx.state.user;
    const { id: conversation_id } = ctx.request.params;
  
    if (!conversation_id) {
      return ctx.badRequest('Conversation ID is required');
    }
  
    try {
      const conversation = await strapi.documents('api::conversation.conversation').findOne({
        documentId: conversation_id,
        filters: {
          users_permissions_user: {
            documentId: user_id,
          },
          is_active: true,
        }
      });

      if(!conversation) {
        return ctx.notFound('Conversation not found or you do not have permission to delete it');
      }

      const deleteOne = await strapi.documents('api::conversation.conversation').update({
        documentId: conversation_id,
        filters: {
          users_permissions_user: {
            documentId: user_id,
          },
        },
        data: {
          is_active: false
        },
        status: 'published',
      });
  
      if (!deleteOne) {
        return ctx.notFound('Conversation not found or you do not have permission to delete it');
      }
  
      ctx.send({
        data: 'Conversation deleted successfully',
        success: true,
      });
    } catch (err) {
      console.error(err);
      throw new ApplicationError('Error deleting conversation: ' + err.message);
    }
  }
}));