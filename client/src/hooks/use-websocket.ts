import { useEffect, useRef, useCallback } from 'react';
import { queryClient } from '@/lib/queryClient';
import type { WSMessage } from '@shared/schema';

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host; // includes port if present
    const wsUrl = `${protocol}//${host}/ws`;

    console.log('Connecting to WebSocket:', wsUrl);
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.current.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);

        switch (message.type) {
          case 'signal':
            // Update signals cache - either update existing or add new
            queryClient.setQueryData(['/api/signals'], (old: any[] = []) => {
              const existingIndex = old.findIndex(s => s.id === message.data.id);
              if (existingIndex >= 0) {
                // Update existing signal
                const updated = [...old];
                updated[existingIndex] = message.data;
                return updated;
              } else {
                // Add new signal to the beginning, limit to 50 items
                return [message.data, ...old].slice(0, 50);
              }
            });
            break;

          case 'trade':
            // Update trades cache directly by prepending new trade
            queryClient.setQueryData(['/api/trades'], (old: any[] = []) => {
              // Add new trade to the beginning, limit to 50 items
              return [message.data, ...old].slice(0, 50);
            });
            break;

          case 'stats':
            // Update stats cache directly
            queryClient.setQueryData(['/api/stats'], message.data);
            break;

          case 'connection':
            // Update stats to reflect connection status change
            queryClient.setQueryData(['/api/stats'], (old: any) => ({
              ...old,
              isConnected: message.data?.isConnected ?? false,
            }));
            break;

          case 'mt5_account':
            // Update MT5 account info cache directly
            queryClient.setQueryData(['/api/mt5-account'], message.data);
            break;

          case 'mt5_positions':
            // Update MT5 positions cache directly
            queryClient.setQueryData(['/api/mt5-positions'], message.data);
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
      
      // Attempt to reconnect after 3 seconds
      reconnectTimeout.current = setTimeout(() => {
        console.log('Attempting to reconnect...');
        connect();
      }, 3000);
    };
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  return ws.current;
}
