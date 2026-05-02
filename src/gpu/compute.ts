/**
 * Compute pipeline: advances the cell grid one tick.
 *
 * States: 0=EMPTY 1=ALIVE 2=DIVIDING 3=DEAD
 *
 * Written to use only if/else (no switch) and explicit i=i+1u increments
 * for maximum compatibility across WebGPU implementations (Chrome + Safari).
 */
const computeShader = (gridSize: number) => /* wgsl */ `
struct Params {
  divideAge:      u32,
  deathAge:       u32,
  survivalEnergy: u32,
  divideEnergy:   u32,
};

const SIZE:             u32 = ${gridSize}u;
const NO_CELL:          u32 = ${gridSize * gridSize}u;
const ENERGY_GAIN:      i32 = 8;
const CROWDING_PENALTY: i32 = 10;
const COMFORT_NEIGHBORS:u32 = 3u;
const MAX_ENERGY:       i32 = 100;
const DEAD_LINGER_TICKS:u32 = 10u;

@group(0) @binding(0) var<storage, read>       stateIn:   array<u32>;
@group(0) @binding(1) var<storage, read_write> stateOut:  array<u32>;
@group(0) @binding(2) var<storage, read>       ageIn:     array<u32>;
@group(0) @binding(3) var<storage, read_write> ageOut:    array<u32>;
@group(0) @binding(4) var<storage, read>       energyIn:  array<u32>;
@group(0) @binding(5) var<storage, read_write> energyOut: array<u32>;
@group(0) @binding(6) var<uniform>             params:    Params;

fn idx(x: u32, y: u32) -> u32 { return y * SIZE + x; }

fn inBounds(x: i32, y: i32) -> bool {
  return x >= 0 && x < i32(SIZE) && y >= 0 && y < i32(SIZE);
}

// Neighbour offsets in clockwise order starting at +x.
// Split into X/Y components to avoid switch-in-function return issues.
fn nox(i: u32) -> i32 {
  if (i == 0u) { return  1; }
  if (i == 1u) { return  1; }
  if (i == 2u) { return  0; }
  if (i == 3u) { return -1; }
  if (i == 4u) { return -1; }
  if (i == 5u) { return -1; }
  if (i == 6u) { return  0; }
  return 1;
}

fn noy(i: u32) -> i32 {
  if (i == 0u) { return  0; }
  if (i == 1u) { return  1; }
  if (i == 2u) { return  1; }
  if (i == 3u) { return  1; }
  if (i == 4u) { return  0; }
  if (i == 5u) { return -1; }
  if (i == 6u) { return -1; }
  return -1;
}

fn neighborStart(x: u32, y: u32) -> u32 {
  return ((x * 1664525u) ^ (y * 1013904223u)) & 7u;
}

fn clampEnergy(value: i32) -> u32 {
  return u32(clamp(value, 0, MAX_ENERGY));
}

fn livingNeighbors(x: u32, y: u32) -> u32 {
  var count: u32 = 0u;
  var i: u32 = 0u;
  loop {
    if (i >= 8u) { break; }
    let nx = i32(x) + nox(i);
    let ny = i32(y) + noy(i);
    if (inBounds(nx, ny)) {
      let s = stateIn[idx(u32(nx), u32(ny))];
      if (s == 1u || s == 2u) { count = count + 1u; }
    }
    i = i + 1u;
  }
  return count;
}

fn livingEnergyAfterTick(currentEnergy: u32, neighbors: u32) -> u32 {
  var crowding: i32 = 0;
  if (neighbors > COMFORT_NEIGHBORS) {
    crowding = i32(neighbors - COMFORT_NEIGHBORS) * CROWDING_PENALTY;
  }
  return clampEnergy(i32(currentEnergy) + ENERGY_GAIN - crowding);
}

fn preferredChildSlot(x: u32, y: u32) -> u32 {
  let start = neighborStart(x, y);
  var i: u32 = 0u;
  loop {
    if (i >= 8u) { break; }
    let ni = (start + i) & 7u;
    let nx = i32(x) + nox(ni);
    let ny = i32(y) + noy(ni);
    if (inBounds(nx, ny)) {
      let dest = idx(u32(nx), u32(ny));
      if (stateIn[dest] == 0u) { return dest; }
    }
    i = i + 1u;
  }
  return NO_CELL;
}

fn parentClaimingCell(x: u32, y: u32) -> u32 {
  let here = idx(x, y);
  var i: u32 = 0u;
  loop {
    if (i >= 8u) { break; }
    let sx = i32(x) + nox(i);
    let sy = i32(y) + noy(i);
    if (inBounds(sx, sy)) {
      let parent = idx(u32(sx), u32(sy));
      if (stateIn[parent] == 2u && preferredChildSlot(u32(sx), u32(sy)) == here) {
        return parent;
      }
    }
    i = i + 1u;
  }
  return NO_CELL;
}

@compute @workgroup_size(8, 8, 1)
fn cs_main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let x = gid.x;
  let y = gid.y;
  if (x >= SIZE || y >= SIZE) { return; }

  let here     = idx(x, y);
  let state    = stateIn[here];
  let age      = ageIn[here];
  let energy   = energyIn[here];
  let neighbors = livingNeighbors(x, y);

  var nextState  = state;
  var nextAge    = age;
  var nextEnergy = energy;

  if (state == 1u) {
    // ALIVE: age and update energy, then check transitions
    nextAge    = age + 1u;
    nextEnergy = livingEnergyAfterTick(energy, neighbors);

    if (nextAge >= params.deathAge || nextEnergy < params.survivalEnergy) {
      nextState  = 3u; // → DEAD
      nextAge    = 1u;
      nextEnergy = 0u;
    } else if (nextAge >= params.divideAge && nextEnergy >= params.divideEnergy) {
      nextState  = 2u; // → DIVIDING
      nextEnergy = nextEnergy / 2u;
    }

  } else if (state == 2u) {
    // DIVIDING: parent reverts to ALIVE; child spawns via parentClaimingCell below
    nextState  = 1u;
    nextAge    = age + 1u;
    nextEnergy = livingEnergyAfterTick(energy, neighbors);

  } else if (state == 3u) {
    // DEAD: linger then clear
    nextAge    = age + 1u;
    nextEnergy = 0u;
    if (nextAge >= DEAD_LINGER_TICKS) {
      nextState = 0u; // → EMPTY
      nextAge   = 0u;
    }

  } else {
    // EMPTY: become ALIVE if a dividing neighbour claims this slot
    let parent = parentClaimingCell(x, y);
    if (parent != NO_CELL) {
      nextState  = 1u;
      nextAge    = 1u;
      nextEnergy = energyIn[parent];
    }
  }

  stateOut[here]  = nextState;
  ageOut[here]    = nextAge;
  energyOut[here] = nextEnergy;
}
`;

// Use the async variant so shader compilation errors reject the promise
// and surface as visible errors rather than silent no-ops.
export async function createComputePipeline(device: GPUDevice, gridSize: number) {
  const module = device.createShaderModule({ code: computeShader(gridSize) });
  return device.createComputePipelineAsync({
    layout: 'auto',
    compute: { module, entryPoint: 'cs_main' },
  });
}
