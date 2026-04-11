export function createComputePipeline(device: GPUDevice, gridSize: number) {
    const shaderModule = device.createShaderModule({
        code: `
        struct CellState{
            data: array<u32>,
        };

        @group(0) @binding(0) var<storage, read> inputCells: CellState;
        @group(0) @binding(1) var<storage, read_write> outputCells: CellState;

        fn getIndex(x: u32, y: u32, size: u32) -> u32{
            return y * size +x;
        }

        @compute @workgroup_size(8, 8, 1)
        fn cs_main(@builtin(global_invocation_id) globalId: vec3u) {
            let size = ${gridSize}u;
            let x = globalId.x;
            let y = globalId.y;

            if (x >= size || y >= size) {
                return;
            }
            var neighbors: u32 = 0u;
            for (var dy: i32 = -1; dy <= 1; dy++) {
                for (var dx: i32 = -1; dx <= 1; dx++) {
                    if(dx==0 && dy==0){
                    continue;
                }

                let nx = i32(x) + dx;
                let ny = i32(y) + dy;

                //boundary check
                if(nx>=0 && nx<i32(size) && ny>=0 && ny<i32(size)){
                    let index = getIndex(u32(nx),u32(ny), size);
                    neighbors += inputCells.data[index];
                }
                }
            }
            let index = getIndex(x, y, size);
            let current = inputCells.data[index];
            var next: u32 = current;

            //applying game of life rules.
            if(current == 1u){
                if(neighbors < 2u || neighbors > 3u){
                    next = 0u;
                }else{
                    next = 1u;
                }
            } else {
                if (neighbors == 3u) {
                    next = 1u;
                }
            }

            outputCells.data[index] = next;
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