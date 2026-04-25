# Informes e indicadores de negocio

## Objetivo de los informes

Los informes permiten responder a preguntas de negocio como:

- cuanto se esperaba ingresar o gastar este ano
- cuanto se ha registrado realmente hasta ahora
- como se reparte el resultado entre fijo y variable
- cual es la diferencia entre el balance previsto y el balance real

## Informes disponibles

La aplicacion muestra tres informes complementarios en formato tabla.

Tambien permite descargar en CSV:

- el informe completo del ano seleccionado
- un consolidado de totales por ano para todos los ejercicios disponibles

La calidad del informe depende de que el dato base este bien cargado. Para eso la aplicacion permite mantener partidas, presupuestos y consumos tanto manualmente como por importacion Excel con plantillas guiadas.

### Informe anual

Columnas:

- previsto
- real
- diferencia

Filas:

- ingresos fijos
- ingresos variables
- total ingresos
- gastos fijos
- gastos variables
- total gastos
- balance

### Informe mensual real

Columnas:

- mes
- gastos fijos
- gastos variables
- gastos totales
- ingresos totales
- balance

Filas:

- enero a diciembre

### Informe por partida

Columnas:

- partida
- previsto
- real
- diferencia

Filas:

- una fila por cada partida con presupuesto o consumo registrado en el ano

## Exportacion CSV

La exportacion esta pensada para reutilizar la informacion fuera de la aplicacion, por ejemplo en hojas de calculo o revisiones compartidas.

Archivos disponibles:

- `informes-AAAA.csv`: incluye resumen anual, detalle mensual y detalle por partida del ano seleccionado
- `totales-anuales.csv`: incluye una fila por ano con los principales totales previstos y reales

## Como interpretar el informe

### Ingresos fijos e ingresos variables

Permiten ver si la previsibilidad del hogar se apoya mas en entradas estables o en entradas ocasionales.

### Gastos fijos y gastos variables

Permiten distinguir entre compromisos estructurales y gasto con mayor margen de ajuste.

### Total ingresos y total gastos

Dan una lectura global del ejercicio sin perder el detalle fijo/variable.

### Balance

El balance siempre es:

- total ingresos menos total gastos

Interpretacion:

- si el balance real es peor que el previsto, hay una desviacion negativa
- si el balance real es mejor que el previsto, la ejecucion economica va mejor de lo esperado

### Diferencia

La columna `Diferencia` muestra dos datos en una sola celda:

- la desviacion monetaria calculada como real menos previsto
- el porcentaje que representa el real sobre el previsto

Interpretacion:

- `100,0 %` significa que el real coincide exactamente con lo previsto
- por debajo de `100,0 %` significa que el real queda por debajo del previsto
- por encima de `100,0 %` significa que el real supera lo previsto
- si el previsto es `0`, el porcentaje se muestra como `Sin previsto` cuando no existe base comparable

### Lectura del informe mensual

Permite detectar:

- meses con mayor presion de gasto fijo
- meses en los que el gasto variable se dispara
- meses con mejor o peor balance
- estacionalidad en ingresos y gastos reales

### Lectura del informe por partida

Permite detectar:

- partidas que estan muy por debajo del presupuesto previsto
- partidas que ya han superado el `100,0 %` de ejecucion
- categorias sin presupuesto previo pero con movimiento real
- desviaciones relevantes en partidas concretas

## Indicadores que conviene vigilar

- balance real
- diferencia entre balance previsto y real
- peso del gasto fijo frente al variable
- diferencia entre ingresos previstos y reales
- diferencia entre gastos previstos y reales

## Lecturas tipicas del informe

### Situacion 1: gasto variable alto

Interpretacion:

- el hogar esta gastando mas de lo esperado en la parte con mayor capacidad de correccion

Posible accion:

- revisar las categorias variables para reducir tension presupuestaria

### Situacion 2: gasto fijo alto

Interpretacion:

- existe presion estructural en el presupuesto

Posible accion:

- renegociar contratos, seguros o suministros

### Situacion 3: ingresos reales por debajo

Interpretacion:

- el problema no es solo de gasto; puede haber un desvio por menor entrada de dinero

Posible accion:

- revisar estimaciones de ingreso y recalibrar el presupuesto anual
