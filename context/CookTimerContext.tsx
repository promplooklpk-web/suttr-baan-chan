import * as Haptics from 'expo-haptics';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  cancelCookTimerNotification,
  scheduleCookTimerNotification,
} from '@/lib/cookTimerNotify';

export type CookTimerState = {
  id: string;
  label: string;
  endAt: number;
  pausedRemaining?: number;
  finished?: boolean;
  durationSeconds: number;
};

type CookTimerContextValue = {
  timers: CookTimerState[];
  barHeight: number;
  setBarHeight: (h: number) => void;
  getTimer: (id: string) => CookTimerState | undefined;
  startTimer: (id: string, label: string, seconds: number) => void;
  pauseTimer: (id: string) => void;
  resumeTimer: (id: string) => void;
  resetTimer: (id: string, seconds: number) => void;
  dismissTimer: (id: string) => void;
  clearAllTimers: () => void;
  remainingSeconds: (id: string) => number;
};

const CookTimerContext = createContext<CookTimerContextValue | null>(null);

function computeRemaining(t: CookTimerState): number {
  if (t.finished) return 0;
  if (t.pausedRemaining != null) return t.pausedRemaining;
  if (!t.endAt) return t.durationSeconds;
  return Math.max(0, Math.ceil((t.endAt - Date.now()) / 1000));
}

export function CookTimerProvider({ children }: { children: React.ReactNode }) {
  const [timers, setTimers] = useState<CookTimerState[]>([]);
  const [barHeight, setBarHeight] = useState(0);
  const completedRef = useRef<Set<string>>(new Set());

  const markFinished = useCallback((id: string) => {
    if (completedRef.current.has(id)) return;
    completedRef.current.add(id);
    setTimers((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, finished: true, endAt: 0, pausedRemaining: 0 } : t,
      ),
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (timers.length === 0) return;
    const id = setInterval(() => {
      setTimers((prev) => {
        let changed = false;
        const next = prev.map((t) => {
          if (t.finished || t.pausedRemaining != null) return t;
          if (!t.endAt) return t;
          const left = computeRemaining(t);
          if (left <= 0) {
            if (!completedRef.current.has(t.id)) {
              completedRef.current.add(t.id);
              changed = true;
              return { ...t, finished: true, endAt: 0, pausedRemaining: 0 };
            }
          }
          return t;
        });
        if (changed) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
        }
        return changed ? next : prev;
      });
    }, 250);
    return () => clearInterval(id);
  }, [timers.length]);

  const startTimer = useCallback((id: string, label: string, seconds: number) => {
    completedRef.current.delete(id);
    void scheduleCookTimerNotification(id, seconds);
    setTimers((prev) => {
      const rest = prev.filter((t) => t.id !== id);
      return [
        ...rest,
        {
          id,
          label,
          endAt: Date.now() + seconds * 1000,
          durationSeconds: seconds,
          finished: false,
        },
      ];
    });
  }, []);

  const pauseTimer = useCallback((id: string) => {
    setTimers((prev) => {
      const t = prev.find((x) => x.id === id);
      if (!t) return prev;
      const left = computeRemaining(t);
      void cancelCookTimerNotification(id);
      return prev.map((x) =>
        x.id === id ? { ...x, endAt: 0, pausedRemaining: left, finished: false } : x,
      );
    });
  }, []);

  const resumeTimer = useCallback((id: string) => {
    setTimers((prev) => {
      const t = prev.find((x) => x.id === id);
      if (!t || t.pausedRemaining == null) return prev;
      const sec = t.pausedRemaining;
      void scheduleCookTimerNotification(id, sec);
      return prev.map((x) =>
        x.id === id
          ? {
              ...x,
              endAt: Date.now() + sec * 1000,
              pausedRemaining: undefined,
              finished: false,
            }
          : x,
      );
    });
  }, []);

  const resetTimer = useCallback((id: string, seconds: number) => {
    completedRef.current.delete(id);
    void cancelCookTimerNotification(id);
    setTimers((prev) =>
      prev.map((x) =>
        x.id === id
          ? {
              ...x,
              endAt: 0,
              pausedRemaining: seconds,
              finished: false,
              durationSeconds: seconds,
            }
          : x,
      ),
    );
  }, []);

  const dismissTimer = useCallback((id: string) => {
    completedRef.current.delete(id);
    void cancelCookTimerNotification(id);
    setTimers((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAllTimers = useCallback(() => {
    setTimers((prev) => {
      for (const t of prev) void cancelCookTimerNotification(t.id);
      return [];
    });
    completedRef.current.clear();
  }, []);

  const getTimer = useCallback((id: string) => timers.find((t) => t.id === id), [timers]);

  const remainingSeconds = useCallback(
    (id: string) => {
      const t = timers.find((x) => x.id === id);
      if (!t) return 0;
      return computeRemaining(t);
    },
    [timers],
  );

  const value = useMemo(
    () => ({
      timers,
      barHeight,
      setBarHeight,
      getTimer,
      startTimer,
      pauseTimer,
      resumeTimer,
      resetTimer,
      dismissTimer,
      clearAllTimers,
      remainingSeconds,
    }),
    [
      timers,
      barHeight,
      getTimer,
      startTimer,
      pauseTimer,
      resumeTimer,
      resetTimer,
      dismissTimer,
      clearAllTimers,
      remainingSeconds,
    ],
  );

  return <CookTimerContext.Provider value={value}>{children}</CookTimerContext.Provider>;
}

export function useCookTimers() {
  const ctx = useContext(CookTimerContext);
  if (!ctx) throw new Error('useCookTimers requires CookTimerProvider');
  return ctx;
}
