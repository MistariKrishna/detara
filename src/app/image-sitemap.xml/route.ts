import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const images = [
    {
      url: `${baseUrl}/assets/images/file_000000004f747208abb644f0cadec060-1773492339421.png`,
      title: 'DETARA Logo',
      caption: 'DETARA — European Diamond Jewelry',
    },
    {
      url: `${baseUrl}/assets/images/file_000000004f747208abb644f0cadec060-1773483679682.png`,
      title: 'DETARA Brand Image',
      caption: 'Precision-crafted diamond jewelry',
    },
    {
      url: `${baseUrl}/assets/images/1000020526-1776717108239.jpg`,
      title: 'Diamond Jewelry Collection',
      caption: 'DETARA diamond jewelry collection',
    },
    {
      url: `${baseUrl}/assets/images/1000018091-1776115875572.jpg`,
      title: 'Diamond Engagement Ring',
      caption: 'Precision-cut diamond engagement ring',
    },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${images?.map(
      (img) => `
  <url>
    <loc>${baseUrl}</loc>
    <image:image>
      <image:loc>${img?.url}</image:loc>
      <image:title>${img?.title}</image:title>
      <image:caption>${img?.caption}</image:caption>
    </image:image>
  </url>
  `
    )?.join('')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
