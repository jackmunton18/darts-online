importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js')

// process.env not defined

const app = firebase.initializeApp({
    // TODO: Replace the following with your actual Firebase config values
    apiKey: 'AIzaSyDWz80BGQvpwc35ciKWBcu0dP7r0RaHCko',
    authDomain: 'holly-birthday.firebaseapp.com',
    projectId: 'holly-birthday',
    storageBucket: 'holly-birthday.appspot.com',
    messagingSenderId: '557884679709',
    appId: '1:557884679709:web:514e38e2da320fe8e9c8f4'
});

// import { getMessaging } from "firebase/messaging";

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Received background message ", payload);
  
  // Check if we should process this notification
  // This helps prevent duplicate notifications
  const messageId = payload.data?.messageId || payload.messageId;
  const processedMessages = self.processedMessages || [];
  
  if (processedMessages.includes(messageId)) {
    console.log("Message already processed, skipping");
    return;
  }
  
  // Save this message ID to prevent duplicates
  self.processedMessages = [...processedMessages, messageId].slice(-10); // Keep last 10
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});