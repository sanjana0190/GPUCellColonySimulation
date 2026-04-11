export function setupMouseInteraction(
  canvas: HTMLCanvasElement,
  gridSize: number,
  onCellToggle: (row: number, col: number) => void,
) {
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const nx = x / rect.width;
    const ny = y / rect.height;

    const col = Math.min(
      gridSize - 1,
      Math.max(0, Math.floor(nx * gridSize)),
    );
    // Grid row 0 is bottom in NDC; screen Y grows downward, so flip.
    const row = Math.min(
      gridSize - 1,
      Math.max(0, Math.floor((1 - ny) * gridSize)),
    );

    onCellToggle(row, col);
  });
}
