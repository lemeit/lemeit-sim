/* Controles numéricos compartidos: mantienen el input nativo y su validación. */
(() => {
  function update(input) {
    const wrapper = input.parentElement;
    if (!wrapper?.classList.contains('numeric-control')) return;
    wrapper.querySelectorAll('button').forEach(button => {
      button.disabled = input.disabled || input.readOnly;
    });
  }
  function decorate(input) {
    if (input.parentElement?.classList.contains('numeric-control')) return;
    const wrapper = document.createElement('span');
    wrapper.className = 'numeric-control';
    input.before(wrapper);
    wrapper.append(input);
    const controls = document.createElement('span');
    controls.className = 'number-steps';
    const label = input.getAttribute('aria-label') || input.closest('label')?.querySelector('.field-label')?.textContent.trim() || input.closest('label')?.textContent.trim() || 'valor';
    if (!input.hasAttribute('aria-label') && !input.hasAttribute('aria-labelledby')) input.setAttribute('aria-label', label);
    for (const direction of [1, -1]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'number-step';
      button.dataset.direction = direction;
      button.setAttribute('aria-label', `${direction === 1 ? 'Aumentar' : 'Disminuir'} ${label}`);
      button.title = button.getAttribute('aria-label');
      button.innerHTML = `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="${direction === 1 ? 'M4 10l4-4 4 4' : 'M4 6l4 4 4-4'}"/></svg>`;
      button.addEventListener('click', () => {
        if (input.disabled || input.readOnly) return;
        const previous = input.value;
        if (input.step === 'any') {
          let next = (Number.isFinite(input.valueAsNumber) ? input.valueAsNumber : 0) + direction;
          if (input.min !== '') next = Math.max(next, Number(input.min));
          if (input.max !== '') next = Math.min(next, Number(input.max));
          input.value = String(Number(next.toPrecision(15)));
        } else {
          try { input.stepUp(direction); } catch { return; }
        }
        if (input.value === previous) return;
        const host = input.closest('#inspector') || document;
        const key = input.id ? `#${CSS.escape(input.id)}` : input.dataset.field ? `input[data-field="${CSS.escape(input.dataset.field)}"]` : null;
        input.dispatchEvent(new Event('input', {bubbles:true}));
        input.dispatchEvent(new Event('change', {bubbles:true}));
        // El inspector puede reconstruirse al confirmar el valor.
        requestAnimationFrame(() => {
          if (document.activeElement !== document.body && document.activeElement !== button) return;
          const current = input.isConnected ? input : key ? host.querySelector(key) : null;
          current?.parentElement.querySelector(`button[data-direction="${direction}"]`)?.focus({preventScroll:true});
        });
      });
      controls.append(button);
    }
    wrapper.append(controls);
    update(input);
  }
  function scan(root) {
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    if (root.matches('input[type="number"]')) decorate(root);
    root.querySelectorAll('input[type="number"]').forEach(decorate);
  }
  scan(document.body);
  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'attributes') {
        if (record.target.matches('input[type="number"]')) update(record.target);
      } else record.addedNodes.forEach(scan);
    }
  }).observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['disabled','readonly']});
})();
