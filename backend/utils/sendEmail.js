const nodemailer = require('nodemailer');

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
      service: 'Gmail', // or another service depending on your needs
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
