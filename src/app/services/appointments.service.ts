import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';

// Forma UI usada por componentes Angular
export interface Appointment {
  id?: number;
  clientName: string;
  serviceName: string;
  day: number | string;
  monthName: string;
  time: string;
  status: string;
  nota?: string;
  clientEmail?: string;
  staffName?: string;
  created_at?: string;
  updated_at?: string;
  showMenu?: boolean;
}

// Forma esperada por Laravel
interface BackendAppointment {
  id?: number;
  usuarios_id: number;
  negocios_id: number;
  servicios_id: number;
  estados_id: number;
  nota?: string | null;
  fecha: string;     // ISO 8601
  fecha_fin: string; // ISO 8601
  tiempo_estimado?: number | null;
  descripcion_cancel?: string | null;
  user?: { id: number; name?: string; nombre?: string } | null;
  business?: any;
  service?: { id: number; name?: string; nombre?: string } | null;
  status?: { id: number; name?: string; nombre?: string } | null;
}

// Ajusta según tus IDs reales o trae estos catálogos desde API si prefieres
const DEFAULT_USER_ID = 1;
const DEFAULT_BUSINESS_ID = 1;
const SERVICE_NAME_TO_ID: Record<string, number> = {
  manicure: 1,
  pedicure: 2,
  gelish: 3,
  acrilicas: 4,
  pestanas: 5
};
const STATUS_NAME_TO_ID: Record<string, number> = {
  reserved: 1,
  confirmed: 2,
  cancelled: 3
};
const ID_TO_STATUS_NAME: Record<number, string> = {
  1: 'reserved',
  2: 'confirmed',
  3: 'cancelled'
};

function monthNameToNumber(monthName: string): number {
  const months = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
  const idx = months.indexOf(monthName.toUpperCase());
  return idx >= 0 ? idx + 1 : new Date().getMonth() + 1;
}

function composeDateISO(day: number | string, monthName: string, time: string): string {
  const year = new Date().getFullYear();
  const month = monthNameToNumber(monthName);
  const dd = String(day).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  const [hh, min] = time.split(':');
  const hh2 = String(parseInt(hh as string, 10)).padStart(2, '0');
  return `${year}-${mm}-${dd}T${hh2}:${min}:00`;
}

function addMinutesToISO(iso: string, minutes: number): string {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() + minutes);
  const pad = (v: number) => String(v).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

function mapUiToBackend(ui: Appointment): BackendAppointment {
  const fecha = composeDateISO(ui.day, ui.monthName, ui.time);
  const fecha_fin = addMinutesToISO(fecha, 60);
  const servicios_id = SERVICE_NAME_TO_ID[ui.serviceName] || SERVICE_NAME_TO_ID['manicure'] || 1;
  const estados_id = STATUS_NAME_TO_ID[ui.status] || STATUS_NAME_TO_ID['reserved'] || 1;
  return {
    id: ui.id,
    usuarios_id: DEFAULT_USER_ID,
    negocios_id: DEFAULT_BUSINESS_ID,
    servicios_id,
    estados_id,
    nota: ui.nota || null,
    fecha,
    fecha_fin,
    tiempo_estimado: 60,
    descripcion_cancel: null
  };
}

function mapBackendToUi(b: BackendAppointment): Appointment {
  const date = new Date(b.fecha);
  const months = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
  const monthName = months[date.getMonth()];
  const day = date.getDate();
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const status = b.status?.nombre ? b.status.nombre.toLowerCase() : ID_TO_STATUS_NAME[b.estados_id] || 'reserved';
  const userFullName = (b.user && ('nombres' in (b.user as any) || 'apellidos' in (b.user as any)))
    ? `${(b.user as any).nombres ?? ''} ${(b.user as any).apellidos ?? ''}`.trim()
    : (b.user?.name || (b.user as any)?.nombre || '');
  const clientName = userFullName || 'Cliente';
  const serviceName = (b.service?.nombre || b.service?.name || String(b.servicios_id));
  return {
    id: b.id,
    clientName,
    serviceName,
    day,
    monthName,
    time: `${hh}:${mm}`,
    status,
    nota: b.nota || undefined,
    clientEmail: (b.user as any)?.email || undefined
  };
}

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private readonly resource = 'appointments';

  constructor(private api: ApiService) {}

  getAll(): Observable<Appointment[]> {
    return this.api.getAll(this.resource).pipe(
      map((res: any) => {
        const list = Array.isArray(res) ? res : [];
        return list.map((b: BackendAppointment) => mapBackendToUi(b));
      })
    );
  }

  getById(id: number | string): Observable<Appointment> {
    return this.api.getById(this.resource, id).pipe(
      map((b: any) => mapBackendToUi(b as BackendAppointment))
    );
  }

  create(payload: Appointment): Observable<Appointment> {
    const body = mapUiToBackend(payload);
    return this.api.create(this.resource, body).pipe(
      map((b: any) => mapBackendToUi(b as BackendAppointment))
    );
  }

  update(id: number | string, payload: Partial<Appointment>): Observable<Appointment> {
    const merged = { id: Number(id), ...payload } as Appointment;
    const body = mapUiToBackend(merged);
    return this.api.update(this.resource, id, body).pipe(
      map((b: any) => mapBackendToUi(b as BackendAppointment))
    );
  }

  delete(id: number | string): Observable<void> {
    return this.api.delete(this.resource, id) as unknown as Observable<void>;
  }

  changeStatus(id: number | string, status: string): Observable<Appointment> {
    const estados_id = STATUS_NAME_TO_ID[status] || STATUS_NAME_TO_ID['reserved'];
    return this.api.update(this.resource, id, { estados_id }).pipe(
      map((b: any) => mapBackendToUi(b as BackendAppointment))
    );
  }
}
