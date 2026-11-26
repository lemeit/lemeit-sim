# Ejemplo 20 · Tanque dinámico con válvulas

Seleccioná Windows o Debian según disponibilidad y capacidad dinámica. Desde ΣIM 0.51.0: abrir el caso, comprobar régimen Dinámico, pulsar Calcular. Configuración dinámica permite duración y paso, altura, Kv y apertura. Gráficas abre automáticamente con nivel frente a tiempo. Para comparar caudal y nivel, agregá una segunda curva y revisá las unidades del eje derecho. Exportá los datos como CSV antes de cerrar. El Ejemplo 15 permanece estacionario.

El adaptador experimental construye un circuito equivalente de agua a 25 °C, tanque de 2 m³ y altura 2 m, alimentación 10 kg/s a 130 kPa, descarga 101,325 kPa, Kv 100 y 400, apertura 50 %, duración 600 s y paso 5 s. El estado inicial lo define DWSIM. No admite un PFD arbitrario ni sustituye fallos por cálculo estacionario o didáctico.

Validación real Windows y Debian: 121 muestras; niveles a 60, 120 y 600 s ≈0,2339; 0,2962; 0,3329 m, descarga final ≈10 kg/s. Ver [tabla completa y gráficas](graficas-cientificas.md). Consistencia numérica, no validación experimental independiente. El modelo didáctico del tanque permanece separado.
