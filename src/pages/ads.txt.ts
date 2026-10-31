import type { APIRoute } from 'astro';
import { validAdsenseClientId } from '../config/constants.mjs';

export const GET: APIRoute = () => {
  const client = validAdsenseClientId(import.meta.env.PUBLIC_ADSENSE_CLIENT_ID || '');
  const body = client
    ? `google.com, ${client.replace('ca-pub-', 'pub-')}, DIRECT, f08c47fec0942fa0\n`
    : [
        '# GarageIntel ads.txt',
        '# PUBLIC_ADSENSE_CLIENT_ID is not set, so no advertising seller is authorized.',
        '# A build with ca-pub-123 writes a line like:',
        '# google.com, pub-123, DIRECT, f08c47fec0942fa0',
        '',
      ].join('\n');
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
