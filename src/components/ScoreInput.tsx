import { useState, useEffect, useCallback } from 'react';
import { Target, X, Check, RotateCcw, Keyboard, Trophy } from 'lucide-react';
import { DartThrow, MultiplierType } from '../types/game';

interface ScoreInputProps {
  currentThrows: DartThrow[];
  onAddThrow: (dartThrow: DartThrow) => void;
  onRemoveThrow: () => void;
  onSubmitTurn: () => void;
  onMiss: () => void;
}

export default function ScoreInput({
  currentThrows,
  onAddThrow,
  onRemoveThrow,
  onSubmitTurn,
  onMiss,
}: ScoreInputProps) {
  const [multiplier, setMultiplier] = useState<MultiplierType>('single');
  const [keyboardInput, setKeyboardInput] = useState<string>('');
  const [keyboardMultiplier, setKeyboardMultiplier] = useState<MultiplierType>('single');
  const [showCelebration, setShowCelebration] = useState(false);

  const sectors = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5, 25];

  const handleSectorClick = (sector: number) => {
    if (currentThrows.length < 3) {
      const score = sector === 25
        ? multiplier === 'double' ? 50 : 25
        : sector * (multiplier === 'single' ? 1 : multiplier === 'double' ? 2 : 3);

      onAddThrow({
        sector,
        multiplier,
        score,
      });
      setMultiplier('single');
    }
  };

  const handleMiss = () => {
    if (currentThrows.length < 3) {
      onMiss();
      setMultiplier('single');
    }
  };

  const getTurnScore = () => {
    return currentThrows.reduce((acc, dart) => acc + dart.score, 0);
  };

  const handleSubmitTurn = useCallback(() => {
    const turnScore = currentThrows.reduce((acc, dart) => acc + dart.score, 0);
    if (turnScore === 180) {
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        onSubmitTurn();
      }, 2000);
    } else {
      onSubmitTurn();
    }
  }, [currentThrows, onSubmitTurn]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        if (currentThrows.length >= 3) return;
        e.preventDefault();
        const newInput = keyboardInput + e.key;
        const numValue = parseInt(newInput);

        if (numValue <= 25) {
          setKeyboardInput(newInput);
        }
      } else if (e.key === '-' || e.key === '_') {
        if (currentThrows.length >= 3) return;
        e.preventDefault();
        setKeyboardMultiplier('triple');
      } else if (e.key === '+' || e.key === '=') {
        if (currentThrows.length >= 3) return;
        e.preventDefault();
        setKeyboardMultiplier('double');
      } else if (e.key === 'Enter') {
        e.preventDefault();

        if (keyboardInput) {
          if (currentThrows.length >= 3) return;
          const sector = parseInt(keyboardInput);

          if (sector === 0) {
            handleMiss();
          } else if (sector >= 1 && sector <= 25) {
            const score = sector === 25
              ? keyboardMultiplier === 'double' ? 50 : 25
              : sector * (keyboardMultiplier === 'single' ? 1 : keyboardMultiplier === 'double' ? 2 : 3);

            onAddThrow({
              sector,
              multiplier: keyboardMultiplier,
              score,
            });
          }

          setKeyboardInput('');
          setKeyboardMultiplier('single');
        } else if (currentThrows.length > 0) {
          handleSubmitTurn();
        }
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        if (keyboardMultiplier !== 'single') {
          setKeyboardMultiplier('single');
        } else {
          setKeyboardInput(keyboardInput.slice(0, -1));
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setKeyboardInput('');
        setKeyboardMultiplier('single');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyboardInput, keyboardMultiplier, currentThrows, onAddThrow, onMiss, handleSubmitTurn]);

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white">Score Entry</h3>
        </div>
        <div className="text-2xl font-bold text-emerald-400">{getTurnScore()}</div>
      </div>

      {keyboardInput && (
        <div className="mb-4 p-4 bg-blue-500/20 border-2 border-blue-500 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-blue-400 font-medium">Keyboard Input</span>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">
                {keyboardMultiplier === 'triple' && 'T'}
                {keyboardMultiplier === 'double' && 'D'}
                {keyboardInput}
              </div>
              <div className="text-xs text-blue-300 mt-1">
                {keyboardMultiplier === 'single' && 'Press - for Triple, + for Double'}
                {keyboardMultiplier === 'triple' && 'Triple • Press Enter to confirm'}
                {keyboardMultiplier === 'double' && 'Double • Press Enter to confirm'}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="flex gap-2 h-16">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className={`flex-1 rounded-lg border-2 border-dashed flex items-center justify-center ${
                currentThrows[index]
                  ? 'bg-emerald-500/20 border-emerald-500'
                  : 'bg-slate-700/30 border-slate-600'
              }`}
            >
              {currentThrows[index] ? (
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {currentThrows[index].score}
                  </div>
                  <div className="text-xs text-slate-400">
                    {currentThrows[index].multiplier === 'triple' && 'T'}
                    {currentThrows[index].multiplier === 'double' && 'D'}
                    {currentThrows[index].sector}
                  </div>
                </div>
              ) : (
                <div className="text-3xl text-slate-600">-</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Multiplier
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['single', 'double', 'triple'] as MultiplierType[]).map((mult) => (
            <button
              key={mult}
              onClick={() => setMultiplier(mult)}
              className={`py-2 px-4 rounded-lg font-semibold transition-all ${
                multiplier === mult
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {mult.charAt(0).toUpperCase() + mult.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Select Sector
        </label>
        <div className="grid grid-cols-7 gap-2">
          {sectors.map((sector) => (
            <button
              key={sector}
              onClick={() => handleSectorClick(sector)}
              disabled={currentThrows.length >= 3}
              className={`aspect-square rounded-lg font-bold transition-all ${
                sector === 25
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border-2 border-red-500/50'
                  : 'bg-slate-700/50 text-white hover:bg-slate-700'
              } disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110`}
            >
              {sector}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleMiss}
          disabled={currentThrows.length >= 3}
          className="flex-1 bg-slate-700/50 text-slate-300 py-3 px-4 rounded-lg font-semibold hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <X className="w-5 h-5" />
          Miss
        </button>
        <button
          onClick={onRemoveThrow}
          disabled={currentThrows.length === 0}
          className="bg-orange-500/20 text-orange-400 py-3 px-4 rounded-lg font-semibold hover:bg-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button
          onClick={handleSubmitTurn}
          disabled={currentThrows.length === 0}
          className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 px-4 rounded-lg font-semibold shadow-lg hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" />
          Submit Turn
        </button>
      </div>

      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative">
            <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-2xl p-8 shadow-2xl transform animate-scaleIn">
              <div className="text-center">
                <Trophy className="w-20 h-20 text-white mx-auto mb-4 animate-bounce" />
                <h2 className="text-5xl font-bold text-white mb-2">180!</h2>
                <p className="text-xl text-white/90">MAXIMUM!</p>
              </div>
            </div>
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 rounded-full animate-confetti"
                style={{
                  left: '50%',
                  top: '50%',
                  backgroundColor: ['#fbbf24', '#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6'][i % 6],
                  animationDelay: `${i * 0.05}s`,
                  transform: `rotate(${i * 18}deg) translateX(${100 + i * 10}px)`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-slate-700/30 rounded-lg border border-slate-600/50">
        <div className="flex items-start gap-2">
          <Keyboard className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-slate-400 leading-relaxed">
            <span className="font-semibold text-slate-300">Keyboard Shortcuts:</span> Type number
            <span className="mx-1 px-1.5 py-0.5 bg-slate-600/50 rounded font-mono">20</span>
            then press
            <span className="mx-1 px-1.5 py-0.5 bg-slate-600/50 rounded font-mono">-</span>
            for Triple or
            <span className="mx-1 px-1.5 py-0.5 bg-slate-600/50 rounded font-mono">+</span>
            for Double, then
            <span className="mx-1 px-1.5 py-0.5 bg-slate-600/50 rounded font-mono">Enter</span>
            to add dart. Press
            <span className="mx-1 px-1.5 py-0.5 bg-slate-600/50 rounded font-mono">Enter</span>
            again to submit turn. Type
            <span className="mx-1 px-1.5 py-0.5 bg-slate-600/50 rounded font-mono">0</span>
            <span className="mx-1 px-1.5 py-0.5 bg-slate-600/50 rounded font-mono">Enter</span>
            for miss.
          </div>
        </div>
      </div>
    </div>
  );
}
