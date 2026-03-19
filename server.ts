import express from "express";
import cors from "cors";
import axios from "axios";
import nodemailer from "nodemailer";
import { createClient } from '@supabase/supabase-js';
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

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

// ZiniPay API Key
const ZINIPAY_API_KEY = process.env.ZINIPAY_API_KEY || '8cd7a947713ac7f4ffc28131022d9102de9aacb54d3c0121';

// Telegram Notification Helper
const sendTelegramNotification = async (order: any, isPaymentVerified: boolean = false) => {
  try {
    const escapeHTML = (str: string) => {
      if (!str) return '';
      return str
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    const status = order.status || order.order_status;
    const isCompleted = status === 'COMPLETED';
    const isCancelled = status === 'CANCELLED';
    
    let message = '';
    if (isCancelled) {
      message = `<b>❌ ORDER CANCELLED</b>\n`;
    } else if (isCompleted) {
      message = `<b>✅ ORDER COMPLETED</b>\n`;
    } else if (isPaymentVerified) {
      message = `<b>✅ PAYMENT VERIFIED</b>\n`;
    } else {
      message = `<b>🚨 NEW ORDER RECEIVED</b>\n`;
    }
    
    message += `REF: ${escapeHTML(order.id)}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    const totalAmount = order.totalAmount || order.total_amount || 0;
    const paymentMethod = order.paymentMethod || order.payment_method || 'N/A';
    const transactionId = order.transactionId || order.transaction_id || 'N/A';
    const customerName = order.customerName || order.customer_name || order.userId || order.user_id || 'Guest';

    message += `<b>👤 CUSTOMER:</b> ${escapeHTML(customerName)}\n`;
    message += `<b>💵 TOTAL:</b> ৳${totalAmount}\n`;
    message += `<b>💳 METHOD:</b> ${escapeHTML(paymentMethod)}\n`;
    message += `<b>🔑 TRX ID:</b> ${escapeHTML(transactionId)}\n\n`;
    
    const items = order.items || [];
    if (Array.isArray(items) && items.length > 0) {
      message += `<b>📦 PRODUCTS:</b>\n`;
      items.forEach((item: any) => {
        const gameTitle = item.gameTitle || item.game_title || item.title || 'Unknown Game';
        const packageName = item.packageName || item.package_name || item.package || 'Unknown Package';
        const playerId = item.playerId || item.player_id || item.uid || 'N/A';
        const loginMethod = item.loginMethod || item.login_method || 'N/A';
        
        message += `• ${escapeHTML(gameTitle)} - ${escapeHTML(packageName)}\n`;
        message += `  ID: ${escapeHTML(playerId)} | ${escapeHTML(loginMethod)}\n`;
        if (item.password) message += `  PW: ${escapeHTML(item.password)}\n`;
        message += `\n`;
      });
    } else if (typeof items === 'string') {
      // Handle case where items might be a string (though it shouldn't be)
      message += `<b>📦 PRODUCTS:</b>\n${escapeHTML(items)}\n\n`;
    }

    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `<b>🕒 TIME:</b> ${new Date().toLocaleString('en-US')}\n\n`;
    
    if (isCompleted) {
      message += `<i>Order has been successfully processed.</i>`;
    } else if (isPaymentVerified) {
      message += `<i>Payment verified. Please process the top-up.</i>`;
    } else if (isCancelled) {
      message += `<i>Order was cancelled by user or system.</i>`;
    } else {
      message += `<i>Awaiting payment or manual processing.</i>`;
    }

    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    await axios.post(telegramUrl, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    });

    return { success: true };
  } catch (error: any) {
    console.error("Telegram Notification Helper Error:", error.message);
    return { success: false, error: error.message };
  }
};

const sendZiniPayVerificationNotification = async (orderId: string, amount: number, transactionId: string) => {
  try {
    const escapeHTML = (str: string) => {
      if (!str) return '';
      return str
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    let message = `✅ <b>ZiniPay Verification Complete!</b>\n\n`;
    message += `Order ID: ${escapeHTML(orderId)}\n`;
    message += `Amount: ৳${amount}\n`;
    message += `Transaction ID:\n${escapeHTML(transactionId)}`;

    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    await axios.post(telegramUrl, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    });
  } catch (error: any) {
    console.error("ZiniPay Telegram Notification Error:", error.message);
  }
};

// Supabase Client (Server-side)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xcxdkplxrxsuuwebpnyx.supabase.co';
// Use Service Role Key if available to bypass RLS for webhooks, otherwise fallback to Anon Key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjeGRrcGx4cnhzdXV3ZWJwbnl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0ODIwNzksImV4cCI6MjA4NzA1ODA3OX0.me1hIWuzeisbb9uBgBUSvHtQkYFMetDcrZ71XJJ68nM';
const supabase = createClient(supabaseUrl, supabaseKey);

// Proxy Routes for Public Data (to avoid client-side fetch errors)
app.get("/api/public/games", async (req, res) => {
  try {
    const { data, error } = await supabase.from('games').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/public/hero-banners", async (req, res) => {
  try {
    const { data, error } = await supabase.from('hero_banners').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/public/floating-icons", async (req, res) => {
  try {
    const { data, error } = await supabase.from('hero_floating_icons').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/public/site-settings", async (req, res) => {
  try {
    const { data, error } = await supabase.from('site_settings').select('logo_url').eq('id', 'main').maybeSingle();
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ZiniPay Create Payment Route
app.post("/api/payment/create", async (req, res) => {
  try {
    console.log("HGP DEBUG: /api/payment/create called with body:", JSON.stringify(req.body));
    const { amount, redirect_url, cancel_url, webhook_url, cus_email, cus_name, metadata } = req.body;

    if (!amount) {
      console.error("HGP ERROR: Missing amount in payment request");
      return res.status(400).json({ success: false, error: "Missing amount" });
    }

    const payload = {
      amount: amount.toString(),
      redirect_url,
      cancel_url,
      webhook_url,
      cus_email: cus_email || "guest@example.com",
      cus_name: cus_name || "Guest",
      metadata: { ...metadata, phone: "01700000000" }
    };
    
    console.log("HGP DEBUG: Sending ZiniPay Payload:", JSON.stringify(payload));

    if (ZINIPAY_API_KEY === '8cd7a947713ac7f4ffc28131022d9102de9aacb54d3c0121') {
      console.warn("HGP WARNING: Using default/test ZiniPay API Key. This may fail on the live endpoint.");
    }

    const response = await axios.post('https://api.zinipay.com/v1/payment/create', payload, {
      headers: {
        'zini-api-key': ZINIPAY_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log("HGP DEBUG: ZiniPay Create Success Response:", JSON.stringify(response.data));
    res.json(response.data);
  } catch (error: any) {
    console.error("HGP ERROR: ZiniPay Create Error:", error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      error: error.response?.data || error.message,
      details: "Please check your ZiniPay API Key and ensure your domain is whitelisted."
    });
  }
});

// ZiniPay Verify Payment Route
app.post("/api/payment/verify", async (req, res) => {
  try {
    const { invoiceId } = req.body;

    const response = await axios.post('https://api.zinipay.com/v1/payment/verify', {
      invoiceId,
      apiKey: ZINIPAY_API_KEY
    }, {
      headers: {
        'zini-api-key': ZINIPAY_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    const data = response.data;
    const status = data.status || data.payment_status || data.data?.status;
    const isSuccess = ['success', 'COMPLETED', 'completed', 'PAID', 'paid'].includes(status);
    
    const actualTransactionId = data.transactionId || data.transaction_id || data.data?.transactionId || invoiceId;
    
    // Extract orderId from metadata if available, or use the one passed from frontend
    let parsedMetadata = data.metadata || data.data?.metadata;
    if (typeof parsedMetadata === 'string') {
      try { parsedMetadata = JSON.parse(parsedMetadata); } catch(e) {}
    }
    const orderId = parsedMetadata?.orderId || data.orderId || data.order_id || req.body.orderId;

    if (isSuccess && orderId) {
      // Fetch the order FIRST to check its current state
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (order) {
        // If it's already completed OR already has a real transaction ID, skip notification
        const alreadyVerified = order.status === 'COMPLETED' || (order.transaction_id && order.transaction_id !== 'PENDING_ZINIPAY');
        
        // Update the order transaction ID atomically to prevent race conditions
        const { data: updatedOrder, error: updateError } = await supabase
          .from('orders')
          .update({ transaction_id: actualTransactionId })
          .eq('id', orderId)
          .eq('transaction_id', 'PENDING_ZINIPAY')
          .select()
          .maybeSingle();

        if (updateError) {
          console.error("HGP Verify Update Error:", updateError);
        }

        // If updatedOrder is null, it means another request already updated it
        const isFirstVerification = !!updatedOrder;

        if (alreadyVerified) {
          console.log(`HGP Verify: Order ${orderId} is already verified, skipping notification.`);
        } else if (isFirstVerification) {
          order.transactionId = actualTransactionId; // Ensure transactionId is set for the notification
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', order.user_id)
            .single();
            
          if (profile && profile.full_name) {
            order.customerName = profile.full_name;
          }

          console.log("HGP Verify: Sending Telegram notification");
          await sendTelegramNotification(order, true);
          await sendZiniPayVerificationNotification(orderId, order.totalAmount || order.total_amount || 0, actualTransactionId);
        }
      }
    }

    res.json(response.data);
  } catch (error: any) {
    console.error("ZiniPay Verify Error:", error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
});

// ZiniPay Webhook Route
app.post("/api/payment/webhook", async (req, res) => {
  try {
    // ZiniPay sends payment status updates here
    const data = req.body;
    console.log("ZiniPay Webhook Received:", JSON.stringify(data, null, 2));
    
    // Extract status and orderId from various possible ZiniPay formats
    const status = data.status || data.payment_status || data.data?.status;
    const invoiceId = data.invoiceId || data.invoice_id || data.data?.invoiceId;
    const transactionId = data.transactionId || data.transaction_id || data.data?.transactionId || invoiceId;
    
    // metadata might be at root or inside data
    let parsedMetadata = data.metadata || data.data?.metadata;
    if (typeof parsedMetadata === 'string') {
      try { parsedMetadata = JSON.parse(parsedMetadata); } catch(e) {}
    }
    const orderId = parsedMetadata?.orderId || data.orderId || data.order_id;

    const isSuccess = ['success', 'COMPLETED', 'completed', 'PAID', 'paid'].includes(status);

    if (isSuccess && orderId) {
      // Fetch the order FIRST to check its current state
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (order) {
        // If it's already completed OR already has a real transaction ID, skip notification
        const alreadyVerified = order.status === 'COMPLETED' || (order.transaction_id && order.transaction_id !== 'PENDING_ZINIPAY');
        
        // Update the order transaction ID atomically to prevent race conditions
        const { data: updatedOrder, error: updateError } = await supabase
          .from('orders')
          .update({ transaction_id: transactionId })
          .eq('id', orderId)
          .eq('transaction_id', 'PENDING_ZINIPAY')
          .select()
          .maybeSingle();

        if (updateError) {
          console.error("HGP Webhook Update Error:", updateError);
        }

        // If updatedOrder is null, it means another request already updated it
        const isFirstVerification = !!updatedOrder;

        if (alreadyVerified) {
          console.log(`HGP Webhook: Order ${orderId} is already verified, skipping notification.`);
        } else if (isFirstVerification) {
          order.transactionId = transactionId; // Ensure transactionId is set for the notification
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', order.user_id)
            .single();
            
          if (profile && profile.full_name) {
            order.customerName = profile.full_name;
          }

          console.log("HGP Webhook: Sending Telegram notification");
          await sendTelegramNotification(order, true);
          await sendZiniPayVerificationNotification(orderId, order.totalAmount || order.total_amount || 0, transactionId);
        }
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("ZiniPay Webhook Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

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
    const isCancelled = order.status === 'CANCELLED';
    
    let subject = isCompleted 
      ? `Order Delivery Complete - HGP #${order.id}`
      : isCancelled
        ? `Order Rejected/Cancelled - HGP #${order.id}`
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
            : isCancelled
              ? `<p style="color: #dc2626; font-weight: bold; font-size: 18px;">Your order has been rejected or cancelled.</p>
                 <p>If you have already paid, please contact support with your Transaction ID for a refund or manual processing.</p>`
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
    const result = await sendTelegramNotification(order);
    
    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error: any) {
    console.error("Telegram Route Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Handle ZiniPay Redirects (GET/POST)
app.all(["/payment/success", "/shop/payment/success"], (req, res) => {
  const params = { ...req.query, ...req.body };
  const queryString = new URLSearchParams(params as any).toString();
  
  // Determine the base URL
  const host = req.get('host') || 'localhost:3000';
  // Better protocol detection for Cloud Run and other proxies
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const baseUrl = process.env.APP_URL || `${protocol}://${host}`;
  
  console.log(`Redirecting to: ${baseUrl}/?payment=success&${queryString}`);
  
  // Always redirect to root /
  res.redirect(`${baseUrl}/?payment=success&${queryString}`);
});

app.all(["/payment/cancel", "/shop/payment/cancel"], (req, res) => {
  const params = { ...req.query, ...req.body };
  const queryString = new URLSearchParams(params as any).toString();
  
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const baseUrl = process.env.APP_URL || `${protocol}://${host}`;
  
  // Always redirect to root /
  res.redirect(`${baseUrl}/?payment=cancel&${queryString}`);
});

async function startServer() {
  const PORT = 3000;

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    // SPA fallback for development
    app.use('*all', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api') || url.startsWith('/payment')) {
        return next();
      }
      try {
        const template = await vite.transformIndexHtml(url, `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <link rel="icon" type="image/svg+xml" href="/vite.svg" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>Hasibul Game Point</title>
            </head>
            <body>
              <div id="root"></div>
              <script type="module" src="/src/main.tsx"></script>
            </body>
          </html>
        `);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else if (process.env.VERCEL !== "1") {
    // Only serve static files if NOT on Vercel (Vercel handles this via vercel.json)
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
