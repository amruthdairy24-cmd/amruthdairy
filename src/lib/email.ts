import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Returns a list of admin emails to notify for new orders and subscriptions
 */
export function getAdminNotificationEmails(): string[] {
  const emails = new Set<string>();
  if (process.env.ADMIN_EMAIL) emails.add(process.env.ADMIN_EMAIL.trim());
  emails.add('amruthdairy24@gmail.com');
  if (process.env.SMTP_USER) emails.add(process.env.SMTP_USER.trim());
  return Array.from(emails).filter(Boolean);
}

/**
 * Resolves the logo attachment for CID embedding
 */
function getLogoAttachment() {
  const logoPath = path.join(process.cwd(), 'public', 'images', 'logo', 'amruth-logo.png');
  if (fs.existsSync(logoPath)) {
    return [{
      filename: 'amruth-logo.png',
      path: logoPath,
      cid: 'amruthlogo'
    }];
  }
  return [];
}

/**
 * Sends OTP verification email
 */
export async function sendOtpEmail(toEmail: string, otpCode: string) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ SMTP credentials are not configured. The email will not be sent.');
    console.warn(`[DEV SIMULATION] Email to ${toEmail}: Your OTP is ${otpCode}`);
    return { success: true, message: 'Simulated email sent' };
  }

  const mailOptions = {
    from: `"Amruth Dairy" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Your Verification Code - Amruth Dairy',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <h2 style="color: #02429C; margin: 0 0 8px 0; font-size: 24px; font-weight: 800;">Amruth Dairy</h2>
        <p style="font-size: 14px; color: #64748b; margin: 0 0 20px 0;">Please use the following 6-digit verification code to complete your verification.</p>
        <div style="font-size: 36px; font-weight: 900; color: #02429C; letter-spacing: 6px; background: #f0f7ff; padding: 16px; border-radius: 12px; border: 1px dashed #93c5fd; margin: 0 auto 20px auto; max-width: 260px;">
          ${otpCode}
        </div>
        <p style="font-size: 13px; color: #94a3b8; margin: 0;">This code will expire in 10 minutes. If you did not request it, please ignore this email.</p>
      </div>
    `,
  };

  try {
    const info = await getTransporter().sendMail(mailOptions);
    console.log('[Email] OTP sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email] Failed to send OTP email:', error);
    throw new Error('Failed to send verification email.');
  }
}

/**
 * Interface for product order notification parameters
 */
export interface ProductOrderEmailParams {
  orderId: string;
  totalAmount: number;
  customerName: string;
  customerPhone: string;
  customerArea: string;
  deliveryAddress: string;
  landmark?: string;
  deliveryNotes?: string;
  deliveryDate: string;
  paymentId?: string;
  items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>;
}

/**
 * Sends a beautiful product order notification to admins
 */
export async function sendAdminNewProductOrderEmail(params: ProductOrderEmailParams) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[Email] SMTP not configured, skipping order notification');
    return { success: false, message: 'SMTP not configured' };
  }

  const adminEmails = getAdminNotificationEmails();
  if (adminEmails.length === 0) return { success: false, message: 'No admin emails configured' };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://amruthdairyfarms.com';
  const logoAttachments = getLogoAttachment();

  const itemsHtml = params.items.map((item, idx) => `
    <tr style="border-bottom: 1px solid #f1f5f9; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
      <td style="padding: 12px 14px; font-weight: 700; color: #1e293b; font-size: 13px;">${item.product_name}</td>
      <td style="padding: 12px 14px; text-align: center; color: #475569; font-size: 13px; font-weight: 600;">${item.quantity}</td>
      <td style="padding: 12px 14px; text-align: right; color: #64748b; font-size: 13px;">₹${item.unit_price}</td>
      <td style="padding: 12px 14px; text-align: right; font-weight: 800; color: #02429C; font-size: 14px;">₹${item.subtotal}</td>
    </tr>
  `).join('');

  const formattedDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const formattedDeliveryDate = params.deliveryDate
    ? new Date(params.deliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Tomorrow Morning';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Product Order</title>
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #01357A 0%, #02429C 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
          ${logoAttachments.length > 0 ? `
            <img src="cid:amruthlogo" alt="Amruth Dairy" style="height: 58px; width: auto; max-width: 190px; margin: 0 auto 12px auto; display: block;" />
          ` : `
            <h1 style="margin: 0 0 6px 0; font-size: 26px; font-weight: 900; letter-spacing: 0.5px;">AMRUTH DAIRY</h1>
          `}
          <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 9999px; padding: 4px 14px; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">
            ✨ New Product Order Received
          </div>
          <h2 style="margin: 14px 0 0 0; font-size: 22px; font-weight: 800; color: #ffffff;">₹${params.totalAmount} Received</h2>
        </div>

        <!-- Body Content -->
        <div style="padding: 24px;">

          <!-- Order Summary Card -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Order ID:</td>
                <td style="padding: 6px 0; text-align: right; font-family: monospace; font-weight: 800; color: #02429C;">#${params.orderId.slice(0, 8)}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Order Time:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #1e293b;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Scheduled Delivery:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 800; color: #059669;">🚚 ${formattedDeliveryDate}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Payment Status:</td>
                <td style="padding: 6px 0; text-align: right;">
                  <span style="background-color: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 6px;">
                    ✓ Razorpay PAID
                  </span>
                </td>
              </tr>
              ${params.paymentId ? `
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Transaction ID:</td>
                <td style="padding: 6px 0; text-align: right; font-family: monospace; font-size: 11px; color: #64748b;">${params.paymentId}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          <!-- Customer & Delivery Details -->
          <div style="border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin-bottom: 20px;">
            <div style="font-size: 12px; font-weight: 800; color: #02429C; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
              📍 Customer & Delivery Information
            </div>
            <div style="font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">
              ${params.customerName}
            </div>
            <div style="margin-bottom: 10px;">
              <a href="tel:${params.customerPhone}" style="color: #02429C; text-decoration: none; font-weight: 700; font-size: 14px;">
                📞 ${params.customerPhone}
              </a>
            </div>
            <div style="font-size: 13px; color: #334155; line-height: 1.5; background-color: #f8fafc; padding: 12px; border-radius: 8px;">
              <strong>Area:</strong> ${params.customerArea}<br>
              <strong>Address:</strong> ${params.deliveryAddress}
              ${params.landmark ? `<br><strong>Landmark:</strong> ${params.landmark}` : ''}
              ${params.deliveryNotes ? `<br><strong>Notes:</strong> ${params.deliveryNotes}` : ''}
            </div>
          </div>

          <!-- Items Table -->
          <div style="border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; margin-bottom: 24px;">
            <div style="background-color: #f8fafc; padding: 12px 14px; font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0;">
              🛍️ Items Ordered (${params.items.length})
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f1f5f9; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-transform: uppercase;">
                  <th style="padding: 8px 14px; text-align: left;">Item</th>
                  <th style="padding: 8px 14px; text-align: center;">Qty</th>
                  <th style="padding: 8px 14px; text-align: right;">Unit Price</th>
                  <th style="padding: 8px 14px; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr style="background-color: #f8fafc; border-top: 2px solid #e2e8f0;">
                  <td colspan="3" style="padding: 12px 14px; font-weight: 800; color: #1e293b; font-size: 14px; text-align: right;">Total Amount:</td>
                  <td style="padding: 12px 14px; font-weight: 900; color: #02429C; font-size: 16px; text-align: right;">₹${params.totalAmount}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Admin Action Button -->
          <div style="text-align: center; margin: 28px 0 10px 0;">
            <a href="${appUrl}/admin/orders" style="display: inline-block; background-color: #02429C; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 800; font-size: 14px; box-shadow: 0 4px 12px rgba(2, 66, 156, 0.25);">
              View in Admin Orders Portal →
            </a>
          </div>

        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8;">
          <p style="margin: 0 0 4px 0; font-weight: 700; color: #64748b;">Amruth Dairy Farms · Pure Desi A2 Cow Milk</p>
          <p style="margin: 0;">Mangaluru, Karnataka · Automated Admin Dispatch Notification</p>
        </div>

      </div>
    </body>
    </html>
  `;

  try {
    const info = await getTransporter().sendMail({
      from: `"Amruth Dairy Alerts" <${process.env.SMTP_USER}>`,
      to: adminEmails,
      subject: `🛒 New Order: ₹${params.totalAmount} from ${params.customerName} (${params.customerArea})`,
      html: htmlContent,
      attachments: logoAttachments
    });
    console.log('[Email] Admin product order notification sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email] Failed to send admin product order notification:', error);
    return { success: false, error };
  }
}

/**
 * Interface for subscription notification parameters
 */
export interface SubscriptionEmailParams {
  subscriptionId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerArea: string;
  deliveryAddress: string;
  quantity: number;
  monthlyAmount: number;
  startDate: string;
  planType: string;
  paymentStatus: string;
  razorpayPaymentId?: string;
}

/**
 * Sends a beautiful subscription notification to admins
 */
export async function sendAdminNewSubscriptionEmail(params: SubscriptionEmailParams) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[Email] SMTP not configured, skipping subscription notification');
    return { success: false, message: 'SMTP not configured' };
  }

  const adminEmails = getAdminNotificationEmails();
  if (adminEmails.length === 0) return { success: false, message: 'No admin emails configured' };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://amruthdairyfarms.com';
  const logoAttachments = getLogoAttachment();

  const formattedStartDate = params.startDate
    ? new Date(params.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Starting Soon';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Milk Subscription</title>
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #01357A 0%, #02429C 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
          ${logoAttachments.length > 0 ? `
            <img src="cid:amruthlogo" alt="Amruth Dairy" style="height: 58px; width: auto; max-width: 190px; margin: 0 auto 12px auto; display: block;" />
          ` : `
            <h1 style="margin: 0 0 6px 0; font-size: 26px; font-weight: 900; letter-spacing: 0.5px;">AMRUTH DAIRY</h1>
          `}
          <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 9999px; padding: 4px 14px; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">
            🥛 New Milk Subscription Activated
          </div>
          <h2 style="margin: 14px 0 0 0; font-size: 24px; font-weight: 800; color: #ffffff;">${params.quantity}L / Day · ${params.planType === 'trial' ? '7-Day Trial' : 'Monthly Plan'}</h2>
        </div>

        <!-- Body Content -->
        <div style="padding: 24px;">

          <!-- Subscription Summary Card -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Daily Quantity:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 800; color: #02429C; font-size: 14px;">${params.quantity} Litre(s) / Day</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Plan Type:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #1e293b; text-transform: capitalize;">${params.planType} Plan</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Start Date:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 800; color: #059669;">📅 ${formattedStartDate}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Monthly Amount:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 800; color: #02429C; font-size: 14px;">₹${params.monthlyAmount}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Payment Status:</td>
                <td style="padding: 6px 0; text-align: right;">
                  <span style="background-color: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 6px;">
                    ✓ ${params.paymentStatus.toUpperCase()}
                  </span>
                </td>
              </tr>
              ${params.razorpayPaymentId ? `
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Payment ID:</td>
                <td style="padding: 6px 0; text-align: right; font-family: monospace; font-size: 11px; color: #64748b;">${params.razorpayPaymentId}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          <!-- Customer Details -->
          <div style="border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin-bottom: 24px;">
            <div style="font-size: 12px; font-weight: 800; color: #02429C; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
              👤 Subscriber Details
            </div>
            <div style="font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">
              ${params.customerName}
            </div>
            <div style="margin-bottom: 8px;">
              <a href="tel:${params.customerPhone}" style="color: #02429C; text-decoration: none; font-weight: 700; font-size: 14px;">
                📞 ${params.customerPhone}
              </a>
            </div>
            ${params.customerEmail ? `
            <div style="margin-bottom: 10px; font-size: 13px; color: #64748b;">
              ✉️ ${params.customerEmail}
            </div>
            ` : ''}
            <div style="font-size: 13px; color: #334155; line-height: 1.5; background-color: #f8fafc; padding: 12px; border-radius: 8px;">
              <strong>Delivery Area:</strong> ${params.customerArea || 'Mangaluru'}<br>
              <strong>Address:</strong> ${params.deliveryAddress || 'Address on profile'}
            </div>
          </div>

          <!-- Admin Action Button -->
          <div style="text-align: center; margin: 28px 0 10px 0;">
            <a href="${appUrl}/admin/subscriptions" style="display: inline-block; background-color: #02429C; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 800; font-size: 14px; box-shadow: 0 4px 12px rgba(2, 66, 156, 0.25);">
              Manage in Admin Subscriptions Portal →
            </a>
          </div>

        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8;">
          <p style="margin: 0 0 4px 0; font-weight: 700; color: #64748b;">Amruth Dairy Farms · Pure Desi A2 Cow Milk</p>
          <p style="margin: 0;">Mangaluru, Karnataka · Automated Admin Subscription Notification</p>
        </div>

      </div>
    </body>
    </html>
  `;

  try {
    const info = await getTransporter().sendMail({
      from: `"Amruth Dairy Alerts" <${process.env.SMTP_USER}>`,
      to: adminEmails,
      subject: `🥛 New Subscription: ${params.quantity}L/Day from ${params.customerName} (${params.customerArea || 'Mangaluru'})`,
      html: htmlContent,
      attachments: logoAttachments
    });
    console.log('[Email] Admin subscription notification sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email] Failed to send admin subscription notification:', error);
    return { success: false, error };
  }
}
