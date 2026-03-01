import axios from "axios";
import { Order } from "../types";

/**
 * HGP DIRECT SMTP PROTOCOL
 * This service now uses the local backend to securely send 
 * emails via Gmail SMTP without exposing App Passwords.
 */

export const sendOrderNotification = async (order: Order, userEmail: string, userName: string, pdfDataUri?: string, isAdminAlert: boolean = false) => {
  try {
    console.log(`HGP SMTP: Initiating secure relay (${isAdminAlert ? 'Admin Alert' : 'User Confirmation'}) via local API...`);

    // We send the base64 part of the PDF only
    const pdfBase64 = pdfDataUri?.split('base64,')[1];

    const response = await axios.post('/api/notifications/email', {
      order,
      userEmail,
      userName,
      pdfBase64,
      isAdminAlert,
      fileName: `HGP_Receipt_${order.id}.pdf`
    });

    if (!response.data.success) {
      const errorMsg = response.data.error || 'Unknown SMTP Error';
      console.error("HGP SMTP RELAY ERROR:", errorMsg);
      return false;
    }

    console.log("HGP SMTP SUCCESS: Direct Gmail dispatch confirmed.");
    return true;
  } catch (error: any) {
    console.error("HGP SMTP FATAL ERROR:", error.response?.data || error.message);
    return false;
  }
};
