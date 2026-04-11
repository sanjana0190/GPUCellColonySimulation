export function createCellStateBuffer(
    device: GPUDevice,
    gridSize: number
){
    const cellCount = gridSize * gridSize;

    const cellStates = new Uint32Array(cellCount);
    const ageStates = new Uint32Array(cellCount);

    for(let i=0;i<cellCount;i++){
        const alive = Math.random() > 0.5 ? 1 : 0;
        cellStates[i] = alive;
        ageStates[i] = alive ? 1 : 0;
    }

    const usage = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC;
        
    function createBuffer(data: Uint32Array) {
        const buffer = device.createBuffer({
          size: data.byteLength,
          usage,
        });
        device.queue.writeBuffer(buffer, 0, data as Uint32Array<ArrayBuffer>);
        return buffer;
      }

    return {
        stateA: createBuffer(cellStates),
        stateB: createBuffer(new Uint32Array(cellCount)),
        ageA: createBuffer(ageStates),
        ageB: createBuffer(new Uint32Array(cellCount)),
    };
}