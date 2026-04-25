# Usuarios y flujos de uso

## Perfil de usuario principal

El usuario principal es una persona responsable de organizar las finanzas del hogar.

Ese perfil suele necesitar:

- cargar o ajustar partidas
- registrar presupuesto al inicio del ano
- revisar consumos durante el ano
- entender rapidamente si va por encima o por debajo de lo previsto

## Flujo funcional recomendado

### 1. Preparar el ejercicio

Al inicio del ano o cuando se empieza a usar la aplicacion:

1. crear el ano de trabajo si se trata de un ejercicio pasado
2. crear o importar las partidas presupuestarias
3. marcar si cada una es ingreso o gasto
4. marcar si cada una es fija o variable
5. asignar o importar el importe anual previsto

Ejemplos de partidas:

- nomina
- hipoteca
- supermercado
- suministros
- ocio
- seguro del coche

### 2. Registrar la realidad mensual

Cada mes:

1. seleccionar el ano
2. registrar o importar el consumo real de cada partida que aplique
3. actualizar importes si se detectan errores o cambios

### 3. Revisar informes

El responsable del presupuesto puede:

- ver el total previsto frente al real
- revisar desviaciones mensuales
- revisar el balance real de cada mes
- analizar si el exceso viene de partidas fijas o variables
- detectar que partidas consumen mas porcentaje del esperado

## Casos de uso clave

### Caso de uso 1: alta de una partida

Ejemplo:

- se crea la partida `internet`
- tipo: gasto
- naturaleza: fija
- presupuesto anual: 600 EUR

### Caso de uso 2: registro de consumo

Ejemplo:

- mes: febrero
- partida: supermercado
- real: 420 EUR

### Caso de uso 2 bis: carga masiva por Excel

Ejemplo:

- el usuario descarga la plantilla de partidas, presupuestos o consumos
- completa las filas en Excel siguiendo el formato del ejemplo
- sube el fichero desde la misma pantalla funcional
- el sistema valida y actualiza los datos del ejercicio

### Caso de uso 3: revision de desviaciones

Ejemplo:

- el usuario detecta que el gasto variable real supera al gasto variable previsto
- compara el balance previsto frente al real
- decide reducir gasto en ocio o restauracion

### Caso de uso 4: reconstruccion de un ano pasado

Ejemplo:

- se crea el ano 2023
- se cargan los presupuestos previstos de ese ejercicio
- se registran consumos mes a mes de forma retroactiva
- se revisa el informe historico para analizar desviaciones

## Flujo de demo recomendado

Si se quiere enseñar el producto a negocio:

1. mostrar el selector de ano
2. ensenar la creacion de un ano pasado
3. ensenar la gestion de partidas
4. ensenar la descarga de plantillas Excel y la importacion masiva
5. ensenar el presupuesto previsto por partida
6. ensenar el registro de consumos
7. terminar en informes

Este orden ayuda a entender bien de donde salen los datos del informe resumido.
