// Cloudflare Worker entry. Static files are served from the repo by the assets
// setting in wrangler.jsonc; this file handles the www redirect and /api/*.

import { onRequestPost } from './functions/api/request-call.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // www.golflessonnearme.com -> golflessonnearme.com, keeping path and query string.
    if (url.hostname.startsWith('www.')) {
      url.hostname = url.hostname.slice(4);
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === '/api/request-call') {
      if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
      }
      return onRequestPost({ request, env });
    }

    if (url.pathname.startsWith('/api/')) {
      return new Response('Not found', { status: 404 });
    }

    return env.ASSETS.fetch(request);
  },
};
