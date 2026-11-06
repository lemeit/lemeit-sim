/**
 * lemeit-common.js — helpers compartidos para los portales ambientales de
 * lemeit.ar (emas, aq, wq). Complementa a lemeit-theme.css.
 *
 * Uso típico (antes de cerrar </body>, después de tener en el DOM un botón
 * con id="lm-theme-btn" y, opcionalmente, un switcher con id="lm-switcher"):
 *
 *   <script src="https://design.lemeit.ar/lemeit-common.js"></script>
 *   <script>
 *     LemeitCommon.initTheme();
 *     LemeitCommon.initSwitcher("emas");   // "emas" | "aq" | "wq"
 *     LemeitCommon.renderFooter(document.getElementById("lm-footer"), {
 *       version: "v1.0 — 2026-08-22"
 *     });
 *   </script>
 */
(function (global) {
  "use strict";

  const THEME_KEY = "lemeit-theme";

  // URLs bajo app.lemeit.ar (setiembre 2026) en vez de los subdominios
  // sueltos de antes — mismo origen entre los 3 portales, para que el
  // switcher navegue "para adentro" de la PWA instalada en vez de abrir el
  // navegador al cambiar de portal (ver repo "gateway"). Los subdominios
  // viejos (aq/emas/wq.lemeit.ar) siguen vivos, redirigen acá solos.
  const SITES = [
    { key: "aq",   nombre: "Aire Escolar", desc: "Calidad del aire", url: "https://app.lemeit.ar/aq/" },
    { key: "emas", nombre: "EMAS", desc: "Meteorología", url: "https://app.lemeit.ar/emas/" },
    { key: "wq",   nombre: "Agua Saladillo", desc: "Calidad del agua", url: "https://app.lemeit.ar/wq/" },
  ];

  function initTheme(defaultTheme) {
    const saved = localStorage.getItem(THEME_KEY);
    const theme = saved || defaultTheme || "dark";
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.add("lm-root");

    const btn = document.getElementById("lm-theme-btn") || document.querySelector(".lm-theme-btn");
    function paintBtn() {
      if (!btn) return;
      const t = document.documentElement.getAttribute("data-theme");
      btn.textContent = t === "dark" ? "🌙" : "☀️";
    }
    paintBtn();
    if (btn) {
      btn.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme");
        const next = current === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        localStorage.setItem(THEME_KEY, next);
        paintBtn();
        document.dispatchEvent(new CustomEvent("lemeit-theme-changed", { detail: { theme: next } }));
      });
    }
    return theme;
  }

  function initSwitcher(currentKey) {
    const root = document.getElementById("lm-switcher");
    if (!root) return;
    const btn = root.querySelector(".lm-switcher-btn");
    const menu = root.querySelector(".lm-switcher-menu");
    if (!btn || !menu) return;

    menu.innerHTML = SITES.map((s) => `
      <a href="${s.url}" ${s.key === currentKey ? 'class="lm-current"' : ""}>
        ${s.nombre}
        <span>${s.desc}</span>
      </a>
    `).join("");

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.classList.toggle("open");
    });
    document.addEventListener("click", () => menu.classList.remove("open"));
  }

  // opts.logos (opcional): [{ href, src, alt, title, dark }] — dark:true
  // solo para un logo que sea un recorte blanco/transparente sin versión de
  // color, que necesite el chip de fondo oscuro fijo (.lm-attrib-chip-dark).
  // Si no se pasan logos, el footer queda exactamente como antes.
  // opts.logoSize (opcional): "sm" (default, 15px — el tamaño de siempre) |
  // "md" (20px, tamaño por defecto de .lm-attrib-chip) | "lg" (32px). Sirve
  // para portales con pocos logos donde "sm" queda demasiado chico (ver
  // emas.lemeit.ar, que usa "md" para los logos de proveedor de estación).
  function renderFooter(el, opts) {
    if (!el) return;
    opts = opts || {};
    const version = opts.version || "";
    const extra = opts.extra || "";
    const logos = opts.logos || [];
    const logoSize = opts.logoSize || "sm";
    const sizeClass = logoSize === "lg" ? " lm-attrib-row-lg" : logoSize === "md" ? "" : " lm-attrib-row-sm";
    const imgHeight = logoSize === "lg" ? 32 : logoSize === "md" ? 20 : 15;

    const logosHtml = logos.length
      ? `
      <div class="lm-footer-logos lm-attrib-row${sizeClass}">
        ${logos.map((l) => `
          <a href="${l.href}" target="_blank" class="lm-attrib-chip${l.dark ? " lm-attrib-chip-dark" : ""}" title="${l.title || l.alt || ""}">
            <img src="${l.src}" alt="${l.alt || ""}" height="${imgHeight}">
          </a>
        `).join("")}
      </div>
      <div class="lm-footer-divider"></div>
    `
      : "";

    el.innerHTML = `
      ${logosHtml}
      <div class="lm-footer-credit">Proyecto <a href="https://profe.lemeit.ar" target="_blank">lemeit.ar</a> · <a href="https://wiki.lemeit.ar" target="_blank">Wiki / documentación</a>${extra ? " · " + extra : ""}</div>
      ${version ? `<div class="lm-footer-version">${version}</div>` : ""}
    `;
  }

  global.LemeitCommon = { SITES, initTheme, initSwitcher, renderFooter };
})(window);
