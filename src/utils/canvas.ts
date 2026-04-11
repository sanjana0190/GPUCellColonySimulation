export function getCanvas(): HTMLCanvasElement{
    const canvas = document.getElementById('gpu-canvas') as HTMLCanvasElement;

    if(!canvas){
        throw new Error('Canvas not found');
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    return canvas;
}