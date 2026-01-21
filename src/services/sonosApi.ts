// Sonos Control API Service
import { getValidAccessToken, getHouseholdId, getGroupId } from './sonosAuth';

const SONOS_API_BASE = 'https://api.ws.sonos.com/control/api/v1';

// Types
export interface SonosHousehold {
  id: string;
  name: string;
}

export interface SonosGroup {
  id: string;
  name: string;
  coordinatorId: string;
  playbackState: string;
  playerIds: string[];
}

export interface SonosPlayer {
  id: string;
  name: string;
  websocketUrl: string;
  softwareVersion: string;
  apiVersion: string;
  minApiVersion: string;
  capabilities: string[];
}

export interface SonosGroupVolume {
  volume: number;
  muted: boolean;
  fixed: boolean;
}

// Generic API call helper
async function sonosApiCall<T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: object
): Promise<T | null> {
  const accessToken = await getValidAccessToken();
  
  if (!accessToken) {
    console.error('No valid access token available');
    return null;
  }

  try {
    const response = await fetch(`${SONOS_API_BASE}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Sonos API error: ${response.status} - ${errorText}`);
      return null;
    }

    // Some endpoints return empty response
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error('Sonos API call failed:', error);
    return null;
  }
}

// Get all households
export async function getHouseholds(): Promise<SonosHousehold[]> {
  const response = await sonosApiCall<{ households: SonosHousehold[] }>('/households');
  return response?.households || [];
}

// Get groups in a household
export async function getGroups(householdId?: string): Promise<SonosGroup[]> {
  const hId = householdId || getHouseholdId();
  if (!hId) {
    console.error('No household ID available');
    return [];
  }

  const response = await sonosApiCall<{ groups: SonosGroup[] }>(`/households/${hId}/groups`);
  return response?.groups || [];
}

// Get players in a household
export async function getPlayers(householdId?: string): Promise<SonosPlayer[]> {
  const hId = householdId || getHouseholdId();
  if (!hId) {
    console.error('No household ID available');
    return [];
  }

  const response = await sonosApiCall<{ players: SonosPlayer[] }>(`/households/${hId}/groups`);
  return response?.players || [];
}

// Get group volume
export async function getGroupVolume(groupId?: string): Promise<SonosGroupVolume | null> {
  const gId = groupId || getGroupId();
  if (!gId) {
    console.error('No group ID available');
    return null;
  }

  return sonosApiCall<SonosGroupVolume>(`/groups/${gId}/groupVolume`);
}

// Set group volume (0-100)
export async function setGroupVolume(volume: number, groupId?: string): Promise<boolean> {
  const gId = groupId || getGroupId();
  if (!gId) {
    console.error('No group ID available');
    return false;
  }

  // Clamp volume between 0 and 100
  const clampedVolume = Math.max(0, Math.min(100, Math.round(volume)));

  const result = await sonosApiCall<object>(
    `/groups/${gId}/groupVolume`,
    'POST',
    { volume: clampedVolume }
  );

  return result !== null;
}

// Set relative volume change (-100 to +100)
export async function setRelativeVolume(volumeDelta: number, groupId?: string): Promise<boolean> {
  const gId = groupId || getGroupId();
  if (!gId) {
    console.error('No group ID available');
    return false;
  }

  const result = await sonosApiCall<object>(
    `/groups/${gId}/groupVolume/relative`,
    'POST',
    { volumeDelta: Math.round(volumeDelta) }
  );

  return result !== null;
}

// Mute/unmute group
export async function setGroupMute(muted: boolean, groupId?: string): Promise<boolean> {
  const gId = groupId || getGroupId();
  if (!gId) {
    console.error('No group ID available');
    return false;
  }

  const result = await sonosApiCall<object>(
    `/groups/${gId}/groupVolume/mute`,
    'POST',
    { muted }
  );

  return result !== null;
}

// Duck volume (lower temporarily) - this is what we need for "hold to talk"
// We'll store the original volume and restore it when released
let originalVolume: number | null = null;
let isDucked = false;

export async function duckVolume(duckLevel: number = 20, groupId?: string): Promise<boolean> {
  if (isDucked) {
    return true; // Already ducked
  }

  const gId = groupId || getGroupId();
  if (!gId) {
    console.error('No group ID available');
    return false;
  }

  // Get current volume
  const currentVolume = await getGroupVolume(gId);
  if (currentVolume === null) {
    return false;
  }

  // Store original volume
  originalVolume = currentVolume.volume;
  
  // Set to duck level
  const success = await setGroupVolume(duckLevel, gId);
  if (success) {
    isDucked = true;
  }
  
  return success;
}

export async function restoreVolume(groupId?: string): Promise<boolean> {
  if (!isDucked || originalVolume === null) {
    return true; // Not ducked, nothing to restore
  }

  const gId = groupId || getGroupId();
  if (!gId) {
    console.error('No group ID available');
    return false;
  }

  // Restore original volume
  const success = await setGroupVolume(originalVolume, gId);
  if (success) {
    isDucked = false;
    originalVolume = null;
  }

  return success;
}

export function getIsDucked(): boolean {
  return isDucked;
}

// Playback controls (bonus)
export async function play(groupId?: string): Promise<boolean> {
  const gId = groupId || getGroupId();
  if (!gId) return false;
  
  const result = await sonosApiCall<object>(`/groups/${gId}/playback/play`, 'POST');
  return result !== null;
}

export async function pause(groupId?: string): Promise<boolean> {
  const gId = groupId || getGroupId();
  if (!gId) return false;
  
  const result = await sonosApiCall<object>(`/groups/${gId}/playback/pause`, 'POST');
  return result !== null;
}

export async function togglePlayPause(groupId?: string): Promise<boolean> {
  const gId = groupId || getGroupId();
  if (!gId) return false;
  
  const result = await sonosApiCall<object>(`/groups/${gId}/playback/togglePlayPause`, 'POST');
  return result !== null;
}

export async function skipToNextTrack(groupId?: string): Promise<boolean> {
  const gId = groupId || getGroupId();
  if (!gId) return false;
  
  const result = await sonosApiCall<object>(`/groups/${gId}/playback/skipToNextTrack`, 'POST');
  return result !== null;
}

export async function skipToPreviousTrack(groupId?: string): Promise<boolean> {
  const gId = groupId || getGroupId();
  if (!gId) return false;
  
  const result = await sonosApiCall<object>(`/groups/${gId}/playback/skipToPreviousTrack`, 'POST');
  return result !== null;
}
