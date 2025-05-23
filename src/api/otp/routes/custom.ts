export default {
  routes: [
    {
      method: "POST",
      path: "/auth/send-code",
      handler: "api::otp.otp.sendOtp",
      config: {
        auth: false,
        middlewares: ["plugin::users-permissions.rateLimit"],
      },
    },
    {
      method: "POST",
      path: "/auth/verify-otp",
      handler: "api::otp.otp.verifyOtp",
      config: {
        auth: false,
        middlewares: ["plugin::users-permissions.rateLimit"],
      },
    },
  ],
};
