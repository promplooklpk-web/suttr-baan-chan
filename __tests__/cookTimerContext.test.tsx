import { act, renderHook } from '@testing-library/react-native';

import { CookTimerProvider, useCookTimers } from '@/context/CookTimerContext';

function wrapper({ children }: { children: React.ReactNode }) {
  return <CookTimerProvider>{children}</CookTimerProvider>;
}

describe('CookTimerContext', () => {
  it('start/pause/resume keeps one timer id', () => {
    const { result } = renderHook(() => useCookTimers(), { wrapper });
    act(() => {
      result.current.startTimer('a', 'ขั้น 1', 10);
    });
    expect(result.current.timers).toHaveLength(1);
    act(() => {
      result.current.pauseTimer('a');
    });
    expect(result.current.getTimer('a')?.pausedRemaining).toBeDefined();
    act(() => {
      result.current.resumeTimer('a');
    });
    expect(result.current.getTimer('a')?.endAt).toBeGreaterThan(0);
  });

  it('dismiss removes finished timer', () => {
    const { result } = renderHook(() => useCookTimers(), { wrapper });
    act(() => {
      result.current.startTimer('b', 'ขั้น 2', 1);
    });
    act(() => {
      result.current.dismissTimer('b');
    });
    expect(result.current.timers).toHaveLength(0);
  });
});
