/* SVG originales de ΣIM; no contienen código ni recursos gráficos de DWSIM. */
'use strict';
(function(root){
  const symbols=Object.freeze({
    Pump:'<path d="M0 50 H26 M94 50 H120 M35 90 H92 L82 76 H45 Z"/><path d="M26 50 C26 7 92 3 94 40 V66 L78 78 H48 C34 78 26 66 26 50 Z"/><circle cx="60" cy="47" r="16"/><path d="M60 31 V63 M44 47 H76"/>',
    Mixer:'<path d="M0 25 H20 L40 40 M0 50 H40 M0 75 H20 L40 60 M90 50 H120"/><path d="M40 20 H80 L100 50 L80 80 H40 Z"/><path d="M50 35 L78 65 M50 65 L78 35"/>',
    Splitter:'<path d="M0 50 H30 M90 35 H105 V25 H120 M90 65 H105 V75 H120"/><rect x="30" y="20" width="60" height="60" rx="8"/><path d="M40 50 H60 V35 H80 M60 50 V65 H80"/>',
    HeatExchanger:'<path d="M0 30 H25 M0 80 H25 M105 30 H130 M105 80 H130"/><rect x="25" y="18" width="80" height="74" rx="20"/><path d="M25 30 H40 V45 H90 V65 H40 V80 H105 M45 18 V92 M85 18 V92"/>',
    Separator:'<path d="M35 25 C35 5 95 5 95 25 V85 C95 105 35 105 35 85 Z M35 25 C35 40 95 40 95 25 M0 55 H35 M95 30 H130 M95 80 H130 M40 70 H90 M45 99 V108 M85 99 V108"/>',
    Valve:'<path d="M0 50 H20 M20 25 L100 75 V25 L20 75 Z M100 50 H120 M60 50 V18 M35 18 Q60 -2 85 18 Z"/>',
    Heater:'<circle cx="60" cy="50" r="40"/><path d="M0 50 H20 M100 50 H120 M60 90 V100 M40 50 H80 M60 30 V70"/>',
    Cooler:'<circle cx="60" cy="50" r="40"/><path d="M0 50 H20 M100 50 H120 M60 90 V100 M40 50 H80"/>',
    ConversionReactor:'<path d="M30 25 C30 5 100 5 100 25 V85 C100 105 30 105 30 85 Z M0 55 H30 M100 30 H130 M100 80 H130 M65 10 V65 M45 45 L85 65 M85 45 L45 65"/>',
    EquilibriumReactor:'<path d="M30 25 C30 5 100 5 100 25 V85 C100 105 30 105 30 85 Z M0 55 H30 M100 30 H130 M100 80 H130 M45 45 H85 L75 35 M85 65 H45 L55 75"/>'
  });
  const key='lemeit-visual-palette-v1',listeners=new Set();
  const valid=id=>id==='sim'||id==='dwsim';
  let current='sim';
  try{const saved=root.localStorage?.getItem(key);if(valid(saved))current=saved;}catch{}
  function select(id,persist=true){
    if(!valid(id)||id===current)return false;
    current=id;
    if(persist)try{root.localStorage?.setItem(key,id);}catch{}
    for(const listener of listeners)listener(id);
    return true;
  }
  root.addEventListener?.('storage',event=>{if(event.key===key)select(valid(event.newValue)?event.newValue:'sim',false);});
  root.SimEquipmentPalettes=Object.freeze({
    get current(){return current;},
    list:Object.freeze([{id:'sim',label:'ΣIM'},{id:'dwsim',label:'DWSIM'}].map(Object.freeze)),
    select,
    subscribe(listener){listeners.add(listener);return ()=>listeners.delete(listener);},
    symbol(type,fallback){return current==='dwsim'&&symbols[type]?`<g class="dwsim-symbol">${symbols[type]}</g>`:fallback(type);}
  });
})(globalThis);
