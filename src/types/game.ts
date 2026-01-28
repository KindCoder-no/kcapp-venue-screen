export type GameType = '501' | '301' | '701';

export type MultiplierType = 'single' | 'double' | 'triple';

export interface DartThrow {
  sector: number;
  multiplier: MultiplierType;
  score: number;
}

export interface Turn {
  throws: DartThrow[];
  totalScore: number;
  remainingScore: number;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  turns: Turn[];
  isWinner: boolean;
  average: number;
  highestScore: number;
}

export interface GameState {
  gameType: GameType;
  players: Player[];
  currentPlayerIndex: number;
  currentThrows: DartThrow[];
  isGameOver: boolean;
  winner: Player | null;
}
