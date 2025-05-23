export default {
    routes: [
      {
        method: "GET",
        path: "/chat/conversation",
        handler: "api::conversation.conversation.getConversationList"
      },
      {
        method: "GET",
        path: "/chat/conversation/:id",
        handler: "api::conversation.conversation.getConversationDetails"
      },
      {
        method: "DELETE",
        path: "/chat/conversation/:id",
        handler: "api::conversation.conversation.deleteConversation"
      }
    ],
  };