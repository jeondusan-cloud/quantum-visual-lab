import '../../src/styles/style.css'; // 글로벌 스타일
import '../../src/styles/page.css';  // 페이지 전용 스타일
import 'katex/dist/katex.min.css';
import katex from 'katex';
import Plotly from 'plotly.js-dist-min';
import { psi, psiSquared, energy, generateXArray } from '../utils/quantum-math.js';

// 상태 변수
let currentN = 1;
let currentL = 1.0;
let showPsi = true;
let showProb = true;

// DOM 요소
const nButtons = document.querySelectorAll('.n-btn');
const lSlider = document.getElementById('l-slider');
const lValue = document.getElementById('l-value');
const showPsiCheck = document.getElementById('show-psi');
const showProbCheck = document.getElementById('show-prob');
const plotDiv = document.getElementById('plot-div');
const infoEnergy = document.getElementById('info-energy');
const infoNodes = document.getElementById('info-nodes');
const infoDesc = document.getElementById('info-desc');

// 초기화 함수
function init() {
  renderMath();
  setupEventListeners();
  updatePlot(true);
  updateInfo();
}

// KaTeX 수식 렌더링
function renderMath() {
  const mathContainer = document.getElementById('math-equations');
  const eq1 = "\\psi_n(x) = \\sqrt{\\frac{2}{L}} \\sin\\left(\\frac{n\\pi x}{L}\\right)";
  const eq2 = "|\\psi_n(x)|^2 = \\frac{2}{L} \\sin^2\\left(\\frac{n\\pi x}{L}\\right)";
  
  katex.render(`${eq1} \\quad \\text{,} \\quad ${eq2}`, mathContainer, {
    displayMode: true,
    throwOnError: false
  });
}

// 이벤트 리스너 설정
function setupEventListeners() {
  nButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      nButtons.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentN = parseInt(e.target.getAttribute('data-n'));
      updatePlot();
      updateInfo();
    });
  });

  lSlider.addEventListener('input', (e) => {
    currentL = parseFloat(e.target.value);
    lValue.textContent = currentL.toFixed(1);
    updatePlot();
    updateInfo();
  });

  showPsiCheck.addEventListener('change', (e) => {
    showPsi = e.target.checked;
    updatePlot();
  });

  showProbCheck.addEventListener('change', (e) => {
    showProb = e.target.checked;
    updatePlot();
  });
}

// 그래프 업데이트
function updatePlot(isInitial = false) {
  const x = generateXArray(currentL, 200);
  
  const tracePsi = {
    x: x,
    y: x.map(val => psi(val, currentN, currentL)),
    mode: 'lines',
    name: 'ψ(x)',
    line: { color: '#4cc9f0', width: 3 },
    visible: showPsi ? true : 'legendonly'
  };

  const traceProb = {
    x: x,
    y: x.map(val => psiSquared(val, currentN, currentL)),
    mode: 'lines',
    name: '|ψ(x)|²',
    line: { color: '#ff9e3d', width: 3 },
    visible: showProb ? true : 'legendonly'
  };

  const layout = {
    paper_bgcolor: '#0a0e1a',
    plot_bgcolor: '#0a0e1a',
    font: { color: '#e0e0e0' },
    margin: { t: 40, r: 40, b: 40, l: 40 },
    xaxis: { 
      title: '위치 (x)',
      range: [-0.1, 2.1], // 여유 공간
      showgrid: false,
      zeroline: false
    },
    yaxis: {
      title: '진폭 / 확률',
      range: [-2.5, 4.5], // 고정하여 크기 변화 관찰 용이하게
      showgrid: false,
      zeroline: false
    },
    shapes: [
      // 0 기준선
      {
        type: 'line',
        x0: -0.1, y0: 0, x1: 2.1, y1: 0,
        line: { color: '#334155', width: 1, dash: 'dot' }
      },
      // 왼쪽 벽 x = 0
      {
        type: 'line',
        x0: 0, y0: -2.5, x1: 0, y1: 4.5,
        line: { color: '#ef4444', width: 2, dash: 'dot' }
      },
      // 오른쪽 벽 x = L
      {
        type: 'line',
        x0: currentL, y0: -2.5, x1: currentL, y1: 4.5,
        line: { color: '#ef4444', width: 2, dash: 'dot' }
      }
    ]
  };

  const config = { responsive: true, displayModeBar: false };

  if (isInitial) {
    Plotly.newPlot(plotDiv, [tracePsi, traceProb], layout, config);
  } else {
    Plotly.react(plotDiv, [tracePsi, traceProb], layout, config);
  }
}

// 하단 정보 텍스트 업데이트
function updateInfo() {
  const en = energy(currentN, currentL);
  infoEnergy.textContent = `현재 에너지 E_${currentN} = ${en.toFixed(2)} (단위: ℏ²/mL²)`;
  infoNodes.textContent = `마디(node) 개수: ${currentN} - 1 = ${currentN - 1}`;
  
  let desc = '';
  if (currentN === 1) {
    desc = '바닥상태(n=1)에서는 파동함수의 마디가 없으며, 우물 중앙에서 입자를 발견할 확률이 가장 높습니다.';
  } else {
    desc = `들뜬상태(n=${currentN})에서는 파동함수가 0이 되는 지점(마디)이 ${currentN - 1}개 존재하며, 이 지점에서는 입자를 발견할 확률이 0입니다. 에너지는 n²에 비례하여 증가합니다.`;
  }
  
  if (currentL !== 1.0) {
    desc += ` 또한 우물의 너비(L)가 ${currentL < 1.0 ? '좁아져' : '넓어져'} 에너지가 ${currentL < 1.0 ? '증가' : '감소'}했습니다 (E ∝ 1/L²).`;
  }
  
  infoDesc.textContent = desc;
}

// 실행
document.addEventListener('DOMContentLoaded', init);
