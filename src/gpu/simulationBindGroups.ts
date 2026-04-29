import type { GridBuffers } from './cellBuffer';

export type CellTextures = {
  dead: GPUTexture;
  alive: GPUTexture;
  dividing: GPUTexture;
  sampler: GPUSampler;
};

export type SimulationBindGroups = {
  computeAB: GPUBindGroup;
  computeBA: GPUBindGroup;
  renderA: GPUBindGroup;
  renderB: GPUBindGroup;
};

export function createSimulationBindGroups(
  device: GPUDevice,
  computeLayout: GPUBindGroupLayout,
  renderLayout: GPUBindGroupLayout,
  b: GridBuffers,
  paletteBuffer: GPUBuffer,
  simulationParamsBuffer: GPUBuffer,
  cellTextures: CellTextures,
): SimulationBindGroups {
  const { dead, alive, dividing, sampler } = cellTextures;
  const texView = (t: GPUTexture) => t.createView();

  return {
    computeAB: device.createBindGroup({
      layout: computeLayout,
      entries: [
        { binding: 0, resource: { buffer: b.stateA } },
        { binding: 1, resource: { buffer: b.stateB } },
        { binding: 2, resource: { buffer: b.ageA } },
        { binding: 3, resource: { buffer: b.ageB } },
        { binding: 4, resource: { buffer: b.energyA } },
        { binding: 5, resource: { buffer: b.energyB } },
        { binding: 6, resource: { buffer: simulationParamsBuffer } },
      ],
    }),
    computeBA: device.createBindGroup({
      layout: computeLayout,
      entries: [
        { binding: 0, resource: { buffer: b.stateB } },
        { binding: 1, resource: { buffer: b.stateA } },
        { binding: 2, resource: { buffer: b.ageB } },
        { binding: 3, resource: { buffer: b.ageA } },
        { binding: 4, resource: { buffer: b.energyB } },
        { binding: 5, resource: { buffer: b.energyA } },
        { binding: 6, resource: { buffer: simulationParamsBuffer } },
      ],
    }),
    renderA: device.createBindGroup({
      layout: renderLayout,
      entries: [
        { binding: 0, resource: { buffer: b.stateA } },
        { binding: 1, resource: { buffer: b.ageA } },
        { binding: 2, resource: { buffer: paletteBuffer } },
        { binding: 3, resource: texView(dead) },
        { binding: 4, resource: texView(alive) },
        { binding: 5, resource: texView(dividing) },
        { binding: 6, resource: sampler },
      ],
    }),
    renderB: device.createBindGroup({
      layout: renderLayout,
      entries: [
        { binding: 0, resource: { buffer: b.stateB } },
        { binding: 1, resource: { buffer: b.ageB } },
        { binding: 2, resource: { buffer: paletteBuffer } },
        { binding: 3, resource: texView(dead) },
        { binding: 4, resource: texView(alive) },
        { binding: 5, resource: texView(dividing) },
        { binding: 6, resource: sampler },
      ],
    }),
  };
}
