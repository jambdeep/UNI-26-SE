# Laboratorio virtual: ¿Podemos confiar en esta medición?

Recurso interactivo para **Operación de Sistemas Electrónicos**, 8.º semestre. Vincula el Módulo 1 (tipos de sistemas electrónicos), el Módulo 2 (metrología) y el Entregable 1 (bitácora visual).

## Uso

1. Abre `index.html` con Chrome, Edge o Firefox. No hace falta servidor ni internet.
2. Para publicar en GitHub Pages, sube `index.html`, `styles.css` y `app.js` a la raíz de un repositorio y habilita **Settings → Pages → Deploy from a branch**.
3. Si no se conecta ningún estudiante, activa **Modo profesor**; muestra guiones cortos y explicaciones revelables. Avanza por las seis estaciones.
4. La última estación permite descargar un `.txt` con las mediciones y reflexiones, o imprimir la hoja de trabajo como PDF.

## Alcance y cautelas

- Circuito **ideal**: fuente DC y resistencias en serie (ley de Ohm). El multímetro es una representación didáctica, no un simulador SPICE o un instrumento calibrado.
- La medición de resistencia se simula con la fuente apagada y el componente supuesto aislado. La corriente se representa como una inserción conceptual en serie; no hay modelado de carga del instrumento.
- El banco metrológico utiliza lecturas **ficticias predefinidas** y una referencia asignada de 5.00 V. Los cálculos de sesgo, error relativo y desviación estándar describen esas series, no certifican calibración, exactitud metrológica formal ni trazabilidad.
- **El Entregable 1** solicita fotografías personales del instrumento, revisión física, dos mediciones, registro manuscrito y reflexión manuscrita de al menos 80 palabras. Las capturas del sitio son evidencias de práctica, pero no reemplazan automáticamente los requisitos de la consigna. Consultar al profesor para equivalencias de simulación.
- Los datos del formulario no se guardan permanentemente; descarga el borrador antes de cerrar o recargar.

## Secuencia docente · 60 minutos

| Minutos | Estación |
|---|---|
| 0–10 | La misión |
| 10–25 | Circuito, predicción y medición |
| 25–40 | Banco de multímetros: precisión vs exactitud |
| 40–50 | Diagnósticos y límites de la metrología virtual |
| 50–55 | Bitácora y requisitos de evidencia |
| 55–60 | Dictamen final |

## Archivos

- `index.html`: interfaz
- `styles.css`: diseño adaptable a escritorio y móvil
- `app.js`: simulación didáctica y registros locales en memoria

No utiliza bibliotecas, CDNs ni servicios externos.

## Cambios de la versión 4

- El voltímetro virtual se dibuja más alejado de R₂ en la medición B–C.
- La estación del banco de multímetros presenta gráficas de puntos con dos escalas, eje Y rotulado y lecturas numéricas.
- Se añadió el desarrollo de las fórmulas para promedio, sesgo medio, desviación estándar muestral y error relativo firmado del promedio con sustitución automática de valores.
- Se mantienen las estaciones, la bitácora y el dictamen ya probados.
