import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'
import { isNative, isAndroid } from './services/platformService'
import './index.css'
import './i18n/config' // Initialize i18n
import App from './App.tsx'

// Configure native app settings
if (isNative()) {
  // Add native-app class to html element for CSS targeting
  document.documentElement.classList.add('native-app');

  // Set dark status bar style for native apps
  StatusBar.setStyle({ style: Style.Dark }).catch((err) => {
    console.warn('StatusBar.setStyle failed:', err);
  });

  // Set status bar background color (Android only)
  if (isAndroid()) {
    StatusBar.setBackgroundColor({ color: '#0f172a' }).catch((err) => {
      console.warn('StatusBar.setBackgroundColor failed:', err);
    });
  }

  // Hide splash screen after app is ready
  SplashScreen.hide().catch((err) => {
    console.warn('SplashScreen.hide failed:', err);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
