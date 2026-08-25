import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // 16-character Gmail App Password
  },
});

export async function sendResetEmail(toEmail, token) {
  const resetUrl = `http://localhost:5173/#/reset-password?token=${token}`;

  const mailOptions = {
    from: `"Bidora Arena" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Bidora - Reset Your Security Credentials',
    html: `
      <div style="font-family: 'Outfit', 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background-color: #0b0f19; border: 1px solid #1e293b; border-radius: 16px; color: #ffffff;">
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="font-size: 2.2rem; font-weight: 700; letter-spacing: 0.15em; margin: 0; color: #818cf8; text-shadow: 0 0 10px rgba(129, 140, 248, 0.25);">BIDORA</h1>
          <p style="font-size: 0.85rem; color: #94a3b8; letter-spacing: 0.05em; margin: 5px 0 0 0;">Every Bid. One Winner.</p>
        </div>
        
        <h2 style="font-size: 1.25rem; font-weight: 600; color: #f1f5f9; border-bottom: 1px solid #1e293b; padding-bottom: 10px; margin-top: 0;">Password Reset Request</h2>
        
        <p style="font-size: 0.95rem; color: #cbd5e1; line-height: 1.6;">You requested a link to reset your security credentials. Click the button below to update your password. This link is valid for <strong>1 hour</strong>.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 30px; font-weight: 600; font-size: 0.95rem; color: #ffffff; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); text-decoration: none; border-radius: 10px; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.35);">
            Reset Password
          </a>
        </div>
        
        <p style="font-size: 0.85rem; color: #64748b; line-height: 1.5; margin-bottom: 0;">If you did not request this change, you can safely ignore this email. Your current credentials remain fully secure.</p>
        
        <div style="margin-top: 30px; border-top: 1px solid #1e293b; padding-top: 15px; font-size: 0.75rem; color: #475569; text-align: center;">
          &copy; ${new Date().getFullYear()} Bidora Online Auction System.
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email dispatched successfully. Message ID:', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('Failed to send reset email via Nodemailer:', error.message);
    throw new Error('Email delivery service failed: ' + error.message);
  }
}
