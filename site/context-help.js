/* Enlaces didácticos fijos a la wiki propia. No accede a proyectos ni envía datos. */
'use strict';
globalThis.SimContextHelp = (() => {
  const root = 'https://wiki.lemeit.ar/sim/';
  const docs = Object.freeze({
    MaterialStream: ['fundamentos-corrientes-balances/', 'Corrientes, estado y balances'],
    EnergyStream: ['energia-operaciones-termicas/', 'Energía y operaciones térmicas'],
    Mixer: ['fundamentos-corrientes-balances/', 'Mezclas y balances'],
    Splitter: ['grados-libertad-especificaciones/', 'Grados de libertad y reparto'],
    Separator: ['equilibrio-fases-flash/', 'Equilibrio de fases y flash'],
    Heater: ['energia-operaciones-termicas/', 'Calentamiento y balance energético'],
    Cooler: ['energia-operaciones-termicas/', 'Enfriamiento y balance energético'],
    HeatExchanger: ['energia-operaciones-termicas/', 'Intercambiadores de calor'],
    Tank: ['corrientes-propiedades/', 'Tanque y tiempo de residencia'],
    Compressor: ['bombas-valvulas-presion/', 'Compresión de gases y potencia de eje'],
    Pump: ['bombas-valvulas-presion/', 'Bombas y cambios de presión'],
    Valve: ['bombas-valvulas-presion/', 'Válvulas y estrangulamiento'],
    ConversionReactor: ['reactores-estequiometria/', 'Reacciones y conversión'],
    EquilibriumReactor: ['reactores-estequiometria/', 'Reacciones y equilibrio']
  });
  const chapters = Object.freeze({
    specifications: ['grados-libertad-especificaciones/', 'Grados de libertad y especificaciones'],
    properties: ['modelos-termodinamicos/', 'Selección de modelos termodinámicos'],
    connections: ['diagramas-conexiones/', 'Diagramas y conexiones'],
    validation: ['diagnostico-validacion/', 'Diagnóstico y validación']
  });
  function get(type) {
    const entry = docs[type];
    return entry ? { url: root + entry[0], title: entry[1] } : null;
  }
  function chapter(key) {
    const entry = chapters[key];
    return entry ? { url: root + entry[0], title: entry[1] } : null;
  }
  function link(type) {
    const guide = get(type);
    if (!guide) return '';
    return '<p class="inspector-wiki-help"><a href="' + guide.url +
      '" target="_blank" rel="noopener noreferrer" aria-label="Abrir capítulo de la wiki: ' +
      guide.title + '">' + guide.title + ' ↗</a></p>';
  }
  return Object.freeze({ get, chapter, link });
})();
