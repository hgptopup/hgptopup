
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to prevent Telegram HTML parsing errors
function escapeHTML(str: string) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

serve(async (req) => {
  // Handle CORS for browser requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { order } = await req.json();
    
    // Credentials - Prioritize Env Vars, fallback to provided values
    const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || '8510422259:AAEY1ueGulFXmT-HDkxxLG60TbJWGdu7hPg';
    const CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID') || '5067614518';

    if (!order || !order.items) {
      throw new Error("Payload error: No order data provided.");
    }

    console.log(`Processing Order Notification: ${order.id} [${order.status}]`);

    // Build the "Crimson Intel Report"
    const isCompleted = order.status === 'COMPLETED';
    const isProcessing = order.status === 'PROCESSING';
    let message = isCompleted 
      ? `<b>✅ ORDER COMPLETED</b>\n`
      : isProcessing
        ? `<b>⏳ ORDER PROCESSING</b>\n`
        : `<b>🚨 NEW ORDER RECEIVED</b>\n`;
    
    message += `<code>REF: ${escapeHTML(order.id)}</code>\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (!isCompleted && !isProcessing) {
      order.items.forEach((item: any, index: number) => {
        message += `<b>📦 PRODUCT:</b> ${escapeHTML(item.gameTitle)}\n`;
        message += `<b>💎 PACKAGE:</b> ${escapeHTML(item.packageName)}\n`;
        message += `<b>💰 PRICE:</b> ৳${item.price}\n`;
        message += `<b>🛡️ LOGIN:</b> ${escapeHTML(item.loginMethod)}\n`;
        message += `<b>👤 TARGET ID:</b> <code>${escapeHTML(item.playerId)}</code>\n`;
        
        // Secondary Verification Data
        if (item.password) message += `<b>🔑 PASSWORD:</b> <code>${escapeHTML(item.password)}</code>\n`;
        if (item.whatsapp) message += `<b>📱 WHATSAPP:</b> <code>${escapeHTML(item.whatsapp)}</code>\n`;
        
        message += `\n`;
      });
    } else {
      message += `<b>STATUS:</b> Successfully Deployed\n`;
      message += `<b>CUSTOMER:</b> ${escapeHTML(order.userId)}\n`;
      message += `<b>ITEMS:</b> ${order.items.length} Packages\n\n`;
    }

    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `<b>💵 TOTAL:</b> ৳${order.totalAmount}\n`;
    message += `<b>🕒 TIME:</b> ${new Date().toLocaleString('en-BD')}\n\n`;
    
    if (!isCompleted) {
      message += `<i>Check Admin Dashboard to process.</i>`;
    } else {
      message += `<i>Order has been finalized and user notified.</i>`;
    }

    // Send to Telegram
    const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const telegramResult = await response.json();

    if (!telegramResult.ok) {
      console.error("Telegram API Failed:", telegramResult);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Telegram API Error: ${telegramResult.description}` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ success: true, message: "Notification Sent" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Edge Function Error:", error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
})
