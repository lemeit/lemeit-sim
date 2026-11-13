# Adaptación cinética · auditoría inicial

Auditoría del runtime Windows DWSIM MCP 10.2.15 realizada el 12/11/2026, sin modificar
el motor Debian, el runtime ni sus túneles. Las 58 herramientas MCP incluyen
`dwsim_reaction_add_conversion`, `dwsim_reaction_add_equilibrium`, creación de sets,
listado de reacciones y acceso de lectura al XML. No incluyen una herramienta
específica de creación de reacción cinética ni una de extracción de perfiles PFR.
La creación genérica de equipos no basta para declarar un reactor cinético validado.

DWSIM dispone de modelos CSTR/PFR; la integración actual de ΣIM solo admite
conversión y equilibrio. El siguiente bloque requiere adaptar el acceso al modelo
cinético mediante una API apropiada y validar su disponibilidad en cada motor antes
de habilitar nuevos objetos. No se ejecutan scripts arbitrarios enviados desde la web.

Etapas propuestas:

1. Seleccionar una reacción con estequiometría, fase, ley de velocidad, unidades,
   parámetros, fuente y rango de validez documentados. La base de compuestos no
   aporta automáticamente una cinética válida.
2. Conectar CSTR/PFR isotérmicos y contrastar conversión, volumen y masa/átomos con
   referencias analíticas cuando corresponda y con DWSIM instalado.
3. Extraer perfiles en posición/volumen del PFR y distinguirlos de un transitorio;
   añadir gráficos con unidades, datos descargables y límites numéricos.
4. Implementar y validar batch y transitorios, con condiciones iniciales, integrador,
   control de error y balance energético. Posteriormente, comportamiento no isotérmico.

Estado visible para el usuario: [Ayuda · adaptación por etapas](../site/adaptacion.html).
Referencia: [Reactores DWSIM](https://dwsim.org/help/main/25-reactors.html).
No se habilitan botones calculables ni se presentan perfiles simulados en esta etapa.
