# Reel Vault

Reel Vault is a React Native (Expo) mobile application designed to help you save, categorize, and watch your favorite video reels. Powered by Firebase, Reel Vault lets you save reels directly from other apps via Share Intent, organize them into custom categories, and set reminders to watch them later.

## 🚀 Features

- **Google Authentication:** Secure sign-in utilizing `@react-native-google-signin/google-signin` and Firebase Auth.
- **Save Reels:** Capture URLs via Android/iOS Share Intent or manually add them.
- **Categorization:** Organize reels into custom categories.
- **Reminders:** Set up reminders to watch saved reels at a specific time.
- **Search:** Quickly search through your saved reels and categories.
- **Custom Video Player:** In-app seamless playback of your saved reels.

## 🛠️ Tech Stack

- **Framework:** [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
- **Styling:** [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for React Native)
- **Backend & Database:** [Firebase](https://firebase.google.com/) (Auth, Firestore)
- **Authentication:** Google Sign-In
- **State Management:** React Context API

## 📦 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd "reel vault"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

   Create a `.env` file in the root directory and add your Firebase, Google, Groq, and RapidAPI keys.
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_google_web_client_id
   EXPO_PUBLIC_GROQ_API_KEY=your_groq_api_key
   EXPO_PUBLIC_RAPIDAPI_KEY=your_rapidapi_key
   ```

4. **Run the App Locally:**
   ```bash
   npx expo start
   ```

## 🔒 Security

All secrets (`.env`, `google-services.json`, `client_secret_*.json`) are added to `.gitignore` to prevent accidental exposure of API keys and client secrets. The configuration inside `firebaseConfig.ts` is read securely from environment variables.

## 📱 Build APK

To build a standalone APK for Android, you can use Expo Application Services (EAS):
```bash
eas build -p android --profile preview --local
```
*Note: Make sure you have `eas-cli` installed globally (`npm install -g eas-cli`) and are logged in.*
