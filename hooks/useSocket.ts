import { useSocketContext } from '../configs/SocketContext';

/**
 * useSocket Hook
 * Now a wrapper around SocketContext to ensure a single singleton connection
 * is shared across the entire app.
 */
export const useSocket = (userId?: number | undefined) => {
    const context = useSocketContext();
    
    // We maintain the same return signature for backward compatibility
    return context;
};
