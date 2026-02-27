import { supabase } from "./supabaseClient";
import { Order } from "../types";

export const sendTelegramNotification = async (order: Order) => {
  try {
    console.log("HGP TELEGRAM: Sending notification to admin...");
    
    const { data, error } = await supabase.functions.invoke('send-telegram-notification', {
      body: { order },
    });

    if (error || (data && data.success === false)) {
      const errorMsg = error?.message || data?.error || 'Unknown Telegram Error';
      console.error("HGP TELEGRAM ERROR:", errorMsg);
      alert(`Telegram Error: ${errorMsg}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("HGP TELEGRAM FATAL ERROR:", error);
    return false;
  }
};
