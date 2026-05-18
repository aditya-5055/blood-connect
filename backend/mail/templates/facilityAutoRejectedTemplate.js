const facilityAutoRejectedTemplate = (facilityName, facilityType) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>Registration Auto Rejected</title>
    <style>
      body {
        background-color: #ffffff;
        font-family: Arial, sans-serif;
        font-size: 16px;
        line-height: 1.4;
        color: #333333;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        text-align: center;
      }
      .header {
        background-color: #e53e3e;
        padding: 20px;
        border-radius: 8px 8px 0 0;
      }
      .header h1 {
        color: #ffffff;
        margin: 0;
        font-size: 24px;
      }
      .body {
        padding: 30px 20px;
        text-align: left;
      }
      .body h2 {
        color: #e53e3e;
        font-size: 20px;
      }
      .body p {
        color: #666666;
        font-size: 15px;
      }
      .reason-box {
        background-color: #fff5f5;
        border: 1px solid #e53e3e;
        border-radius: 8px;
        padding: 20px;
        margin: 20px 0;
      }
      .footer {
        background-color: #f9f9f9;
        padding: 20px;
        text-align: center;
        border-top: 1px solid #eeeeee;
        border-radius: 0 0 8px 8px;
      }
      .footer p {
        color: #999999;
        font-size: 12px;
        margin: 0;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🩸 Blood Donation System</h1>
      </div>

      <div class="body">
        <h2>Registration Rejected</h2>
        <p>Dear <strong>${facilityName}</strong>,</p>
        <p>Your ${facilityType} registration has been rejected because you did not visit our office within 7 days.</p>

        <div class="reason-box">
          <p>You can register again and complete verification.</p>
        </div>
      </div>

      <div class="footer">
        <p>© 2026 Blood Donation System. All rights reserved.</p>
        <p>This is an automated email, please do not reply.</p>
      </div>
    </div>
  </body>
  </html>`;
};

module.exports = facilityAutoRejectedTemplate;