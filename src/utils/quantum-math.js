/**
 * 양자역학 파동함수 관련 순수 함수 모음
 */

// 파동함수 값 계산: psi_n(x) = sqrt(2/L) * sin(n * pi * x / L)
export function psi(x, n, L) {
  if (x < 0 || x > L) return 0;
  return Math.sqrt(2 / L) * Math.sin((n * Math.PI * x) / L);
}

// 확률밀도 계산: |psi_n(x)|^2 = (2/L) * sin^2(n * pi * x / L)
export function psiSquared(x, n, L) {
  if (x < 0 || x > L) return 0;
  const val = Math.sin((n * Math.PI * x) / L);
  return (2 / L) * (val * val);
}

// 에너지 계산: E_n = n^2 * pi^2 / (2 * L^2)
export function energy(n, L) {
  return (Math.pow(n, 2) * Math.pow(Math.PI, 2)) / (2 * Math.pow(L, 2));
}

// X축 배열 생성
export function generateXArray(L, points = 200) {
  const xArray = [];
  const step = L / (points - 1);
  for (let i = 0; i < points; i++) {
    xArray.push(i * step);
  }
  return xArray;
}
