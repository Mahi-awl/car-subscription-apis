import { messaging } from "../config/firebase.js";

export const sendPushNotification = async ({
  token,
  title,
  body,
  data = {},
}) => {
  try {
    if (!messaging) {
      console.warn("⚠ Firebase messaging not initialized. Push notification skipped.");
      return null;
    }

    if (!token) {
      console.log("FCM token not found");
      return null;
    }

    const message = {
      token,

      notification: {
        title,
        body,
      },

      data: Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          String(value),
        ])
      ),
    };

    const response = await messaging.send(message);

    console.log("Push notification sent successfully:", response);

    return response;
  } catch (error) {
    console.error("PUSH NOTIFICATION ERROR =>", error);

    return null;
  }
};