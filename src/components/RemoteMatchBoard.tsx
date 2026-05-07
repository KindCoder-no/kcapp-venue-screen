import { useEffect, useMemo, useState } from 'react';
import { Activity, Radio, Trophy } from 'lucide-react';
import { RemoteScoreState, VenueInfo } from '../types/kcapp';
import ScoreInput from './ScoreInput';
import { DartThrow, MultiplierType } from '../types/game';
import { CheckoutDart } from '../lib/kcapp';
import { getCheckoutSuggestions } from '../lib/checkoutSuggestions';

const multiplierToNumber = (m: MultiplierType): number => {
  if (m === 'double') return 2;
  if (m === 'triple') return 3;
  return 1;
};

const dartLabel = (dart: CheckoutDart): string => {
  const prefix = dart.multiplier === 3 ? 'T' : dart.multiplier === 2 ? 'D' : '';
  return `${prefix}${dart.value}`;
};

const dartColor = (dart: CheckoutDart): string => {
  if (dart.multiplier === 3) return 'bg-red-500/80 text-white';
  if (dart.multiplier === 2) return 'bg-amber-400/80 text-slate-900';
  return 'bg-slate-600 text-white';
};

interface RemoteMatchBoardProps {
  venue: VenueInfo;
  scoreState: RemoteScoreState | null;
  connectionStatus: string;
  onSubmitThrow: (legId: string, playerId: string, darts: { value: number; multiplier: number }[]) => void;
}

export default function RemoteMatchBoard({
  venue,
  scoreState,
  connectionStatus,
  onSubmitThrow,
}: RemoteMatchBoardProps) {
  const [currentThrows, setCurrentThrows] = useState<DartThrow[]>([]);

  const currentPlayer = scoreState?.players.find((p) => p.isCurrentPlayer);

  // Live remaining score: subtract darts already entered this turn
  const dartsTurnScore = currentThrows.reduce((acc, t) => acc + t.score, 0);
  const liveScore = currentPlayer ? Math.max(0, currentPlayer.score - dartsTurnScore) : null;
  const currentDart = Math.min(currentThrows.length + 1, 3) as 1 | 2 | 3;

  const checkouts = useMemo<CheckoutDart[][]>(() => {
    const score = liveScore ?? currentPlayer?.score ?? 0;
    if (score < 2 || score > 170) {
      return [];
    }

    return getCheckoutSuggestions(score, currentDart);
  }, [liveScore, currentPlayer?.score, currentDart]);

  // Clear throws when active player changes (turn submitted / score_update arrived)
  useEffect(() => {
    setCurrentThrows([]);
  }, [currentPlayer?.playerId]);

  const handleAddThrow = (dart: DartThrow) => {
    if (currentThrows.length < 3) {
      setCurrentThrows((prev) => [...prev, dart]);
    }
  };

  const handleMiss = () => {
    if (currentThrows.length < 3) {
      setCurrentThrows((prev) => [...prev, { sector: 0, multiplier: 'single', score: 0 }]);
    }
  };

  const handleRemoveThrow = () => {
    setCurrentThrows((prev) => prev.slice(0, -1));
  };

  const handleSubmitTurn = () => {
    if (!scoreState || !currentPlayer || currentThrows.length === 0) {
      return;
    }

    const darts = currentThrows.map((t) => ({
      value: t.sector,
      multiplier: multiplierToNumber(t.multiplier),
    }));

    onSubmitThrow(scoreState.legId, currentPlayer.playerId, darts);
    setCurrentThrows([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <header className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-slate-400 text-sm">Remote Venue Screen</p>
            <h1 className="text-3xl md:text-4xl font-bold text-white">{venue.name}</h1>
            <p className="text-slate-300 text-sm mt-1">Venue ID: {venue.id}</p>
          </div>
          <div className="px-4 py-3 rounded-xl bg-slate-700/40 border border-slate-600/50 min-w-64">
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
              <Radio className="w-4 h-4" />
              <span className="text-sm font-semibold">Connection</span>
            </div>
            <p className="text-sm text-slate-200">{connectionStatus}</p>
          </div>
        </header>

        {/* Waiting state */}
        {!scoreState && (
          <section className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 text-center">
            <Activity className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-2">Waiting for remote match</h2>
            <p className="text-slate-300">
              This screen will switch to live scoring when a match is started remotely.
            </p>
          </section>
        )}

        {scoreState && (
          <>
            {/* Leg / match meta */}
            <section className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-4 flex flex-wrap items-center gap-6 text-sm">
              <div><p className="text-slate-400">Leg</p><p className="text-white font-bold text-lg">{scoreState.legId}</p></div>
              <div><p className="text-slate-400">Match</p><p className="text-white font-semibold text-lg">{scoreState.matchId ?? 'Unknown'}</p></div>
              <div className="ml-auto"><p className="text-slate-400">Updated</p><p className="text-white font-semibold text-lg">{new Date(scoreState.updatedAt).toLocaleTimeString()}</p></div>
            </section>

            {scoreState.isLegFinished && (
              <section className="bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-4 flex items-center gap-3 text-yellow-300">
                <Trophy className="w-5 h-5" />
                <span>This leg is finished. Waiting for next leg or match event.</span>
              </section>
            )}

            {scoreState.isMatchFinished && (
              <section className="bg-orange-500/10 border border-orange-500/50 rounded-xl p-4 flex items-center gap-3 text-orange-300">
                <Trophy className="w-5 h-5" />
                <span>This match is finished. Waiting for a new remote match.</span>
              </section>
            )}

            <section className="grid lg:grid-cols-3 gap-6">
              {/* Players stacked vertically */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                {scoreState.players.map((player) => {
                  const isActive = player.isCurrentPlayer;
                  const displayScore = isActive && liveScore !== null ? liveScore : player.score;
                  const scoreChanged = isActive && liveScore !== null && liveScore !== player.score;

                  return (
                    <article
                      key={player.playerId}
                      className={`rounded-2xl border p-6 transition-all ${
                        isActive
                          ? 'bg-emerald-500/15 border-emerald-400 shadow-lg shadow-emerald-500/20'
                          : 'bg-slate-800/30 border-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <h3 className="text-2xl font-bold text-white">{player.name}</h3>
                        {isActive && (
                          <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
                            THROWING
                          </span>
                        )}
                      </div>

                      <div className="flex items-end gap-6 flex-wrap">
                        <div>
                          <p className="text-slate-400 text-sm mb-1">Remaining Score</p>
                          <p className={`text-7xl font-bold transition-colors ${scoreChanged ? 'text-emerald-300' : 'text-white'}`}>
                            {displayScore}
                          </p>
                        </div>

                        {/* Checkout suggestions for this player */}
                        {isActive && checkouts.length > 0 && (
                          <div className="mb-1">
                            <p className="text-slate-400 text-xs mb-2">Checkout</p>
                            <div className="flex flex-col gap-1.5">
                              {checkouts.slice(0, 3).map((combo, ci) => (
                                <div key={ci} className="flex gap-1.5">
                                  {combo.map((dart, di) => (
                                    <span
                                      key={di}
                                      className={`px-2 py-0.5 rounded text-xs font-bold ${dartColor(dart)}`}
                                    >
                                      {dartLabel(dart)}
                                    </span>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Score input */}
              {!scoreState.isLegFinished && !scoreState.isMatchFinished && (
                <div className="lg:col-span-1">
                  <div className="sticky top-6">
                    <ScoreInput
                      currentThrows={currentThrows}
                      onAddThrow={handleAddThrow}
                      onRemoveThrow={handleRemoveThrow}
                      onSubmitTurn={handleSubmitTurn}
                      onMiss={handleMiss}
                    />
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
