export function createCellStateBuffer(
    device: GPUDevice,
    gridSize: number
){
    const cellCount = gridSize * gridSize;
    const cellStates = new Uint32Array(cellCount);
    for(let i=0;i<cellCount;i++){
        cellStates[i] = Math.random() > 0.5 ? 1 : 0;
    }

    const buffer  = device.createBuffer({
        size: cellStates.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(buffer,0,cellStates);

    return {buffer, cellStates};
}