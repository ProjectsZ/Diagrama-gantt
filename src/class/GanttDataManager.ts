import { Actividad, ProyectoData } from "../model/Actividad.model.js";
import { DateFormat } from "./date-format.js";

export class GanttDataManager {
    private data: ProyectoData;
    private expandedActivities: Set<string> = new Set();
    private flatActivities: Actividad[] = [];
    private days: Date[] = [];
    private minDate: Date;
    private maxDate: Date;
    private dateFormat: DateFormat;

    constructor(data: ProyectoData, dateFormat: DateFormat) {
        this.data = data;
        this.dateFormat = dateFormat;
        this.minDate = this.dateFormat.parseLocalDate(data.fechaInicio);
        this.maxDate = this.dateFormat.parseLocalDate(data.fechaFin);

        this.initializeDates();
        this.initializeExpandedActivities();
        this.processActivities();
    }

    public getFlatActivities(): Actividad[] {
        return this.flatActivities;
    }

    public getDays(): Date[] {
        return this.days;
    }

    public getMinDate(): Date {
        return this.minDate;
    }

    public getMaxDate(): Date {
        return this.maxDate;
    }

    public isExpanded(activityId: string): boolean {
        return this.expandedActivities.has(activityId);
    }

    public toggleActivity(activityId: string): void {
        if (this.expandedActivities.has(activityId)) {
            this.expandedActivities.delete(activityId);
        } else {
            this.expandedActivities.add(activityId);
        }
        this.processActivities();
    }

    private initializeDates(): void {
        const current = new Date(this.minDate);
        this.days = [];
        while (current <= this.maxDate) {
            this.days.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
    }

    private initializeExpandedActivities(): void {
        this.data.actividades.forEach(act => {
            if (act.subactividades && act.subactividades.length > 0) {
                this.expandedActivities.add(act.id);
                this.expandSubactivities(act);
            }
        });
    }

    private expandSubactivities(actividad: Actividad): void {
        if (actividad.subactividades) {
            actividad.subactividades.forEach(sub => {
                if (sub.subactividades && sub.subactividades.length > 0) {
                    this.expandedActivities.add(sub.id);
                    this.expandSubactivities(sub);
                }
            });
        }
    }

    public processActivities(): void {
        this.flatActivities = [];
        this.data.actividades.forEach(act => {
            this.processActivity(act, 0);
        });
    }

    private processActivity(actividad: Actividad, nivel: number): void {
        actividad.nivel = nivel;
        this.flatActivities.push(actividad);

        if (actividad.subactividades && actividad.subactividades.length > 0) {
            if (this.expandedActivities.has(actividad.id)) {
                actividad.subactividades.forEach(sub => {
                    this.processActivity(sub, nivel + 1);
                });
            }
        }
    }

    public calculateActivityDates(actividad: Actividad): { startDate: Date; endDate: Date } {
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

        return {
            startDate: this.dateFormat.parseLocalDate(actividad.fechaInicio),
            endDate: this.dateFormat.parseLocalDate(actividad.fechaFin)
        };
    }
}
