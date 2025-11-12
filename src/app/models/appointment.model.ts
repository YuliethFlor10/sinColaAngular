export interface Appointment {
  id?: number;

  // Datos cliente
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientDocType?: string;
  clientDocNumber?: string;
  clientBirthDate?: string;

  // Datos cita
  serviceName: string;
  staffName?: string;
  nota?: string;

  // Fecha y hora
  day: number;
  monthName: string;
  time: string;

  // Estado
  status: 'reserved' | 'confirmed' | 'cancelled';

  // Campos adicionales de tu backend Laravel
  tipo_documento?: string;
  numero_documento?: string;
  email?: string;
  fecha_nacimiento?: string;
  numero_telefono?: string;
  personal_servicio?: string;
  negocios_id?: number;

  // Extra para frontend (mostrar menú contextual)
  showMenu?: boolean;
}
