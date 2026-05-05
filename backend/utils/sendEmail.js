const nodemailer = require('nodemailer');
const dns = require('dns');

// Force Node.js to use IPv4. Render's free tier often fails to route IPv6 traffic,
// causing ENETUNREACH errors when connecting to smtp.gmail.com.
dns.setDefaultResultOrder('ipv4first');
const sendEmail = async (options) => {
  let transporter;

  // If no credentials are provided in .env, use Ethereal for testing
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('No email credentials found in .env, generating Ethereal test account...');
    let testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } else {
    // For real production (e.g. Gmail)
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // use STARTTLS
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  const mailOptions = {
    from: `"Market Databank" <${process.env.EMAIL_USER || 'test@ethereal.email'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.htmlMessage || `<p>${options.message}</p>`,
  };

  const info = await transporter.sendMail(mailOptions);
  
  // If we are using ethereal, log the URL to view the message
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  }
};

module.exports = sendEmail;
