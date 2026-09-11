export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Resolves with the browser's current position, or `null` if geolocation is
 * unsupported, denied, or times out. Never rejects — location is a nice-to-
 * have for attendance, not a requirement, so callers can always proceed.
 */
export function getCurrentCoordinates(timeoutMs = 8000): Promise<Coordinates | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 },
    );
  });
}
