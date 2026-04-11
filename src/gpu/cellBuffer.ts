export type GridBuffers = {
  stateA: GPUBuffer;
  stateB: GPUBuffer;
  ageA: GPUBuffer;
  ageB: GPUBuffer;
};

export function createCellBuffers(device: GPUDevice, gridSize: number): GridBuffers {
  const cellCount = gridSize * gridSize;
  const cellStates = new Uint32Array(cellCount);
  const ageStates = new Uint32Array(cellCount);

  for (let i = 0; i < cellCount; i++) {
    const alive = Math.random() > 0.5 ? 1 : 0;
    cellStates[i] = alive;
    ageStates[i] = alive ? 1 : 0;
  }

  const usage = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST;

  function uploadBuffer(data: Uint32Array): GPUBuffer {
    const buffer = device.createBuffer({
      size: data.byteLength,
      usage,
    });
    device.queue.writeBuffer(buffer, 0, data as Uint32Array<ArrayBuffer>);
    return buffer;
  }

  return {
    stateA: uploadBuffer(cellStates),
    stateB: uploadBuffer(new Uint32Array(cellCount)),
    ageA: uploadBuffer(ageStates),
    ageB: uploadBuffer(new Uint32Array(cellCount)),
  };
}
