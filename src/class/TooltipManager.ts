import { Actividad } from "../model/Actividad.model.js";
import { DateFormat } from "./date-format.js";

export class TooltipManager {
    private tooltip: HTMLElement;
    private dateFormat: DateFormat;

    constructor(dateFormat: DateFormat) {
        this.dateFormat = dateFormat;
        this.tooltip = this.createTooltip();
    }

    private createTooltip(): HTMLElement {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        document.body.appendChild(tooltip);
        return tooltip;
    }

    public showTooltip(event: MouseEvent, actividad: Actividad): void {
        this.tooltip.innerHTML = `
            <strong>${actividad.nombre}</strong><br>
            Rol: ${actividad.rol}<br>
            Inicio: ${this.dateFormat.formatDate(new Date(actividad.fechaInicio))}<br>
            Fin: ${this.dateFormat.formatDate(new Date(actividad.fechaFin))}<br>
            Progreso: ${actividad.progreso}%<br>
            Asignado: 
              <br> <img class="gantt-avatar gantt-tooltip-avatar" src="${actividad.avatar}" width="80" height="80" alt="${actividad.asignado}" /> ${actividad.asignado} (${actividad.rol})<br>
            ${actividad.descripcion ? `<br>${actividad.descripcion}` : ''}
        `;
        this.tooltip.classList.add('show');
        this.tooltip.style.left = `${event.pageX + 10}px`;
        this.tooltip.style.top = `${event.pageY + 10}px`;
    }

    public hideTooltip(): void {
        this.tooltip.classList.remove('show');
    }
}
