export function createGridVertices(size: number): Float32Array{
    const vertices: number[] = [];
    const step = 2/size;

    for(let row = 0;row<size;row++){
        for(let col = 0;col<size;col++){
            const x = -1+col*step;
            const y = -1+row*step;

            const x2 = x+step;
            const y2 = y+step;

            vertices.push(
                x, y,
                x2, y,
                x2, y2,
                x, y,
                x2, y2,
                x, y2,
            );
        }
    }
    return new Float32Array(vertices)
}

