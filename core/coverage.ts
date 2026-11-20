/**
 * Geographic coverage definition for SafeRoute Beta.
 * Currently bounded to Mumbai metropolitan area.
 */

export const MUMBAI_BBOX = {
  minLon: 72.775,
  minLat: 18.892,
  maxLon: 72.986,
  maxLat: 19.270,
};

export function isWithinMumbai(latitude: number, longitude: number): boolean {
  return (
    latitude >= MUMBAI_BBOX.minLat &&
    latitude <= MUMBAI_BBOX.maxLat &&
    longitude >= MUMBAI_BBOX.minLon &&
    longitude <= MUMBAI_BBOX.maxLon
  );
}
