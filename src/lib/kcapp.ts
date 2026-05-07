import { io, Socket } from 'socket.io-client';

interface VenuePlayer {
  id?: string | number;
  player_id?: string | number;
  name?: string;
  display_name?: string;
}

interface VenueRecord {
  id?: string | number;
  venue_id?: string | number;
  name?: string;
  display_name?: string;
}

export interface BasicAuthCredentials {
  username: string;
  password: string;
}

const normalizeBaseUrl = (value: string) => value.replace(/\/$/, '');

const defaultHost =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}`
    : 'http://localhost';

const defaultApiBase = `${defaultHost}:8001`;
const defaultVenueListUrl =
  typeof window !== 'undefined' ? `${window.location.origin}/api/venue` : '/api/venue';

const apiBaseUrl = normalizeBaseUrl(import.meta.env.VITE_KCAPP_API_BASE ?? defaultApiBase);
const socketBaseUrl = normalizeBaseUrl(import.meta.env.VITE_KCAPP_SOCKET_URL ?? apiBaseUrl);
const venueListUrl = import.meta.env.VITE_KCAPP_VENUE_LIST_URL ?? defaultVenueListUrl;
const envBasicAuthUsername = import.meta.env.VITE_KCAPP_BASIC_AUTH_USERNAME;
const envBasicAuthPassword = import.meta.env.VITE_KCAPP_BASIC_AUTH_PASSWORD;

const defaultBasicAuthCredentials: BasicAuthCredentials | undefined =
  envBasicAuthUsername && envBasicAuthPassword
    ? {
        username: envBasicAuthUsername,
        password: envBasicAuthPassword,
      }
    : undefined;

const resolveName = (player: VenuePlayer): string => {
  if (typeof player.display_name === 'string' && player.display_name.trim()) {
    return player.display_name;
  }
  if (typeof player.name === 'string' && player.name.trim()) {
    return player.name;
  }
  const id = player.player_id ?? player.id;
  return `Player ${id ?? '?'}`;
};

const resolveId = (player: VenuePlayer): string => {
  const id = player.player_id ?? player.id;
  return String(id ?? 'unknown');
};

const resolveVenueName = (venue: VenueRecord): string => {
  if (typeof venue.display_name === 'string' && venue.display_name.trim()) {
    return venue.display_name;
  }
  if (typeof venue.name === 'string' && venue.name.trim()) {
    return venue.name;
  }
  const id = venue.venue_id ?? venue.id;
  return `Venue ${id ?? '?'}`;
};

const resolveVenueId = (venue: VenueRecord): string => {
  const id = venue.id ?? venue.venue_id;
  return String(id ?? 'unknown');
};

const toBasicAuthHeader = (credentials?: BasicAuthCredentials): string | undefined => {
  if (!credentials) {
    return undefined;
  }

  const username = credentials.username.trim();
  const password = credentials.password;

  if (!username || !password) {
    return undefined;
  }

  return `Basic ${btoa(`${username}:${password}`)}`;
};

const buildAuthHeaders = (credentials?: BasicAuthCredentials): HeadersInit => {
  const authHeader = toBasicAuthHeader(credentials ?? defaultBasicAuthCredentials);
  return authHeader ? { Authorization: authHeader } : {};
};

export const kcappConfig = {
  apiBaseUrl,
  socketBaseUrl,
  venueListUrl,
  basicAuthConfigured: Boolean(defaultBasicAuthCredentials),
};

export const createVenueSocket = (venueId: string): Socket => {
  return io(`${socketBaseUrl}/venue/${venueId}`, {
    transports: ['websocket', 'polling'],
  });
};

export const createLegSocket = (legId: string): Socket => {
  return io(`${socketBaseUrl}/legs/${legId}`, {
    transports: ['websocket', 'polling'],
  });
};

export interface CheckoutDart {
  value: number;
  multiplier: number;
}

export const fetchCheckout = async (score: number): Promise<CheckoutDart[][]> => {
  if (score <= 1 || score > 170) {
    return [];
  }

  const response = await fetch(`${apiBaseUrl}/checkout/${score}`, {
    headers: buildAuthHeaders(),
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload as CheckoutDart[][];
};

export const fetchVenuePlayers = async (
  venueId: string,
  credentials?: BasicAuthCredentials,
): Promise<Array<{ id: string; name: string }>> => {
  const response = await fetch(`${apiBaseUrl}/venue/${venueId}/players`, {
    headers: buildAuthHeaders(credentials),
  });

  if (!response.ok) {
    throw new Error('Could not load venue players');
  }

  const payload = (await response.json()) as unknown;

  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((entry) => {
    const player = entry as VenuePlayer;
    return {
      id: resolveId(player),
      name: resolveName(player),
    };
  });
};

export const fetchVenues = async (
  credentials?: BasicAuthCredentials,
): Promise<Array<{ id: string; name: string }>> => {
  const response = await fetch(venueListUrl, {
    headers: buildAuthHeaders(credentials),
  });

  if (!response.ok) {
    throw new Error('Could not load venues');
  }

  const payload = (await response.json()) as unknown;

  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((entry) => {
    const venue = entry as VenueRecord;
    return {
      id: resolveVenueId(venue),
      name: resolveVenueName(venue),
    };
  });
};
