import { getCanvas } from './utils/canvas';
import { initWebGPU } from './gpu/initWebGPU';
import { createGridVertices } from './gpu/grid';
import { createPipeline } from './gpu/pipeline';
import { createCellBuffers } from './gpu/cellBuffer';
import { createComputePipeline } from './gpu/compute';
import { setupControls } from './ui/controls';

async function main() {
  const canvas = getCanvas();
  const { device, context, format } = await initWebGPU(canvas);
  const gridSize = 32;

  const controls = setupControls();

  let lastTime = 0;
  let accumulator = 0;

  // controls how fast simulation updates (overridden each frame from speed slider)
  let simulationStep = 100; // ms (lower = faster)

  const renderPipeline = createPipeline(device, format);
  const vertices = createGridVertices(gridSize);

  const vertexBuffer = device.createBuffer({
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  device.queue.writeBuffer(vertexBuffer, 0, vertices as Float32Array<ArrayBuffer>);

  const { stateA, stateB, ageA, ageB } = createCellBuffers(device, gridSize);
  let currentState = stateA;
  let nextState = stateB;
  let currentAge = ageA;
  let nextAge = ageB;

  controls.onReset(() => {
    currentState.destroy();
    nextState.destroy();
    currentAge.destroy();
    nextAge.destroy();

    const buffers = createCellBuffers(device, gridSize);
    currentState = buffers.stateA;
    nextState = buffers.stateB;
    currentAge = buffers.ageA;
    nextAge = buffers.ageB;
  });

  const computePipeline = createComputePipeline(device, gridSize);

  function frame(time: number) {
    const deltaTime = time - lastTime;
    lastTime = time;

    accumulator += deltaTime;

    simulationStep = controls.speed;

    const encoder = device.createCommandEncoder();

    while (accumulator >= simulationStep && controls.isRunning) {
      const computePass = encoder.beginComputePass();

      const computeBindGroup = device.createBindGroup({
        layout: computePipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: currentState } },
          { binding: 1, resource: { buffer: nextState } },
          { binding: 2, resource: { buffer: currentAge } },
          { binding: 3, resource: { buffer: nextAge } },
        ],
      });

      computePass.setPipeline(computePipeline);
      computePass.setBindGroup(0, computeBindGroup);

      computePass.dispatchWorkgroups(
        Math.ceil(gridSize / 8),
        Math.ceil(gridSize / 8),
      );

      computePass.end();

      // swap buffers AFTER compute
      [currentState, nextState] = [nextState, currentState];
      [currentAge, nextAge] = [nextAge, currentAge];

      accumulator -= simulationStep;
    }

    // Render EVERY frame (smooth visuals)
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

    const renderBindGroup = device.createBindGroup({
      layout: renderPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: currentState } },
        { binding: 1, resource: { buffer: currentAge } },
      ],
    });

    renderPass.setPipeline(renderPipeline);
    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.setBindGroup(0, renderBindGroup);
    renderPass.draw(vertices.length / 2);

    renderPass.end();

    device.queue.submit([encoder.finish()]);

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

main();
