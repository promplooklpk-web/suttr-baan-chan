import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type RunningCookTimer = {
  id: string;
  label: string;
  endAt: number;
  pausedRemaining?: number;
};

type CookTimerContextValue = {
  timers: RunningCookTimer[];
  registerTimer: (id: string, label: string, seconds: number) => void;
  pauseTimer: (id: string, remaining: number) => void;
  resumeTimer: (id: string, seconds: number) => void;
  removeTimer: (id: string) => void;
};

const CookTimerContext = createContext<CookTimerContextValue | null>(null);

export function CookTimerProvider({ children }: { children: React.ReactNode }) {
  const [timers, setTimers] = useState<RunningCookTimer[]>([]);

  const registerTimer = useCallback((id: string, label: string, seconds: number) => {
    setTimers((prev) => {
      const rest = prev.filter((t) => t.id !== id);
      return [...rest, { id, label, endAt: Date.now() + seconds * 1000 }];
    });
  }, []);

  const pauseTimer = useCallback((id: string, remaining: number) => {
    setTimers((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, endAt: 0, pausedRemaining: remaining } : t,
      ),
    );
  }, []);

  const resumeTimer = useCallback((id: string, seconds: number) => {
    setTimers((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, endAt: Date.now() + seconds * 1000, pausedRemaining: undefined }
          : t,
      ),
    );
  }, []);

  const removeTimer = useCallback((id: string) => {
    setTimers((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(
    () => ({ timers, registerTimer, pauseTimer, resumeTimer, removeTimer }),
    [timers, registerTimer, pauseTimer, resumeTimer, removeTimer],
  );

  return <CookTimerContext.Provider value={value}>{children}</CookTimerContext.Provider>;
}

export function useCookTimers() {
  const ctx = useContext(CookTimerContext);
  if (!ctx) throw new Error('useCookTimers requires CookTimerProvider');
  return ctx;
}
