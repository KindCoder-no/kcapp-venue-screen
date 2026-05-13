import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useLegSocket } from '../lib/useLegSocket';
import ScoreInput from '../components/ScoreInput';

// Dummy types, replace with your actual types
type DartThrow = { sector: number; multiplier: string; score: number };
type Visit = DartThrow[];

export default function LegPage() {
  const { id } = useParams<{ id: string }>();
  const [throws, setThrows] = useState<DartThrow[]>([]);
  const [legState, setLegState] = useState<any>(null);
  const lastUndoneVisit = useRef<Visit | null>(null);

  // Socket event handlers
  const eventHandlers = {
    score_update: (data: any) => {
      // eslint-disable-next-line no-console
      console.log('score_update event:', data);
      setLegState(data);
    },
    possible_throw: (data: any) => {
      // eslint-disable-next-line no-console
      console.log('possible_throw event:', data);
    },
    new_leg: (data: any) => {
      // eslint-disable-next-line no-console
      console.log('new_leg event:', data);
      window.location.reload();
    },
    undo_visit: (data: any) => {
      // eslint-disable-next-line no-console
      console.log('undo_visit event received:', data);
      let visit: Visit | null = null;
      if (data && data.visit) {
        visit = [data.visit.first_dart, data.visit.second_dart, data.visit.third_dart]
          .filter(Boolean)
          .map((dart: any) => ({
            sector: dart.sector,
            multiplier: dart.multiplier,
            score: dart.score,
          }));
      }
      // Always try to get last visit from latest legState after undo
      setTimeout(() => {
        setThrows((prev) => {
          let fallbackVisit: Visit | null = null;
          if (legState && Array.isArray(legState.visits) && legState.visits.length > 0) {
            const last = legState.visits[legState.visits.length - 1];
            fallbackVisit = [last.first_dart, last.second_dart, last.third_dart]
              .filter(Boolean)
              .map((dart: any) => ({
                sector: dart.sector,
                multiplier: dart.multiplier,
                score: dart.score,
              }));
          }
          if (visit && visit.length > 0) {
            lastUndoneVisit.current = visit;
            return visit;
          } else if (fallbackVisit && fallbackVisit.length > 0) {
            lastUndoneVisit.current = fallbackVisit;
            return fallbackVisit;
          } else {
            return [];
          }
        });
      }, 100); // allow state to update
    },
    announce: (data: any) => {
      // eslint-disable-next-line no-console
      console.log('announce event:', data);
    },
    say: (data: any) => {
      // eslint-disable-next-line no-console
      console.log('say event:', data);
    },
    leg_finished: (data: any) => {
      // eslint-disable-next-line no-console
      console.log('leg_finished event:', data);
      window.location.reload();
    },
  };

  const { emit } = useLegSocket(id!, eventHandlers);

  // Submit turn to backend
  const handleSubmitTurn = useCallback(() => {
    if (throws.length === 0) return;
    const payload = {
      leg_id: id,
      first_dart: throws[0] || null,
      second_dart: throws[1] || null,
      third_dart: throws[2] || null,
    };
    emit('throw', JSON.stringify(payload));
    setThrows([]);
    lastUndoneVisit.current = null;
  }, [throws, id, emit]);

  // Listen for Backspace to undo last visit if no throws in progress
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace' && throws.length === 0) {
        e.preventDefault();
        emit('undo_visit', {});
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [throws.length, emit]);

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Leg #{id}</h1>
      {/* Render leg state, players, scores, etc. */}
      <pre className="bg-slate-900 text-slate-200 p-4 rounded mb-4 overflow-x-auto text-xs">
        {JSON.stringify(legState, null, 2)}
      </pre>
        
      <ScoreInput
        currentThrows={throws}
        onAddThrow={(dart) => setThrows((prev) => prev.length < 3 ? [...prev, dart] : prev)}
        onRemoveThrow={() => setThrows((prev) => prev.slice(0, -1))}
        onSubmitTurn={handleSubmitTurn}
        onMiss={() => setThrows((prev) => prev.length < 3 ? [...prev, { sector: 0, multiplier: 'single', score: 0 }] : prev)}
      />
    </div>
  );
}
