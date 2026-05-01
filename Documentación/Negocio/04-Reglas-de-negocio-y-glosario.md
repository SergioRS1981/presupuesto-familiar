# Reglas de negocio y glosario

## Reglas de negocio principales

### Anos configurados

- un ano puede existir en la aplicacion aunque todavia no tenga datos
- el alta manual de anos se usa para trabajar con ejercicios historicos
- al registrar presupuesto o consumo para un ano, el sistema asegura su disponibilidad posterior en el selector
- al crear o detectar un ano, el sistema inicializa presupuestos vacios para todas las partidas existentes
- un ano puede marcarse como activo o inactivo sin perder sus datos historicos

### Partidas presupuestarias

- una partida representa una categoria economica del hogar
- una partida es global y comun a todos los anos
- una partida tiene tipo `ingreso` o `gasto`
- una partida tiene naturaleza `fija` o `variable`
- una partida puede estar activa o inactiva
- al crear una partida nueva, el sistema la replica con presupuesto anual `0` en todos los anos conocidos

### Presupuesto anual

- el presupuesto se define por ano y por partida
- para una misma partida solo puede existir un presupuesto anual por ano
- el importe previsto es anual, no mensual

### Consumo mensual

- el consumo se registra por ano, mes y partida
- para una misma partida solo puede existir un consumo por mes y ano
- si ese consumo ya existe, no puede volver a darse de alta desde `Nuevo consumo`; debe modificarse desde `Editar`
- el consumo representa valor real observado
- el consumo puede incluir una nota opcional para anotar contexto o aclaraciones

### Informes

- los informes se calculan para un ano concreto
- los informes muestran previsto y real
- el informe separa ingresos y gastos en fijo y variable
- el balance se calcula como total ingresos menos total gastos

## Glosario funcional

### Partida

Categoria presupuestaria. Ejemplo: hipoteca, supermercado, nomina.

### Ingreso

Entrada de dinero al hogar.

### Gasto

Salida de dinero del hogar.

### Fija

Partida con comportamiento generalmente estable o comprometido. Ejemplo: alquiler, seguro.

### Variable

Partida con importe mas flexible o cambiante. Ejemplo: ocio, compras ocasionales.

### Presupuesto previsto

Importe que se espera ingresar o gastar a lo largo del ano.

### Consumo real

Importe realmente registrado para una partida en un mes concreto.

### Diferencia

Resta entre presupuesto previsto y real acumulado.

### Balance

Diferencia entre ingresos y gastos.

### Ano activo

Ejercicio que aparece en el selector principal y por el que el usuario puede navegar desde la aplicacion.

### Ano inactivo

Ejercicio oculto en la navegacion principal. Conserva sus presupuestos, consumos e informes historicos y puede reactivarse mas adelante.

### Linealizado

Reparto uniforme del presupuesto anual en doce meses para disponer de una referencia comparativa.

## Convenciones funcionales utiles

- los importes se entienden en euros
- el ano es el eje principal de analisis
- el sistema busca comparacion y control, no contabilidad oficial
