import { ProyectoData } from "../model/Actividad.model.js";
import { DateFormat } from "./date-format.js";
import { GanttDataManager } from "./GanttDataManager.js";
import { HtmlRenderer } from "./HtmlRenderer.js";
import { SvgRenderer } from "./SvgRenderer.js";
import { TooltipManager } from "./TooltipManager.js";

export class GanttChart {
    private container: HTMLElement;
    private dataManager: GanttDataManager;
    private htmlRenderer: HtmlRenderer;
    private svgRenderer: SvgRenderer;
    private tooltipManager: TooltipManager;
    private dateFormat: DateFormat;

    private cellWidth: number = 50;
    private zoomLevel: number = 1;

    constructor(containerId: string, data: ProyectoData) {
        this.container = document.getElementById(containerId)!;
        this.dateFormat = new DateFormat();

        // Initialize components
        this.dataManager = new GanttDataManager(data, this.dateFormat);
        this.tooltipManager = new TooltipManager(this.dateFormat);

        this.htmlRenderer = new HtmlRenderer(
            this.container,
            this.dataManager,
            this.tooltipManager,
            this.dateFormat,
            this.cellWidth,
            this.zoomLevel
        );

        this.svgRenderer = new SvgRenderer(this.container);

        this.setupControls();
        this.setupEvents();
        this.render();
    }

    private setupEvents(): void {
        // Listen for redraw events from HtmlRenderer (e.g. expand/collapse)
        document.addEventListener('gantt-redraw', () => {
            this.render();
        });
    }

    private render(): void {
        // Render HTML structure
        this.htmlRenderer.render();

        // Draw connections after DOM update
        setTimeout(() => {
            this.svgRenderer.drawConnections(this.dataManager.getFlatActivities());
        }, 0);
    }

    private setupControls(): void {
        const zoomIn = document.getElementById('zoomIn');
        const zoomOut = document.getElementById('zoomOut');
        const resetZoom = document.getElementById('resetZoom');

        zoomIn?.addEventListener('click', () => {
            this.zoomLevel = Math.min(this.zoomLevel + 0.2, 3);
            this.updateZoom();
        });

        zoomOut?.addEventListener('click', () => {
            this.zoomLevel = Math.max(this.zoomLevel - 0.2, 0.5);
            this.updateZoom();
        });

        resetZoom?.addEventListener('click', () => {
            this.zoomLevel = 1;
            this.updateZoom();
        });
    }

    private updateZoom(): void {
        this.htmlRenderer.setZoomLevel(this.zoomLevel);
        this.render();
    }
}
