# Formato de proyectos y distribución oficial de ΣIM Desktop

Estado al 28/11/2026: intercambio .sim con selector nativo de guardado en el prototipo. CI prepara un .deb piloto para Debian 12 amd64 con DWSIM MCP externo. El paquete autónomo y la publicación de APT siguen pendientes.

## Formato .sim (versión 1)

Un archivo .sim es el mismo documento JSON UTF-8 de proyecto con version: 1 que actualmente utiliza ΣIM. Se conservan los campos del grafo, parámetros, unidades, anotaciones, formato de Gráficas y saved_run cuando sea válido. No se almacenan tokens, claves de actualización ni configuración privada del gateway. Se importan también los JSON históricos mediante el mismo validador. La primera implementación exporta .sim en Desktop y admite .sim y .json en el selector de archivos; Online admite ambos formatos. El límite actual de importación es 2 MB. No se introduce un contenedor ZIP ni se modifica la lógica científica. Una futura versión incompatible requerirá migración explícita, con pruebas de ida y vuelta y conservación del original. La escritura nativa es atómica. Quedan pendientes la asociación MIME y la apertura por doble clic.

## Fuente y canales

Mantener lemeit/lemeit-sim como repositorio fuente único. Compilar desde referencias versionadas e inmutables, con versiones Desktop SemVer independientes de la versión del núcleo; publicar primero como alpha/beta, luego estable. No despliega Online al publicar Desktop. Propuesta de tags desktop-v0.1.0-alpha.3 y siguientes; no crear tags públicos hasta disponer de paquetes verificables.

GitHub Actions: ejecutar pruebas JavaScript, Python y de integración; construir en Windows x64 y en Debian 12 amd64 o entorno compatible. Empaquetar gateway Python, motor DWSIM y recursos bajo sus licencias, sin rutas de desarrollo ni credenciales compartidas. Probar en instalaciones limpias, sin Internet, con Ejemplos 01 y 20, apertura/guardado .sim, actualización desde la versión anterior y cierre de procesos. Generar artefactos, SHA-256, notas, licencias, enlace a fuentes y trazabilidad de versión del motor. Publicar como borrador hasta aprobar las pruebas.

## Windows

Instalador NSIS .exe inicialmente; MSI opcional para instituciones. Tauri Updater con endpoint HTTPS de metadatos y firma de artefactos. La clave privada queda fuera del repositorio (secreto de CI y respaldo seguro); la pública se incorpora al ejecutable. No confundir firma de actualización con Authenticode/SmartScreen. Revisar certificado de firma de código por separado. No actualizar durante cálculos o con proyecto sin guardar. Mantener canal estable separado de pruebas, y no instalar automáticamente una versión más antigua. No depender de un único latest.json si las releases del portal y Desktop comparten repositorio.

## Debian

Paquete sim-desktop amd64 .deb construido para Debian 12. Publicar primero el .deb en GitHub Releases; posteriormente un repositorio APT propio en packages.lemeit.ar (dominio propuesto, no configurado), con pool, Packages, Release e InRelease generados por herramienta de repositorio, firma GPG, clave pública dedicada bajo /etc/apt/keyrings y Signed-By limitado a esa fuente. No usar trusted=yes ni desactivar apt-secure. Restringir el repositorio al paquete sim-desktop; no sustituir paquetes Debian. Publicación atómica de índices y artefactos; conservar versiones anteriores. El usuario ejecutará sudo apt update y sudo apt install --only-upgrade sim-desktop. AppImage con updater puede ser una opción adicional; los paquetes gestionados por APT deben actualizarse vía APT. Validar instalación, actualización y desinstalación sin borrar proyectos.

## Servicios de distribución

- **GitHub Actions** compila en Debian 12, instala el piloto en CI y prepara un índice firmado con una clave efímera para verificar el proceso. **GitHub Releases** alojará paquetes aprobados y sumas SHA-256.
- **Cloudflare R2** alojará el archivo estático APT con el dominio `packages.lemeit.ar`. Guardará `pool/` y `dists/`. Cloudflare DNS vinculará el dominio. No hace falta un Worker para servir los archivos.
- **GPG** firma `InRelease` con una clave dedicada. Guardar la clave privada fuera del repositorio y distribuir la clave pública por un canal autenticado.

Para preparar una actualización en una copia local del árbol APT, con GPG y dpkg-dev instalados:

```bash
bash desktop/scripts/index-apt.sh paquete.deb ruta-al-arbol-apt HUELLA_DE_CLAVE
```

Conservar el mismo árbol para retener paquetes y hashes de índices anteriores. Al publicar, subir primero los paquetes e índices por hash. Publicar `dists/bookworm/InRelease` al final, con revalidación de caché. Antes de habilitar el dominio, probar APT con la clave de prueba e instalar y actualizar entre dos versiones en Debian 12.

## Orden de implementación

1. Verificar apertura, guardado, cancelación, reemplazo y protección de cambios en Windows y Debian. Incorporar la asociación del sistema para la extensión .sim al preparar los instaladores.
2. Completar aislamiento del motor, empaquetado de Python/DWSIM y pruebas offline.
3. Configurar CI de compilación en ambas plataformas, versionado y release borrador.
4. Configurar claves de actualización, endpoint Windows y repositorio APT de prueba.
5. Probar actualización real de dos builds firmados en sistemas limpios antes de abrir canal estable.

Referencias: https://v2.tauri.app/plugin/updater/ ; https://v2.tauri.app/distribute/pipelines/github/ ; https://wiki.debian.org/DebianRepository/UseThirdParty .
