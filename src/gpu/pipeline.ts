export function createPipeline(device: GPUDevice, format: GPUTextureFormat){
    const shaderModule = device.createShaderModule({
        code: `
        struct VertexOutput{
            @builtin(position) position: vec4<f32>,
        };
        @vertex
        fn vs_main(@location(0) position: vec2f) -> VertexOutput{
            var output: VertexOutput;
            output.position = vec4<f32>(position,0.0,1.0);
            return output;
        }
        @fragment
        fn fs_main() -> @location(0) vec4<f32>{
            return vec4<f32>(0.8,0.8,0.8,1.0);
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
            topology:"line-list",
        },
    });
}