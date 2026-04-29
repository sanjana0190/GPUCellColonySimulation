import { CELL_STATE, STARTING_AGE, STARTING_ENERGY } from './cellState';

/**
 * Six GPU buffers held in ping-pong pairs: `state`, `age`, `energy`.
 * The compute shader reads from one half and writes to the other every tick,
 * then `main.ts` flips which half is "latest" before the next pass.
 */
export type GridBuffers = {
  stateA: GPUBuffer;
  stateB: GPUBuffer;
  ageA: GPUBuffer;
  ageB: GPUBuffer;
  energyA: GPUBuffer;
  energyB: GPUBuffer;
};

const STORAGE_USAGE = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST;

export function createCellBuffers(
  device: GPUDevice,
  gridSize: number,
  initialCellCount = 0,
): GridBuffers {
  const cellCount = gridSize * gridSize;
  const cellsToSeed = Math.min(initialCellCount, cellCount);

  const initialState = new Uint32Array(cellCount);
  const initialAge = new Uint32Array(cellCount);
  const initialEnergy = new Uint32Array(cellCount);

  // Drop `cellsToSeed` alive cells at random empty positions.
  for (let placed = 0; placed < cellsToSeed; placed++) {
    let index = Math.floor(Math.random() * cellCount);
    while (initialState[index] !== CELL_STATE.empty) {
      index = (index + 1) % cellCount;
    }
    initialState[index] = CELL_STATE.alive;
    initialAge[index] = STARTING_AGE;
    initialEnergy[index] = STARTING_ENERGY;
  }

  const empty = new Uint32Array(cellCount);

  return {
    stateA: uploadBuffer(device, initialState),
    stateB: uploadBuffer(device, empty),
    ageA: uploadBuffer(device, initialAge),
    ageB: uploadBuffer(device, empty),
    energyA: uploadBuffer(device, initialEnergy),
    energyB: uploadBuffer(device, empty),
  };
}

function uploadBuffer(device: GPUDevice, data: Uint32Array): GPUBuffer {
  const buffer = device.createBuffer({
    size: data.byteLength,
    usage: STORAGE_USAGE,
  });
  device.queue.writeBuffer(buffer, 0, data as Uint32Array<ArrayBuffer>);
  return buffer;
}
