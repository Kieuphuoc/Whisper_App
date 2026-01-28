import { createContext, Dispatch } from 'react';

export type User = {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    token?: string;
};

export type UserAction =
    | { type: 'SET_USER'; payload: User }
    | { type: 'LOGOUT' };

export const MyUserContext = createContext<User | null>(null);
export const MyDispatchContext = createContext<Dispatch<UserAction> | null>(null);

export const userReducer = (state: User | null, action: UserAction): User | null => {
    switch (action.type) {
        case 'SET_USER':
            return action.payload;
        case 'LOGOUT':
            return null;
        default:
            return state;
    }
};
