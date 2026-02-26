
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { order, userEmail, userName, pdfBase64, fileName } = await req.json()

    // SMTP Configuration from Environment Variables
    const SMTP_HOSTNAME = Deno.env.get('SMTP_HOSTNAME') || 'smtp.gmail.com'
    const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') || '587')
    const SMTP_USERNAME = Deno.env.get('SMTP_USERNAME') || 'hasibulgamepoint02@gmail.com'
    const SMTP_PASSWORD = Deno.env.get('SMTP_PASSWORD') || 'lwri taoi ugqg dzrk'
    const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || SMTP_USERNAME

    if (!SMTP_USERNAME || !SMTP_PASSWORD) {
      throw new Error("SMTP credentials not configured in environment variables.")
    }

    const client = new SmtpClient()

    if (SMTP_PORT === 465) {
      await client.connectTLS({
        hostname: SMTP_HOSTNAME,
        port: SMTP_PORT,
        username: SMTP_USERNAME,
        password: SMTP_PASSWORD,
      })
    } else {
      await client.connect({
        hostname: SMTP_HOSTNAME,
        port: SMTP_PORT,
      })
      await client.startTLS()
      await client.login(SMTP_USERNAME, SMTP_PASSWORD)
    }

    // Prepare Email Content
    const isCompleted = order.status === 'COMPLETED';
    const subject = isCompleted 
      ? `Deployment Successful - HGP #${order.id}`
      : `Order Confirmation - HGP #${order.id}`;

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #dc2626;">Hasibul Game Point</h2>
        <p>Hello <strong>${userName}</strong>,</p>
        
        ${isCompleted 
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
    `

    await client.send({
      from: SMTP_USERNAME,
      to: userEmail,
      subject: subject,
      content: htmlContent,
      html: htmlContent,
      attachments: pdfBase64 ? [
        {
          filename: fileName || 'receipt.pdf',
          content: pdfBase64,
          encoding: 'base64',
        }
      ] : []
    })

    await client.close()

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("Email Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
