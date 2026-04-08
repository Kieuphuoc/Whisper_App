import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { BASE_URL } from './Apis';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MyUserContext } from './Context';

interface SocketContextType {
    connected: boolean;
    socket: Socket | null;
    emit: (event: string, data: any) => void;
    on: (event: string, callback: (data: any) => void) => void;
    off: (event: string, callback?: (data: any) => void) => void;
    joinRoom: (roomId: number | string) => void;
    leaveRoom: (roomId: number | string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const user = useContext(MyUserContext);
    const [connected, setConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            console.log('[Socket Provider] Disconnecting...');
            socketRef.current.disconnect();
            socketRef.current = null;
            setConnected(false);
        }
    }, []);

    const connect = useCallback(async () => {
        if (socketRef.current?.connected || !user?.id) return;

        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        console.log(`[Socket Provider] Connecting to: ${BASE_URL} for User: ${user.id}`);

        socketRef.current = io(BASE_URL, {
            path: '/socket.io/',
            auth: { token },
            transports: ['websocket'],
            upgrade: false,
            forceNew: true,
            reconnectionAttempts: 5,
            timeout: 20000
        });

        socketRef.current.on('connect', () => {
            console.log('[Socket Provider] Connected. ID:', socketRef.current?.id);
            setConnected(true);
        });

        socketRef.current.on('disconnect', (reason) => {
            console.log(`[Socket Provider] Disconnected. Reason: ${reason}`);
            setConnected(false);
        });

        socketRef.current.on('connect_error', (error) => {
            console.error('[Socket Provider] Connection Error:', error.message);
        });

    }, [user?.id]);

    useEffect(() => {
        if (user?.id) {
            connect();
        } else {
            disconnect();
        }

        return () => {
            // Deciding whether to disconnect on unmount of provider (which is app-wide)
            // Usually not necessary unless app is completely closed
        };
    }, [user?.id, connect, disconnect]);

    const emit = useCallback((event: string, data: any) => {
        socketRef.current?.emit(event, data);
    }, []);

    const on = useCallback((event: string, callback: (data: any) => void) => {
        socketRef.current?.on(event, callback);
    }, []);

    const off = useCallback((event: string, callback?: (data: any) => void) => {
        if (callback) {
            socketRef.current?.off(event, callback);
        } else {
            socketRef.current?.off(event);
        }
    }, []);

    const joinRoom = useCallback((roomId: number | string) => {
        socketRef.current?.emit('join_room', roomId);
    }, []);

    const leaveRoom = useCallback((roomId: number | string) => {
        socketRef.current?.emit('leave_room', roomId);
    }, []);

    const value = useMemo(() => ({
        connected,
        socket: socketRef.current,
        emit,
        on,
        off,
        joinRoom,
        leaveRoom
    }), [connected, emit, on, off, joinRoom, leaveRoom]);

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocketContext = () => {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('useSocketContext must be used within a SocketProvider');
    }
    return context;
};
