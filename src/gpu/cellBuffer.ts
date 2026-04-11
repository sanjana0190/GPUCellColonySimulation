export function createCellStateBuffer(
    device: GPUDevice,
    gridSize: number
){
    const cellCount = gridSize * gridSize;
    const cellStates = new Uint32Array(cellCount);
    for(let i=0;i<cellCount;i++){
        cellStates[i] = Math.random() > 0.5 ? 1 : 0;
    }

    const bufferA  = device.createBuffer({
        size: cellStates.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    const bufferB = device.createBuffer({
        size: cellStates.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(bufferA,0,cellStates);

    return {bufferA, bufferB, cellCount};
}