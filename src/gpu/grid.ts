export function createGridVertices(size: number, divisions: number): Float32Array{
    const vertices: number[] = [];
    const step = size/divisions;
    const half = size/2;

    //vertical lines
    for(let i=0;i<=divisions;i++){
        const x = -half + i * step;

        vertices.push(x,-half);
        vertices.push(x,half);
    }
    for(let j=0;j<=divisions;j++){
        const y = -half + j * step;
        vertices.push(-half,y);
        vertices.push(half,y);
    }
    return new Float32Array(vertices)
}

