export interface VenueInfo {
  id: string;
  name: string;
}

export interface RemotePlayer {
  playerId: string;
  name: string;
  score: number;
  isCurrentPlayer: boolean;
}

export interface RemoteScoreState {
  legId: string;
  matchId: string | null;
  winnerName: string | null;
  players: RemotePlayer[];
  isLegFinished: boolean;
  isMatchFinished: boolean;
  updatedAt: string;
}
