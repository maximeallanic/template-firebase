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
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com']
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
