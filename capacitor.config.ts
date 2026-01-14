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
      serverClientId: '933996160893-5oqbi0g9lq3g1eic07iuhj2rndblmpch.apps.googleusercontent.com',
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
