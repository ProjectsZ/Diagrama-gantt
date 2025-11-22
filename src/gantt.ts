import { DateFormat } from "./class/date-format.js";
import { Actividad, Estado, ProyectoData } from "./model/Actividad.model.js";


class GanttChart {

    private container: HTMLElement;
    private data: ProyectoData;
    private cellWidth: number = 50; // Ancho de cada celda (día)
    private zoomLevel: number = 1;
    private minDate: Date;
    private maxDate: Date;
    private days: Date[] = [];
    private tooltip!: HTMLElement;
    private expandedActivities: Set<string> = new Set(); // IDs de actividades expandidas
    private flatActivities: Actividad[] = []; // Lista plana de actividades para renderizar
    private today: Date = new Date(); // Fecha de hoy

    private dateFormat: DateFormat = new DateFormat();

    constructor(containerId: string, data: ProyectoData) {
        this.container = document.getElementById(containerId)!;
        this.data = data;
        this.minDate = new Date(data.fechaInicio);
        this.maxDate = new Date(data.fechaFin);
        this.initializeDates();
        this.processActivities();
        this.createTooltip();
        this.render();
        this.setupControls();
    }

    private processActivities(): void {
        // Procesar actividades y asignar niveles
        this.flatActivities = [];
        this.data.actividades.forEach(act => {
            // Expandir todas las actividades por defecto
            if (act.subactividades && act.subactividades.length > 0) {
                if (!this.expandedActivities.has(act.id)) {
                    this.expandedActivities.add(act.id);
                }
            }
            this.processActivity(act, 0);
        });
    }

    private processActivity(actividad: Actividad, nivel: number): void {
        actividad.nivel = nivel;
        this.flatActivities.push(actividad);
        
        // Si tiene subactividades y está expandida, procesarlas también
        if (actividad.subactividades && actividad.subactividades.length > 0) {
            if (this.expandedActivities.has(actividad.id)) {
                actividad.subactividades.forEach(sub => {
                    this.processActivity(sub, nivel + 1);
                });
            }
        }
    }

    private initializeDates(): void {
        const current = new Date(this.minDate);
        this.days = [];
        
        while (current <= this.maxDate) {
            this.days.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
    }

    private createTooltip(): void {
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'tooltip';
        document.body.appendChild(this.tooltip);
    }

    private setupControls(): void {
        const zoomIn = document.getElementById('zoomIn');
        const zoomOut = document.getElementById('zoomOut');
        const resetZoom = document.getElementById('resetZoom');

        zoomIn?.addEventListener('click', () => {
            this.zoomLevel = Math.min(this.zoomLevel + 0.2, 3);
            this.render();
        });

        zoomOut?.addEventListener('click', () => {
            this.zoomLevel = Math.max(this.zoomLevel - 0.2, 0.5);
            this.render();
        });

        resetZoom?.addEventListener('click', () => {
            this.zoomLevel = 1;
            this.render();
        });
    }

    

    private render(): void {
        this.container.innerHTML = '';
        
        // Procesar actividades para obtener lista plana
        this.processActivities();
        
        // Crear estructura principal
        const header = this.createHeader();
        this.container.appendChild(header);
        
        // Crear filas de actividades
        this.flatActivities.forEach((actividad, index) => {
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
        timelineHeader.style.minWidth = `${this.days.length * this.cellWidth * this.zoomLevel}px`;
        
        let currentMonth = '';
        let monthContainer: HTMLElement | null = null;
        
        this.days.forEach((day, index) => {
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

    private createAvatar(name: string, initials?: string): HTMLElement {
        const avatar = document.createElement('div');
        avatar.className = 'gantt-avatar';
        avatar.textContent = initials || this.getInitials(name);
        // Color basado en el nombre
        const colors = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#30cfd0'];
        const index = name.charCodeAt(0) % colors.length;
        avatar.style.backgroundColor = colors[index];
        return avatar;
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
            expandIcon.innerHTML = this.expandedActivities.has(actividad.id) ? '−' : '+';
            expandIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleActivity(actividad.id);
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
        const isParentExpanded = hasSubactivities && this.expandedActivities.has(actividad.id);
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
        
        // Columna 3: Assigned
        const assignedCol = document.createElement('div');
        assignedCol.className = 'gantt-assigned-col';
        const assignedName = actividad.asignado || actividad.rol;
        if (assignedName && assignedName.trim() !== '' && !isParentExpanded) {
            const avatar = this.createAvatar(assignedName, actividad.avatar);
            assignedCol.appendChild(avatar);
            const nameSpan = document.createElement('span');
            nameSpan.textContent = assignedName;
            assignedCol.appendChild(nameSpan);
        }
        
        sidebar.appendChild(taskNameCol);
        sidebar.appendChild(statusCol);
        sidebar.appendChild(assignedCol);
        row.appendChild(sidebar);
        
        // Timeline de la fila
        const timelineRow = document.createElement('div');
        timelineRow.className = 'gantt-timeline';
        timelineRow.style.position = 'relative';
        timelineRow.style.height = '40px';
        timelineRow.style.width = `${this.days.length * this.cellWidth * this.zoomLevel}px`;
        
        // Crear grid
        this.createGrid(timelineRow);
        
        // Crear marcador Today
        this.createTodayMarker(timelineRow);
        
        // Crear barras
        this.createBar(timelineRow, actividad, index);
        
        row.appendChild(timelineRow);
        return row;
    }

    private createTodayMarker(container: HTMLElement): void {
        const todayIndex = this.dateFormat.getDayIndex(this.minDate, this.today);
        if (todayIndex >= 0 && todayIndex < this.days.length) {
            const marker = document.createElement('div');
            marker.className = 'gantt-today-marker';
            marker.style.left = `${todayIndex * this.cellWidth * this.zoomLevel}px`;
            container.appendChild(marker);
        }
    }

    private createGrid(container: HTMLElement): void {
        const grid = document.createElement('div');
        grid.className = 'gantt-grid';
        
        this.days.forEach((day, index) => {
            const line = document.createElement('div');
            line.className = 'gantt-grid-line';
            line.style.left = `${index * this.cellWidth * this.zoomLevel}px`;
            grid.appendChild(line);
        });
        
        container.appendChild(grid);
    }

    private calculateActivityDates(actividad: Actividad): { startDate: Date; endDate: Date } {
        // Si tiene subactividades, calcular las fechas basándose en ellas
        if (actividad.subactividades && actividad.subactividades.length > 0) {
            let minDate: Date | null = null;
            let maxDate: Date | null = null;
            
            actividad.subactividades.forEach(sub => {
                const subDates = this.calculateActivityDates(sub);
                if (!minDate || subDates.startDate < minDate) {
                    minDate = subDates.startDate;
                }
                if (!maxDate || subDates.endDate > maxDate) {
                    maxDate = subDates.endDate;
                }
            });
            
            if (minDate && maxDate) {
                return { startDate: minDate, endDate: maxDate };
            }
        }
        
        // Si no tiene subactividades, usar las fechas directas
        return {
            startDate: new Date(actividad.fechaInicio),
            endDate: new Date(actividad.fechaFin)
        };
    }

    private createBar(container: HTMLElement, actividad: Actividad, rowIndex: number): void {
        // Calcular fechas (puede ser desde subactividades o directas)
        const { startDate, endDate } = this.calculateActivityDates(actividad);
        
        const startIndex = this.dateFormat.getDayIndex(this.minDate,startDate);
        const daysDuration = this.dateFormat.getDaysBetween(startDate, endDate) + 1;
        
        const left = startIndex * this.cellWidth * this.zoomLevel;
        const width = daysDuration * this.cellWidth * this.zoomLevel;
        
        const hasSubactivities = actividad.subactividades && actividad.subactividades.length > 0;
        const hasVisibleSubactivities = hasSubactivities && this.expandedActivities.has(actividad.id);
        const isParent = hasSubactivities && actividad.nivel === 0;
        
        // Si tiene subactividades visibles, no mostrar barra del padre (solo de los hijos)
        if (hasSubactivities && hasVisibleSubactivities) {
            return;
        }
        
        // Para actividades padre colapsadas o actividades normales
        const bar = document.createElement('div');
        bar.className = `gantt-bar ${actividad.tipo}`;
        if (isParent) {
            bar.classList.add('parent-bar');
        }
        
        const rowHeight = 40; // Altura de cada fila reducida
        const barHeight = isParent ? 22 : 18;
        const topOffset = 1; // Muy cerca del borde superior
        
        bar.style.left = `${left}px`;
        bar.style.top = `${topOffset}px`;
        bar.style.width = `${width}px`;
        bar.style.height = `${barHeight}px`;
        bar.style.backgroundColor = actividad.color;
        bar.style.zIndex = '2';
        bar.style.borderRadius = '4px';
        
        if (actividad.tipo === 'actividad') {
            // Contenedor del contenido de la barra
            const barContent = document.createElement('div');
            barContent.className = 'gantt-bar-content';
            barContent.style.display = 'flex';
            barContent.style.alignItems = 'center';
            barContent.style.height = '100%';
            barContent.style.padding = '0 8px';
            barContent.style.gap = '8px';
            
            // Nombre truncado con ID
            const barName = document.createElement('span');
            barName.className = 'gantt-bar-name';
            barName.style.overflow = 'hidden';
            barName.style.textOverflow = 'ellipsis';
            barName.style.whiteSpace = 'nowrap';
            barName.style.flex = '1';
            
            // Mostrar ID si existe
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
            
            // Avatar si hay asignado
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
            
            // Indicador de progreso (solo para actividades no padre)
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
            // Hito - diamante
            const milestoneSize = 18 * this.zoomLevel;
            const topOffset = 1; // Muy cerca del borde superior
            
            bar.style.width = `${milestoneSize}px`;
            bar.style.height = `${milestoneSize}px`;
            bar.style.left = `${left - milestoneSize / 2}px`;
            bar.style.top = `${topOffset}px`;
            bar.style.backgroundColor = 'transparent';
            bar.style.border = 'none';
            bar.style.transform = 'rotate(45deg)';
            bar.style.borderRadius = '0';
            
            const diamond = document.createElement('div');
            diamond.style.width = '100%';
            diamond.style.height = '100%';
            diamond.style.backgroundColor = actividad.color;
            diamond.style.transform = 'rotate(-45deg)';
            bar.appendChild(diamond);
            
            // Avatar sobre el hit
            const assignedName = actividad.asignado || actividad.rol;
            if (assignedName && assignedName.trim() !== '') {
                const milestoneAvatar = this.createAvatar(assignedName, actividad.avatar);
                milestoneAvatar.style.position = 'absolute';
                milestoneAvatar.style.top = '50%';
                milestoneAvatar.style.left = '50%';
                milestoneAvatar.style.transform = 'translate(-50%, -50%) rotate(45deg)';
                milestoneAvatar.style.width = '16px';
                milestoneAvatar.style.height = '16px';
                milestoneAvatar.style.fontSize = '9px';
                milestoneAvatar.style.zIndex = '3';
                bar.appendChild(milestoneAvatar);
            }
        }
        
        // Tooltip
        bar.addEventListener('mouseenter', (e) => {
            this.showTooltip(e, actividad);
        });
        
        bar.addEventListener('mouseleave', () => {
            this.hideTooltip();
        });
        
        container.appendChild(bar);
    }

    private showTooltip(event: MouseEvent, actividad: Actividad): void {
        this.tooltip.innerHTML = `
            <strong>${actividad.nombre}</strong><br>
            Rol: ${actividad.rol}<br>
            Inicio: ${this.dateFormat.formatDate(new Date(actividad.fechaInicio))}<br>
            Fin: ${this.dateFormat.formatDate(new Date(actividad.fechaFin))}<br>
            Progreso: ${actividad.progreso}%<br>
            ${actividad.descripcion ? `<br>${actividad.descripcion}` : ''}
        `;
        this.tooltip.classList.add('show');
        this.tooltip.style.left = `${event.pageX + 10}px`;
        this.tooltip.style.top = `${event.pageY + 10}px`;
    }

    private hideTooltip(): void {
        this.tooltip.classList.remove('show');
    }

    private toggleActivity(activityId: string): void {
        if (this.expandedActivities.has(activityId)) {
            this.expandedActivities.delete(activityId);
        } else {
            this.expandedActivities.add(activityId);
        }
        this.render();
    }

    private calculateAverageProgress(actividad: Actividad): number {
        if (!actividad.subactividades || actividad.subactividades.length === 0) {
            return actividad.progreso;
        }
        
        const total = actividad.subactividades.reduce((sum, sub) => {
            return sum + (sub.subactividades ? this.calculateAverageProgress(sub) : sub.progreso);
        }, 0);
        
        return Math.round(total / actividad.subactividades.length);
    }
}

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

