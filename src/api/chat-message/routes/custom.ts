import { config } from "process";

export default {
    routes: [
      {
        method: "POST",
        path: "/chat/send-message",
        handler: "api::chat-message.chat-message.sendMessage",
        auth: true
      }
    ],
  };