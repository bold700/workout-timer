// Sonos OAuth2 Configuration
// IMPORTANT: In production, token exchange should happen server-side
// For this app, we use a serverless proxy or local development

import { Capacitor } from '@capacitor/core';

const SONOS_CLIENT_ID = '24980fc6-b0b3-43d0-982a-0e4314c9e2c4';
const SONOS_AUTH_URL = 'https://api.sonos.com/login/v3/oauth';

// Dynamische redirect URI: gebruik altijd HTTPS URL (Sonos vereist https://)
// De callback pagina redirect automatisch naar de app als die beschikbaar is
function getRedirectUri(): string {
  // Voor native apps: gebruik GitHub Pages callback URL
  // De callback pagina detecteert automatisch of het in een app is en redirect naar deep link
  if (Capacitor.isNativePlatform()) {
    return 'https://bold700.github.io/workout-timer/callback';
  }
  // Voor web: gebruik de huidige origin + /callback
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  // Als we in een subdirectory zitten (zoals /workout-timer/), gebruik die
  const basePath = pathname.split('/').slice(0, -1).join('/') || '';
  return `${origin}${basePath}/callback`;
}

const SONOS_REDIRECT_URI = getRedirectUri();

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'sonos_access_token',
  REFRESH_TOKEN: 'sonos_refresh_token',
  TOKEN_EXPIRY: 'sonos_token_expiry',
  HOUSEHOLD_ID: 'sonos_household_id',
  GROUP_ID: 'sonos_group_id',
};

export interface SonosTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// Generate random state for CSRF protection
function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Start OAuth flow - redirect to Sonos login
export function startSonosAuth(): void {
  const state = generateState();
  sessionStorage.setItem('sonos_oauth_state', state);

  // Log de redirect URI voor debugging
  console.log('Sonos OAuth - Redirect URI:', SONOS_REDIRECT_URI);
  console.log('Sonos OAuth - Is Native Platform:', Capacitor.isNativePlatform());

  const params = new URLSearchParams({
    client_id: SONOS_CLIENT_ID,
    response_type: 'code',
    redirect_uri: SONOS_REDIRECT_URI,
    scope: 'playback-control-all',
    state: state,
  });

  const authUrl = `${SONOS_AUTH_URL}?${params.toString()}`;
  console.log('Sonos OAuth - Full Auth URL:', authUrl);
  
  window.location.href = authUrl;
}

// Handle OAuth callback - exchange code for tokens
// NOTE: This requires a serverless proxy because we can't expose client_secret in frontend
export async function handleSonosCallback(code: string, state: string): Promise<boolean> {
  const savedState = sessionStorage.getItem('sonos_oauth_state');
  
  if (state !== savedState) {
    console.error('OAuth state mismatch - possible CSRF attack');
    return false;
  }

  sessionStorage.removeItem('sonos_oauth_state');

  try {
    // Call our serverless proxy to exchange the code for tokens
    // The proxy keeps the client_secret secure
    const response = await fetch('https://sonos-proxy.morning-wood-5814.workers.dev/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        redirect_uri: SONOS_REDIRECT_URI,
      }),
    });

    if (!response.ok) {
      throw new Error('Token exchange failed');
    }

    const data = await response.json();
    
    const tokens: SonosTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
    };

    saveTokens(tokens);
    return true;
  } catch (error) {
    console.error('Failed to exchange code for tokens:', error);
    return false;
  }
}

// Save tokens to localStorage
function saveTokens(tokens: SonosTokens): void {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
  localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, tokens.expiresAt.toString());
}

// Get stored tokens
export function getStoredTokens(): SonosTokens | null {
  const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  const expiresAt = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);

  if (!accessToken || !refreshToken || !expiresAt) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
    expiresAt: parseInt(expiresAt, 10),
  };
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  const tokens = getStoredTokens();
  return tokens !== null && tokens.expiresAt > Date.now();
}

// Refresh access token if needed
export async function refreshAccessToken(): Promise<string | null> {
  const tokens = getStoredTokens();
  
  if (!tokens) {
    return null;
  }

  // If token is still valid for more than 5 minutes, return it
  if (tokens.expiresAt > Date.now() + 5 * 60 * 1000) {
    return tokens.accessToken;
  }

  try {
    const response = await fetch('https://sonos-proxy.morning-wood-5814.workers.dev/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: tokens.refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    
    const newTokens: SonosTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || tokens.refreshToken,
      expiresAt: Date.now() + (data.expires_in * 1000),
    };

    saveTokens(newTokens);
    return newTokens.accessToken;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    return null;
  }
}

// Get valid access token (refreshes if needed)
export async function getValidAccessToken(): Promise<string | null> {
  return refreshAccessToken();
}

// Logout - clear all Sonos data
export function logoutSonos(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}

// Save selected household
export function saveHouseholdId(householdId: string): void {
  localStorage.setItem(STORAGE_KEYS.HOUSEHOLD_ID, householdId);
}

// Get selected household
export function getHouseholdId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.HOUSEHOLD_ID);
}

// Save selected group
export function saveGroupId(groupId: string): void {
  localStorage.setItem(STORAGE_KEYS.GROUP_ID, groupId);
}

// Get selected group
export function getGroupId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.GROUP_ID);
}
