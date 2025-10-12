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
            // Invalidate signals query to refetch
            queryClient.invalidateQueries({ queryKey: ['/api/signals'] });
            break;

          case 'trade':
            // Invalidate trades query to refetch
            queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
            break;

          case 'stats':
            // Update stats cache directly
            queryClient.setQueryData(['/api/stats'], message.data);
            break;

          case 'connection':
            // Update connection status
            queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
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
