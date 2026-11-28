/* Local, dependency-free MathML for known process equations. Unknown expressions remain readable. */
'use strict';
globalThis.SimCalloutMath=(()=>{
 const ns='http://www.w3.org/1998/Math/MathML';
 const n=(tag,...children)=>{const el=document.createElementNS(ns,tag);for(const child of children)el.append(typeof child==='string'?document.createTextNode(child):child);return el;};
 const i=x=>n('mi',x),o=x=>n('mo',x),t=x=>n('mtext',x),r=(...x)=>n('mrow',...x);
 const sub=(x,y)=>n('msub',x,typeof y==='string'?i(y):y);
 const dot=x=>{const el=n('mover',i(x),o('˙'));el.setAttribute('accent','true');return el;};
 const m=x=>x?sub(dot('m'),x):dot('m'),h=x=>x?sub(i('h'),x):i('h'),sum=x=>r(o('∑'),x),eq=(a,b)=>r(a,o('='),b),delta=()=>r(o('Δ'),dot('H')),flux=x=>sub(r(o('('),m(),h(),o(')')),x);
 const approx=(a,b)=>r(a,o('≈'),b),frac=(a,b)=>n('mfrac',a,b);
 const mass=x=>sum(m(x)), species=x=>sub(dot('n'),x);
 const formulas={
 'Σṁₑ = Σṁₛ':()=>eq(mass('e'),mass('s')),
 'Σṁₑ − Σṁₛ':()=>r(mass('e'),o('−'),mass('s')),
 'ΔḢ = Σ(ṁh)ₛ − Σ(ṁh)ₑ':()=>eq(delta(),r(sum(flux('s')),o('−'),sum(flux('e')))),
 'Σ(ṁh)ₑ = ṁₛhₛ':()=>eq(sum(flux('e')),r(m('s'),h('s'))),
 'ṁⱼ = fⱼ · ṁₑ':()=>eq(m('j'),r(sub(i('f'),'j'),o('·'),m('e'))),
 'ṁₑwₖ,ₑ = Σⱼ ṁⱼwₖ,ⱼ':()=>eq(r(m('e'),sub(i('w'),'k,e')),r(sub(o('∑'),'j'),m('j'),sub(i('w'),'k,j'))),
 'Q̇ = ΔḢ':()=>eq(dot('Q'),delta()),
 'ΔḢ caliente + ΔḢ fría ≈ 0':()=>approx(r(sub(delta(),t('caliente')),o('+'),sub(delta(),t('fría'))),n('mn','0')),
 'hₛ ≈ hₑ':()=>approx(h('s'),h('e')),
 'τ = Vρₑ / ṁₑ':()=>eq(i('τ'),frac(r(i('V'),sub(i('ρ'),'e')),m('e'))),
 'Ẇ hacia el fluido ≈ ΔḢ':()=>approx(sub(dot('W'),t('fluido')),delta()),
 'Ẇ generado ≈ −ΔḢ':()=>approx(sub(dot('W'),t('generado')),r(o('−'),delta())),
 'ṅₖ,ₛ − ṅₖ,ₑ = Σᵣ νₖ,ᵣ ξ̇ᵣ':()=>eq(r(species('k,s'),o('−'),species('k,e')),r(sub(o('∑'),'r'),sub(i('ν'),'k,r'),sub(dot('ξ'),'r'))),
 'dM/dt = ṁₑ − ṁₛ':()=>eq(frac(r(i('d'),i('M')),r(i('d'),i('t'))),r(m('e'),o('−'),m('s'))),
 'ṁₖ = ṁ · wₖ':()=>eq(m('k'),r(m(),o('·'),sub(i('w'),'k'))),
 'Ḣ = ṁ · h':()=>eq(dot('H'),r(m(),o('·'),h())),
 'ṁ = ṅ · M':()=>eq(m(),r(dot('n'),o('·'),i('M')))
 };
 function render(root){for(const el of root.querySelectorAll('.explorer-equation')){if(el.querySelector('math'))continue;const plain=el.textContent.trim(),build=formulas[plain];if(!build)continue;const math=n('math',build());math.setAttribute('display','block');math.setAttribute('aria-label',plain);el.title=plain;el.replaceChildren(math);}}
 return {render,formulas};
})();
