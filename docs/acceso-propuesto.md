# Acceso propuesto, todavía sin implementar

## Estado actual

La web no autentica personas. Cualquier visitante puede pedir cálculos mediante
la API pública limitada. El secreto entre Worker y gateway protege el origen del
motor, no identifica a alumnos. La comprobación de Origin tampoco es autenticación.

El gateway limita globalmente los cálculos públicos a 12/minuto y 120/hora, serializa
los trabajos y aplica 45 s de límite total, tamaño de proyecto y entradas validadas.
Los límites son compartidos: un tercero puede consumir capacidad y perjudicar una
clase. Esto no habilita una terminal pública; las rutas expuestas están acotadas.
El monitor de esta revisión muestra solo HTTP, latencia, estado y mensajes de esa
vista, no archivos privados, comandos, credenciales ni registros internos de la PC.

## Propuesta para decidir con el docente

- Edición y preparación de proyectos sin registro personal.
- Cálculos de alumnos mediante código temporal de clase, sin correo ni cuenta.
  Validación en servidor, vencimiento, revocación y límites por clase/sesión.
- Administración privada con autenticación independiente del acceso de alumnos.
  Protegerla antes de agregar control de servicios o registros privados.
- Un código compartido puede reenviarse: no equivale a identificar individualmente
  a cada alumno. Conservar la menor cantidad posible de datos personales.

No se activaron cuentas, códigos, cookies de acceso ni nuevos servicios en este cambio.
Referencia: https://api-security.owasp.org/editions/2023/en/0xa4-unrestricted-resource-consumption/
