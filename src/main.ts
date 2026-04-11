import { getCanvas } from './utils/canvas';
import { initWebGPU } from './gpu/initWebGPU';

async function main(){
  const canvas = getCanvas();
  const { device, context, format } = await initWebGPU(canvas);

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

  renderPass.end();

  device.queue.submit([encoder.finish()]);
}
main();