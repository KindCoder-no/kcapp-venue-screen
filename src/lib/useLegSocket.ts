import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export interface LegSocketEvents {
  score_update: (data: any) => void;
  possible_throw: (data: any) => void;
  new_leg: (data: any) => void;
  undo_visit: (data: any) => void;
  announce: (data: any) => void;
  say: (data: any) => void;
  leg_finished: (data: any) => void;
}

export function useLegSocket(
  legId: number | string,
  eventHandlers: Partial<LegSocketEvents>,
) {
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef(eventHandlers);
  handlersRef.current = eventHandlers;

  useEffect(() => {
    if (!legId) return;
    const baseUrl = import.meta.env.VITE_KCAPP_SOCKET_URL || window.location.origin;
    const socket = io(`${baseUrl}/legs/${legId}`);
    socketRef.current = socket;
    // Debug log for connection
    // eslint-disable-next-line no-console
    console.log('Connecting to socket:', `${baseUrl}/legs/${legId}`);

    // Register event handlers (always use latest from handlersRef)
    const events = Object.keys(handlersRef.current);
    events.forEach((event) => {
      socket.on(event, (...args: any[]) => {
        const handler = handlersRef.current[event as keyof LegSocketEvents];
        if (handler) handler(...args);
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [legId]);

  // Return emit function
  return {
    emit: (event: string, payload: any) => {
      socketRef.current?.emit(event, payload);
    },
    socket: socketRef.current,
  };
}
