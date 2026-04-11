export function createPipeline(device: GPUDevice, format: GPUTextureFormat){
    const shaderModule = device.createShaderModule({
        code: `
        struct CellState{
            data: array<u32>,
        };
        @group(0) @binding(0) var<storage, read> stateBuffer: CellState;
        @group(0) @binding(1) var<storage, read> ageBuffer: CellState;

        struct VertexOutput{
            @builtin(position) position: vec4<f32>,
            @location(0) @interpolate(flat) cellIndex: u32,
        };

        @vertex
        fn vs_main(@location(0) position: vec2f, 
        @builtin(vertex_index) vertexIndex: u32,) -> VertexOutput{
            var output: VertexOutput;
            output.position = vec4<f32>(position,0.0,1.0);
            output.cellIndex = vertexIndex/6u; //each six vertices = 1 square = 2 triangles
            return output;
        }
        fn getColor(state: u32, age: u32) -> vec4<f32> {
            let ageFactor = min(f32(age) / 10.0, 1.0);
            if (state == 0u) {
                return vec4<f32>(0.02, 0.02, 0.03, 1.0);
            }
            if (state == 1u) {
                let s = 0.5 + ageFactor * 0.5;
                let rgb = vec3<f32>(0.2, 0.8, 0.3) * s;
                return vec4<f32>(rgb, 1.0);
            }
            if (state == 2u) {
                return vec4<f32>(1.0, 1.0, 0.3, 1.0);
            }
            if (state == 3u) {
                let rgb = vec3<f32>(0.9, 0.2, 0.2) * (1.0 - ageFactor);
                return vec4<f32>(rgb, 1.0);
            }
            return vec4<f32>(1.0, 1.0, 1.0, 1.0);
        }

        @fragment
        fn fs_main(@location(0) @interpolate(flat) cellIndex: u32) -> @location(0) vec4<f32> {
            let state = stateBuffer.data[cellIndex];
            let age = ageBuffer.data[cellIndex];
            return getColor(state, age);
        }
        `,
    });


    return device.createRenderPipeline({
        layout: "auto",
        vertex: {
            module: shaderModule,
            entryPoint: "vs_main",
            buffers: [
                {
                    arrayStride: 2*4,
                    attributes: [
                        {
                            shaderLocation:0,
                            offset:0,
                            format: "float32x2",
                        },
                    ],
                },
            ],
        },
        fragment:{
            module: shaderModule,
            entryPoint: "fs_main",
            targets: [
                {
                    format,
                },
            ],
        },

        primitive: {
            topology: "triangle-list",
        },
    });
}