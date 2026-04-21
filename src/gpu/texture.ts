/**
 * Loads an image URL into a GPU texture suitable for TEXTURE_BINDING + sampling.
 * Uses sRGB so PNG art displays with expected gamma.
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
    format: 'rgba8unorm-srgb',
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT,
  });

  device.queue.copyExternalImageToTexture(
    { source: bitmap },
    { texture },
    [bitmap.width, bitmap.height, 1],
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
