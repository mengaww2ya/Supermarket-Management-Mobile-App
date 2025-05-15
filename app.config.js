import "dotenv/config";

export default {
  expo: {
    plugins: [
      "expo-router"
    ],
    newArchEnabled: true,
    userInterfaceStyle: "automatic",
    name: "QUEEN",
    slug: "QUEEN",
    version: "1.0.0", // 👈 Added this line (App version)
    extra: {
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
      // firebaseMeasurementId: process.env.FIREBASE_MEASUREMENT_ID,

      // Chapa Payment configuration (Customer)
      chapaPublicKey: process.env.CHAPA_PUBLIC_KEY,
      chapaSecretKey: process.env.CHAPA_SECRET_KEY,
      chapaEncryptionKey: process.env.CHAPA_ENCRYPTION_KEY,

      // Chapa Payment configuration (Supplier)
      supplierChapaPublicKey: process.env.SUPPLIER_CHAPA_PUBLIC_KEY,
      supplierChapaSecretKey: process.env.SUPPLIER_CHAPA_SECRET_KEY,
      supplierChapaEncryptionKey: process.env.SUPPLIER_CHAPA_ENCRYPTION_KEY,

      // EAS project linking
      eas: {
        projectId: "3d683789-a14b-496b-86ce-a6959400d966",
      },
    },
    android: {
      package: "com.h2m2025.queen",
      versionCode: 1
    }
  }
};
