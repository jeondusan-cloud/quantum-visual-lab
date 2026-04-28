// visualizer.js — Plotly 기반 시각화 (단일 div 버전)
import Plotly from 'plotly.js-dist-min';

export class Visualizer {
  constructor(divId) {
    this.plotDiv = document.getElementById(divId);
    this.initialized = false;
  }

  init(x, V, V0) {
    const xArr = Array.from(x);
    const VArr = Array.from(V);

    // trace 0: 확률밀도 |ψ|²
    // trace 1: Re(ψ)
    // trace 2: Im(ψ)
    // trace 3: 포텐셜 V(x) (오른쪽 y축)
    Plotly.newPlot(this.plotDiv, [
      {
        x: xArr, y: new Array(xArr.length).fill(0),
        mode: 'lines', name: '|ψ(x,t)|²',
        line: { color: '#4cc9f0', width: 2.5 },
        fill: 'tozeroy', fillcolor: 'rgba(76,201,240,0.12)',
      },
      {
        x: xArr, y: new Array(xArr.length).fill(0),
        mode: 'lines', name: 'Re(ψ)',
        line: { color: '#a78bfa', width: 1.5 },
        opacity: 0.7,
      },
      {
        x: xArr, y: new Array(xArr.length).fill(0),
        mode: 'lines', name: 'Im(ψ)',
        line: { color: '#ffd93d', width: 1.5 },
        opacity: 0.7,
      },
      {
        x: xArr, y: VArr,
        mode: 'lines', name: 'V(x)',
        line: { color: '#ef4444', width: 2, dash: 'dash' },
        yaxis: 'y2',
      },
    ], {
      title: { text: '양자 터널링: |ψ|², Re(ψ), Im(ψ)', font: { color: '#e0e0e0', size: 14 } },
      paper_bgcolor: '#0a0e1a',
      plot_bgcolor: '#0a0e1a',
      font: { color: '#a0a8c0' },
      xaxis: { title: '위치 x', gridcolor: '#1e293b', zerolinecolor: '#334155' },
      yaxis: { title: '진폭 / 확률', gridcolor: '#1e293b', range: [-0.6, 0.5], zerolinecolor: '#334155' },
      yaxis2: {
        title: 'V(x)', overlaying: 'y', side: 'right',
        showgrid: false, range: [0, V0 * 2], color: '#ef4444',
      },
      legend: { x: 0.01, y: 0.99, bgcolor: 'rgba(10,14,26,0.7)' },
      margin: { t: 45, r: 60, b: 50, l: 60 },
    }, { responsive: true, displayModeBar: false });

    this.initialized = true;
  }

  update(state) {
    const prob = Array.from(state.probability);
    const re = Array.from(state.re);
    const im = Array.from(state.im);

    // trace 0=|ψ|², trace 1=Re, trace 2=Im, trace 3=V(x)
    if (state.V) {
      const V = Array.from(state.V);
      Plotly.restyle(this.plotDiv, { y: [prob, re, im, V] }, [0, 1, 2, 3]);
    } else {
      Plotly.restyle(this.plotDiv, { y: [prob, re, im] }, [0, 1, 2]);
    }
  }
}
