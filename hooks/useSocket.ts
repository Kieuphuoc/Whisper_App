import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { BASE_URL } from '../configs/Apis';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useSocket = (userId: number | undefined) => {
    const [connected, setConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    const connect = useCallback(async () => {
        if (socketRef.current || !userId) return;

        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        console.log(`[Socket FE] Initiating connection to: ${BASE_URL} (Token Exists: ${!!token})`);

        socketRef.current = io(BASE_URL, {
            path: '/socket.io/',
            auth: { token },
            transports: ['websocket'], // Force websocket
            upgrade: false, // Don't try polling upgrade
            forceNew: true, // Create a fresh connection
            reconnectionAttempts: 5,
            timeout: 20000
        });

        socketRef.current.on('connect', () => {
            console.log('[Socket FE] Connected successfully. Socket ID:', socketRef.current?.id);
            setConnected(true);
        });

        socketRef.current.on('disconnect', (reason) => {
            console.log(`[Socket FE] Disconnected. Reason: ${reason}`);
            setConnected(false);
        });

        socketRef.current.on('connect_error', (error) => {
            console.error('[Socket FE] Connection Error Details:', {
                message: error.message,
                name: error.name,
                stack: error.stack,
                req: (error as any).req,
                cause: error.cause
            });
        });

        socketRef.current.on('error', (error) => {
            console.error('[Socket FE] General Socket Error:', error);
        });

        socketRef.current.on('reconnect_attempt', (attempts) => {
            console.warn(`[Socket FE] Reconnection attempt #${attempts}`);
        });

        socketRef.current.on('reconnect_failed', () => {
            console.error('[Socket FE] Reconnection completely failed.');
        });

        socketRef.current.io.on('error', (error) => {
            console.error('[Socket FE] Engine.io Error:', error);
        });

    }, [userId]);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
            setConnected(false);
        }
    }, []);

    useEffect(() => {
        if (userId) {
            connect();
        } else {
            disconnect();
        }

        return () => {
            disconnect();
        };
    }, [userId, connect, disconnect]);

    const joinRoom = (roomId: number) => {
        console.log(`[Socket FE] Emitting 'join_room' for room: ${roomId}`);
        socketRef.current?.emit('join_room', roomId);
    };

    const leaveRoom = (roomId: number) => {
        console.log(`[Socket FE] Emitting 'leave_room' for room: ${roomId}`);
        socketRef.current?.emit('leave_room', roomId);
    };

    const emit = (event: string, data: any) => {
        console.log(`[Socket FE] Emitting event: '${event}' with data:`, data);
        socketRef.current?.emit(event, data);
    };

    const on = (event: string, callback: (data: any) => void) => {
        console.log(`[Socket FE] Registering listener for event: '${event}'`);
        socketRef.current?.on(event, callback);
    };

    const off = (event: string) => {
        console.log(`[Socket FE] Removing listener for event: '${event}'`);
        socketRef.current?.off(event);
    };

    return {
        connected,
        joinRoom,
        leaveRoom,
        emit,
        on,
        off,
        socket: socketRef.current
    };
};
