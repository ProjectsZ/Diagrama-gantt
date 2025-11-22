import { ProyectoData } from "./model/Actividad.model.js";
import { GanttChart } from "./class/GanttChart.js";

// Cargar datos y inicializar el diagrama
async function initGantt() {
    try {
        const response = await fetch('data.json');
        const data: ProyectoData = await response.json();

        const gantt = new GanttChart('gantt-chart', data);
    } catch (error) {
        console.error('Error al cargar los datos:', error);
        document.getElementById('gantt-chart')!.innerHTML =
            '<p style="padding: 20px; color: red;">Error al cargar los datos del proyecto.</p>';
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGantt);
} else {
    initGantt();
}
