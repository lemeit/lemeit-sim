/* SVG originales de ΣIM; no contienen código ni recursos gráficos de DWSIM. */
'use strict';
(function(root){
  const symbols=Object.freeze({
    Pump:'<path d="M0 50 H25 M95 50 H120 M35 88 H90 L80 75 H45 Z"/><circle cx="60" cy="48" r="35"/><path d="M38 65 L81 48 L38 31 Z"/>',
    Mixer:'<path d="M0 25 H25 M0 50 H25 M0 75 H25 M25 10 L100 50 L25 90 Z M100 50 H120"/>',
    Splitter:'<path d="M0 50 H20 M20 50 L95 10 V90 Z M95 25 H120 M95 75 H120"/>',
    HeatExchanger:'<path d="M0 30 H30 M0 80 H30 M100 30 H130 M100 80 H130"/><circle cx="65" cy="55" r="43"/><path d="M30 30 H45 L85 80 H100 M30 80 H45 L85 30 H100"/>',
    Separator:'<path d="M35 25 C35 5 95 5 95 25 V85 C95 105 35 105 35 85 Z M35 25 C35 40 95 40 95 25 M0 55 H35 M95 30 H130 M95 80 H130 M40 70 H90 M45 99 V108 M85 99 V108"/>',
    Valve:'<path d="M0 50 H20 M20 25 L100 75 V25 L20 75 Z M100 50 H120 M60 50 V15 M42 15 H78"/>',
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
    symbol(type,fallback){return current==='dwsim'&&symbols[type]?symbols[type]:fallback(type);}
  });
})(globalThis);
