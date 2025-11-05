# Diagrama de Gantt

Un diagrama de Gantt interactivo construido con TypeScript, HTML y CSS.

## Características

- ✅ Visualización de actividades y hitos
- ✅ Indicadores de progreso
- ✅ Roles y responsabilidades
- ✅ Zoom in/out
- ✅ Tooltips informativos
- ✅ Datos parametrizables mediante JSON

## Estructura del Proyecto

```
diagrama-gantt/
├── src/
│   └── gantt.ts          # Lógica principal del diagrama
├── dist/                 # Archivos compilados (generados)
├── index.html            # Página principal
├── styles.css            # Estilos del diagrama
├── data.json             # Datos del proyecto (parametrizable)
├── package.json          # Dependencias del proyecto
└── tsconfig.json         # Configuración de TypeScript
```

## Instalación

1. Instalar dependencias:
```bash
npm install
```

## Uso

1. Compilar TypeScript:
```bash
npm run build
```

2. Iniciar servidor local:
```bash
npm run serve
```

3. Abrir en el navegador: `http://localhost:8080`

## Personalizar Datos

Edita el archivo `data.json` para personalizar tu proyecto:

```json
{
  "proyecto": "Nombre del Proyecto",
  "fechaInicio": "2024-01-01",
  "fechaFin": "2024-06-30",
  "actividades": [
    {
      "id": "act-1",
      "nombre": "Nombre de la Actividad",
      "fechaInicio": "2024-01-01",
      "fechaFin": "2024-01-15",
      "tipo": "actividad",  // "actividad" o "hito"
      "progreso": 100,      // 0-100
      "rol": "Nombre del Rol",
      "color": "#4CAF50",
      "descripcion": "Descripción opcional"
    }
  ]
}
```

## Campos del JSON

- **proyecto**: Nombre del proyecto
- **fechaInicio**: Fecha de inicio del proyecto (YYYY-MM-DD)
- **fechaFin**: Fecha de fin del proyecto (YYYY-MM-DD)
- **actividades**: Array de actividades
  - **id**: Identificador único
  - **nombre**: Nombre de la actividad
  - **fechaInicio**: Fecha de inicio (YYYY-MM-DD)
  - **fechaFin**: Fecha de fin (YYYY-MM-DD)
  - **tipo**: "actividad" o "hito"
  - **progreso**: Porcentaje de progreso (0-100)
  - **rol**: Rol responsable
  - **color**: Color en formato hexadecimal
  - **descripcion**: Descripción opcional

## Scripts Disponibles

- `npm run build` - Compila TypeScript
- `npm run watch` - Compila TypeScript en modo watch
- `npm run serve` - Inicia servidor HTTP local

