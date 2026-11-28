'use strict';

const invoke = globalThis.__TAURI__?.core?.invoke;
const stages = Array.from(document.querySelectorAll('[data-phase]'));
const messages = {
  service: 'Preparando el servicio local…',
  engine: 'Verificando el motor DWSIM…',
  catalog: 'Cargando compuestos y modelos termodinámicos…',
  ready: 'Todo listo para abrir el editor.'
};
const stageLabels = { pending: 'En espera', active: 'En curso', done: 'Listo', failed: 'Revisar' };
const message = document.getElementById('message');
const progress = document.getElementById('progress');
const versionLabel = document.getElementById('version');
const retry = document.getElementById('retry');
const open = document.getElementById('open');

function render(phase, error, version) {
  const completed = phase === 'ready' ? stages.length : stages.findIndex(stage => stage.dataset.phase === phase);
  for (const [index, stage] of stages.entries()) {
    const state = index < completed ? 'done' : index > completed ? 'pending' : error ? 'failed' : 'active';
    stage.dataset.state = state;
    stage.lastElementChild.textContent = stageLabels[state];
  }
  progress.value = completed;
  versionLabel.textContent = version;
  const text = error || messages[phase];
  if (message.textContent !== text) message.textContent = text;
  retry.hidden = !error;
  open.disabled = Boolean(error) || phase !== 'ready';
  return Boolean(error) || phase === 'ready';
}

async function poll() {
  try {
    const finished = render(...await invoke('startup_status'));
    if (!finished) window.setTimeout(poll, 180);
  } catch {
    message.textContent = 'No se pudo consultar el arranque. Cerrá y volvé a abrir ΣIM Desktop.';
  }
}

retry.addEventListener('click', async () => {
  retry.disabled = true;
  try {
    await invoke('retry_startup');
    await poll();
  } catch {
    message.textContent = 'No se pudo reiniciar la carga. Volvé a intentar.';
  } finally {
    retry.disabled = false;
  }
});

open.addEventListener('click', async () => {
  open.disabled = true;
  try {
    await invoke('open_editor');
  } catch (error) {
    await poll();
    if (retry.hidden) message.textContent = String(error);
  }
});

if (invoke) void poll();
