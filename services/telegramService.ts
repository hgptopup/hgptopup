import { supabase } from "./supabaseClient";
import { Order } from "../types";

export const sendTelegramNotification = async (order: Order) => {
  try {
    console.log("HGP TELEGRAM: Sending notification to admin...");
    
    const { data, error } = await supabase.functions.invoke('send-telegram-notification', {
      body: { order },
    });

    if (error) {
      console.error("HGP TELEGRAM ERROR:", error);
      alert(`Telegram Error: ${error.message || 'Failed to connect to Edge Function'}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("HGP TELEGRAM FATAL ERROR:", error);
    return false;
  }
};
