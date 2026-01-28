import { Trophy, TrendingUp, Target } from 'lucide-react';
import { Player } from '../types/game';

interface PlayerCardProps {
  player: Player;
  isActive: boolean;
  startingScore: number;
}

export default function PlayerCard({ player, isActive, startingScore }: PlayerCardProps) {
  const dartsThrown = player.turns.reduce((acc, turn) => acc + turn.throws.length, 0);
  const totalScored = startingScore - player.score;

  return (
    <div
      className={`bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border-2 transition-all ${
        isActive
          ? 'border-emerald-500 shadow-lg shadow-emerald-500/20 scale-[1.02]'
          : 'border-slate-700/50'
      } ${player.isWinner ? 'ring-2 ring-yellow-500 ring-offset-2 ring-offset-slate-900' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-bold text-white">{player.name}</h3>
            {player.isWinner && <Trophy className="w-5 h-5 text-yellow-500" />}
          </div>
          {isActive && (
            <span className="inline-block px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded">
              Current Player
            </span>
          )}
        </div>
      </div>

      <div className="mb-6">
        <div className="text-5xl font-bold text-white mb-1">{player.score}</div>
        <div className="text-sm text-slate-400">Points Remaining</div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-700/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-blue-400" />
            <div className="text-xs text-slate-400">Average</div>
          </div>
          <div className="text-lg font-bold text-white">
            {player.average.toFixed(1)}
          </div>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <div className="text-xs text-slate-400">Highest</div>
          </div>
          <div className="text-lg font-bold text-white">{player.highestScore}</div>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-1">Darts</div>
          <div className="text-lg font-bold text-white">{dartsThrown}</div>
        </div>
      </div>

      {player.turns.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="text-xs text-slate-400 mb-2">Recent Turns</div>
          <div className="flex gap-2 overflow-x-auto">
            {player.turns.slice(-5).reverse().map((turn, index) => (
              <div
                key={index}
                className="flex-shrink-0 bg-slate-700/30 rounded px-3 py-1.5 text-center"
              >
                <div className="text-sm font-bold text-white">{turn.totalScore}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
