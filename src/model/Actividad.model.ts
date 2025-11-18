export interface Actividad {
    id: string;
    nombre: string;
    fechaInicio: string;
    fechaFin: string;
    tipo: 'actividad' | 'hito';
    progreso: number;
    rol: string;
    color: string;
    descripcion?: string;
    subactividades?: Actividad[];
    nivel?: number; // Para indentación (0 = padre, 1+ = hijo)
    estado?: Estado; // Estado de la tarea
    asignado?: string; // Nombre del asignado
    avatar?: string; // Iniciales para avatar
}

export interface ProyectoData {
    proyecto: string;
    fechaInicio: string;
    fechaFin: string;
    actividades: Actividad[];
}


export type Estado = 'Done' | 'In progress' | 'Open' | 'Planned';