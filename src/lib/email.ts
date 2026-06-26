import nodemailer from 'nodemailer';

const smtpConfig = {
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

const transporter = nodemailer.createTransport(smtpConfig);

export async function sendOtpEmail(toEmail: string, otpCode: string) {
  // If no SMTP credentials are provided, simply log the OTP and skip sending (Dev Fallback)
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ SMTP credentials are not configured. The email will not be sent.');
    console.warn(`[DEV SIMULATION] Email to ${toEmail}: Your OTP is ${otpCode}`);
    return { success: true, message: 'Simulated email sent' };
  }

  const mailOptions = {
    from: `"Amruth Dairy" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Your Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #4a90e2;">Amruth Dairy</h2>
        <p style="font-size: 16px; color: #333;">Please use the following 6-digit verification code to complete your registration/login.</p>
        <h1 style="font-size: 40px; color: #333; letter-spacing: 5px; background: #f4f4f4; padding: 15px; border-radius: 8px;">
          ${otpCode}
        </h1>
        <p style="font-size: 14px; color: #777; margin-top: 20px;">This code will expire in 10 minutes.</p>
        <p style="font-size: 12px; color: #aaa; margin-top: 30px;">If you didn't request this code, you can safely ignore this email.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[Email] Message sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email] Failed to send email:', error);
    throw new Error('Failed to send verification email.');
  }
}
