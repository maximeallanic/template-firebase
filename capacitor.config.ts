import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.spicyvssweet.app',
  appName: 'Spicy vs Sweet',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f172a',
      showSpinner: false,
      launchAutoHide: true
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0f172a'
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      // Web Client ID (client_type: 3) - for server-side token verification
      serverClientId: '235167916448-4vuo4v1js10scr2d2bbk6q1iribtgn6k.apps.googleusercontent.com',
      // Android Client ID (client_type: 1) - for native Android sign-in
      androidClientId: '235167916448-v0rh6d7cvhael9nc79oftcg304tcpijn.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  },
  ios: {
    contentInset: 'automatic'
  },
  android: {
    backgroundColor: '#0f172a'
  }
};

export default config;
