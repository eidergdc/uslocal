export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  unit: 'miles' | 'km' = 'km'
): number => {
  const R = unit === 'miles' ? 3959 : 6371; // Earth's radius in miles or kilometers
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

const toRad = (value: number): number => {
  return value * Math.PI / 180;
};

export const formatDistance = (distance: number, unit: 'miles' | 'km' = 'km'): string => {
  if (unit === 'miles') {
    if (distance < 0.1) {
      return `${Math.round(distance * 5280)}ft`; // Convert to feet for very short distances
    }
    return `${distance.toFixed(1)}mi`;
  }
  
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
};