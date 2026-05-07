import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import VenueSetup from './components/VenueSetup';
import RemoteMatchBoard from './components/RemoteMatchBoard';
import { createLegSocket, createVenueSocket } from './lib/kcapp';
import { RemotePlayer, RemoteScoreState, VenueInfo } from './types/kcapp';

type RawRecord = Record<string, unknown>;

interface KcappScoreEvent {
  players?: unknown;
  leg?: unknown;
  match?: unknown;
}

const readString = (value: unknown): string | null => {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return null;
};

const readBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1';
  }
  return false;
};

const readNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const parsePlayers = (payload: unknown): RemotePlayer[] => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((entry, index) => {
    const item = entry as RawRecord;
    const playerId = readString(item.player_id ?? item.id) ?? `player-${index}`;
    const name =
      readString(item.name) ??
      readString(item.display_name) ??
      readString(item.player_name) ??
      `Player ${index + 1}`;

    return {
      playerId,
      name,
      score: readNumber(item.current_score ?? item.score ?? item.remaining_score),
      isCurrentPlayer: readBoolean(item.is_current_player),
    };
  });
};

const readWinnerName = (event: KcappScoreEvent, players: RemotePlayer[]): string | null => {
  const match = (event.match ?? {}) as RawRecord;
  const winner = (match.winner ?? {}) as RawRecord;

  const explicitWinnerName =
    readString(match.winner_name) ??
    readString(match.winnerName) ??
    readString(winner.name) ??
    readString(winner.display_name) ??
    readString(winner.player_name);

  if (explicitWinnerName) {
    return explicitWinnerName;
  }

  const winnerId =
    readString(match.winner_id) ??
    readString(match.winnerId) ??
    readString(winner.player_id) ??
    readString(winner.id);

  if (winnerId) {
    const matchingPlayer = players.find((player) => player.playerId === winnerId);
    if (matchingPlayer) {
      return matchingPlayer.name;
    }
  }

  return players.find((player) => player.score === 0)?.name ?? null;
};

const parseScoreState = (payload: unknown, fallbackLegId: string): RemoteScoreState | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const event = payload as KcappScoreEvent;
  const leg = (event.leg ?? {}) as RawRecord;
  const match = (event.match ?? {}) as RawRecord;
  const legId = readString(leg.id) ?? fallbackLegId;
  const matchId = readString(match.id);
  const players = parsePlayers(event.players);
  const winnerName = readWinnerName(event, players);

  return {
    legId,
    matchId,
    winnerName,
    players,
    isLegFinished: readBoolean(leg.is_finished),
    isMatchFinished: readBoolean(match.is_finished),
    updatedAt: new Date().toISOString(),
  };
};

const readLegIdFromEvent = (payload: unknown): string | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const event = payload as RawRecord;
  const match = (event.match ?? {}) as RawRecord;
  const leg = (event.leg ?? {}) as RawRecord;

  return (
    readString(event.leg_id) ??
    readString(event.current_leg_id) ??
    readString(match.current_leg_id) ??
    readString(leg.id)
  );
};

const VENUE_STORAGE_KEY = 'kcapp_venue';

function App() {
  const [venue, setVenue] = useState<VenueInfo | null>(() => {
    const raw = localStorage.getItem(VENUE_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as VenueInfo;
      if (!parsed?.id) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });
  const [scoreState, setScoreState] = useState<RemoteScoreState | null>(null);
  const [connectionStatus, setConnectionStatus] = useState('Not connected');

  const venueSocketRef = useRef<Socket | null>(null);
  const legSocketRef = useRef<Socket | null>(null);
  const matchResetTimerRef = useRef<number | null>(null);

  const clearMatchResetTimer = () => {
    if (matchResetTimerRef.current !== null) {
      window.clearTimeout(matchResetTimerRef.current);
      matchResetTimerRef.current = null;
    }
  };

  const disconnectLegSocket = () => {
    if (legSocketRef.current) {
      legSocketRef.current.disconnect();
      legSocketRef.current = null;
    }
  };

  const connectLegSocket = (legId: string) => {
    disconnectLegSocket();
    setConnectionStatus(`Connected to venue. Joining leg ${legId}...`);

    const socket = createLegSocket(legId);
    legSocketRef.current = socket;

    socket.on('connect', () => {
      setConnectionStatus(`Live scoring connected for leg ${legId}`);
      socket.emit('join');
    });

    socket.on('score_update', (payload: unknown) => {
      const state = parseScoreState(payload, legId);
      if (state) {
        setScoreState(state);
      }
    });

    socket.on('connected', (payload: unknown) => {
      const state = parseScoreState(payload, legId);
      if (state) {
        setScoreState(state);
      }
    });

    socket.on('new_leg', (payload: unknown) => {
      const nextLegId = readLegIdFromEvent(payload);
      if (nextLegId) {
        connectLegSocket(nextLegId);
      }
    });

    socket.on('leg_finished', (payload: unknown) => {
      const state = parseScoreState(payload, legId);
      if (state) {
        setScoreState(state);
      } else {
        setScoreState((current) => {
          if (!current) {
            return null;
          }
          return {
            ...current,
            isLegFinished: true,
            updatedAt: new Date().toISOString(),
          };
        });
      }
      setConnectionStatus('Leg finished. Waiting for next leg...');
    });

    socket.on('disconnect', () => {
      setConnectionStatus('Disconnected from leg updates. Reconnecting...');
    });
  };

  useEffect(() => {
    if (!venue) {
      return;
    }

    setConnectionStatus(`Connecting to venue ${venue.id}...`);
    const socket = createVenueSocket(venue.id);
    venueSocketRef.current = socket;

    socket.on('connect', () => {
      setConnectionStatus('Connected to venue. Waiting for remote match...');
    });

    const onRemoteMatch = (payload: unknown) => {
      clearMatchResetTimer();
      setScoreState(null);
      const legId = readLegIdFromEvent(payload);
      if (legId) {
        connectLegSocket(legId);
      } else {
        setConnectionStatus('Remote match started, waiting for leg details...');
      }
    };

    socket.on('start_remote', onRemoteMatch);
    socket.on('venue_new_match', onRemoteMatch);
    socket.on('disconnect', () => {
      setConnectionStatus('Disconnected from venue. Reconnecting...');
    });

    return () => {
      clearMatchResetTimer();
      socket.disconnect();
      venueSocketRef.current = null;
      disconnectLegSocket();
    };
  }, [venue]);

  useEffect(() => {
    if (!scoreState?.isMatchFinished) {
      clearMatchResetTimer();
      return;
    }

    if (matchResetTimerRef.current !== null) {
      return;
    }

    setConnectionStatus('Match finished. Celebration ends in 30 seconds...');
    matchResetTimerRef.current = window.setTimeout(() => {
      matchResetTimerRef.current = null;
      setScoreState(null);
      disconnectLegSocket();
      setConnectionStatus('Connected to venue. Waiting for remote match...');
    }, 30000);
  }, [scoreState?.isMatchFinished]);

  const submitThrow = (legId: string, playerId: string, darts: { value: number; multiplier: number }[]) => {
    const socket = legSocketRef.current;
    if (!socket) {
      return;
    }

    const miss = { value: 0, multiplier: 1 };
    const padded = [
      darts[0] ?? miss,
      darts[1] ?? miss,
      darts[2] ?? miss,
    ];

    const payload = {
      player_id: Number(playerId),
      leg_id: Number(legId),
      first_dart: padded[0],
      second_dart: padded[1],
      third_dart: padded[2],
    };

    socket.emit('throw', JSON.stringify(payload));
  };

  const handleVenueSelected = (selectedVenue: VenueInfo) => {
    localStorage.setItem(VENUE_STORAGE_KEY, JSON.stringify(selectedVenue));
    setVenue(selectedVenue);
  };

  const handleManualSelectLeg = (legId: string) => {
    clearMatchResetTimer();
    setScoreState(null);
    connectLegSocket(legId);
  };

  if (!venue) {
    return (
      <VenueSetup
        onVenueSelected={handleVenueSelected}
      />
    );
  }

  return (
    <RemoteMatchBoard
      venue={venue}
      scoreState={scoreState}
      connectionStatus={connectionStatus}
      onSubmitThrow={submitThrow}
      onManualSelectLeg={handleManualSelectLeg}
    />
  );
}

export default App;
