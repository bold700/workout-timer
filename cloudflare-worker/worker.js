/**
 * Sonos OAuth2 Proxy Worker for Cloudflare Workers
 * 
 * This worker handles the token exchange securely, keeping the client_secret
 * on the server side.
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Go to https://dash.cloudflare.com/ and create a Workers account (free tier available)
 * 2. Create a new Worker called "workout-timer-sonos-proxy"
 * 3. Copy this code into the worker
 * 4. Add these environment variables in the Worker settings:
 *    - SONOS_CLIENT_ID: 24980fc6-b0b3-43d0-982a-0e4314c9e2c4
 *    - SONOS_CLIENT_SECRET: 6c6e1f18-c81e-4063-acd5-92b6cbe2525a
 * 5. Deploy the worker
 * 6. Your worker URL will be: https://workout-timer-sonos-proxy.{your-subdomain}.workers.dev
 * 7. Update the URLs in sonosAuth.ts to match your worker URL
 */

const SONOS_TOKEN_URL = 'https://api.sonos.com/login/v3/oauth/access';
const ALLOWED_ORIGINS = [
  'https://bold700.github.io',
  'http://localhost:5173',
  'http://localhost:3000',
];

// CORS headers helper
function corsHeaders(origin) {
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// Handle preflight requests
function handleOptions(request) {
  const origin = request.headers.get('Origin') || '';
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

// Exchange authorization code for tokens
async function handleTokenExchange(request, env) {
  const origin = request.headers.get('Origin') || '';
  const { code, redirect_uri } = await request.json();

  if (!code || !redirect_uri) {
    return new Response(JSON.stringify({ error: 'Missing code or redirect_uri' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(origin),
      },
    });
  }

  const credentials = btoa(`${env.SONOS_CLIENT_ID}:${env.SONOS_CLIENT_SECRET}`);

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirect_uri,
  });

  try {
    const response = await fetch(SONOS_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        'Authorization': `Basic ${credentials}`,
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Token exchange failed', details: data }), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(origin),
        },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(origin),
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Request failed', message: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(origin),
      },
    });
  }
}

// Refresh access token
async function handleTokenRefresh(request, env) {
  const origin = request.headers.get('Origin') || '';
  const { refresh_token } = await request.json();

  if (!refresh_token) {
    return new Response(JSON.stringify({ error: 'Missing refresh_token' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(origin),
      },
    });
  }

  const credentials = btoa(`${env.SONOS_CLIENT_ID}:${env.SONOS_CLIENT_SECRET}`);

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refresh_token,
  });

  try {
    const response = await fetch(SONOS_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        'Authorization': `Basic ${credentials}`,
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Token refresh failed', details: data }), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(origin),
        },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(origin),
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Request failed', message: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(origin),
      },
    });
  }
}

// Main request handler
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    // Route requests
    if (request.method === 'POST') {
      if (path === '/token') {
        return handleTokenExchange(request, env);
      }
      if (path === '/refresh') {
        return handleTokenRefresh(request, env);
      }
    }

    // Health check
    if (path === '/' || path === '/health') {
      return new Response(JSON.stringify({ status: 'ok', service: 'workout-timer-sonos-proxy' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not Found', { status: 404 });
  },
};
