export function setupControls() {
    let isRunning = true;
    let speed = 100;
  
    const toggleBtn = document.getElementById("toggle") as HTMLButtonElement;
    const resetBtn = document.getElementById("reset") as HTMLButtonElement;
    const speedSlider = document.getElementById("speed") as HTMLInputElement;
  
    toggleBtn.onclick = () => {
      isRunning = !isRunning;
      toggleBtn.textContent = isRunning ? "Pause" : "Start";
    };
  
    speedSlider.oninput = () => {
      speed = Number(speedSlider.value);
    };
  
    return {
      get isRunning() {
        return isRunning;
      },
      get speed() {
        return speed;
      },
      onReset(callback: () => void) {
        resetBtn.onclick = callback;
      },
    };
  }