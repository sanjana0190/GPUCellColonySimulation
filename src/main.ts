import { getCanvas } from './utils/canvas';
import { initWebGPU } from './gpu/initWebGPU';
import { createGridVertices } from './gpu/grid';
import { createPipeline } from './gpu/pipeline';
import { createCellBuffers, type GridBuffers } from './gpu/cellBuffer';
import { createComputePipeline } from './gpu/compute';
import {
  createSimulationBindGroups,
  type SimulationBindGroups,
} from './gpu/simulationBindGroups';
import { setupControls } from './ui/controls';
import { setupMouseInteraction } from './interaction/mouse';

function destroyGridBuffers(b: GridBuffers) {
  b.stateA.destroy();
  b.stateB.destroy();
  b.ageA.destroy();
  b.ageB.destroy();
}

async function main() {
  const canvas = getCanvas();
  const { device, context, format } = await initWebGPU(canvas);
  const gridSize = 32;
  const workgroupsPerDim = Math.ceil(gridSize / 8);

  const cellReadScratch = device.createBuffer({
    size: 4,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });

  const controls = setupControls();
  let lastTime = 0;
  let accumulator = 0;
  let simulationStep = 100;

  const renderPipeline = createPipeline(device, format);
  const computePipeline = createComputePipeline(device, gridSize);

  const renderLayout = renderPipeline.getBindGroupLayout(0);
  const computeLayout = computePipeline.getBindGroupLayout(0);

  const vertices = createGridVertices(gridSize);
  const vertexBuffer = device.createBuffer({
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vertexBuffer, 0, vertices as Float32Array<ArrayBuffer>);

  let grid = createCellBuffers(device, gridSize);
  /** Latest grid data lives in A when true, in B when false (ping-pong). */
  let resultInA = true;
  let bindGroups: SimulationBindGroups = createSimulationBindGroups(
    device,
    computeLayout,
    renderLayout,
    grid,
  );

  function rebuildAfterNewGrid() {
    bindGroups = createSimulationBindGroups(
      device,
      computeLayout,
      renderLayout,
      grid,
    );
    resultInA = true;
  }

  controls.onReset(() => {
    destroyGridBuffers(grid);
    grid = createCellBuffers(device, gridSize);
    rebuildAfterNewGrid();
  });

  function displayState(): GPUBuffer {
    return resultInA ? grid.stateA : grid.stateB;
  }

  function displayAge(): GPUBuffer {
    return resultInA ? grid.ageA : grid.ageB;
  }

  let toggleQueue = Promise.resolve();

  function toggleCell(row: number, col: number): Promise<void> {
    if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) {
      return Promise.resolve();
    }

    const index = row * gridSize + col;
    const byteOffset = index * 4;
    const stateBuf = displayState();
    const ageBuf = displayAge();

    const copyEncoder = device.createCommandEncoder();
    copyEncoder.copyBufferToBuffer(stateBuf, byteOffset, cellReadScratch, 0, 4);
    device.queue.submit([copyEncoder.finish()]);

    return cellReadScratch.mapAsync(GPUMapMode.READ).then(() => {
      const prev = new Uint32Array(cellReadScratch.getMappedRange().slice(0))[0];
      cellReadScratch.unmap();

      const wasAlive = prev === 1 || prev === 2;
      const nextVal = wasAlive ? 0 : 1;
      const packed = new Uint32Array(1);
      packed[0] = nextVal;
      device.queue.writeBuffer(stateBuf, byteOffset, packed as Uint32Array<ArrayBuffer>);
      packed[0] = nextVal !== 0 ? 1 : 0;
      device.queue.writeBuffer(ageBuf, byteOffset, packed as Uint32Array<ArrayBuffer>);
    });
  }

  setupMouseInteraction(canvas, gridSize, (row, col) => {
    toggleQueue = toggleQueue
      .then(() => toggleCell(row, col))
      .catch(() => {});
  });

  function frame(time: number) {
    const deltaTime = time - lastTime;
    lastTime = time;
    accumulator += deltaTime;
    simulationStep = controls.speed;

    const encoder = device.createCommandEncoder();

    while (accumulator >= simulationStep && controls.isRunning) {
      const computePass = encoder.beginComputePass();
      computePass.setPipeline(computePipeline);
      computePass.setBindGroup(
        0,
        resultInA ? bindGroups.computeAB : bindGroups.computeBA,
      );
      computePass.dispatchWorkgroups(workgroupsPerDim, workgroupsPerDim);
      computePass.end();

      resultInA = !resultInA;
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
    renderPass.setBindGroup(
      0,
      resultInA ? bindGroups.renderA : bindGroups.renderB,
    );
    renderPass.draw(vertices.length / 2);
    renderPass.end();

    device.queue.submit([encoder.finish()]);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

main();
