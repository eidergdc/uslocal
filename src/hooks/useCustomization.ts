import { useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

interface CustomizationData {
  appIcon: string;
  headerLogo: string;
}

export const useCustomization = () => {
  const [customization, setCustomization] = useState<CustomizationData>({
    appIcon: '',
    headerLogo: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to real-time changes in customization settings
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'customization'),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data() as CustomizationData;
          setCustomization(data);
          
          // Update favicon if app icon is set
          if (data.appIcon) {
            updateFavicon(data.appIcon);
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to customization changes:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateFavicon = (iconUrl: string) => {
    // Update favicon
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon) {
      favicon.href = iconUrl;
    } else {
      // Create favicon if it doesn't exist
      const newFavicon = document.createElement('link');
      newFavicon.rel = 'icon';
      newFavicon.href = iconUrl;
      document.head.appendChild(newFavicon);
    }

    // Update apple-touch-icon
    let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
    if (appleTouchIcon) {
      appleTouchIcon.href = iconUrl;
    } else {
      appleTouchIcon = document.createElement('link');
      appleTouchIcon.rel = 'apple-touch-icon';
      appleTouchIcon.href = iconUrl;
      document.head.appendChild(appleTouchIcon);
    }

    // Update manifest icons
    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (manifestLink) {
      // Create dynamic manifest
      const manifest = {
        name: "US LOCAL - Marketplace Brasileiro",
        short_name: "US LOCAL",
        description: "Marketplace para brasileiros nos EUA",
        start_url: "/",
        display: "standalone",
        background_color: "#009739",
        theme_color: "#009739",
        orientation: "portrait-primary",
        icons: [
          {
            src: iconUrl,
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: iconUrl,
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ],
        categories: ["business", "social", "lifestyle"],
        lang: "pt-BR"
      };

      const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
      const manifestUrl = URL.createObjectURL(manifestBlob);
      manifestLink.href = manifestUrl;
    }
  };

  return {
    ...customization,
    loading
  };
};