import { RotateCcw, Home } from 'lucide-react';
import { Player, GameType } from '../types/game';
import PlayerCard from './PlayerCard';
import ScoreInput from './ScoreInput';
import { DartThrow } from '../types/game';

interface GameBoardProps {
  players: Player[];
  currentPlayerIndex: number;
  currentThrows: DartThrow[];
  gameType: GameType;
  isGameOver: boolean;
  winner: Player | null;
  onAddThrow: (dartThrow: DartThrow) => void;
  onRemoveThrow: () => void;
  onSubmitTurn: () => void;
  onMiss: () => void;
  onNewGame: () => void;
  onBackToSetup: () => void;
}

export default function GameBoard({
  players,
  currentPlayerIndex,
  currentThrows,
  gameType,
  isGameOver,
  winner,
  onAddThrow,
  onRemoveThrow,
  onSubmitTurn,
  onMiss,
  onNewGame,
  onBackToSetup,
}: GameBoardProps) {
  const startingScore = parseInt(gameType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-4 mb-6 flex items-center justify-between border border-slate-700/50">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
              Game: {gameType}
            </h1>
            <p className="text-slate-400">
              {isGameOver
                ? `${winner?.name} wins!`
                : `${players[currentPlayerIndex]?.name}'s turn`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onNewGame}
              className="bg-slate-700/50 text-slate-300 py-2 px-4 rounded-lg font-semibold hover:bg-slate-700 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">New Game</span>
            </button>
            <button
              onClick={onBackToSetup}
              className="bg-slate-700/50 text-slate-300 py-2 px-4 rounded-lg font-semibold hover:bg-slate-700 flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Setup</span>
            </button>
          </div>
        </div>

        {isGameOver && winner && (
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50 rounded-xl p-6 mb-6 text-center">
            <div className="text-4xl md:text-5xl font-bold text-yellow-400 mb-2">
              {winner.name} Wins!
            </div>
            <p className="text-slate-300 text-lg">
              Finished with an average of {winner.average.toFixed(1)} per dart
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {players.map((player, index) => (
              <PlayerCard
                key={player.id}
                player={player}
                isActive={index === currentPlayerIndex && !isGameOver}
                startingScore={startingScore}
              />
            ))}
          </div>

          <div className="lg:col-span-1">
            {!isGameOver && (
              <div className="sticky top-6">
                <ScoreInput
                  currentThrows={currentThrows}
                  onAddThrow={onAddThrow}
                  onRemoveThrow={onRemoveThrow}
                  onSubmitTurn={onSubmitTurn}
                  onMiss={onMiss}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
