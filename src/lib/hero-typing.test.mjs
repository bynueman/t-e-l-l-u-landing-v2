import assert from "node:assert/strict";
import { test } from "node:test";
import { nextTypingState, typingTiming } from "./hero-typing.ts";

test("typing deletes and types one character at a time, then loops to the original", () => {
  const messages = ["Apa?", "Website?", "Konten?"];
  let state = { index: 0, length: messages[0].length, phase: "hold" };
  const completed = [];
  for (let step = 0; step < 100; step++) {
    const next = nextTypingState(state, messages);
    if (state.phase === "delete") assert.equal(state.length - next.length, 1);
    if (state.phase === "type") assert.equal(next.length - state.length, 1);
    if (next.phase === "hold") completed.push(messages[next.index]);
    state = next;
    if (completed.length === 3) break;
  }
  assert.deepEqual(completed, ["Website?", "Konten?", "Apa?"]);
  assert.equal(typingTiming.hold, 3000);
  assert.ok(typingTiming.type > typingTiming.delete);
  assert.ok(typingTiming.gap <= 100, "avoid a long pause between deletion and incoming typing");
});
