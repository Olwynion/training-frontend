import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { auth } from '../api/client';

interface User {
  user_id: string;
  email: string;
  name: string;
}

interface AuthCtx {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('access_token')
  );

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const save = (data: any) => {
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('user', JSON.stringify(data));
    setToken(data.access_token);
    setUser(data);
  };

  const login = async (email: string, password: string) => {
    const { data } = await auth.login({ email, password });
    save(data);
  };

  const register = async (email: string, password: string, name: string) => {
    const { data } = await auth.register({ email, password, name });
    save(data);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
