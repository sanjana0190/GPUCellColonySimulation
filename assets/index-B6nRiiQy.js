(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();function e(){let e=document.getElementById(`gpu-canvas`);if(!e)throw Error(`Canvas not found`);return e.width=window.innerWidth,e.height=window.innerHeight,e}async function t(e){if(!navigator.gpu)throw Error(`WebGPU not supported`);let t=await navigator.gpu.requestAdapter();if(!t)throw Error(`Failed to get GPU adapter`);let n=await t.requestDevice(),r=e.getContext(`webgpu`),i=navigator.gpu.getPreferredCanvasFormat();return r.configure({device:n,format:i,alphaMode:`opaque`}),{device:n,context:r,format:i}}function n(e){let t=[],n=2/e;for(let r=0;r<e;r++)for(let i=0;i<e;i++){let e=-1+i*n,a=-1+r*n,o=e+n,s=a+n;t.push(e,a,0,0,o,a,1,0,o,s,1,1,e,a,0,0,o,s,1,1,e,s,0,1)}return new Float32Array(t)}var r=`
struct Vertex {
  @builtin(position) position: vec4<f32>,
  @location(0) @interpolate(flat) cellIndex: u32,
  @location(1) uv: vec2<f32>,
};

@group(0) @binding(0) var<storage, read> stateBuffer: array<u32>;
@group(0) @binding(1) var<storage, read> ageBuffer: array<u32>;
@group(0) @binding(2) var<storage, read> palette: array<vec4<f32>, 3>;
@group(0) @binding(3) var texDead: texture_2d<f32>;
@group(0) @binding(4) var texAlive: texture_2d<f32>;
@group(0) @binding(5) var texDividing: texture_2d<f32>;
@group(0) @binding(6) var cellSampler: sampler;

const STATE_EMPTY: u32 = 0u;
const STATE_ALIVE: u32 = 1u;
const STATE_DIVIDING: u32 = 2u;
const STATE_DEAD: u32 = 3u;

@vertex
fn vs_main(
  @location(0) position: vec2<f32>,
  @location(1) uv: vec2<f32>,
  @builtin(vertex_index) vertexIndex: u32,
) -> Vertex {
  var out: Vertex;
  out.position = vec4<f32>(position, 0.0, 1.0);
  out.cellIndex = vertexIndex / 6u;
  out.uv = uv;
  return out;
}

@fragment
fn fs_main(in: Vertex) -> @location(0) vec4<f32> {
  // textureSample uses implicit derivatives, so it must run in uniform
  // control flow. Sample every cell texture before any state-dependent branch.
  let sDead = textureSample(texDead, cellSampler, in.uv);
  let sAlive = textureSample(texAlive, cellSampler, in.uv);
  let sDividing = textureSample(texDividing, cellSampler, in.uv);

  let state = stateBuffer[in.cellIndex];
  if (state == STATE_EMPTY) {
    return vec4<f32>(0.0);
  }

  let age = ageBuffer[in.cellIndex];
  let ageFactor = clamp(f32(age) / 10.0, 0.0, 1.0);
  let deadColor = palette[0];
  let aliveColor = palette[1];
  let dividingColor = palette[2];

  var tex: vec4<f32>;
  var tint: vec4<f32>;

  if (state == STATE_ALIVE) {
    tex = sAlive;
    let brightness = 0.5 + ageFactor * 0.5;
    tint = vec4<f32>(aliveColor.rgb * brightness, aliveColor.a);
  } else if (state == STATE_DIVIDING) {
    tex = sDividing;
    tint = dividingColor;
  } else {
    tex = mix(sAlive, sDead, ageFactor);
    tint = vec4<f32>(mix(aliveColor.rgb, deadColor.rgb, ageFactor), 1.0);
  }

  return vec4<f32>(tex.rgb * tint.rgb, tex.a * tint.a);
}
`;function i(e,t){let n=e.createShaderModule({code:r});return e.createRenderPipeline({layout:`auto`,vertex:{module:n,entryPoint:`vs_main`,buffers:[{arrayStride:16,attributes:[{shaderLocation:0,offset:0,format:`float32x2`},{shaderLocation:1,offset:8,format:`float32x2`}]}]},fragment:{module:n,entryPoint:`fs_main`,targets:[{format:t,blend:{color:{srcFactor:`src-alpha`,dstFactor:`one-minus-src-alpha`,operation:`add`},alpha:{srcFactor:`one`,dstFactor:`one-minus-src-alpha`,operation:`add`}}}]},primitive:{topology:`triangle-list`}})}var a={empty:0,alive:1,dividing:2,dead:3},o=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST;function s(e,t,n=0){let r=t*t,i=Math.min(n,r),o=new Uint32Array(r),s=new Uint32Array(r),l=new Uint32Array(r);for(let e=0;e<i;e++){let e=Math.floor(Math.random()*r);for(;o[e]!==a.empty;)e=(e+1)%r;o[e]=a.alive,s[e]=1,l[e]=50}let u=new Uint32Array(r);return{stateA:c(e,o),stateB:c(e,u),ageA:c(e,s),ageB:c(e,u),energyA:c(e,l),energyB:c(e,u)}}function c(e,t){let n=e.createBuffer({size:t.byteLength,usage:o});return e.queue.writeBuffer(n,0,t),n}var l=e=>`
struct Params {
  divideAge: u32,
  deathAge: u32,
  survivalEnergy: u32,
  divideEnergy: u32,
};

const STATE_EMPTY: u32 = 0u;p
const STATE_ALIVE: u32 = 1u;
const STATE_DIVIDING: u32 = 2u;
const STATE_DEAD: u32 = 3u;

const SIZE: u32 = ${e}u;
const NO_CELL: u32 = ${e*e}u;

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
`;function u(e,t){let n=e.createShaderModule({code:l(t)});return e.createComputePipeline({layout:`auto`,compute:{module:n,entryPoint:`cs_main`}})}function d(e,t,n,r,i,a,o){let{dead:s,alive:c,dividing:l,sampler:u}=o,d=e=>e.createView();return{computeAB:e.createBindGroup({layout:t,entries:[{binding:0,resource:{buffer:r.stateA}},{binding:1,resource:{buffer:r.stateB}},{binding:2,resource:{buffer:r.ageA}},{binding:3,resource:{buffer:r.ageB}},{binding:4,resource:{buffer:r.energyA}},{binding:5,resource:{buffer:r.energyB}},{binding:6,resource:{buffer:a}}]}),computeBA:e.createBindGroup({layout:t,entries:[{binding:0,resource:{buffer:r.stateB}},{binding:1,resource:{buffer:r.stateA}},{binding:2,resource:{buffer:r.ageB}},{binding:3,resource:{buffer:r.ageA}},{binding:4,resource:{buffer:r.energyB}},{binding:5,resource:{buffer:r.energyA}},{binding:6,resource:{buffer:a}}]}),renderA:e.createBindGroup({layout:n,entries:[{binding:0,resource:{buffer:r.stateA}},{binding:1,resource:{buffer:r.ageA}},{binding:2,resource:{buffer:i}},{binding:3,resource:d(s)},{binding:4,resource:d(c)},{binding:5,resource:d(l)},{binding:6,resource:u}]}),renderB:e.createBindGroup({layout:n,entries:[{binding:0,resource:{buffer:r.stateB}},{binding:1,resource:{buffer:r.ageB}},{binding:2,resource:{buffer:i}},{binding:3,resource:d(s)},{binding:4,resource:d(c)},{binding:5,resource:d(l)},{binding:6,resource:u}]})}}async function f(e,t){let n=await(await fetch(t)).blob(),r=await createImageBitmap(n),i=e.createTexture({size:[r.width,r.height,1],format:`rgba8unorm-srgb`,usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});return e.queue.copyExternalImageToTexture({source:r},{texture:i},[r.width,r.height,1]),r.close(),i}function p(e){return e.createSampler({magFilter:`linear`,minFilter:`linear`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`})}function m(e,t,n){let r=new Float32Array(12);return h(e,r,0),h(t,r,4),h(n,r,8),r}function h(e,t,n){let r=e.startsWith(`#`)?e.slice(1):e,i=parseInt(r.slice(0,2),16)/255,a=parseInt(r.slice(2,4),16)/255,o=parseInt(r.slice(4,6),16)/255;t[n]=Number.isFinite(i)?i:0,t[n+1]=Number.isFinite(a)?a:0,t[n+2]=Number.isFinite(o)?o:0,t[n+3]=1}function g(){let e=!0,t=100,n=document.getElementById(`toggle`),r=document.getElementById(`reset`),i=document.getElementById(`speed`),a=p(`initial-cells`),o=p(`divide-age`),s=p(`death-age`),c=p(`survival-energy`),l=p(`divide-energy`),u=document.getElementById(`color-dead`),d=document.getElementById(`color-alive`),f=document.getElementById(`color-dividing`);n.onclick=()=>{e=!e,n.textContent=e?`Pause`:`Start`},i.oninput=()=>{t=Number(i.value)},g(a),a.input.addEventListener(`input`,()=>{g(a)});function p(e){return{input:document.getElementById(e),output:document.getElementById(`${e}-value`)}}function h(e){return Number(e.input.value)}function g(e){e.output.value=e.input.value}let _=[o,s,c,l];function v(){let e=h(o),t=h(s),n=Number(s.input.max);t<=e&&(s.input.value=String(Math.min(n,e+1)));let r=h(c),i=h(l),a=Number(l.input.max);i<=r&&(l.input.value=String(Math.min(a,r+1)))}function y(){v();for(let e of _)g(e)}function b(){v();let e=h(o),t=h(s),n=h(c),r=h(l);return new Uint32Array([e,t,n,r])}function x(){return m(u.value,d.value,f.value)}return{get isRunning(){return e},get speed(){return t},get initialCellCount(){return h(a)},readPalette:x,readSimulationParams:b,onReset(e){r.onclick=e},onSimulationParamsChange(e){y();for(let t of _)t.input.addEventListener(`input`,()=>{y(),e()})},onPaletteChange(e){for(let t of[u,d,f])t.addEventListener(`input`,e)}}}function _(e,t,n){e.addEventListener(`click`,r=>{let i=e.getBoundingClientRect(),a=r.clientX-i.left,o=r.clientY-i.top,s=a/i.width,c=o/i.height,l=Math.min(t-1,Math.max(0,Math.floor(s*t)));n(Math.min(t-1,Math.max(0,Math.floor((1-c)*t))),l)})}var v=`/GPUCellColonySimulation/assets/Dead%20Cell-BcFC9mVG.png`,y=`/GPUCellColonySimulation/assets/Living%20Cell-DCgI8XhE.png`,b=`/GPUCellColonySimulation/assets/Dividing%20Cell-C7maMMib.png`,x=32,S=Math.ceil(x/8),C=48,w=16;function T(e){e.stateA.destroy(),e.stateB.destroy(),e.ageA.destroy(),e.ageB.destroy(),e.energyA.destroy(),e.energyB.destroy()}async function E(){let r=e(),{device:o,context:c,format:l}=await t(r),[m,h,E]=await Promise.all([f(o,v),f(o,y),f(o,b)]),D={dead:m,alive:h,dividing:E,sampler:p(o)},O=g(),k=o.createBuffer({size:C,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),A=o.createBuffer({size:w,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});function j(){let e=O.readPalette();o.queue.writeBuffer(k,0,e)}function M(){let e=O.readSimulationParams();o.queue.writeBuffer(A,0,e)}O.onPaletteChange(j),O.onSimulationParamsChange(M),j(),M();let N=i(o,l),P=u(o,x),F=P.getBindGroupLayout(0),I=N.getBindGroupLayout(0),L=n(x),R=o.createBuffer({size:L.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});o.queue.writeBuffer(R,0,L);let z=s(o,x,O.initialCellCount),B=!0,V=H();function H(){return d(o,F,I,z,k,A,D)}O.onReset(()=>{T(z),z=s(o,x,O.initialCellCount),V=H(),B=!0});let U=()=>B?z.stateA:z.stateB,W=()=>B?z.ageA:z.ageB,G=()=>B?z.energyA:z.energyB,K=new Uint32Array([a.alive]),q=new Uint32Array([1]),J=new Uint32Array([50]);function Y(e,t){if(e<0||e>=x||t<0||t>=x)return;let n=(e*x+t)*4;o.queue.writeBuffer(U(),n,K),o.queue.writeBuffer(W(),n,q),o.queue.writeBuffer(G(),n,J)}_(r,x,Y);let X=0,Z=0;function Q(e){let t=e-X;X=e,Z+=t;let n=O.speed,r=o.createCommandEncoder();for(;Z>=n&&O.isRunning;){let e=r.beginComputePass();e.setPipeline(P),e.setBindGroup(0,B?V.computeAB:V.computeBA),e.dispatchWorkgroups(S,S),e.end(),B=!B,Z-=n}let i=r.beginRenderPass({colorAttachments:[{view:c.getCurrentTexture().createView(),clearValue:{r:.02,g:.02,b:.03,a:1},loadOp:`clear`,storeOp:`store`}]});i.setPipeline(N),i.setVertexBuffer(0,R),i.setBindGroup(0,B?V.renderA:V.renderB),i.draw(L.length/4),i.end(),o.queue.submit([r.finish()]),requestAnimationFrame(Q)}requestAnimationFrame(Q)}E();