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
  function selectionRect(a,b){return {left:Math.min(a.x,b.x),right:Math.max(a.x,b.x),top:Math.min(a.y,b.y),bottom:Math.max(a.y,b.y)};}
  function encloses(outer,inner){return inner.left>=outer.left&&inner.right<=outer.right&&inner.top>=outer.top&&inner.bottom<=outer.bottom;}
  function translateNodes(nodes,originals,dx,dy){
    const keysX=['x','startX','endX','routeX'],keysY=['y','startY','endY','routeY'];
    for(const n of nodes){const original=originals.find(o=>o.id===n.id);if(!original)continue;for(const key of keysX)if(Number.isFinite(original[key]))n[key]=original[key]+dx;for(const key of keysY)if(Number.isFinite(original[key]))n[key]=original[key]+dy;}
  }
  return Object.freeze({selectionRect,encloses,translateNodes,insideCanvas,outsideCanvas,shouldRemoveAfterDrag,isEditable,isDeleteShortcut});
})();
