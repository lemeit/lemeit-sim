# Formato de proyectos y distribución oficial de ΣIM Desktop

Estado: diseño inicial y primera implementación de intercambio .sim, 27/11/2026. No es una release ni un repositorio APT operativo.

## Formato .sim (versión 1)

Un archivo .sim es el mismo documento JSON UTF-8 de proyecto con version: 1 que actualmente utiliza ΣIM. Se conservan los campos del grafo, parámetros, unidades, anotaciones, formato de Gráficas y saved_run cuando sea válido. No se almacenan tokens, claves de actualización ni configuración privada del gateway. Se importan también los JSON históricos mediante el mismo validador. La primera implementación exporta .sim en Desktop y admite .sim y .json en el selector de archivos; Online puede importarlos cuando se integre la rama compartida. El límite actual de importación es 2 MB. No se introduce un contenedor ZIP ni se modifica la lógica científica. Una futura versión incompatible requerirá migración explícita, con pruebas de ida y vuelta y conservación del original. La asociación MIME/extensión, apertura por doble clic y escritura nativa atómica son pendientes.

## Fuente y canales

Mantener lemeit/lemeit-sim como repositorio fuente único. Compilar desde referencias versionadas e inmutables, con versiones Desktop SemVer independientes de la versión del núcleo; publicar primero como alpha/beta, luego estable. No despliega Online al publicar Desktop. Propuesta de tags desktop-v0.1.0-alpha.3 y siguientes; no crear tags públicos hasta disponer de paquetes verificables.

GitHub Actions: ejecutar pruebas JavaScript, Python y de integración; construir en Windows x64 y en Debian 12 amd64 o entorno compatible. Empaquetar gateway Python, motor DWSIM y recursos bajo sus licencias, sin rutas de desarrollo ni credenciales compartidas. Probar en instalaciones limpias, sin Internet, con Ejemplos 01 y 20, apertura/guardado .sim, actualización desde la versión anterior y cierre de procesos. Generar artefactos, SHA-256, notas, licencias, enlace a fuentes y trazabilidad de versión del motor. Publicar como borrador hasta aprobar las pruebas.

## Windows

Instalador NSIS .exe inicialmente; MSI opcional para instituciones. Tauri Updater con endpoint HTTPS de metadatos y firma de artefactos. La clave privada queda fuera del repositorio (secreto de CI y respaldo seguro); la pública se incorpora al ejecutable. No confundir firma de actualización con Authenticode/SmartScreen. Revisar certificado de firma de código por separado. No actualizar durante cálculos o con proyecto sin guardar. Mantener canal estable separado de pruebas, y no instalar automáticamente una versión más antigua. No depender de un único latest.json si las releases del portal y Desktop comparten repositorio.

## Debian

Paquete sim-desktop amd64 .deb construido para Debian 12. Publicar primero el .deb en GitHub Releases; posteriormente un repositorio APT propio en packages.lemeit.ar (dominio propuesto, no configurado), con pool, Packages, Release e InRelease generados por herramienta de repositorio, firma GPG, clave pública dedicada bajo /etc/apt/keyrings y Signed-By limitado a esa fuente. No usar trusted=yes ni desactivar apt-secure. Restringir el repositorio al paquete sim-desktop; no sustituir paquetes Debian. Publicación atómica de índices y artefactos; conservar versiones anteriores. El usuario ejecutará sudo apt update y sudo apt install --only-upgrade sim-desktop. AppImage con updater puede ser una opción adicional; los paquetes gestionados por APT deben actualizarse vía APT. Validar instalación, actualización y desinstalación sin borrar proyectos.

## Orden de implementación

1. Validar .sim en Windows/Debian, apertura y guardado nativo, protección de cambios, asociación de extensión.
2. Completar aislamiento del motor, empaquetado de Python/DWSIM y pruebas offline.
3. Configurar CI de compilación en ambas plataformas, versionado y release borrador.
4. Configurar claves de actualización, endpoint Windows y repositorio APT de prueba.
5. Probar actualización real de dos builds firmados en sistemas limpios antes de abrir canal estable.

Referencias: https://v2.tauri.app/plugin/updater/ ; https://v2.tauri.app/distribute/pipelines/github/ ; https://wiki.debian.org/DebianRepository/UseThirdParty .
