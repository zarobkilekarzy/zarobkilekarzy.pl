import type { APIRoute } from 'astro';
import { robotsTxt } from '@/lib/seo';

/**
 * robots.txt — część wynikająca z buildu (sitemap z `site`). Blok dla botów AI (Content Signals)
 * dokleja przed nim Cloudflare („managed robots.txt”) — zob. lib/seo/robots.ts.
 */
export const GET: APIRoute = ({ site }) =>
  new Response(robotsTxt(site!), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
