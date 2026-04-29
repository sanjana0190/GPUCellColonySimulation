import { colorsToPaletteFloats } from './palette';

type RangeControl = {
  input: HTMLInputElement;
  output: HTMLOutputElement;
};

export function setupControls() {
  let isRunning = true;
  let speed = 100;

  const toggleBtn = document.getElementById('toggle') as HTMLButtonElement;
  const resetBtn = document.getElementById('reset') as HTMLButtonElement;
  const speedSlider = document.getElementById('speed') as HTMLInputElement;

  const initialCells = getRangeControl('initial-cells');
  const divideAge = getRangeControl('divide-age');
  const deathAge = getRangeControl('death-age');
  const survivalEnergy = getRangeControl('survival-energy');
  const divideEnergy = getRangeControl('divide-energy');

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

  syncRangeLabel(initialCells);
  initialCells.input.addEventListener('input', () => {
    syncRangeLabel(initialCells);
  });

  function getRangeControl(id: string): RangeControl {
    return {
      input: document.getElementById(id) as HTMLInputElement,
      output: document.getElementById(`${id}-value`) as HTMLOutputElement,
    };
  }

  function readRange(control: RangeControl): number {
    return Number(control.input.value);
  }

  function syncRangeLabel(control: RangeControl) {
    control.output.value = control.input.value;
  }

  const simulationControls = [
    divideAge,
    deathAge,
    survivalEnergy,
    divideEnergy,
  ];

  function normalizeSimulationControls() {
    const divideAgeValue = readRange(divideAge);
    const deathAgeValue = readRange(deathAge);
    const maxDeathAge = Number(deathAge.input.max);
    if (deathAgeValue <= divideAgeValue) {
      deathAge.input.value = String(Math.min(maxDeathAge, divideAgeValue + 1));
    }

    const survivalEnergyValue = readRange(survivalEnergy);
    const divideEnergyValue = readRange(divideEnergy);
    const maxDivideEnergy = Number(divideEnergy.input.max);
    if (divideEnergyValue <= survivalEnergyValue) {
      divideEnergy.input.value = String(
        Math.min(maxDivideEnergy, survivalEnergyValue + 1),
      );
    }
  }

  function syncSimulationLabels() {
    normalizeSimulationControls();
    for (const control of simulationControls) {
      syncRangeLabel(control);
    }
  }

  function readSimulationParams(): Uint32Array {
    normalizeSimulationControls();
    const divideAgeValue = readRange(divideAge);
    const deathAgeValue = readRange(deathAge);
    const survivalEnergyValue = readRange(survivalEnergy);
    const divideEnergyValue = readRange(divideEnergy);

    return new Uint32Array([
      divideAgeValue,
      deathAgeValue,
      survivalEnergyValue,
      divideEnergyValue,
    ]);
  }

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
    get initialCellCount() {
      return readRange(initialCells);
    },
    readPalette,
    readSimulationParams,
    onReset(callback: () => void) {
      resetBtn.onclick = callback;
    },
    onSimulationParamsChange(callback: () => void) {
      syncSimulationLabels();
      for (const control of simulationControls) {
        control.input.addEventListener('input', () => {
          syncSimulationLabels();
          callback();
        });
      }
    },
    onPaletteChange(callback: () => void) {
      for (const el of [colorDead, colorAlive, colorDividing]) {
        el.addEventListener('input', callback);
      }
    },
  };
}
