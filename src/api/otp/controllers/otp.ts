/**
 * otp controller
 */

import { factories } from "@strapi/strapi";
import { randomInt } from "crypto";
import { addMinutes } from "date-fns";
import utils from "@strapi/utils";
import { v4 as uuidv4 } from 'uuid';

const { ValidationError, ApplicationError } = utils.errors;
const OTP_REQUEST_LIMIT = 5;
const OTP_REQUEST_WINDOW = 10;
const OTP_COOLDOWN_PERIOD = 1;

const generateRandomPassword = () => {
  const uuid = uuidv4();
  const timestamp = Date.now();
  return `${uuid}-${timestamp}`;
};

const sanitizeUser = (user, ctx) => {
  const { auth } = ctx.state;
  const userSchema = strapi.getModel("plugin::users-permissions.user");

  return strapi.contentAPI.sanitize.output(user, userSchema, { auth });
};

export default factories.createCoreController("api::otp.otp", ({ strapi }) => ({
  async sendOtp(ctx) {
    const { email } = ctx.request.body;
    if (!email || !email.includes('@')) {
      return ctx.badRequest('Invalid email address');
    }

    try {
      let user = await strapi.query('plugin::users-permissions.user').findOne({ where: { email } });

      // Check if the user is blocked
      if (user && user.blocked) {
        return ctx.badRequest('Your account has been blocked. Please contact support for assistance.');
      }

      const otpRequests = await strapi.query('api::otp.otp').findMany({
        where: { user: user ? user.id : null, createdAt: { $gte: addMinutes(new Date(), -OTP_REQUEST_WINDOW) } },
      });

      if (otpRequests.length >= OTP_REQUEST_LIMIT) {
        throw new ValidationError(`You can only request OTP ${OTP_REQUEST_LIMIT} times in the last ${OTP_REQUEST_WINDOW} minutes.`);
      }

      const lastOtpRequest = otpRequests[otpRequests.length - 1];
      if (lastOtpRequest && new Date().getTime() - new Date(lastOtpRequest.createdAt).getTime() < OTP_COOLDOWN_PERIOD * 60 * 1000) {
        throw new ValidationError(`You must wait ${OTP_COOLDOWN_PERIOD} minute(s) before requesting another OTP.`);
      }

      const now = new Date();
      const expiresAt = addMinutes(now, 30);
      const code = randomInt(1000_000).toString().padStart(6, '0');

      const otpEntry = await strapi.query('api::otp.otp').create({
        data: {
          code,
          expiresAt,
          user: user ? user.id : null,
        },
      });

      await strapi.plugin('email').service('email').send({
        to: email,
        from: 'witworkapp@gmail.com',
        subject: 'Your OTP Code',
        text: `Your OTP code is: ${otpEntry.code}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your OTP Code</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333333;
      margin: 0;
      padding: 0;
      background-color: #f9f9f9;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 1px solid #eeeeee;
    }
    .logo {
      max-height: 60px;
    }
    .content {
      padding: 30px 20px;
      text-align: center;
    }
    .code {
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 4px;
      color: #3498db;
      padding: 15px 0;
      margin: 20px 0;
      border: 1px dashed #dddddd;
      border-radius: 6px;
      background-color: #f7f9fc;
    }
    .message {
      margin-bottom: 20px;
      font-size: 16px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eeeeee;
      color: #999999;
      font-size: 12px;
    }
    .highlight {
      color: #3498db;
      font-weight: 600;
    }
    .note {
      font-size: 14px;
      color: #777777;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>WitWork AI</h2>
    </div>
    <div class="content">
      <h2>Verification Code</h2>
      <p class="message">Hello,<br>Please use the following verification code to complete your login:</p>
      <div class="code">${otpEntry.code}</div>
      <p class="note">This code will expire in 2 minutes.</p>
      <p>If you didn't request this code, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Witai. All rights reserved.</p>
      <p>This is an automated message, please do not reply.</p>
    </div>
  </div>
</body>
</html>
        `,
      });

      ctx.send({
        data: {
          otpId: otpEntry.documentId,
          message: 'OTP sent successfully',
        },
        code: 200,
        message: 'success',
      });
    } catch (err) {
      throw new ApplicationError(
        'Error sending OTP: ' + err.message
      );
    }
  },

  async verifyOtp(ctx) {
    const { email, code, otp_id } = ctx.request.body;

    if (!email || !code || !otp_id) {
      return ctx.badRequest('Email and OTP code are required');
    }

    try {
      const otpEntry = await strapi.documents('api::otp.otp').findOne({
        documentId: otp_id,
        filters: {
          code,
          expiresAt: { $gt: new Date() }
        }
      });
      
      console.log('otpEntry', otpEntry);

      if (!otpEntry) {
        throw new ValidationError('Invalid or expired OTP');
      }

      if (otpEntry.verified) {
        throw new ValidationError('This OTP has already been used');
      }

      let user = await strapi.query('plugin::users-permissions.user').findOne({ where: { email } });

      if (!user) {
        const defaultRole = await strapi.query('plugin::users-permissions.role').findOne({
          where: { type: 'authenticated' },
        });
        if (!defaultRole) {
          throw new ApplicationError('Default role not found');
        }
        const password = generateRandomPassword();
        user = await strapi.query('plugin::users-permissions.user').create({
          data: {
            username: email,
            email,
            password: password,
            confirmed: true,
            role: defaultRole.id,
          },
        });
      }

      if(user) {
        await strapi.query('api::otp.otp').update({
          where: { code },
          data: { 
            verified: true,
            user: user.id,
          },
        });
      }

      const userDto: any = await sanitizeUser(user, ctx);

      ctx.send({
        data: {
          jwt: strapi.plugins['users-permissions'].services.jwt.issue({
            id: userDto.id,
          }),
          user: await sanitizeUser(userDto, ctx),
        },
        code: 200,
        message: 'success',
      });
    } catch (err) {
      ctx.badRequest(err.message);
    }
  }
}));
