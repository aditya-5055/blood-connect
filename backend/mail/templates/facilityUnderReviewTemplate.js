const facilityUnderReviewTemplate = (facilityName, facilityType) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>Registration Under Review</title>
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
        background-color: #2b6cb0;
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
        color: #2b6cb0;
        font-size: 20px;
      }
      .body p {
        color: #666666;
        font-size: 15px;
      }
      .notice-box {
        background-color: #ebf8ff;
        border: 1px solid #2b6cb0;
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
        <h2>Registration Under Review</h2>
        <p>Dear <strong>${facilityName}</strong>,</p>
        <p>Your ${facilityType} registration is under review.</p>

        <div class="notice-box">
          <p>Please visit our nearest office within <strong>7 days</strong> with your original documents for physical verification.</p>
          <p>If you do not visit within 7 days, your registration will be automatically rejected.</p>
        </div>

        <p>We will notify you once the review is completed.</p>
      </div>

      <div class="footer">
        <p>© 2026 Blood Donation System. All rights reserved.</p>
        <p>This is an automated email, please do not reply.</p>
      </div>
    </div>
  </body>
  </html>`;
};

module.exports = facilityUnderReviewTemplate;