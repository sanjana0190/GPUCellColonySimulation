import { getCanvas } from './utils/canvas';
import { initWebGPU } from './gpu/initWebGPU';
import { createGridVertices } from './gpu/grid';
import { createPipeline } from './gpu/pipeline';
import { createCellBuffers, type GridBuffers } from './gpu/cellBuffer';
import { createComputePipeline } from './gpu/compute';
import {
  createSimulationBindGroups,
  type SimulationBindGroups,
  type CellTextures,
} from './gpu/simulationBindGroups';
import { loadTextureFromUrl, createLinearSampler } from './gpu/texture';
import { setupControls } from './ui/controls';
import { setupMouseInteraction } from './interaction/mouse';
import {
  CELL_STATE,
  STARTING_AGE,
  STARTING_ENERGY,
} from './gpu/cellState';

import deadCellUrl from './assets/Dead Cell.png?url';
import livingCellUrl from './assets/Living Cell.png?url';
import dividingCellUrl from './assets/Dividing Cell.png?url';

const GRID_SIZE = 32;
const WORKGROUP_SIZE = 8;
const WORKGROUPS_PER_DIM = Math.ceil(GRID_SIZE / WORKGROUP_SIZE);
const PALETTE_BYTES = 12 * 4; // 3 × vec4<f32>
const SIM_PARAMS_BYTES = 4 * 4; // 4 × u32

function destroyGridBuffers(b: GridBuffers) {
  b.stateA.destroy();
  b.stateB.destroy();
  b.ageA.destroy();
  b.ageB.destroy();
  b.energyA.destroy();
  b.energyB.destroy();
}

async function main() {
  const canvas = getCanvas();
  const { device, context, format } = await initWebGPU(canvas);

  // Load cell artwork up-front so the first frame already has textures.
  const [texDead, texAlive, texDividing] = await Promise.all([
    loadTextureFromUrl(device, deadCellUrl),
    loadTextureFromUrl(device, livingCellUrl),
    loadTextureFromUrl(device, dividingCellUrl),
  ]);
  const cellTextures: CellTextures = {
    dead: texDead,
    alive: texAlive,
    dividing: texDividing,
    sampler: createLinearSampler(device),
  };

  const controls = setupControls();

  // GPU buffers shared between every bind group: palette colours and the four
  // simulation thresholds the compute shader reads as a uniform.
  const paletteBuffer = device.createBuffer({
    size: PALETTE_BYTES,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  const simulationParamsBuffer = device.createBuffer({
    size: SIM_PARAMS_BYTES,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  function uploadPalette() {
    const data = controls.readPalette();
    device.queue.writeBuffer(paletteBuffer, 0, data as Float32Array<ArrayBuffer>);
  }
  function uploadSimulationParams() {
    const data = controls.readSimulationParams();
    device.queue.writeBuffer(
      simulationParamsBuffer,
      0,
      data as Uint32Array<ArrayBuffer>,
    );
  }
  controls.onPaletteChange(uploadPalette);
  controls.onSimulationParamsChange(uploadSimulationParams);
  uploadPalette();
  uploadSimulationParams();

  // Pipelines & vertex data.
  const renderPipeline = createPipeline(device, format);
  const computePipeline = createComputePipeline(device, GRID_SIZE);
  const computeLayout = computePipeline.getBindGroupLayout(0);
  const renderLayout = renderPipeline.getBindGroupLayout(0);

  const vertices = createGridVertices(GRID_SIZE);
  const vertexBuffer = device.createBuffer({
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vertexBuffer, 0, vertices as Float32Array<ArrayBuffer>);

  // Ping-pong buffers: one half is read, the other half is written each tick.
  // `latestIsA` flips after every compute pass so the next pass reads from the
  // freshly written buffer.
  let grid = createCellBuffers(device, GRID_SIZE, controls.initialCellCount);
  let latestIsA = true;
  let bindGroups: SimulationBindGroups = makeBindGroups();

  function makeBindGroups(): SimulationBindGroups {
    return createSimulationBindGroups(
      device,
      computeLayout,
      renderLayout,
      grid,
      paletteBuffer,
      simulationParamsBuffer,
      cellTextures,
    );
  }

  controls.onReset(() => {
    destroyGridBuffers(grid);
    grid = createCellBuffers(device, GRID_SIZE, controls.initialCellCount);
    bindGroups = makeBindGroups();
    latestIsA = true;
  });

  // Helpers: pick the "current" half of each ping-pong pair so click handlers
  // and the renderer always touch the freshest data.
  const latestState = () => (latestIsA ? grid.stateA : grid.stateB);
  const latestAge = () => (latestIsA ? grid.ageA : grid.ageB);
  const latestEnergy = () => (latestIsA ? grid.energyA : grid.energyB);

  // Reusable scratch buffers so we don't allocate on every click.
  const stateScratch = new Uint32Array([CELL_STATE.alive]);
  const ageScratch = new Uint32Array([STARTING_AGE]);
  const energyScratch = new Uint32Array([STARTING_ENERGY]);

  function addCell(row: number, col: number) {
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return;
    const byteOffset = (row * GRID_SIZE + col) * 4;
    // queue.writeBuffer is sequenced relative to other queue work, so the
    // next compute pass always reads what we just wrote here.
    device.queue.writeBuffer(latestState(), byteOffset, stateScratch as Uint32Array<ArrayBuffer>);
    device.queue.writeBuffer(latestAge(), byteOffset, ageScratch as Uint32Array<ArrayBuffer>);
    device.queue.writeBuffer(latestEnergy(), byteOffset, energyScratch as Uint32Array<ArrayBuffer>);
  }

  setupMouseInteraction(canvas, GRID_SIZE, addCell);

  // Animation loop: advance the simulation in fixed-size ticks, then draw.
  let lastTime = 0;
  let accumulator = 0;

  function frame(time: number) {
    const deltaTime = time - lastTime;
    lastTime = time;
    accumulator += deltaTime;
    const simulationStep = controls.speed;

    const encoder = device.createCommandEncoder();

    while (accumulator >= simulationStep && controls.isRunning) {
      const computePass = encoder.beginComputePass();
      computePass.setPipeline(computePipeline);
      computePass.setBindGroup(
        0,
        latestIsA ? bindGroups.computeAB : bindGroups.computeBA,
      );
      computePass.dispatchWorkgroups(WORKGROUPS_PER_DIM, WORKGROUPS_PER_DIM);
      computePass.end();

      latestIsA = !latestIsA;
      accumulator -= simulationStep;
    }

    const renderPass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
          clearValue: { r: 0.02, g: 0.02, b: 0.03, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    });
    renderPass.setPipeline(renderPipeline);
    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.setBindGroup(0, latestIsA ? bindGroups.renderA : bindGroups.renderB);
    renderPass.draw(vertices.length / 4);
    renderPass.end();

    device.queue.submit([encoder.finish()]);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

main();
