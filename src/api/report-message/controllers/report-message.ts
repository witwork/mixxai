/**
 * report-message controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::report-message.report-message',  ({ strapi }) => ({
    async create(ctx: any) {
        const { message_id, reason } = ctx.request.body;
        const user_id = ctx.state.user.id;
        if (!message_id || !reason) {
            return ctx.badRequest('Message id and reason are required');
        }
        
        try {
            const report = await strapi.services['api::report-message.report-message'].create({
                data: {
                    chat_messages: [message_id],
                    reason,
                    publishedAt: new Date()
                }
              });
            
            return { data: report };
        } catch (error) {
            return ctx.badRequest('Failed to create report', { error: error.message });
        }
    },
    
    async findMyReports(ctx: any) {
        const user_id = ctx.state.user.id;
        
        try {
            // Fetch chat messages that belong to the current user
            // const userMessages = await strapi.entityService.findMany('api::chat-message.chat-message', {
            //     filters: { user: user_id },
            //     populate: ['report_message'],
            // });
            
            // // Extract the report messages
            // const reportIds = userMessages
            //     .filter(msg => msg.report_message)
            //     .map(msg => msg.report_message.id);
                
            // // Get the unique report IDs
            // const uniqueReportIds = [...new Set(reportIds)];
            
            // // Fetch the full report details
            // const reports = await strapi.entityService.findMany('api::report-message.report-message', {
            //     filters: { id: { $in: uniqueReportIds } },
            //     populate: ['chat_messages'],
            // });
            
            // return { data: reports };
        } catch (error) {
            return ctx.badRequest('Failed to fetch reports', { error: error.message });
        }
    }
}));
