/**
 * Cell state IDs shared between TypeScript and WGSL shaders.
 * Keep these in sync with the constants in `compute.ts` and `pipeline.ts`.
 */
export const CELL_STATE = {
  empty: 0,
  alive: 1,
  dividing: 2,
  dead: 3,
} as const;

/** Newly placed cells start with this age and energy. */
export const STARTING_AGE = 1;
export const STARTING_ENERGY = 50;
