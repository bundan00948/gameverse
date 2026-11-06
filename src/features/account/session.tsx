import { createContext, useContext, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
export const SessionContext = createContext<User | null>(null);
export function SessionProvider({ user, children }: { user: User | null; children: ReactNode }) { return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>; }
export function usePlayer() { return useContext(SessionContext); }
