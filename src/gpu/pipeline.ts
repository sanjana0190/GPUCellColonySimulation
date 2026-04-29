/**
 * Render pipeline: draws one textured quad per grid cell.
 *
 * The fragment shader looks up each cell's state and age in storage buffers,
 * picks the matching cell texture (alive / dividing / dying), and tints it
 * with the user-chosen palette colour.
 */
const RENDER_SHADER = /* wgsl */ `
struct Vertex {
  @builtin(position) position: vec4<f32>,
  @location(0) @interpolate(flat) cellIndex: u32,
  @location(1) uv: vec2<f32>,
};

@group(0) @binding(0) var<storage, read> stateBuffer: array<u32>;
@group(0) @binding(1) var<storage, read> ageBuffer: array<u32>;
@group(0) @binding(2) var<storage, read> palette: array<vec4<f32>, 3>;
@group(0) @binding(3) var texDead: texture_2d<f32>;
@group(0) @binding(4) var texAlive: texture_2d<f32>;
@group(0) @binding(5) var texDividing: texture_2d<f32>;
@group(0) @binding(6) var cellSampler: sampler;

const STATE_EMPTY: u32 = 0u;
const STATE_ALIVE: u32 = 1u;
const STATE_DIVIDING: u32 = 2u;
const STATE_DEAD: u32 = 3u;

@vertex
fn vs_main(
  @location(0) position: vec2<f32>,
  @location(1) uv: vec2<f32>,
  @builtin(vertex_index) vertexIndex: u32,
) -> Vertex {
  var out: Vertex;
  out.position = vec4<f32>(position, 0.0, 1.0);
  out.cellIndex = vertexIndex / 6u;
  out.uv = uv;
  return out;
}

@fragment
fn fs_main(in: Vertex) -> @location(0) vec4<f32> {
  // textureSample uses implicit derivatives, so it must run in uniform
  // control flow. Sample every cell texture before any state-dependent branch.
  let sDead = textureSample(texDead, cellSampler, in.uv);
  let sAlive = textureSample(texAlive, cellSampler, in.uv);
  let sDividing = textureSample(texDividing, cellSampler, in.uv);

  let state = stateBuffer[in.cellIndex];
  if (state == STATE_EMPTY) {
    return vec4<f32>(0.0);
  }

  let age = ageBuffer[in.cellIndex];
  let ageFactor = clamp(f32(age) / 10.0, 0.0, 1.0);
  let deadColor = palette[0];
  let aliveColor = palette[1];
  let dividingColor = palette[2];

  var tex: vec4<f32>;
  var tint: vec4<f32>;

  if (state == STATE_ALIVE) {
    tex = sAlive;
    let brightness = 0.5 + ageFactor * 0.5;
    tint = vec4<f32>(aliveColor.rgb * brightness, aliveColor.a);
  } else if (state == STATE_DIVIDING) {
    tex = sDividing;
    tint = dividingColor;
  } else {
    tex = mix(sAlive, sDead, ageFactor);
    tint = vec4<f32>(mix(aliveColor.rgb, deadColor.rgb, ageFactor), 1.0);
  }

  return vec4<f32>(tex.rgb * tint.rgb, tex.a * tint.a);
}
`;

export function createPipeline(device: GPUDevice, format: GPUTextureFormat) {
  const module = device.createShaderModule({ code: RENDER_SHADER });

  return device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module,
      entryPoint: 'vs_main',
      buffers: [
        {
          arrayStride: 4 * 4,
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x2' },
            { shaderLocation: 1, offset: 8, format: 'float32x2' },
          ],
        },
      ],
    },
    fragment: {
      module,
      entryPoint: 'fs_main',
      targets: [
        {
          format,
          blend: {
            color: {
              srcFactor: 'src-alpha',
              dstFactor: 'one-minus-src-alpha',
              operation: 'add',
            },
            alpha: {
              srcFactor: 'one',
              dstFactor: 'one-minus-src-alpha',
              operation: 'add',
            },
          },
        },
      ],
    },
    primitive: { topology: 'triangle-list' },
  });
}
