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

  let { bufferA, bufferB } = createCellStateBuffer(device, gridSize);
  let currentBuffer = bufferA;
  let nextBuffer = bufferB;

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
        { binding: 0, resource: { buffer: currentBuffer } },
        { binding: 1, resource: { buffer: nextBuffer } },
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
      entries: [{ binding: 0, resource: { buffer: nextBuffer } }],
    });

    renderPass.setPipeline(renderPipeline);
    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.setBindGroup(0, renderBindGroup);
    renderPass.draw(vertices.length / 2);
    renderPass.end();

    device.queue.submit([encoder.finish()]);

    [currentBuffer, nextBuffer] = [nextBuffer, currentBuffer];
    requestAnimationFrame(frame);
  }

  frame();
}

main();
