import { getCanvas } from './utils/canvas';
import { initWebGPU } from './gpu/initWebGPU';
import { createGridVertices } from './gpu/grid';
import { createPipeline } from './gpu/pipeline';

async function main(){
  const canvas = getCanvas();
  const { device, context, format } = await initWebGPU(canvas);

  const pipeline = createPipeline(device,format); //creating pipeline
  const vertices = createGridVertices(1.8,20); //creating grid vertices

  const vertexBuffer = device.createBuffer({
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  device.queue.writeBuffer(vertexBuffer,0,vertices as Float32Array<ArrayBuffer>);

  const encoder = device.createCommandEncoder();
  const textureView = context.getCurrentTexture().createView();
  const renderPass = encoder.beginRenderPass({
    colorAttachments:[{
      view: textureView,
      clearValue:{r:0.1, g:0.1, b:0.2,a: 1.0},
      loadOp: "clear",
      storeOp: "store",
    },],
  });
  renderPass.setPipeline(pipeline);
  renderPass.setVertexBuffer(0,vertexBuffer);
  renderPass.draw(vertices.length/2);
  renderPass.end();

  device.queue.submit([encoder.finish()]);
}
main();