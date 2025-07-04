const axios = require('axios');
require('dotenv').config();


const RESEND_API_KEY = process.env.RESEND_API_KEY;

async function sendResetEmail(to, resetLink) {
  try {
    await axios.post(
      'https://api.resend.com/emails',
      {
        from: 'Your App <onboarding@resend.dev>',  // ← sandbox sender
        to,
        subject: 'Password Reset Request',
        html: `
          <p>Hello,</p>
          <p>You requested a password reset. Click below to reset your password:</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p>If you didn’t request this, ignore it.</p>
        `
      },
      {
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        }
      }
    );
    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error('Email failed:', err.response?.data || err.message);
    throw new Error('Email send failed.');
  }
}

module.exports = { sendResetEmail };
