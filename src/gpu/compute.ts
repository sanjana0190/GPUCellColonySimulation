export function createComputePipeline(device: GPUDevice){
    const shaderModule = device.createShaderModule({
        code: `
        struct CellState{
            data: array<u32>,
        };

        @group(0) @binding(0) var<storage, read> inputCells: CellState;
        @group(0) @binding(1) var<storage, read_write> outputCells: CellState;

        @compute @workgroup_size(8, 8, 1)
        fn cs_main(@builtin(global_invocation_id) globalId: vec3u) {
            let gridSize = 32u;
            let x = globalId.x;
            let y = globalId.y;

            if (x >= gridSize || y >= gridSize) {
                return;
            }
            let index = y * gridSize + x;

            outputCells.data[index] = inputCells.data[index];
        }
        `,
    });

    return device.createComputePipeline({
        layout: "auto",
        compute: {
            module: shaderModule,
            entryPoint: "cs_main",
        },
    });
}