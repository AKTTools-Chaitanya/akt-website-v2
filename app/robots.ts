import type { MetadataRoute } from 'next';
import { config } from '@/lib/config';

/**
 * Dynamic robots.txt. On staging (indexable=false) the whole site is disallowed → prod SEO never
 * leaks. On prod: allow crawl, block non-indexable app routes and faceted params, explicitly allow
 * AI-search crawlers (GPTBot, PerplexityBot, ClaudeBot, Google-Extended), declare the sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  if (!config.indexable) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/cart', '/checkout', '/account', '/wishlist', '/api/', '/*?sort=', '/*?page='],
      },
      // AI-search / LLM crawlers — deliberately allowed for brand + entity visibility.
      {
        userAgent: ['GPTBot', 'OAI-SearchBot', 'PerplexityBot', 'ClaudeBot', 'Claude-Web', 'Google-Extended'],
        allow: '/',
      },
    ],
    sitemap: `${config.siteUrl}/sitemap.xml`,
    host: config.siteUrl,
  };
}
