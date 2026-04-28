// main.js — UI 컨트롤 + 애니메이션 루프
// tunneling.html의 DOM ID에 정확히 맞춤

import {
  createGrid,
  gaussianPacket,
  createBarrier,
  evolveStep,
  transmissionReflection,
  totalProbability,
} from './physics.js';
import { Visualizer } from './visualizer.js';

// ─────────────────────────────────────────────────────────
// 시뮬레이션 상수
// ─────────────────────────────────────────────────────────
const N = 1024;
const L = 80;
const DT = 0.05;
const V0 = 1.0;
const X0 = -15;
const STEPS_PER_FRAME = 4;
const T_STOP = 80;

// ─────────────────────────────────────────────────────────
// 전역 상태
// ─────────────────────────────────────────────────────────
const state = {
  grid: null,
  V: null,
  psiR: null,
  psiI: null,
  t: 0,
  running: false,
  rafId: null,
  viz: null,
};

// ─────────────────────────────────────────────────────────
// 헬퍼: visualizer가 기대하는 state 객체 생성
// ─────────────────────────────────────────────────────────
function buildVizState() {
  const n = state.psiR.length;
  const prob = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    prob[i] = state.psiR[i] * state.psiR[i] + state.psiI[i] * state.psiI[i];
  }
  return { probability: prob, re: state.psiR, im: state.psiI, V: state.V };
}

// ─────────────────────────────────────────────────────────
// 통계 패널 갱신 (tunneling.html의 ID에 맞춤)
// ─────────────────────────────────────────────────────────
function updateStats() {
  const { T, R } = transmissionReflection(state.grid.x, state.psiR, state.psiI, 0);
  const total = totalProbability(state.grid.x, state.psiR, state.psiI);

  setText('info-T', `투과율 T = ${(T * 100).toFixed(1)} %`);
  setText('info-R', `반사율 R = ${(R * 100).toFixed(1)} %`);
  setText('info-norm', `정규화 ∫|ψ|²dx = ${total.toFixed(3)}`);
  setText('info-time', `시간 t = ${state.t.toFixed(2)}`);
}

// ─────────────────────────────────────────────────────────
// 슬라이더 값 → 시뮬레이션 재구성
// ─────────────────────────────────────────────────────────
function rebuild() {
  const energyRatio = parseFloat(getEl('energy-ratio-slider').value);
  const barrierWidth = parseFloat(getEl('barrier-width-slider').value);
  const sigma = parseFloat(getEl('sigma-slider').value);

  setText('energy-ratio-value', energyRatio.toFixed(2));
  setText('barrier-width-value', barrierWidth.toFixed(1));
  setText('sigma-value', sigma.toFixed(1));

  // k₀ = √(2·E),   E = energyRatio · V₀
  const k0 = Math.sqrt(2 * energyRatio * V0);

  state.grid = createGrid(N, L);
  state.V = createBarrier(state.grid.x, V0, barrierWidth);
  const { real, imag } = gaussianPacket(state.grid.x, X0, k0, sigma);
  state.psiR = real;
  state.psiI = imag;
  state.t = 0;

  if (!state.viz.initialized) {
    state.viz.init(state.grid.x, state.V, V0);
  }
  state.viz.update(buildVizState());
  updateStats();
}

// ─────────────────────────────────────────────────────────
// 애니메이션 루프
// ─────────────────────────────────────────────────────────
function loop() {
  if (!state.running) return;

  for (let i = 0; i < STEPS_PER_FRAME; i++) {
    const next = evolveStep(state.psiR, state.psiI, state.V, state.grid.k, DT);
    state.psiR = next.real;
    state.psiI = next.imag;
    state.t += DT;
  }

  state.viz.update(buildVizState());
  updateStats();

  if (state.t > T_STOP) {
    pauseSim();
    return;
  }

  state.rafId = requestAnimationFrame(loop);
}

// ─────────────────────────────────────────────────────────
// 컨트롤 함수
// ─────────────────────────────────────────────────────────
function startSim() {
  if (state.running) return;
  if (state.t >= T_STOP) rebuild();
  state.running = true;
  setBtnEnabled('btn-play', false);
  setBtnEnabled('btn-pause', true);
  loop();
}

function pauseSim() {
  state.running = false;
  if (state.rafId !== null) {
    cancelAnimationFrame(state.rafId);
    state.rafId = null;
  }
  setBtnEnabled('btn-play', true);
  setBtnEnabled('btn-pause', false);
}

function resetSim() {
  pauseSim();
  rebuild();
}

// ─────────────────────────────────────────────────────────
// DOM 헬퍼
// ─────────────────────────────────────────────────────────
function getEl(id) {
  const el = document.getElementById(id);
  if (!el) console.warn(`[main.js] Element #${id} not found`);
  return el;
}
function setText(id, value) {
  const el = getEl(id);
  if (el) el.textContent = value;
}
function setBtnEnabled(id, enabled) {
  const el = getEl(id);
  if (el) el.disabled = !enabled;
}

// ─────────────────────────────────────────────────────────
// 이벤트 바인딩
// ─────────────────────────────────────────────────────────
function bindEvents() {
  ['energy-ratio-slider', 'barrier-width-slider', 'sigma-slider'].forEach(id => {
    const el = getEl(id);
    if (!el) return;
    el.addEventListener('input', () => {
      pauseSim();
      rebuild();
    });
  });

  getEl('btn-play')?.addEventListener('click', startSim);
  getEl('btn-pause')?.addEventListener('click', pauseSim);
  getEl('btn-reset')?.addEventListener('click', resetSim);
}

// ─────────────────────────────────────────────────────────
// 부트스트랩
// ─────────────────────────────────────────────────────────
function init() {
  // plot-div 하나를 사용 (tunneling.html에는 단일 그래프 컨테이너)
  state.viz = new Visualizer('plot-div');

  bindEvents();
  rebuild();

  console.log('✓ Phase 2 Tunneling initialized');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
