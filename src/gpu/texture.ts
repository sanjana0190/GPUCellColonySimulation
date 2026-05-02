/**
 * Loads an image URL into a GPU texture suitable for TEXTURE_BINDING + sampling.
 *
 * Uses rgba8unorm (not srgb) for maximum cross-browser compatibility — Safari
 * has known issues with copyExternalImageToTexture + rgba8unorm-srgb on some
 * versions. The visual difference for cell art is negligible.
 */
export async function loadTextureFromUrl(
  device: GPUDevice,
  url: string,
): Promise<GPUTexture> {
  const response = await fetch(url);
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);

  const texture = device.createTexture({
    size: [bitmap.width, bitmap.height, 1],
    format: 'rgba8unorm',
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT,
  });

  device.queue.copyExternalImageToTexture(
    { source: bitmap, flipY: false },
    { texture, premultipliedAlpha: false },
    [bitmap.width, bitmap.height],
  );

  bitmap.close();
  return texture;
}

export function createLinearSampler(device: GPUDevice): GPUSampler {
  return device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
  });
}
