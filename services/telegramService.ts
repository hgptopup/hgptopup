import axios from "axios";
import { Order } from "../types";

export const sendTelegramNotification = async (order: Order) => {
  try {
    console.log("HGP TELEGRAM: Sending notification to admin via local API...");
    
    const response = await axios.post('/api/notifications/telegram', {
      order
    });

    if (!response.data.success) {
      const errorMsg = response.data.error || 'Unknown Telegram Error';
      console.error("HGP TELEGRAM ERROR:", errorMsg);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error("HGP TELEGRAM FATAL ERROR:", error.response?.data || error.message);
    return false;
  }
};
