import { createContext, Dispatch } from 'react';

// 1. Định nghĩa kiểu dữ liệu cho user
export type User = {
  id: string;
  name: string;
  email: string;
}

// 2. Context lưu user hoặc null
export const MyUserContext = createContext<User | null>(null);

// 3. Context lưu hàm dispatch (giả sử bạn dùng useReducer cho user)
export const MyDispatchContext = createContext<Dispatch<any> | null>(null);
