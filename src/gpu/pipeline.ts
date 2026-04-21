export function createPipeline(device: GPUDevice, format: GPUTextureFormat) {
  const shaderModule = device.createShaderModule({
    code: `
        struct CellState{
            data: array<u32>,
        };
        @group(0) @binding(0) var<storage, read> stateBuffer: CellState;
        @group(0) @binding(1) var<storage, read> ageBuffer: CellState;
        @group(0) @binding(2) var<storage, read> palette: array<vec4<f32>, 3>;
        @group(0) @binding(3) var texDead: texture_2d<f32>;
        @group(0) @binding(4) var texAlive: texture_2d<f32>;
        @group(0) @binding(5) var texDividing: texture_2d<f32>;
        @group(0) @binding(6) var cellSampler: sampler;

        struct VertexOutput{
            @builtin(position) position: vec4<f32>,
            @location(0) @interpolate(flat) cellIndex: u32,
            @location(1) uv: vec2<f32>,
        };

        @vertex
        fn vs_main(
            @location(0) position: vec2<f32>,
            @location(1) uv: vec2<f32>,
            @builtin(vertex_index) vertexIndex: u32,
        ) -> VertexOutput {
            var output: VertexOutput;
            output.position = vec4<f32>(position, 0.0, 1.0);
            output.cellIndex = vertexIndex / 6u;
            output.uv = uv;
            return output;
        }

        fn getTint(state: u32, age: u32) -> vec4<f32> {
            let ageFactor = min(f32(age) / 10.0, 1.0);
            let deadC = palette[0];
            let aliveC = palette[1];
            let divC = palette[2];
            if (state == 0u) {
                return deadC;
            }
            if (state == 1u) {
                let s = 0.5 + ageFactor * 0.5;
                let rgb = aliveC.xyz * s;
                return vec4<f32>(rgb, aliveC.w);
            }
            if (state == 2u) {
                return divC;
            }
            if (state == 3u) {
                let rgb = mix(aliveC.xyz, deadC.xyz, ageFactor);
                return vec4<f32>(rgb, 1.0);
            }
            return vec4<f32>(1.0, 1.0, 1.0, 1.0);
        }

        @fragment
        fn fs_main(
            @location(0) @interpolate(flat) cellIndex: u32,
            @location(1) uv: vec2<f32>,
        ) -> @location(0) vec4<f32> {
            let state = stateBuffer.data[cellIndex];
            let age = ageBuffer.data[cellIndex];
            let tint = getTint(state, age);

            let cDead = textureSample(texDead, cellSampler, uv);
            let cAlive = textureSample(texAlive, cellSampler, uv);
            let cDiv = textureSample(texDividing, cellSampler, uv);

            var tex = cDead;
            if (state == 1u) {
                tex = cAlive;
            } else if (state == 2u) {
                tex = cDiv;
            } else if (state == 3u) {
                let ageFactor = min(f32(age) / 10.0, 1.0);
                tex = mix(cAlive, cDead, ageFactor);
            }

            let rgb = tex.rgb * tint.rgb;
            let a = tex.a * tint.a;
            return vec4<f32>(rgb, a);
        }
        `,
  });

  return device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: shaderModule,
      entryPoint: 'vs_main',
      buffers: [
        {
          arrayStride: 4 * 4,
          attributes: [
            {
              shaderLocation: 0,
              offset: 0,
              format: 'float32x2',
            },
            {
              shaderLocation: 1,
              offset: 8,
              format: 'float32x2',
            },
          ],
        },
      ],
    },
    fragment: {
      module: shaderModule,
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

    primitive: {
      topology: 'triangle-list',
    },
  });
}
