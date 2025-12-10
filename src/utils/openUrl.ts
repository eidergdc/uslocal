import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

export const openUrl = async (url: string) => {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url });
  } else {
    window.open(url, '_blank');
  }
};

export const openWhatsApp = async (phone: string) => {
  const cleanPhone = phone.replace(/\D/g, '');
  const url = `https://wa.me/${cleanPhone}`;
  await openUrl(url);
};

export const openPhone = async (phone: string) => {
  const url = `tel:${phone}`;
  await openUrl(url);
};

export const openMaps = async (lat: number, lng: number, app: 'google' | 'apple' | 'waze' = 'google') => {
  let url = '';

  switch (app) {
    case 'google':
      url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      break;
    case 'apple':
      url = `http://maps.apple.com/?daddr=${lat},${lng}`;
      break;
    case 'waze':
      url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
      break;
  }

  await openUrl(url);
};

export const openWebsite = async (url: string) => {
  await openUrl(url);
};
