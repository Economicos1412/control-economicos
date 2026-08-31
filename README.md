# Control de económicos

Aplicación web local para administrar los registros del archivo de origen. Incluye los campos: número económico, marca, modelo, número de serie, categoría, folio, área, fecha de prueba y observaciones.

## Uso

Abre `index.html` en cualquier navegador moderno. Los cambios se guardan automáticamente en el navegador de este equipo.

Se puede agregar, editar, buscar y filtrar registros. Para respaldar o llevar los datos a Excel, usa **Exportar CSV**; Excel abre este archivo sin problema.

## Listas editables

Los campos **Unidad / marca**, **Modelo** y **Categoría** muestran opciones que ya se han usado. Al final de cada lista está **“Agregar otro…”**: al elegirla aparece un campo para escribir un valor nuevo, que al guardar queda disponible en la lista para futuros registros. Cada registro también puede contener un **Monto**.

## Importar Excel

Usa **Importar Excel / CSV** para cargar un archivo `.xlsx` o `.csv`. La aplicación detecta la fila de encabezados, por lo que puede aceptar espacios antes de la tabla, pero el archivo debe incluir estas nueve columnas: `Número eco.`, `Marca`, `Modelo`, `No. de serie`, `Categoría`, `Folio no.`, `Área`, `Fecha de prueba` y `Observaciones`. Si un número económico ya existe, el registro importado lo actualiza.
