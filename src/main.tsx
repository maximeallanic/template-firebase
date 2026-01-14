import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'
import { isNative } from './services/platformService'
import './index.css'
import './i18n/config' // Initialize i18n
import App from './App.tsx'

// Configure native app settings
if (isNative()) {
  // Add native-app class to html element for CSS targeting
  document.documentElement.classList.add('native-app');

  // Set dark status bar style for native apps
  StatusBar.setStyle({ style: Style.Dark }).catch((err) => {
    console.debug('StatusBar.setStyle not available:', err);
  });
  StatusBar.setBackgroundColor({ color: '#0f172a' }).catch((err) => {
    // Android only - iOS doesn't support this
    console.debug('StatusBar.setBackgroundColor not available:', err);
  });
  // Hide splash screen after app is ready
  SplashScreen.hide().catch((err) => {
    console.debug('SplashScreen.hide not available:', err);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
