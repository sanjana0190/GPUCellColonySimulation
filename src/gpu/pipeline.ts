export function createPipeline(device: GPUDevice, format: GPUTextureFormat){
    const shaderModule = device.createShaderModule({
        code: `
        struct CellState{
            data: array<u32>,
        };
        @group(0) @binding(0) var<storage, read> cellState: CellState;

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
        @fragment
        fn fs_main(@location(0) @interpolate(flat) cellIndex: u32) -> @location(0) vec4<f32> {
            let state = cellState.data[cellIndex];
            if(state == 1u){
                return vec4<f32>(0.2,0.9,0.3,1.0); //alive cell color
            }

            return vec4<f32>(0.0, 0.0, 0.0, 1.0); // dead cell (black)
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