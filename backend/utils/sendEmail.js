// We are using the Brevo HTTP API to bypass Render's strict SMTP (Port 587) block.
// This uses standard web traffic (Port 443) which is always allowed.

const sendEmail = async (options) => {
  // Fallback if environment variables aren't set yet
  if (!process.env.BREVO_API_KEY || !process.env.EMAIL_USER) {
    console.warn('⚠️ Missing BREVO_API_KEY or EMAIL_USER. Email was NOT sent. Message was:');
    console.warn(options.message);
    return;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: "Market Databank",
          email: process.env.EMAIL_USER // This must be the email verified in Brevo
        },
        to: [
          { email: options.email }
        ],
        subject: options.subject,
        htmlContent: options.htmlMessage || `<p>${options.message}</p>`,
        textContent: options.message
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Brevo API Error:', errorData);
      throw new Error('Failed to send email via Brevo API');
    }

    console.log(`✅ Email successfully sent to ${options.email} via Brevo API`);
  } catch (err) {
    console.error('Email sending failed:', err);
    throw err;
  }
};

module.exports = sendEmail;
