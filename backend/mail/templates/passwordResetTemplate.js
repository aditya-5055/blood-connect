const passwordResetTemplate = (resetUrl) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Reset Your Password - Blood Donation System</title>
    <style>
      body { background-color: #ffffff; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.4; color: #333333; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; }
      .header { background-color: #e53e3e; padding: 20px; border-radius: 8px 8px 0 0; }
      .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
      .header p { color: #ffffff; margin: 5px 0 0 0; font-size: 13px; opacity: 0.9; }
      .body { padding: 30px 20px; text-align: left; }
      .body h2 { color: #e53e3e; font-size: 20px; }
      .body p { color: #666666; font-size: 15px; }
      .btn-box { text-align: center; margin: 30px 0; }
      .btn { background-color: #e53e3e; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block; }
      .url-box { background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 20px 0; word-break: break-all; }
      .url-box p { color: #666666; font-size: 13px; margin: 0 0 8px 0; }
      .url-box a { color: #e53e3e; font-size: 13px; }
      .warning { font-size: 13px; color: #999999; margin-top: 20px; }
      .footer { background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eeeeee; border-radius: 0 0 8px 8px; }
      .footer p { color: #999999; font-size: 12px; margin: 0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🩸 Blood Donation System</h1>
        <p>Password Reset Request</p>
      </div>

      <div class="body">
        <h2>Reset Your Password 🔐</h2>
        <p>Dear User,</p>
        <p>We received a request to reset your password for your <strong>Blood Donation System</strong> account.</p>
        <p>Click the button below to reset your password. This link is valid for <strong>1 hour</strong>.</p>

        <div class="btn-box">
          <a href="${resetUrl}" class="btn">Reset My Password</a>
        </div>

        <div class="url-box">
          <p>If the button does not work, copy and paste this link in your browser:</p>
          <a href="${resetUrl}">${resetUrl}</a>
        </div>

        <p class="warning">⚠️ If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
      </div>

      <div class="footer">
        <p>© 2026 Blood Donation System. All rights reserved.</p>
        <p>This is an automated email, please do not reply.</p>
      </div>
    </div>
  </body>
  </html>`;
};

module.exports = passwordResetTemplate;