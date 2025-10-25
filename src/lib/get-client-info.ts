import UAParser from 'ua-parser-js';

export function parseUserAgent(ua: string | null | undefined) {
  const raw = ua || '';
  try {
    const parser = new UAParser(raw);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const device = parser.getDevice();

    return {
      raw,
      browserName: browser.name || undefined,
      browserVersion: browser.version || undefined,
      osName: os.name || undefined,
      osVersion: os.version || undefined,
      deviceVendor: device.vendor || undefined,
      deviceModel: device.model || undefined,
      deviceType: device.type || undefined,
    };
  } catch (err) {
    return { raw };
  }
}

export function extractIpFromHeaders(headers: Headers) {
  const xff = headers.get('x-forwarded-for') || headers.get('x-real-ip') || '';
  if (xff) return xff.split(',')[0].trim();
  // In some environments the client IP may not be available
  return 'unknown';
}
