/** Pack 3 × vec4<f32> (dead, alive, dividing) for GPU `array<vec4<f32>, 3>`. */
export function colorsToPaletteFloats(
  deadHex: string,
  aliveHex: string,
  dividingHex: string,
): Float32Array {
  const out = new Float32Array(12);
  writeHexAsVec4(deadHex, out, 0);
  writeHexAsVec4(aliveHex, out, 4);
  writeHexAsVec4(dividingHex, out, 8);
  return out;
}

function writeHexAsVec4(hex: string, target: Float32Array, offset: number) {
  const h = hex.startsWith('#') ? hex.slice(1) : hex;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  target[offset] = Number.isFinite(r) ? r : 0;
  target[offset + 1] = Number.isFinite(g) ? g : 0;
  target[offset + 2] = Number.isFinite(b) ? b : 0;
  target[offset + 3] = 1;
}
