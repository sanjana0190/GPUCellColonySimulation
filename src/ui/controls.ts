import { colorsToPaletteFloats } from './palette';

export function setupControls() {
  let isRunning = true;
  let speed = 100;

  const toggleBtn = document.getElementById('toggle') as HTMLButtonElement;
  const resetBtn = document.getElementById('reset') as HTMLButtonElement;
  const speedSlider = document.getElementById('speed') as HTMLInputElement;

  const colorDead = document.getElementById('color-dead') as HTMLInputElement;
  const colorAlive = document.getElementById('color-alive') as HTMLInputElement;
  const colorDividing = document.getElementById('color-dividing') as HTMLInputElement;

  toggleBtn.onclick = () => {
    isRunning = !isRunning;
    toggleBtn.textContent = isRunning ? 'Pause' : 'Start';
  };

  speedSlider.oninput = () => {
    speed = Number(speedSlider.value);
  };

  function readPalette(): Float32Array {
    return colorsToPaletteFloats(
      colorDead.value,
      colorAlive.value,
      colorDividing.value,
    );
  }

  return {
    get isRunning() {
      return isRunning;
    },
    get speed() {
      return speed;
    },
    readPalette,
    onReset(callback: () => void) {
      resetBtn.onclick = callback;
    },
    onPaletteChange(callback: () => void) {
      for (const el of [colorDead, colorAlive, colorDividing]) {
        el.addEventListener('input', callback);
      }
    },
  };
}
