export default ({ env }) => ({
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host: env('SMTP_HOST', 'smtp.gmail.com'),
        port: env('SMTP_PORT', 587),
        secure: false, // true for 465, false for other ports
        auth: {
          user: env('SMTP_USERNAME'),              
          pass: env('SMTP_PASSWORD'),
        },
        tls: {
          rejectUnauthorized: false
        },
        // Thêm các tham số DKIM nếu có
      },
      settings: {
        defaultFrom: env('SMTP_USERNAME', 'witworkapp@gmail.com'),
        defaultReplyTo: env('SMTP_USERNAME', 'witworkapp@gmail.com'),
      }
    },
  },
});