// Pure, isomorphic (no "use client"/"use server") — usable both from the
// session dice-roll server action and directly in client components (e.g.
// a quick-fill roll button on a sheet's stat fields) with no DB round trip.
export function rollDice(faces: number, quantity: number): number[] {
  const results: number[] = [];
  for (let i = 0; i < quantity; i++) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    results.push((array[0] % faces) + 1);
  }
  return results;
}
