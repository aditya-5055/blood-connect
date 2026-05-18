const nodemailer = require("nodemailer");
require("dotenv").config();

const mailSender = async (email, title, body) => {
  try {
    let transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      secure: false,
    });

    let info = await transporter.sendMail({
      from: `"Blood Donation System" <${process.env.MAIL_USER}>`,
      to: `${email}`,
      subject: `${title}`,
      html: `${body}`,
    });

    return info;
  } catch (error) {
    console.error("Mail Sender Error:", error.message);
    throw error; // This ensures the controller knows it failed
  }
};

module.exports = mailSender;


// const nodemailer = require("nodemailer");
// require("dotenv").config();

// const mailSender = async (email, title, body) => {
//   try {
//     const transporter = nodemailer.createTransport({
//       host: process.env.MAIL_HOST,   // ✅ keep host
//       port: 587,                     // ✅ important for gmail
//       secure: false,                 // ✅ false for port 587
//       auth: {
//         user: process.env.MAIL_USER,
//         pass: process.env.MAIL_PASS,
//       },
//     });

//     const info = await transporter.sendMail({
//       from: `"Blood Donation System" <${process.env.MAIL_USER}>`,
//       to: email,
//       subject: title,
//       html: body,
//     });

//     return info;
//   } catch (error) {
//     console.log("Mail Error:", error.message); // ✅ show real error
//     throw error; // ✅ important
//   }
// };

// module.exports = mailSender;