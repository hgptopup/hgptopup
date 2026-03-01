import express from "express";
import cors from "cors";
import axios from "axios";
import nodemailer from "nodemailer";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Notification Credentials
  const SMTP_HOSTNAME = process.env.SMTP_HOSTNAME || 'smtp.gmail.com';
  const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
  const SMTP_USERNAME = process.env.SMTP_USERNAME || 'hasibulgamepoint02@gmail.com';
  const SMTP_PASSWORD = process.env.SMTP_PASSWORD || 'lwri taoi ugqg dzrk';
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8510422259:AAEY1ueGulFXmT-HDkxxLG60TbJWGdu7hPg';
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5067614518';

  // Email Notification Route
  app.post("/api/notifications/email", async (req, res) => {
    try {
      const { order, userEmail, userName, pdfBase64, fileName, isAdminAlert } = req.body;

      const transporter = nodemailer.createTransport({
        host: SMTP_HOSTNAME,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: {
          user: SMTP_USERNAME,
          pass: SMTP_PASSWORD,
        },
      });

      const isCompleted = order.status === 'COMPLETED';
      let subject = isCompleted 
        ? `Deployment Successful - HGP #${order.id}`
        : `Order Confirmation - HGP #${order.id}`;

      if (isAdminAlert) {
        subject = `🚨 NEW ORDER RECEIVED - HGP #${order.id}`;
      }

      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #dc2626;">Hasibul Game Point</h2>
          <p>Hello <strong>${userName}</strong>,</p>
          ${isAdminAlert 
            ? `<p style="color: #dc2626; font-weight: bold; font-size: 18px;">New Order Alert!</p>
               <p>A new order has been placed on the store. Please check the admin dashboard to process it.</p>`
            : isCompleted 
              ? `<p style="color: #16a34a; font-weight: bold; font-size: 18px;">Your order has been successfully processed and deployed!</p>
                 <p>The items have been added to your account. Thank you for choosing HGP.</p>`
              : `<p>Thank you for your order! We have received your request and it is being processed.</p>
                 <p>Deployment usually takes 5-30 minutes.</p>`
          }
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <h3>Order Summary:</h3>
          <p><strong>Order ID:</strong> ${order.id}</p>
          <p><strong>Status:</strong> ${order.status}</p>
          <p><strong>Total Amount:</strong> ৳${order.totalAmount}</p>
          ${order.paymentMethod ? `<p><strong>Payment Method:</strong> ${order.paymentMethod}</p>` : ''}
          ${order.transactionId ? `<p><strong>Transaction ID:</strong> ${order.transactionId}</p>` : ''}
          <ul style="list-style: none; padding: 0;">
            ${order.items.map((item: any) => `
              <li style="padding: 10px; background: #f9f9f9; margin-bottom: 5px; border-radius: 5px;">
                <strong>${item.gameTitle}</strong> - ${item.packageName}<br/>
                <span style="font-size: 12px; color: #666;">Target ID: ${item.playerId}</span>
              </li>
            `).join('')}
          </ul>
          <p>Your receipt is attached to this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666; text-align: center;">This is an automated message from the HGP Crimson Protocol. Please do not reply directly.</p>
        </div>
      `;

      await transporter.sendMail({
        from: SMTP_USERNAME,
        to: userEmail,
        subject: subject,
        html: htmlContent,
        attachments: pdfBase64 ? [
          {
            filename: fileName || 'receipt.pdf',
            content: Buffer.from(pdfBase64, 'base64'),
          }
        ] : []
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Email Error:", error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Telegram Notification Route
  app.post("/api/notifications/telegram", async (req, res) => {
    try {
      const { order } = req.body;

      const escapeHTML = (str: string) => {
        if (!str) return '';
        return str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      };

      const isCompleted = order.status === 'COMPLETED';
      let message = isCompleted 
        ? `<b>✅ ORDER COMPLETED</b>\n`
        : `<b>🚨 NEW ORDER RECEIVED</b>\n`;
      
      message += `<code>REF: ${escapeHTML(order.id)}</code>\n`;
      message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

      if (!isCompleted) {
        message += `<b>💵 TOTAL:</b> ৳${order.totalAmount}\n`;
        message += `<b>💳 METHOD:</b> ${escapeHTML(order.paymentMethod)}\n`;
        message += `<b>🔑 TRX ID:</b> <code>${escapeHTML(order.transactionId)}</code>\n\n`;
        
        order.items.forEach((item: any) => {
          message += `<b>📦 PRODUCT:</b> ${escapeHTML(item.gameTitle)}\n`;
          message += `<b>💎 PACKAGE:</b> ${escapeHTML(item.packageName)}\n`;
          message += `<b>🛡️ LOGIN:</b> ${escapeHTML(item.loginMethod)}\n`;
          message += `<b>👤 TARGET ID:</b> <code>${escapeHTML(item.playerId)}</code>\n`;
          
          if (item.password) message += `<b>🔑 PASSWORD:</b> <code>${escapeHTML(item.password)}</code>\n`;
          if (item.whatsapp) message += `<b>📱 WHATSAPP:</b> <code>${escapeHTML(item.whatsapp)}</code>\n`;
          if (item.vaultGmail) message += `<b>📧 VAULT MAIL:</b> ${escapeHTML(item.vaultGmail)}\n`;
          if (item.vaultNumber) message += `<b>🔐 VAULT CODE:</b> <code>${escapeHTML(item.vaultNumber)}</code>\n`;
          
          message += `\n`;
        });
      } else {
        message += `<b>STATUS:</b> Successfully Deployed\n`;
        message += `<b>CUSTOMER:</b> ${escapeHTML(order.userId)}\n`;
        message += `<b>ITEMS:</b> ${order.items.length} Packages\n`;
        message += `<b>💵 TOTAL:</b> ৳${order.totalAmount}\n\n`;
      }

      message += `━━━━━━━━━━━━━━━━━━━━\n`;
      message += `<b>🕒 TIME:</b> ${new Date().toLocaleString('en-BD')}\n\n`;
      
      if (!isCompleted) {
        message += `<i>Check Admin Dashboard to process.</i>`;
      } else {
        message += `<i>Order has been finalized and user notified.</i>`;
      }

      const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      
      const response = await axios.post(telegramUrl, {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      });

      if (!response.data.ok) {
        throw new Error(`Telegram API Error: ${response.data.description}`);
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Telegram Error:", error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
