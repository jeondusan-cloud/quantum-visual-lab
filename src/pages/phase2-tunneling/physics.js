// phase2-tunneling/physics.js
// ============================================================
// Quantum Tunneling Simulator - TDSE Solver
// Method: Split-Operator (Strang splitting) with FFT
// Units: Natural units (ℏ = m = 1)
// ============================================================

import { fft, ifft } from 'fft-js';

// ============================================================
// 1. GRID & CONSTANTS
// ============================================================

/**
 * 공간 격자 생성
 * @param {number} N - 격자점 개수 (2의 거듭제곱이어야 FFT 빠름)
 * @param {number} L - 공간 도메인 크기 [-L/2, L/2]
 * @returns {{x: Float64Array, dx: number, k: Float64Array}}
 */
export function createGrid(N = 1024, L = 100) {
  const dx = L / N;
  const x = new Float64Array(N);
  const k = new Float64Array(N);
  
  // 위치 격자: x ∈ [-L/2, L/2)
  for (let i = 0; i < N; i++) {
    x[i] = -L / 2 + i * dx;
  }
  
  // 운동량 격자 (FFT 표준 순서: 0, dk, 2dk, ..., -2dk, -dk)
  const dk = (2 * Math.PI) / L;
  for (let i = 0; i < N; i++) {
    k[i] = i < N / 2 ? i * dk : (i - N) * dk;
  }
  
  return { x, dx, k, N, L };
}

// ============================================================
// 2. INITIAL WAVEFUNCTION (Gaussian Wave Packet)
// ============================================================

/**
 * 가우시안 파동패킷 (분리된 real/imag 배열 반환)
 * ψ(x,0) = (2πσ²)^(-1/4) · exp(-(x-x₀)²/4σ²) · exp(ik₀x)
 * 
 * @param {Float64Array} x - 위치 배열
 * @param {number} x0 - 초기 중심 위치
 * @param {number} k0 - 초기 운동량
 * @param {number} sigma - 패킷 폭
 * @returns {{real: Float64Array, imag: Float64Array}}
 */
export function gaussianPacket(x, x0, k0, sigma) {
  const N = x.length;
  const real = new Float64Array(N);
  const imag = new Float64Array(N);
  const norm = Math.pow(2 * Math.PI * sigma * sigma, -0.25);
  
  for (let i = 0; i < N; i++) {
    const d = x[i] - x0;
    const envelope = norm * Math.exp(-(d * d) / (4 * sigma * sigma));
    const phase = k0 * x[i];
    real[i] = envelope * Math.cos(phase);
    imag[i] = envelope * Math.sin(phase);
  }
  
  return { real, imag };
}

// ============================================================
// 3. POTENTIAL: Rectangular Barrier
// ============================================================

/**
 * 사각 포텐셜 장벽
 * V(x) = V₀ for |x| < a/2, else 0
 * 
 * @param {Float64Array} x - 위치 배열
 * @param {number} V0 - 장벽 높이
 * @param {number} a - 장벽 폭
 * @returns {Float64Array}
 */
export function createBarrier(x, V0, a) {
  const N = x.length;
  const V = new Float64Array(N);
  
  for (let i = 0; i < N; i++) {
    V[i] = Math.abs(x[i]) < a / 2 ? V0 : 0;
  }
  
  return V;
}

// ============================================================
// 4. SPLIT-OPERATOR PROPAGATOR
// ============================================================

/**
 * 한 시간 스텝 진화: ψ(t) → ψ(t + dt)
 * 입력/출력 모두 분리된 real/imag 배열
 * 
 * 알고리즘 (Strang splitting):
 *   1. ψ ← exp(-iV·dt/2) · ψ        (위치공간 절반 스텝)
 *   2. ψ̃ ← FFT(ψ)
 *   3. ψ̃ ← exp(-i·k²·dt/2) · ψ̃    (운동량공간 풀 스텝)
 *   4. ψ ← IFFT(ψ̃)
 *   5. ψ ← exp(-iV·dt/2) · ψ        (위치공간 절반 스텝)
 * 
 * @param {Float64Array} psiR - 실수부
 * @param {Float64Array} psiI - 허수부
 * @param {Float64Array} V - 포텐셜
 * @param {Float64Array} k - 운동량 격자
 * @param {number} dt - 시간 스텝
 * @returns {{real: Float64Array, imag: Float64Array}}
 */
export function evolveStep(psiR, psiI, V, k, dt) {
  const N = psiR.length;
  
  // fft-js 포맷으로 변환: [Re, Im] 쌍 배열
  const psi = new Array(N);
  
  // Step 1: 위치공간에서 V 절반 스텝 (e^(-iV·dt/2) 곱하기)
  for (let i = 0; i < N; i++) {
    const angle = -V[i] * dt / 2;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    // (c + is)(re + i·im) = (c·re - s·im) + i(c·im + s·re)
    psi[i] = [c * psiR[i] - s * psiI[i], c * psiI[i] + s * psiR[i]];
  }
  
  // Step 2: FFT to momentum space
  const psiK = fft(psi);
  
  // Step 3: 운동량공간에서 T 풀 스텝 (e^(-i·k²·dt/2) 곱하기)
  for (let i = 0; i < N; i++) {
    const angle = -k[i] * k[i] * dt / 2;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const re = psiK[i][0];
    const im = psiK[i][1];
    psiK[i] = [c * re - s * im, c * im + s * re];
  }
  
  // Step 4: IFFT back to position space
  const psiX = ifft(psiK);
  
  // Step 5: 위치공간에서 V 절반 스텝 한 번 더 + 분리 배열로 변환
  const real = new Float64Array(N);
  const imag = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    const angle = -V[i] * dt / 2;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const re = psiX[i][0];
    const im = psiX[i][1];
    real[i] = c * re - s * im;
    imag[i] = c * im + s * re;
  }
  
  return { real, imag };
}

// ============================================================
// 5. OBSERVABLES & DIAGNOSTICS
// ============================================================

/**
 * 확률밀도 |ψ(x)|² 계산 (분리 배열 입력)
 */
export function probabilityDensity(psiR, psiI) {
  const N = psiR.length;
  const prob = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    prob[i] = psiR[i] * psiR[i] + psiI[i] * psiI[i];
  }
  return prob;
}

/**
 * 전체 확률 (정규화 체크용) ∫|ψ|² dx ≈ 1 이어야 함
 * @param {Float64Array} x - 위치 배열 (dx 계산용)
 * @param {Float64Array} psiR - 실수부
 * @param {Float64Array} psiI - 허수부
 */
export function totalProbability(x, psiR, psiI) {
  const N = x.length;
  const dx = (x[N - 1] - x[0]) / (N - 1);
  let sum = 0;
  for (let i = 0; i < N; i++) {
    sum += psiR[i] * psiR[i] + psiI[i] * psiI[i];
  }
  return sum * dx;
}

/**
 * 투과/반사 확률 계산
 * @param {Float64Array} x - 위치 배열
 * @param {Float64Array} psiR - 실수부
 * @param {Float64Array} psiI - 허수부
 * @param {number} barrierEdge - 장벽 오른쪽 끝 (a/2), 0이면 x=0 기준
 */
export function transmissionReflection(x, psiR, psiI, barrierEdge) {
  const N = x.length;
  const dx = (x[N - 1] - x[0]) / (N - 1);
  let R = 0, T = 0;
  
  for (let i = 0; i < N; i++) {
    const p = psiR[i] * psiR[i] + psiI[i] * psiI[i];
    if (x[i] < -barrierEdge) R += p * dx;       // 왼쪽 영역 = 반사
    else if (x[i] > barrierEdge) T += p * dx;    // 오른쪽 영역 = 투과
  }
  
  return { R, T, total: R + T };
}
