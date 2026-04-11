export function createCellStateBuffer(
    device: GPUDevice,
    gridSize: number
){
    const cellCount = gridSize * gridSize;
    const cellStates = new Uint32Array(cellCount);
    for(let i=0;i<cellCount;i++){
        cellStates[i] = Math.random() > 0.5 ? 1 : 0;
    }

    const usage = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC;
        
    const bufferA  = device.createBuffer({
        size: cellStates.byteLength,
        usage: usage,
    });

    const bufferB = device.createBuffer({
        size: cellStates.byteLength,
        usage: usage,
    });

    device.queue.writeBuffer(bufferA,0,cellStates);

    return {bufferA, bufferB};
}