export const pixelFills = [
  [0, 1, .055], [1, 4, .04], [2, 0, .065], [2, 3, .035],
  [3, 2, .05], [4, 4, .065], [4, 5, .035], [5, 1, .045],
] as const;

export function deformPixel(x: number, y: number, pointerX: number, pointerY: number, strength: number, radius: number) {
  const dx = x - pointerX;
  const dy = y - pointerY;
  const distance = Math.hypot(dx, dy);
  if (!strength || !distance || distance >= radius) return { x: 0, y: 0, rotation: 0, opacity: 0 };
  const falloff = (1 - distance / radius) ** 1.4 * strength;
  // Mostly tangential, with a little outward pressure; displacement stays below 12px.
  return {
    x: (-dy * .94 + dx * .24) / distance * 12 * falloff,
    y: (dx * .94 + dy * .24) / distance * 12 * falloff,
    rotation: .065 * falloff,
    opacity: .065 * falloff,
  };
}
