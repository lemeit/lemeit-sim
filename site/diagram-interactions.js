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
  return Object.freeze({insideCanvas,outsideCanvas,shouldRemoveAfterDrag,isEditable,isDeleteShortcut});
})();
