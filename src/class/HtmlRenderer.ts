import { Actividad, Estado } from "../model/Actividad.model.js";
import { DateFormat } from "./date-format.js";
import { GanttDataManager } from "./GanttDataManager.js";
import { TooltipManager } from "./TooltipManager.js";

export class HtmlRenderer {
    private container: HTMLElement;
    private dataManager: GanttDataManager;
    private tooltipManager: TooltipManager;
    private dateFormat: DateFormat;
    private cellWidth: number;
    private zoomLevel: number;
    private today: Date = new Date();

    constructor(
        container: HTMLElement,
        dataManager: GanttDataManager,
        tooltipManager: TooltipManager,
        dateFormat: DateFormat,
        cellWidth: number,
        zoomLevel: number
    ) {
        this.container = container;
        this.dataManager = dataManager;
        this.tooltipManager = tooltipManager;
        this.dateFormat = dateFormat;
        this.cellWidth = cellWidth;
        this.zoomLevel = zoomLevel;
    }

    public setZoomLevel(level: number): void {
        this.zoomLevel = level;
    }

    public render(): void {
        this.container.innerHTML = '';

        // Crear estructura principal
        const header = this.createHeader();
        this.container.appendChild(header);

        // Crear filas de actividades
        this.dataManager.getFlatActivities().forEach((actividad, index) => {
            const row = this.createActivityRow(actividad, index);
            this.container.appendChild(row);
        });
    }

    private createHeader(): HTMLElement {
        const header = document.createElement('div');
        header.className = 'gantt-header';

        // Sidebar con columnas
        const sidebar = document.createElement('div');
        sidebar.className = 'gantt-sidebar-header-container';

        const taskNameHeader = document.createElement('div');
        taskNameHeader.className = 'gantt-sidebar-header';
        taskNameHeader.textContent = 'Nombre de la actividad';
        sidebar.appendChild(taskNameHeader);

        const statusHeader = document.createElement('div');
        statusHeader.className = 'gantt-sidebar-header';
        statusHeader.textContent = 'Estado';
        sidebar.appendChild(statusHeader);

        const datesHeader = document.createElement('div');
        datesHeader.className = 'gantt-sidebar-header fecha';
        datesHeader.textContent = 'Fecha-inicio';
        sidebar.appendChild(datesHeader);

        const datesHeader2 = document.createElement('div');
        datesHeader2.className = 'gantt-sidebar-header fecha';
        datesHeader2.textContent = 'Fecha-fin';
        sidebar.appendChild(datesHeader2);

        const assignedHeader = document.createElement('div');
        assignedHeader.className = 'gantt-sidebar-header';
        assignedHeader.textContent = 'Asignado/Rol';
        sidebar.appendChild(assignedHeader);


        header.appendChild(sidebar);

        // Timeline header
        const timelineHeader = document.createElement('div');
        timelineHeader.className = 'gantt-timeline-header';
        timelineHeader.style.display = 'flex';
        timelineHeader.style.flex = '1';
        timelineHeader.style.minWidth = `${this.dataManager.getDays().length * this.cellWidth * this.zoomLevel}px`;

        let currentMonth = '';
        let monthContainer: HTMLElement | null = null;

        this.dataManager.getDays().forEach((day, index) => {
            const month = this.dateFormat.formatMonth(day);
            const isNewMonth = month !== currentMonth;

            if (isNewMonth || index === 0) {
                currentMonth = month;
                // Crear contenedor de mes
                monthContainer = document.createElement('div');
                monthContainer.className = 'gantt-month-container';
                const monthLabel = document.createElement('div');
                monthLabel.className = 'gantt-month-label';
                monthLabel.textContent = month;
                monthContainer.appendChild(monthLabel);

                const daysContainer = document.createElement('div');
                daysContainer.className = 'gantt-days-container';
                monthContainer.appendChild(daysContainer);
                timelineHeader.appendChild(monthContainer);
            }

            const cell = document.createElement('div');
            cell.className = 'gantt-timeline-cell';
            cell.style.minWidth = `${this.cellWidth * this.zoomLevel}px`;
            cell.style.width = `${this.cellWidth * this.zoomLevel}px`;
            cell.textContent = day.getDate().toString();

            if (monthContainer) {
                const daysContainer = monthContainer.querySelector('.gantt-days-container');
                daysContainer?.appendChild(cell);
            }
        });

        header.appendChild(timelineHeader);
        return header;
    }

    private createActivityRow(actividad: Actividad, index: number): HTMLElement {
        const row = document.createElement('div');
        row.className = 'gantt-row';
        row.setAttribute('data-activity-id', actividad.id);
        row.setAttribute('data-level', String(actividad.nivel || 0));

        // Sidebar con tres columnas
        const sidebar = document.createElement('div');
        sidebar.className = 'gantt-sidebar-row';

        // Columna 1: Task name
        const taskNameCol = document.createElement('div');
        taskNameCol.className = 'gantt-task-name-col';

        const titleContainer = document.createElement('div');
        titleContainer.className = 'gantt-row-title-container';
        titleContainer.style.paddingLeft = `${(actividad.nivel || 0) * 30}px`;

        // Icono de expandir/colapsar
        const hasSubactivities = actividad.subactividades && actividad.subactividades.length > 0;
        if (hasSubactivities) {
            const expandIcon = document.createElement('span');
            expandIcon.className = 'gantt-expand-icon';
            expandIcon.innerHTML = this.dataManager.isExpanded(actividad.id) ? '−' : '+';
            expandIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.dataManager.toggleActivity(actividad.id);
                this.render(); // Re-render after toggle
                // Trigger event for connection redraw
                const event = new CustomEvent('gantt-redraw');
                document.dispatchEvent(event);
            });
            titleContainer.appendChild(expandIcon);
        } else {
            const spacer = document.createElement('span');
            spacer.style.width = '28px';
            spacer.style.display = 'inline-block';
            titleContainer.appendChild(spacer);
        }

        const title = document.createElement('span');
        title.className = 'gantt-row-title';
        // Mostrar ID antes del nombre si existe
        const idSpan = document.createElement('span');
        idSpan.className = 'gantt-activity-id';
        idSpan.textContent = actividad.id ? `${actividad.id} ` : '';
        idSpan.style.fontWeight = '600';
        idSpan.style.marginRight = '8px';
        idSpan.style.color = '#495057';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = actividad.nombre;

        title.appendChild(idSpan);
        title.appendChild(nameSpan);
        titleContainer.appendChild(title);
        taskNameCol.appendChild(titleContainer);

        // Columna 2: Status
        const statusCol = document.createElement('div');
        statusCol.className = 'gantt-status-col';
        const isParentExpanded = hasSubactivities && this.dataManager.isExpanded(actividad.id);
        // Solo mostrar estado si no es una actividad padre expandida
        if (!isParentExpanded) {
            const estado = actividad.estado || (actividad.progreso === 100 ? 'Done' : actividad.progreso > 0 ? 'In progress' : 'Open');
            const estadoDot = document.createElement('div');
            estadoDot.className = 'gantt-status-dot';
            estadoDot.style.backgroundColor = this.getEstadoColor(estado);
            const estadoText = document.createElement('span');
            estadoText.textContent = estado;
            statusCol.appendChild(estadoDot);
            statusCol.appendChild(estadoText);
        }

        // Columna 3: Fecha de inicio
        const startCol = document.createElement('div');
        startCol.className = 'gantt-status-col gantt-start-col';
        startCol.textContent = actividad.fechaInicio;

        // Columna 4: Fecha de fin
        const endCol = document.createElement('div');
        endCol.className = 'gantt-status-col gantt-end-col';
        endCol.textContent = actividad.fechaFin;

        // Columna 5: Assigned
        const assignedCol = document.createElement('div');
        assignedCol.className = 'gantt-assigned-col';

        // Mostrar avatar y rol/asignado
        if (actividad.rol || actividad.asignado) {
            const avatarName = actividad.asignado || actividad.rol;
            const avatar = this.createAvatar(avatarName, actividad.avatar);
            assignedCol.appendChild(avatar);

            const textContainer = document.createElement('div');
            textContainer.style.display = 'flex';
            textContainer.style.flexDirection = 'column';
            textContainer.style.gap = '2px';

            if (actividad.rol && actividad.rol.trim() !== '') {
                const rolSpan = document.createElement('span');
                rolSpan.textContent = actividad.rol;
                rolSpan.style.fontWeight = 'bold';
                textContainer.appendChild(rolSpan);
            }

            if (actividad.asignado && actividad.asignado.trim() !== '' && actividad.asignado !== actividad.rol) {
                const nameSpan = document.createElement('span');
                nameSpan.textContent = actividad.asignado;
                textContainer.appendChild(nameSpan);
            }

            assignedCol.appendChild(textContainer);
        }

        sidebar.appendChild(taskNameCol);
        sidebar.appendChild(statusCol);
        sidebar.appendChild(startCol);
        sidebar.appendChild(endCol);
        sidebar.appendChild(assignedCol);
        row.appendChild(sidebar);

        // Timeline de la fila
        const timelineRow = document.createElement('div');
        timelineRow.className = 'gantt-timeline';
        timelineRow.style.position = 'relative';
        timelineRow.style.height = '40px';
        timelineRow.style.width = `${this.dataManager.getDays().length * this.cellWidth * this.zoomLevel}px`;

        this.createGrid(timelineRow);
        this.createTodayMarker(timelineRow);
        this.createBar(timelineRow, actividad, index);

        row.appendChild(timelineRow);
        return row;
    }

    private createGrid(container: HTMLElement): void {
        const grid = document.createElement('div');
        grid.className = 'gantt-grid';

        this.dataManager.getDays().forEach((day, index) => {
            const line = document.createElement('div');
            line.className = 'gantt-grid-line';
            line.style.left = `${index * this.cellWidth * this.zoomLevel}px`;
            grid.appendChild(line);
        });

        container.appendChild(grid);
    }

    private createTodayMarker(container: HTMLElement): void {
        const todayIndex = this.dateFormat.getDayIndex(this.dataManager.getMinDate(), this.today);
        if (todayIndex >= 0 && todayIndex < this.dataManager.getDays().length) {
            const marker = document.createElement('div');
            marker.className = 'gantt-today-marker';
            marker.style.left = `${todayIndex * this.cellWidth * this.zoomLevel}px`;
            container.appendChild(marker);
        }
    }

    private createBar(container: HTMLElement, actividad: Actividad, rowIndex: number): void {
        const { startDate, endDate } = this.dataManager.calculateActivityDates(actividad);

        const startIndex = this.dateFormat.getDayIndex(this.dataManager.getMinDate(), startDate);
        const daysDuration = this.dateFormat.getDaysBetween(startDate, endDate) + 1;

        const left = startIndex * this.cellWidth * this.zoomLevel;
        const width = daysDuration * this.cellWidth * this.zoomLevel;

        const hasSubactivities = actividad.subactividades && actividad.subactividades.length > 0;
        const hasVisibleSubactivities = hasSubactivities && this.dataManager.isExpanded(actividad.id);
        const isParent = hasSubactivities && actividad.nivel === 0;

        if (hasSubactivities && hasVisibleSubactivities) {
            return;
        }

        const bar = document.createElement('div');
        bar.id = actividad.id;
        bar.className = `gantt-bar ${actividad.tipo} ${actividad.dependencias?.[0]}`;
        if (isParent) {
            bar.classList.add('parent-bar');
        }

        const rowHeight = 40;
        const barHeight = isParent ? 22 : 18;
        const topOffset = 1;

        bar.style.left = `${left}px`;
        bar.style.top = `${topOffset}px`;
        bar.style.width = `${width}px`;
        bar.style.height = `${barHeight}px`;
        bar.style.backgroundColor = actividad.color;
        bar.style.zIndex = '2';
        bar.style.borderRadius = '4px';

        if (actividad.tipo === 'actividad') {
            const barContent = document.createElement('div');
            barContent.className = 'gantt-bar-content';
            barContent.style.display = 'flex';
            barContent.style.alignItems = 'center';
            barContent.style.height = '100%';
            barContent.style.padding = '0 8px';
            barContent.style.gap = '8px';

            const barName = document.createElement('span');
            barName.className = 'gantt-bar-name';
            barName.style.overflow = 'hidden';
            barName.style.textOverflow = 'ellipsis';
            barName.style.whiteSpace = 'nowrap';
            barName.style.flex = '1';

            if (actividad.id) {
                const barIdSpan = document.createElement('span');
                barIdSpan.textContent = `${actividad.id} `;
                barIdSpan.style.fontWeight = '600';
                barIdSpan.style.marginRight = '4px';
                barName.appendChild(barIdSpan);
            }

            const barNameText = document.createElement('span');
            barNameText.textContent = actividad.nombre;
            barName.appendChild(barNameText);
            barContent.appendChild(barName);

            const assignedName = actividad.asignado || actividad.rol;
            if (assignedName && assignedName.trim() !== '' && !isParent) {
                const barAvatar = this.createAvatar(assignedName, actividad.avatar);
                barAvatar.style.width = '18px';
                barAvatar.style.height = '18px';
                barAvatar.style.fontSize = '10px';
                barAvatar.style.flexShrink = '0';
                barContent.appendChild(barAvatar);
            }

            bar.appendChild(barContent);

            if (!isParent) {
                const progressBar = document.createElement('div');
                progressBar.className = 'gantt-progress-indicator';
                progressBar.style.position = 'absolute';
                progressBar.style.left = '0';
                progressBar.style.top = '0';
                progressBar.style.height = '100%';
                progressBar.style.width = `${actividad.progreso}%`;
                progressBar.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                progressBar.style.borderRadius = '4px';
                bar.appendChild(progressBar);
            }
        } else {
            const milestoneSize = 16 * this.zoomLevel;
            const topOffset = 2;

            bar.style.left = `${left - milestoneSize / 2}px`;
            bar.style.top = `${topOffset}px`;
            bar.style.width = 'auto';
            bar.style.height = `${milestoneSize}px`;

            const diamond = document.createElement('div');
            diamond.className = 'gantt-milestone-diamond';
            diamond.style.width = `${milestoneSize + 20}px`;
            diamond.style.height = `${milestoneSize + 20}px`;
            diamond.style.backgroundColor = actividad.color;
            bar.appendChild(diamond);

            const label = document.createElement('span');
            label.className = 'gantt-milestone-label';
            label.textContent = actividad.nombre;
            bar.appendChild(label);
        }

        bar.addEventListener('mouseenter', (e) => {
            this.tooltipManager.showTooltip(e, actividad);
        });

        bar.addEventListener('mouseleave', () => {
            this.tooltipManager.hideTooltip();
        });

        container.appendChild(bar);
    }

    private getEstadoColor(estado?: Estado): string {
        switch (estado) {
            case 'Done': return '#2196F3';
            case 'In progress': return '#FF9800';
            case 'Open': return '#9E9E9E';
            case 'Planned': return '#9E9E9E';
            default: return '#9E9E9E';
        }
    }

    private getInitials(name: string): string {
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    private createAvatar(name: string, avatarUrl?: string): HTMLElement {
        const avatar = document.createElement('div');
        avatar.className = 'gantt-avatar';

        if (avatarUrl && avatarUrl.trim() !== '') {
            const img = document.createElement('img');
            img.src = avatarUrl;
            img.alt = name;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '50%';
            avatar.appendChild(img);
        } else {
            avatar.textContent = this.getInitials(name);
            const colors = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#30cfd0'];
            const index = name.charCodeAt(0) % colors.length;
            avatar.style.backgroundColor = colors[index];
        }

        return avatar;
    }
}
