export function createComputePipeline(device: GPUDevice, gridSize: number) {
    const shaderModule = device.createShaderModule({
        code: `
        struct CellState{
            data: array<u32>,
        };

        @group(0) @binding(0) var<storage, read> stateIn: CellState;
        @group(0) @binding(1) var<storage, read_write> stateOut: CellState;

        @group(0) @binding(2) var<storage, read> ageIn: CellState;
        @group(0) @binding(3) var<storage, read_write> ageOut: CellState;

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

            let cellIndex = getIndex(x, y, size);
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
                    let nIdx = getIndex(u32(nx),u32(ny), size);
                    let nState = stateIn.data[nIdx];
                    if (nState == 1u || nState == 2u) {
                        neighbors += 1u;
                    }
                }
                }
            }

            let currentState = stateIn.data[cellIndex];
            let currentAge = ageIn.data[cellIndex];
    
            var nextState = currentState;
            var nextAge = currentAge;

            //applying  rules.
            if(currentState == 1u){//ALIVE
                if(neighbors < 2u || neighbors > 3u){
                    nextState = 3u;
                }else if(neighbors == 3u){
                    nextState = 2u; //dividing
                }
                nextAge = currentAge + 1u;
            }

            else if(currentState == 3u){
                if(neighbors == 3u){
                    nextState = 2u;
                    nextAge = 1u;
                }
            } //dead

            else if(currentState == 2u){//dividing
                nextState = 1u; //becomes alive
                nextAge = currentAge + 1u;
            }

            else if(currentState == 0u) {
                if(neighbors == 3u) {
                    nextState = 1u;
                    nextAge = 1u;
                }
            }

            stateOut.data[cellIndex] = nextState;
            ageOut.data[cellIndex] = nextAge;
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