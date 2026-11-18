(() => {
  'use strict';
  const dialog = document.getElementById('information-dialog');
  const title = document.getElementById('information-title');
  const content = document.getElementById('information-text');
  const links = [...document.querySelectorAll('a[data-information]')];
  let request;

  async function show(link) {
    request?.abort();
    const current = new AbortController();
    request = current;
    title.textContent = link.textContent;
    content.textContent = 'Cargando…';
    if (!dialog.open) dialog.showModal();
    dialog.querySelector('.dialog-body').scrollTop = 0;
    try {
      const response = await fetch(link.href, {signal: current.signal});
      if (!response.ok || !response.headers.get('Content-Type')?.startsWith('text/plain')) {
        throw new Error('Documento no disponible');
      }
      const text = await response.text();
      if (!current.signal.aborted) content.textContent = text;
    } catch {
      if (!current.signal.aborted) content.textContent = 'No se pudo abrir el documento. Volvé a intentarlo.';
    }
  }

  for (const link of links) {
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (history.state?.information) return;
      history.pushState({...history.state, information: link.href}, '');
      show(link);
    });
  }

  dialog.addEventListener('close', () => {
    if (dialog.open) return;
    request?.abort();
    if (history.state?.information) history.back();
  });

  function restore() {
    const link = links.find(item => item.href === history.state?.information);
    if (link) show(link);
    else if (dialog.open) dialog.close();
  }

  window.addEventListener('popstate', restore);
  restore();
})();
