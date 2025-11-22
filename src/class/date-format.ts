export class DateFormat {

    /**
     * Parse a date string (YYYY-MM-DD) as a local date at midnight,
     * avoiding timezone offset issues that occur with new Date("YYYY-MM-DD")
     */
    parseLocalDate(dateString: string): Date {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    getDaysBetween(start: Date, end: Date): number {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    getDayIndex(minDate: Date, date: Date): number {
        const startTime = minDate.getTime();
        const dateTime = date.getTime();
        return Math.floor((dateTime - startTime) / (1000 * 60 * 60 * 24));
    }

    formatDate(date: Date): string {
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    }

    formatMonth(date: Date): string {
        return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    }
}