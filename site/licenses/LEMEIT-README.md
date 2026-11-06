# lemeit-design

[![sitio: design.lemeit.ar](https://img.shields.io/badge/sitio-design.lemeit.ar-009688?style=flat-square&labelColor=555555)](https://design.lemeit.ar)
[![docs: badges](https://img.shields.io/badge/docs-badges-009688?style=flat-square&labelColor=555555)](docs/badges.md)
[![licencia: MIT](https://img.shields.io/badge/licencia-MIT-009688?style=flat-square&labelColor=555555)](#licencia)

Sistema de diseño compartido para los portales ambientales de lemeit.ar — paleta, tipografía y componentes base tomados de [profe.lemeit.ar](https://profe.lemeit.ar) (tema PaperMod, paleta "X-Wing Poe Dameron": naranja óxido sobre crema en modo claro, negro cálido con acentos naranja en modo oscuro).

Publicado en [design.lemeit.ar](https://design.lemeit.ar), que sirve como página de documentación y como origen de los dos archivos que consumen los demás sitios.

## Uso

En el `<head>` de cualquier portal:

```html
<link rel="stylesheet" href="https://design.lemeit.ar/lemeit-theme.css">
```

Antes de cerrar `</body>`:

```html
<script src="https://design.lemeit.ar/lemeit-common.js"></script>
<script>
  LemeitCommon.initTheme();                 // aplica el tema guardado y conecta el botón #lm-theme-btn
  LemeitCommon.initSwitcher("emas");        // "emas" | "aq" | "wq" | "profe" — arma el menú #lm-switcher
  LemeitCommon.renderFooter(document.getElementById("lm-footer"), {
    version: "v1.0 — 2026-08-22",
    logos: [ // opcional — logos de redes/programas antes del texto de crédito
      { href: "https://openaq.org", src: "https://design.lemeit.ar/logos/openaq.svg", alt: "OpenAQ", title: "OpenAQ" },
    ],
    logoSize: "sm", // opcional — "sm" (15px, default del footer) | "md" (20px) | "lg" (32px)
  });
</script>
```

### Atribución (`.lm-attrib-*`)

Clases compartidas para mostrar logos de redes/programas asociados a un portal, en el footer (vía `renderFooter({logos, logoSize})`) y en cualquier otro lado (ej. la pestaña "Acerca de" de un portal), manteniendo el mismo look:

| Clase | Tamaño de imagen | Uso típico |
|-------|-------------------|------------|
| `.lm-attrib-row .lm-attrib-row-sm` | 15px | Footer (default de `renderFooter()`) |
| `.lm-attrib-row` (sin modificador) | 20px | Uso intermedio — ej. footer de un portal con pocos logos que "sm" deja demasiado chico (`logoSize: "md"`) |
| `.lm-attrib-row .lm-attrib-row-lg` | 32px | Paneles "Acerca de" — para diferenciarse visualmente del footer |

`.lm-attrib-chip-dark` es un modificador aparte, para un logo que solo tenga versión blanca/transparente (sin versión de color) y necesite un fondo oscuro fijo para leerse — no depende del tema del sitio (`opts.logos[].dark: true` en `renderFooter()`).

## Archivos

| Archivo | Contenido |
|---------|-----------|
| `lemeit-theme.css` | Variables de color (`--lm-*`), tipografía, y clases de componentes base (`.lm-card`, `.lm-badge-*`, `.lm-chip` / `.lm-chip-accent`, `.lm-nav-btn`, `.lm-btn`, `.lm-select`, `.lm-footer`, etc.) |
| `lemeit-common.js` | `LemeitCommon.initTheme()`, `.initSwitcher()`, `.renderFooter()` — ver `index.html` para un ejemplo completo de cada uno |
| `index.html` | Página de documentación / muestra visual de todos los componentes — también es la home de design.lemeit.ar |

## Cómo se aplica en cada sitio

Los estilos y componentes son deliberadamente genéricos (tarjetas, badges, tabs, botones) para que cada portal los adopte de a poco sin tener que reescribirse entero de una. La idea es reemplazar gradualmente las variables de color y clases propias de cada sitio por las de acá, sin tocar su lógica ni su estructura de navegación en la primera etapa.

## Deploy

```bash
npx wrangler pages deploy . --project-name=lemeit-design
```

Dominio custom (`design.lemeit.ar`) configurado en el proyecto Pages de Cloudflare, no en este repo.

### Chips de metadata (`.lm-chip`)

Combinación gris + verde + naranja de los badges tipo shields.io que encabezan el `README.md` de cada repo (label gris `#555` + valor verde-azulado `#009688`, con `#FF5722` naranja como acento opcional para destacar algo puntual, ej. "API: pública") — portada como componente reutilizable (`--lm-chip-label`/`--lm-chip-value`/`--lm-chip-accent` en `lemeit-theme.css`, demo en `index.html`). Colores fijos, no cambian con el tema claro/oscuro, igual que un badge real de shields.io. Distinto de `.lm-badge-good/moderate/bad` (que son de estado, no de metadata tipo "sitio/docs/API/licencia"). Todavía sin adoptar en ningún portal — queda disponible para cuando se use en un footer o tarjeta "Acerca de".

### Colores de marca por sitio (`--lm-site-*`)

Cada portal de la Red Ambiental tiene su propio color de acento para el logo/ícono/favicon — distintos entre sí a propósito, para diferenciarlos a simple vista al alternar entre ellos con una sola app instalada (setiembre 2026). Misma familia tonal verde-azulado → celeste, colores fijos igual que los chips de arriba: `--lm-site-aq` (`#009688`, verde-azulado — Aire Escolar) y `--lm-site-emas` (`#0097A7`, celeste — EMAS). `--lm-site-wq` queda pendiente de asignar. Viven en `lemeit-theme.css`, separados de `--lm-chip-value` aunque hoy `--lm-site-aq` comparta valor con él — para no atar el significado de un componente de badges genérico a la identidad de un sitio puntual. El naranja general (`--lm-accent`, usado en el resto de la UI de cada portal) no cambia.

## Licencia

MIT.

### Tags para README de GitHub

Usar el mismo patrón visual con imágenes enlazadas de Shields.io, estilo `flat-square` y colores explícitos de la paleta. Ver [la guía de tags y badges](docs/badges.md) para ejemplos Markdown, colores y su equivalente web `.lm-chip`.
