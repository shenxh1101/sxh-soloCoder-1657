const PREFIX = 'restaurant_inventory_';

export function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage set error:', e);
  }
}

export function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const value = localStorage.getItem(PREFIX + key);
    if (value === null) return defaultValue;
    return JSON.parse(value) as T;
  } catch (e) {
    console.error('Storage get error:', e);
    return defaultValue;
  }
}

export function removeStorage(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch (e) {
    console.error('Storage remove error:', e);
  }
}
