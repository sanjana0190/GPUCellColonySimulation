/**
 * Compute pipeline: advances the cell grid one tick.
 *
 * Each cell can be in one of four states:
 *   0 EMPTY     – no cell here
 *   1 ALIVE     – living cell, ages and gains/loses energy each tick
 *   2 DIVIDING  – flagged for division this tick; produces a child next tick
 *   3 DEAD      – dying cell that lingers a few ticks before clearing
 *
 * State transitions every tick:
 *   ALIVE   → DIVIDING when age ≥ divideAge AND energy ≥ divideEnergy
 *   ALIVE   → DEAD     when age ≥ deathAge OR energy < survivalEnergy
 *   DIVIDING → ALIVE   (parent) — and an empty neighbour becomes ALIVE (child)
 *   DEAD    → EMPTY    after DEAD_LINGER_TICKS
 *   EMPTY   → ALIVE    when a dividing neighbour claims this cell
 */
const computeShader = (gridSize: number) => /* wgsl */ `
struct Params {
  divideAge: u32,
  deathAge: u32,
  survivalEnergy: u32,
  divideEnergy: u32,
};

const STATE_EMPTY: u32 = 0u;
const STATE_ALIVE: u32 = 1u;
const STATE_DIVIDING: u32 = 2u;
const STATE_DEAD: u32 = 3u;

const SIZE: u32 = ${gridSize}u;
const NO_CELL: u32 = ${gridSize * gridSize}u;

const ENERGY_GAIN: i32 = 8;
const CROWDING_PENALTY: i32 = 10;
const COMFORT_NEIGHBORS: u32 = 3u;
const MAX_ENERGY: i32 = 100;
const DEAD_LINGER_TICKS: u32 = 10u;

@group(0) @binding(0) var<storage, read>       stateIn:  array<u32>;
@group(0) @binding(1) var<storage, read_write> stateOut: array<u32>;
@group(0) @binding(2) var<storage, read>       ageIn:    array<u32>;
@group(0) @binding(3) var<storage, read_write> ageOut:   array<u32>;
@group(0) @binding(4) var<storage, read>       energyIn: array<u32>;
@group(0) @binding(5) var<storage, read_write> energyOut: array<u32>;
@group(0) @binding(6) var<uniform>             params:   Params;

fn idx(x: u32, y: u32) -> u32 { return y * SIZE + x; }

fn inBounds(x: i32, y: i32) -> bool {
  return x >= 0 && x < i32(SIZE) && y >= 0 && y < i32(SIZE);
}

// 8 surrounding offsets, fixed clockwise order starting at +x.
fn neighborOffset(i: u32) -> vec2<i32> {
  switch (i) {
    case 0u:  { return vec2<i32>( 1,  0); }
    case 1u:  { return vec2<i32>( 1,  1); }
    case 2u:  { return vec2<i32>( 0,  1); }
    case 3u:  { return vec2<i32>(-1,  1); }
    case 4u:  { return vec2<i32>(-1,  0); }
    case 5u:  { return vec2<i32>(-1, -1); }
    case 6u:  { return vec2<i32>( 0, -1); }
    default:  { return vec2<i32>( 1, -1); }
  }
}

// Per-cell rotation so different cells try neighbours in different orders,
// avoiding the visual artefact of every parent always preferring the same side.
fn neighborStart(x: u32, y: u32) -> u32 {
  return ((x * 1664525u) ^ (y * 1013904223u)) & 7u;
}

fn clampEnergy(value: i32) -> u32 {
  return u32(clamp(value, 0, MAX_ENERGY));
}

fn livingNeighbors(x: u32, y: u32) -> u32 {
  var count: u32 = 0u;
  for (var i: u32 = 0u; i < 8u; i++) {
    let off = neighborOffset(i);
    let nx = i32(x) + off.x;
    let ny = i32(y) + off.y;
    if (inBounds(nx, ny)) {
      let s = stateIn[idx(u32(nx), u32(ny))];
      if (s == STATE_ALIVE || s == STATE_DIVIDING) {
        count += 1u;
      }
    }
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

// Slot a dividing cell at (x,y) would place its child in. Returns NO_CELL when
// every neighbour is occupied.
fn preferredChildSlot(x: u32, y: u32) -> u32 {
  let start = neighborStart(x, y);
  for (var i: u32 = 0u; i < 8u; i++) {
    let off = neighborOffset((start + i) & 7u);
    let nx = i32(x) + off.x;
    let ny = i32(y) + off.y;
    if (inBounds(nx, ny)) {
      let dest = idx(u32(nx), u32(ny));
      if (stateIn[dest] == STATE_EMPTY) {
        return dest;
      }
    }
  }
  return NO_CELL;
}

// For an empty cell, find a dividing neighbour whose preferred slot is *here*.
// Returns NO_CELL when no parent claims this cell.
fn parentClaimingCell(x: u32, y: u32) -> u32 {
  let here = idx(x, y);
  for (var i: u32 = 0u; i < 8u; i++) {
    let off = neighborOffset(i);
    let sx = i32(x) + off.x;
    let sy = i32(y) + off.y;
    if (inBounds(sx, sy)) {
      let parent = idx(u32(sx), u32(sy));
      if (stateIn[parent] == STATE_DIVIDING && preferredChildSlot(u32(sx), u32(sy)) == here) {
        return parent;
      }
    }
  }
  return NO_CELL;
}

@compute @workgroup_size(8, 8, 1)
fn cs_main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let x = gid.x;
  let y = gid.y;
  if (x >= SIZE || y >= SIZE) { return; }

  let here = idx(x, y);
  let state = stateIn[here];
  let age = ageIn[here];
  let energy = energyIn[here];
  let neighbors = livingNeighbors(x, y);

  var nextState = state;
  var nextAge = age;
  var nextEnergy = energy;

  switch (state) {
    case STATE_ALIVE: {
      nextAge = age + 1u;
      nextEnergy = livingEnergyAfterTick(energy, neighbors);

      if (nextAge >= params.deathAge || nextEnergy < params.survivalEnergy) {
        nextState = STATE_DEAD;
        nextAge = 1u;
        nextEnergy = 0u;
      } else if (nextAge >= params.divideAge && nextEnergy >= params.divideEnergy) {
        nextState = STATE_DIVIDING;
        nextEnergy = nextEnergy / 2u; // parent and child share energy
      }
    }

    case STATE_DIVIDING: {
      // Resolve division: parent goes back to alive; the child appears in
      // the empty branch below thanks to parentClaimingCell.
      nextState = STATE_ALIVE;
      nextAge = age + 1u;
      nextEnergy = livingEnergyAfterTick(energy, neighbors);
    }

    case STATE_DEAD: {
      nextAge = age + 1u;
      nextEnergy = 0u;
      if (nextAge >= DEAD_LINGER_TICKS) {
        nextState = STATE_EMPTY;
        nextAge = 0u;
      }
    }

    case STATE_EMPTY: {
      let parent = parentClaimingCell(x, y);
      if (parent != NO_CELL) {
        nextState = STATE_ALIVE;
        nextAge = 1u;
        nextEnergy = energyIn[parent]; // half of parent's pre-division energy
      }
    }

    default: {}
  }

  stateOut[here] = nextState;
  ageOut[here] = nextAge;
  energyOut[here] = nextEnergy;
}
`;

export function createComputePipeline(device: GPUDevice, gridSize: number) {
  const module = device.createShaderModule({ code: computeShader(gridSize) });
  return device.createComputePipeline({
    layout: 'auto',
    compute: { module, entryPoint: 'cs_main' },
  });
}
