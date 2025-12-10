import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { SplashScreen } from '@capacitor/splash-screen';
import App from './App';
import './index.css';

// Initialize Capacitor plugins
const initCapacitor = async () => {
  try {
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: '#EC4899' });

    Keyboard.setAccessoryBarVisible({ isVisible: true });

    CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        CapacitorApp.exitApp();
      } else {
        window.history.back();
      }
    });

    await SplashScreen.hide();
  } catch (error) {
    console.log('Capacitor not available, running in browser mode');
  }
};

// Simple error handling
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
  
  // Show error on screen
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #ff4444;
    color: white;
    padding: 20px;
    z-index: 9999;
    font-family: system-ui;
    text-align: center;
  `;
  errorDiv.innerHTML = `
    <h3>Erro JavaScript:</h3>
    <p>${e.error?.message || e.message}</p>
    <button onclick="window.location.reload()" style="background: white; color: #ff4444; border: none; padding: 10px 20px; border-radius: 5px; margin-top: 10px; cursor: pointer;">
      Recarregar
    </button>
  `;
  document.body.appendChild(errorDiv);
});

// Show loading
const loadingDiv = document.createElement('div');
loadingDiv.id = 'loading';
loadingDiv.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: system-ui;
  z-index: 1000;
`;
loadingDiv.innerHTML = `
  <div style="text-align: center;">
    <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #009739; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
    <p style="color: #666;">Carregando US LOCAL...</p>
  </div>
  <style>
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
`;
document.body.appendChild(loadingDiv);

const startApp = async () => {
  await initCapacitor();

  try {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error('Root element not found');
    }

    const root = createRoot(rootElement);

    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );

    // Remove loading after render
    setTimeout(() => {
      const loading = document.getElementById('loading');
      if (loading) loading.remove();
    }, 1000);

  } catch (error) {
    console.error('Failed to render app:', error);

    // Remove loading
    const loading = document.getElementById('loading');
    if (loading) loading.remove();

    // Show error
    document.body.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: system-ui;
        text-align: center;
        padding: 20px;
      ">
        <div>
          <h1 style="color: #009739; margin-bottom: 20px;">US LOCAL</h1>
          <p style="color: #666; margin-bottom: 20px;">Erro ao carregar a aplicação</p>
          <p style="color: #999; font-size: 14px; margin-bottom: 20px;">${error.message}</p>
          <button onclick="window.location.reload()" style="
            background: #009739;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
          ">
            Recarregar
          </button>
        </div>
      </div>
    `;
  }
};

startApp();