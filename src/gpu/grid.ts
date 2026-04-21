/**
 * Interleaved quad vertices: position (clip xy) + UV (0–1 per cell quad).
 * Six vertices per cell (two triangles).
 */
export function createGridVertices(size: number): Float32Array {
  const vertices: number[] = [];
  const step = 2 / size;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const x = -1 + col * step;
      const y = -1 + row * step;

      const x2 = x + step;
      const y2 = y + step;

      vertices.push(
        x,
        y,
        0,
        0,
        x2,
        y,
        1,
        0,
        x2,
        y2,
        1,
        1,
        x,
        y,
        0,
        0,
        x2,
        y2,
        1,
        1,
        x,
        y2,
        0,
        1,
      );
    }
  }
  return new Float32Array(vertices);
}
