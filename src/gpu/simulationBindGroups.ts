import type { GridBuffers } from './cellBuffer';

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
): SimulationBindGroups {
  return {
    computeAB: device.createBindGroup({
      layout: computeLayout,
      entries: [
        { binding: 0, resource: { buffer: b.stateA } },
        { binding: 1, resource: { buffer: b.stateB } },
        { binding: 2, resource: { buffer: b.ageA } },
        { binding: 3, resource: { buffer: b.ageB } },
      ],
    }),
    computeBA: device.createBindGroup({
      layout: computeLayout,
      entries: [
        { binding: 0, resource: { buffer: b.stateB } },
        { binding: 1, resource: { buffer: b.stateA } },
        { binding: 2, resource: { buffer: b.ageB } },
        { binding: 3, resource: { buffer: b.ageA } },
      ],
    }),
    renderA: device.createBindGroup({
      layout: renderLayout,
      entries: [
        { binding: 0, resource: { buffer: b.stateA } },
        { binding: 1, resource: { buffer: b.ageA } },
      ],
    }),
    renderB: device.createBindGroup({
      layout: renderLayout,
      entries: [
        { binding: 0, resource: { buffer: b.stateB } },
        { binding: 1, resource: { buffer: b.ageB } },
      ],
    }),
  };
}
