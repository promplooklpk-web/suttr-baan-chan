export type FeedbackPayload = {
  message: string;
  variant?: 'default' | 'error';
  onUndo?: () => void | Promise<void>;
};

type Listener = (payload: FeedbackPayload) => void;

let listener: Listener | null = null;

export function setFeedbackListener(next: Listener | null): void {
  listener = next;
}

export function emitFeedback(
  message: string,
  options?: { error?: boolean; onUndo?: () => void | Promise<void> },
): void {
  listener?.({
    message,
    variant: options?.error ? 'error' : 'default',
    onUndo: options?.onUndo,
  });
}
