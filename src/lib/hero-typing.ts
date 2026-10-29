export type TypingState = { index: number; length: number; phase: "hold" | "delete" | "gap" | "type" };
export const typingTiming = { hold: 3000, delete: 20, gap: 80, type: 55 } as const;

export function nextTypingState(state: TypingState, messages: readonly string[]): TypingState {
  if (state.phase === "hold") return { ...state, phase: "delete" };
  if (state.phase === "delete") {
    const length = Math.max(0, state.length - 1);
    return { ...state, length, phase: length ? "delete" : "gap" };
  }
  if (state.phase === "gap") return { index: (state.index + 1) % messages.length, length: 0, phase: "type" };
  const length = Math.min(messages[state.index].length, state.length + 1);
  return { ...state, length, phase: length === messages[state.index].length ? "hold" : "type" };
}
