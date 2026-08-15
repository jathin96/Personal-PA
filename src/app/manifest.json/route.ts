import { NextResponse } from 'next/server';

export async function GET() {
  const manifest = {
    name: 'PA Assistant',
    short_name: 'PA',
    description: 'Your AI-powered personal task assistant',
    start_url: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#7c3aed',
    orientation: 'any',
    icons: [
      {
        src: '/icons/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
      {
        src: '/icons/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
    ],
  };
  return NextResponse.json(manifest, {
    headers: { 'Content-Type': 'application/manifest+json' },
  });
}
