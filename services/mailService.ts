import { supabase } from "./supabaseClient";
import { Order } from "../types";

/**
 * HGP DIRECT SMTP PROTOCOL
 * This service now uses Supabase Edge Functions to securely send 
 * emails via your Gmail SMTP without exposing App Passwords.
 */

export const sendOrderNotification = async (order: Order, userEmail: string, userName: string, pdfDataUri?: string, isAdminAlert: boolean = false) => {
  try {
    console.log(`HGP SMTP: Initiating secure relay (${isAdminAlert ? 'Admin Alert' : 'User Confirmation'}) via Supabase Edge Function...`);

    // We send the base64 part of the PDF only
    const pdfBase64 = pdfDataUri?.split('base64,')[1];

    const { data, error } = await supabase.functions.invoke('send-order-email', {
      body: {
        order,
        userEmail,
        userName,
        pdfBase64,
        isAdminAlert,
        fileName: `HGP_Receipt_${order.id}.pdf`
      },
    });

    if (error || (data && data.success === false)) {
      const errorMsg = error?.message || data?.error || 'Unknown SMTP Error';
      console.error("HGP SMTP RELAY ERROR:", errorMsg);
      alert(`Email Error: ${errorMsg}`);
      return false;
    }

    console.log("HGP SMTP SUCCESS: Direct Gmail dispatch confirmed.");
    return true;
  } catch (error) {
    console.error("HGP SMTP FATAL ERROR:", error);
    return false;
  }
};
