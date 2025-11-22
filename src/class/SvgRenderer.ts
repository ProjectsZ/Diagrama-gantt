import * as d3 from 'd3';
import { Actividad } from "../model/Actividad.model.js";

export class SvgRenderer {
    private container: HTMLElement;

    constructor(container: HTMLElement) {
        this.container = container;
    }

    public drawConnections(flatActivities: Actividad[]): void {
        // Crear o seleccionar SVG en el contenedor principal
        let svg = d3.select(this.container).select<SVGSVGElement>('.gantt-connections-svg');

        if (svg.empty()) {
            svg = d3.select(this.container)
                .append('svg')
                .attr('class', 'gantt-connections-svg')
                .style('position', 'absolute')
                .style('top', '0')
                .style('left', '0')
                .style('width', '100%')
                .style('height', '100%')
                .style('pointer-events', 'none')
                .style('z-index', '1');

            // Definir marcador de flecha
            svg.append('defs').append('marker')
                .attr('id', 'arrowhead')
                .attr('viewBox', '0 -5 10 10')
                .attr('refX', 8)
                .attr('refY', 0)
                .attr('markerWidth', 6)
                .attr('markerHeight', 6)
                .attr('orient', 'auto')
                .append('path')
                .attr('d', 'M0,-5L10,0L0,5')
                .attr('fill', '#999');
        } else {
            // Limpiar solo los paths y circles, mantener defs
            svg.selectAll('path:not(defs path)').remove();
            svg.selectAll('circle').remove();
        }

        // Asegurar que el SVG cubra todo el scroll
        svg.style('width', `${this.container.scrollWidth}px`)
            .style('height', `${this.container.scrollHeight}px`);

        // Helper para obtener offset relativo al contenedor
        const getOffset = (el: HTMLElement) => {
            let x = 0;
            let y = 0;
            let element = el;
            while (element && element !== this.container) {
                x += element.offsetLeft;
                y += element.offsetTop;
                element = element.offsetParent as HTMLElement;
            }
            return { x, y };
        };

        // Iterar sobre actividades visibles
        flatActivities.forEach((current) => {
            if (current.dependencias && current.dependencias.length > 0) {
                current.dependencias.forEach(depId => {
                    const currentBar = document.getElementById(current.id);
                    const sourceBar = document.getElementById(depId);

                    if (currentBar && sourceBar) {
                        const sourcePos = getOffset(sourceBar);
                        const currentPos = getOffset(currentBar);

                        // Punto final de la fuente (derecha centro)
                        const x1 = sourcePos.x + sourceBar.offsetWidth;
                        const y1 = sourcePos.y + (sourceBar.offsetHeight / 2);

                        // Punto inicial del destino (izquierda centro)
                        const x2 = currentPos.x;
                        const y2 = currentPos.y + (currentBar.offsetHeight / 2);

                        // Dibujar línea rectilínea
                        const path = d3.path();
                        path.moveTo(x1, y1);

                        const midX = x1 + 20; // Salir un poco a la derecha

                        // Si el destino está después de la fuente (y suficiente espacio)
                        if (x2 > x1 + 20) {
                            path.lineTo(midX, y1);
                            path.lineTo(midX, y2);
                            path.lineTo(x2, y2);
                        } else {
                            // Si el destino está antes o muy cerca (Z-shape)
                            const midY = y1 + (y2 - y1) / 2;
                            path.lineTo(midX, y1);
                            path.lineTo(midX, midY);
                            path.lineTo(x2 - 20, midY);
                            path.lineTo(x2 - 20, y2);
                            path.lineTo(x2, y2);
                        }

                        svg.append('path')
                            .attr('d', path.toString())
                            .attr('stroke', '#999')
                            .attr('stroke-width', 1.5)
                            .attr('stroke-dasharray', '4,4')
                            .attr('fill', 'none')
                            .attr('marker-end', 'url(#arrowhead)');
                    }
                });
            }
        });
    }
}
