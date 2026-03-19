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
const sendTelegramNotification = async (order: any) => {
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
      message = `<b>✅ PAYMENT COMPLETED</b>\n`;
    } else {
      message = `<b>🚨 NEW ORDER RECEIVED</b>\n`;
    }
    
    message += `<code>REF: ${escapeHTML(order.id)}</code>\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    const totalAmount = order.totalAmount || order.total_amount || 0;
    const paymentMethod = order.paymentMethod || order.payment_method || 'N/A';
    const transactionId = order.transactionId || order.transaction_id || 'N/A';
    const customerName = order.customerName || order.customer_name || order.userId || order.user_id || 'Guest';

    message += `<b>👤 CUSTOMER:</b> <code>${escapeHTML(customerName)}</code>\n`;
    message += `<b>💵 TOTAL:</b> ৳${totalAmount}\n`;
    message += `<b>💳 METHOD:</b> ${escapeHTML(paymentMethod)}\n`;
    message += `<b>🔑 TRX ID:</b> <code>${escapeHTML(transactionId)}</code>\n\n`;
    
    const items = order.items || [];
    if (Array.isArray(items) && items.length > 0) {
      message += `<b>📦 PRODUCTS:</b>\n`;
      items.forEach((item: any) => {
        const gameTitle = item.gameTitle || item.game_title || item.title || 'Unknown Game';
        const packageName = item.packageName || item.package_name || item.package || 'Unknown Package';
        const playerId = item.playerId || item.player_id || item.uid || 'N/A';
        const loginMethod = item.loginMethod || item.login_method || 'N/A';
        
        message += `• ${escapeHTML(gameTitle)} - ${escapeHTML(packageName)}\n`;
        message += `  ID: <code>${escapeHTML(playerId)}</code> | ${escapeHTML(loginMethod)}\n`;
        if (item.password) message += `  PW: <code>${escapeHTML(item.password)}</code>\n`;
        message += `\n`;
      });
    } else if (typeof items === 'string') {
      // Handle case where items might be a string (though it shouldn't be)
      message += `<b>📦 PRODUCTS:</b>\n<code>${escapeHTML(items)}</code>\n\n`;
    }

    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `<b>🕒 TIME:</b> ${new Date().toLocaleString('en-BD')}\n\n`;
    
    if (isCompleted) {
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

// Specific ZiniPay Admin Notification Helper
const sendZiniPayAdminNotification = async (orderId: string, amount: string | number, transactionId: string, status: string = 'success') => {
  try {
    const adminChatIds = [TELEGRAM_CHAT_ID];
    if (status !== 'success') return { success: true };

    const message = `<b>✅ ZiniPay Verification Complete!</b>\n\n` +
                    `<b>Order ID:</b> ${orderId}\n` +
                    `<b>Amount:</b> ৳${amount}\n` +
                    `<b>Transaction ID:</b> ${transactionId}`;

    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const requests = adminChatIds.map(chatId => 
      axios.post(telegramUrl, {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    );

    await Promise.all(requests);
    return { success: true };
  } catch (error: any) {
    console.error("ZiniPay Admin Telegram Notification Error:", error.message);
    return { success: false, error: error.message };
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
    
    // Extract orderId from metadata if available
    const metadata = data.metadata || data.data?.metadata;
    const orderId = metadata?.orderId || data.orderId || data.order_id;

    if (isSuccess && orderId) {
      // Use the secure RPC function to update the order and bypass RLS
      const { data: rpcResult, error: rpcError } = await supabase.rpc('process_payment', {
        p_order_id: orderId,
        p_txn_id: invoiceId
      });

      if (rpcError) {
        console.error("HGP Verify RPC Error:", rpcError);
      } else if (rpcResult && rpcResult.success) {
        console.log(`HGP Verify: Order ${orderId} updated to PROCESSING via RPC`);
        const order = rpcResult.order;
        const profile = rpcResult.profile;
        if (profile && profile.full_name) {
          order.customerName = profile.full_name;
        }

        console.log("HGP Verify: Sending Telegram notification to admin");
        // Send the specific ZiniPay admin notification (screenshot format)
        await sendZiniPayAdminNotification(orderId, data.amount || order.totalAmount, invoiceId, 'success');
      } else if (rpcResult && rpcResult.already_processed) {
        console.log(`HGP Verify: Order ${orderId} is already PROCESSING/COMPLETED, skipping notification.`);
      }
    } else if (!isSuccess && orderId) {
      // Optional: Send failed notification
      await sendZiniPayAdminNotification(orderId, data.amount || '0', invoiceId || 'N/A', 'failed');
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
    // Basic security: check for a secret token if provided in environment
    const webhookToken = process.env.ZINIPAY_WEBHOOK_TOKEN;
    if (webhookToken && req.query.token !== webhookToken) {
      console.error("ZiniPay Webhook: Unauthorized access attempt");
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // ZiniPay sends payment status updates here
    const data = req.body;
    console.log("ZiniPay Webhook Received:", JSON.stringify(data, null, 2));
    
    // Extract status and orderId from various possible ZiniPay formats
    const status = data.status || data.payment_status || data.data?.status;
    const invoiceId = data.invoiceId || data.invoice_id || data.data?.invoiceId;
    const transactionId = data.transactionId || data.transaction_id || data.data?.transactionId || invoiceId;
    const amount = data.amount || data.data?.amount || '0';
    
    // metadata might be at root or inside data
    const metadata = data.metadata || data.data?.metadata;
    const orderId = metadata?.orderId || data.orderId || data.order_id;

    const isSuccess = ['success', 'COMPLETED', 'completed', 'PAID', 'paid'].includes(status);

    if (isSuccess && orderId) {
      // Use the secure RPC function to update the order and bypass RLS
      const { data: rpcResult, error: rpcError } = await supabase.rpc('process_payment', {
        p_order_id: orderId,
        p_txn_id: transactionId
      });

      if (rpcError) {
        console.error("HGP Webhook RPC Error:", rpcError);
      } else if (rpcResult && rpcResult.success) {
        console.log(`HGP Webhook: Order ${orderId} updated to PROCESSING via RPC`);
        const order = rpcResult.order;
        const profile = rpcResult.profile;
        if (profile && profile.full_name) {
          order.customerName = profile.full_name;
        }

        console.log("HGP Webhook: Sending Telegram notification to admin");
        // Send the specific ZiniPay admin notification (screenshot format)
        await sendZiniPayAdminNotification(orderId, amount, transactionId, 'success');
      } else if (rpcResult && rpcResult.already_processed) {
        console.log(`HGP Webhook: Order ${orderId} is already PROCESSING/COMPLETED, skipping notification.`);
      }
    } else if (!isSuccess && orderId) {
      // Optional: Send failed notification
      await sendZiniPayAdminNotification(orderId, amount, transactionId || 'N/A', 'failed');
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
    const isProcessing = order.status === 'PROCESSING';
    const isCancelled = order.status === 'CANCELLED';
    
    let subject = isCompleted 
      ? `Order Delivery Complete - HGP #${order.id}`
      : isProcessing
        ? `Payment Successful - Order Processing - HGP #${order.id}`
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
            : isProcessing
              ? `<p style="color: #eab308; font-weight: bold; font-size: 18px;">Payment Successful! Your order is now processing.</p>
                 <p>Our admins will manually review and complete your order shortly.</p>`
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
