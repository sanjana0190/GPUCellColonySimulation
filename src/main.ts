import { getCanvas } from './utils/canvas';
import { initWebGPU } from './gpu/initWebGPU';
import { createGridVertices } from './gpu/grid';
import { createPipeline } from './gpu/pipeline';
import { createCellStateBuffer } from './gpu/cellBuffer';
import { createComputePipeline } from './gpu/compute';

async function main() {
  const canvas = getCanvas();
  const { device, context, format } = await initWebGPU(canvas);
  const gridSize = 32;

  const renderPipeline = createPipeline(device, format);
  const vertices = createGridVertices(gridSize);

  const vertexBuffer = device.createBuffer({
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  device.queue.writeBuffer(vertexBuffer, 0, vertices as Float32Array<ArrayBuffer>);

  const { stateA, stateB, ageA, ageB } = createCellStateBuffer(device, gridSize);
  let currentState = stateA;
  let nextState = stateB;
  let currentAge = ageA;
  let nextAge = ageB;

  const computePipeline = createComputePipeline(device, gridSize);

  const workgroupsX = Math.ceil(gridSize / 8);
  const workgroupsY = Math.ceil(gridSize / 8);

  const renderBindGroupLayout = renderPipeline.getBindGroupLayout(0);
  const computeBindGroupLayout = computePipeline.getBindGroupLayout(0);

  function frame() {
    const encoder = device.createCommandEncoder();

    const computeBindGroup = device.createBindGroup({
      layout: computeBindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: currentState } },
        { binding: 1, resource: { buffer: nextState } },
        { binding: 2, resource: { buffer: currentAge } },
        { binding: 3, resource: { buffer: nextAge } },
      ],
    });

    const computePass = encoder.beginComputePass();
    computePass.setPipeline(computePipeline);
    computePass.setBindGroup(0, computeBindGroup);
    computePass.dispatchWorkgroups(workgroupsX, workgroupsY);
    computePass.end();

    const textureView = context.getCurrentTexture().createView();
    const renderPass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.1, g: 0.1, b: 0.2, a: 1.0 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    });

    const renderBindGroup = device.createBindGroup({
      layout: renderBindGroupLayout,
      entries: [{ binding: 0, resource: { buffer: nextState } }],
    });

    renderPass.setPipeline(renderPipeline);
    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.setBindGroup(0, renderBindGroup);
    renderPass.draw(vertices.length / 2);
    renderPass.end();

    device.queue.submit([encoder.finish()]);

    [currentState, nextState] = [nextState, currentState];
    [currentAge, nextAge] = [nextAge, currentAge];
    requestAnimationFrame(frame);
  }

  frame();
}

main();
