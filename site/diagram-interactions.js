/* Gestos de objetos del diagrama. Sin dependencia del motor ni del DOM para geometría. */
'use strict';
globalThis.SimDiagramInteractions=(()=>{
  function insideCanvas(x,y,rect){
    return Number.isFinite(x)&&Number.isFinite(y)&&!!rect&&
      x>=rect.left&&x<=rect.right&&y>=rect.top&&y<=rect.bottom;
  }
  function outsideCanvas(x,y,rect,margin=24){
    return Number.isFinite(x)&&Number.isFinite(y)&&rect&&
      (x<rect.left-margin||x>rect.right+margin||y<rect.top-margin||y>rect.bottom+margin);
  }
  function shouldRemoveAfterDrag({startX,startY,x,y,rect,cancelled=false}){
    return !cancelled&&Number.isFinite(startX)&&Number.isFinite(startY)&&
      Math.hypot(x-startX,y-startY)>=18&&outsideCanvas(x,y,rect);
  }
  function isEditable(target){
    return !!(target?.isContentEditable||target?.closest?.('input,textarea,select,button,[contenteditable],[role="textbox"],[role="combobox"],[role="spinbutton"]'));
  }
  function isDeleteShortcut(event){
    return (event.key==='Delete'||event.key==='Backspace')&&
      !event.altKey&&!event.ctrlKey&&!event.metaKey&&!isEditable(event.target);
  }
  function snap(value,enabled=true,step=20){return enabled&&Number.isFinite(value)?Math.round(value/step)*step:value;}
  function constrainDelta(dx,dy,shift=false){return !shift?{dx,dy}:Math.abs(dx)>=Math.abs(dy)?{dx,dy:0}:{dx:0,dy};}
  function routePenalty(points){
    let penalty=0,previousX=0,previousY=0;
    for(let i=1;i<points.length;i++){
      const dx=points[i].x-points[i-1].x,dy=points[i].y-points[i-1].y;
      if(dx&&dy)throw new Error('El recorrido debe ser ortogonal');
      if(dx){const sign=Math.sign(dx);if(previousX&&sign!==previousX)penalty+=200;previousX=sign;}
      if(dy){const sign=Math.sign(dy);if(previousY&&sign!==previousY)penalty+=200;previousY=sign;}
      if(Math.abs(dx)+Math.abs(dy)<12&&Math.abs(dx)+Math.abs(dy)>0)penalty+=30;
    }
    return penalty;
  }
  function selectionRect(a,b){return {left:Math.min(a.x,b.x),right:Math.max(a.x,b.x),top:Math.min(a.y,b.y),bottom:Math.max(a.y,b.y)};}
  function encloses(outer,inner){return inner.left>=outer.left&&inner.right<=outer.right&&inner.top>=outer.top&&inner.bottom<=outer.bottom;}
  function intersects(a,b){return a.left<=b.right&&a.right>=b.left&&a.top<=b.bottom&&a.bottom>=b.top;}
  function polylineIntersects(rect,points,tolerance=0){
    const r={left:rect.left-tolerance,right:rect.right+tolerance,top:rect.top-tolerance,bottom:rect.bottom+tolerance};
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],dx=b.x-a.x,dy=b.y-a.y;
      let lo=0,hi=1,hit=true;
      for(const [p,q] of [[-dx,a.x-r.left],[dx,r.right-a.x],[-dy,a.y-r.top],[dy,r.bottom-a.y]]){
        if(p===0){if(q<0){hit=false;break;}continue;}
        const t=q/p;if(p<0)lo=Math.max(lo,t);else hi=Math.min(hi,t);
        if(lo>hi){hit=false;break;}
      }
      if(hit)return true;
    }
    return false;
  }
  function translateNodes(nodes,originals,dx,dy){
    const keysX=['x','startX','endX','routeX'],keysY=['y','startY','endY','routeY'];
    for(const n of nodes){const original=originals.find(o=>o.id===n.id);if(!original)continue;for(const key of keysX)if(Number.isFinite(original[key]))n[key]=original[key]+dx;for(const key of keysY)if(Number.isFinite(original[key]))n[key]=original[key]+dy;}
  }
  return Object.freeze({selectionRect,encloses,intersects,polylineIntersects,translateNodes,snap,constrainDelta,routePenalty,insideCanvas,outsideCanvas,shouldRemoveAfterDrag,isEditable,isDeleteShortcut});
})();
