/*
 * SPDX-License-Identifier: GPL-3.0-only
 * SVG port of DWSIM's SkiaSharp DrawMode 0 geometry.
 * DWSIM: Daniel Wagner Oliveira de Medeiros and contributors.
 * See licenses/NOTICE.md for the upstream revision and class mapping.
 */
'use strict';

const DwsimSymbols = (() => {
  const path = (d, extra = '') => `<path d="${d}" ${extra}/>`;
  const line = d => path(d, 'fill="none"');
  const rect = (x, y, width, height, radius = 0) =>
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}"/>`;
  const oval = (cx, cy, rx, ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`;
  const letter = (x, y, size, tag) =>
    `<text class="dwsim-letter" x="${x}" y="${y}" style="font-size:${size}px" text-anchor="middle">${tag}</text>`;
  const stream = path('M0 35 H65 V25 L100 50 L65 75 V65 H0 Z');
  const tank = path('M10 10 A40 10 0 0 1 90 10 V90 A40 10 0 0 1 10 90 Z') +
    oval(50, 10, 40, 10).replace('/>', ' fill="none"/>');
  const stirred = oval(50, 90, 40, 10) + rect(10, 10, 80, 80) +
    oval(50, 10, 40, 10) + line('M50 -10 V70') +
    oval(35, 65, 15, 5) + oval(65, 65, 15, 5);
  const reactor = tag => rect(25, 0, 50, 100, 10) + rect(11, 43, 14, 14) +
    rect(75, 10, 14, 14) + rect(75, 76, 14, 14) +
    line('M25 30 H75 L25 70 H75 Z') + letter(50, 93, 20, tag);
  const thermal = tag => path('M0 50 L50 0 L100 50 L50 100 Z') + letter(50, 70, 55, tag);
  const trays = right => Array.from({length: 7}, (_, i) => 'M6.25 ' + (20 + i * 10) + ' H' + right).join(' ');
  // DWSIM's 10-unit corner radius in its flowsheet coordinate system.
  const roundColumn = (right, width) => rect(6.25, 10, right - 6.25, 80, 1250 / width)
    .replace('/>', ' ry="' + 1250 / 225 + '"/>');
  const distillation = roundColumn(31.25, 180) +
    oval(75, 17.5, 9.375, 7.5) + oval(75, 82.5, 9.375, 7.5) +
    line('M17.5 10 V2 H75 V10 M17.5 90 V98 H75 V90 M75 25 V30 H31.25 M75 75 V70 H31.25 M75 98 H100 M75 30 H100 ' +
      'M50 17.5 H68.75 L71.875 12.5 L78.125 22.5 L81.25 17.5 H100 ' +
      'M50 82.5 H68.75 L71.875 87.5 L78.125 77.5 L81.25 82.5 H100 ' + trays(31));
  const absorption = roundColumn(81.25, 67.5) +
    line('M45 10 V2 H100 M45 90 V98 H100 ' + trays(81.25));
  const pfr = path('M10 0 H90 A10 50 0 0 1 90 100 H10 A10 50 0 0 1 10 0 Z') +
    oval(10, 50, 10, 50).replace('/>', ' fill="none"/>') +
    line(Array.from({length: 15}, (_, i) => 'M' + (15 + i * 5) + ' 0 a10 50 0 0 1 0 100').join(' '));

  const drawings = {
    MaterialStream: stream,
    EnergyStream: stream,
    Mixer: path('M100 50 L50 0 H0 V100 H50 Z'),
    Splitter: path('M0 50 L50 0 H100 V100 H50 Z'),
    Separator: path('M25 20 A25 20 0 0 1 75 20 V80 A25 20 0 0 1 25 80 Z') +
      line('M25 20 H75 M25 80 H75'),
    Tank: tank,
    Expander: path('M100 0 L0 30 V70 L100 100 Z'),
    Compressor: path('M0 0 L100 30 V70 L0 100 Z'),
    Pump: path('M50 100 L70 98 L80 90 L90 100 H10 L20 90 L30 98 Z') +
      path('M50 0 H100 V25 H93 Z') + oval(50, 50, 50, 50) +
      rect(-5, 35, 55, 30).replace('/>', ' class="dwsim-paper"/>') +
      rect(-5, 35, 55, 30),
    HeatExchanger: oval(50, 50, 50, 50) + line('M0 100 L25 37.5 L75 62.5 L100 0'),
    Valve: path('M0 20 L50 50 L100 20 V80 L50 50 L0 80 Z'),
    Heater: thermal('H'),
    Cooler: thermal('C'),
    ConversionReactor: reactor('C'),
    EquilibriumReactor: reactor('E'),
    CSTR: stirred,
    Polymerization: stirred,
    PFR: pfr,
    RigorousColumn: distillation,
    AbsorptionColumn: absorption,
    ReliefValve: path('M20 100 L50 50 L100 20 V80 L50 50 L80 100 Z') +
      line('M50 50 V20 H0 M10 30 L20 10 M20 30 L30 10 M30 30 L40 10'),
  };

  function equipment(type, width, height) {
    // SVG geometry scales with the equipment bounds, while stroke and lettering stay isotropic.
    return '<g transform="scale(' + width / 100 + ' ' + height / 100 + ')">' + drawings[type] + '</g>';
  }

  function thumbnail(type, {w, h}) {
    return '<svg class="palette-symbol dwsim ' + (type === 'EnergyStream' ? 'dwsim-energy' : '') +
      '" viewBox="' + [-w * .12, -h * .15, w * 1.24, h * 1.3].join(' ') +
      '" aria-hidden="true">' + equipment(type, w, h) + '</svg>';
  }

  function arrowTransform({a, b, length}, anchor) {
    const angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    const size = Math.min(length, 40) / 100;
    const x = anchor === 'out' ? b.x : anchor === 'in' ? a.x : (a.x + b.x) / 2;
    const y = anchor === 'out' ? b.y : anchor === 'in' ? a.y : (a.y + b.y) / 2;
    const offset = anchor === 'out' ? -100 : anchor === 'in' ? 0 : -50;
    return 'translate(' + x + ' ' + y + ') rotate(' + angle + ') scale(' + size + ') translate(' + offset + ' -50)';
  }

  function arrow(transform) {
    return '<g class="dwsim-stream-arrow" transform="' + transform + '">' +
      stream.replace('/>', ' class="dwsim-paper"/>') + stream + '</g>';
  }

  return Object.freeze({equipment, thumbnail, arrowTransform, arrow});
})();
