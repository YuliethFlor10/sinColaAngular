import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

interface CitaDetalle {
  id: number;
  cliente_nombre: string;
  cliente_email: string;
  tipo_servicio: string;
  fecha: string;
  estado: string;
  personal_asignado?: string;
  tiempo_estimado?: number;
  nota?: string;
  cliente_telefono?: string;
  direccion?: string;
}

@Component({
  selector: 'app-cita-confirmada',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cita-confirmada.component.html',
  styleUrls: ['./cita-confirmada.component.css']
})
export class CitaConfirmadaComponent implements OnInit {
  loading = true;
  success = false;
  error = false;
  errorMessage = '';
  citaData: CitaDetalle | null = null;
  citaId: string | null = null;

  // 🔥 Propiedades que usa el HTML
  alreadyConfirmed = false;
  confirmacionExitosa = false;

  // 🔥 URL de tu API Laravel
  private apiUrl = 'http://localhost:8000/api/appointments';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // 🔥 Obtener ID desde la ruta /cliente-final/cita-confirmada/:id
    this.citaId = this.route.snapshot.paramMap.get('id');

    // 🔥 Verificar si viene el parámetro status=already
    const status = this.route.snapshot.queryParamMap.get('status');
    if (status === 'already') {
      this.alreadyConfirmed = true;
    }

    console.log('✅ Componente cita-confirmada cargado');
    console.log('📋 ID de cita:', this.citaId);
    console.log('📋 Status:', status);

    if (!this.citaId) {
      this.error = true;
      this.errorMessage = 'ID de cita no válido';
      this.loading = false;
      return;
    }

    // Obtener los detalles de la cita
    this.obtenerDatosCita();
  }

  obtenerDatosCita(): void {
    console.log(`📡 GET ${this.apiUrl}/${this.citaId}`);

    this.http.get<any>(`${this.apiUrl}/${this.citaId}`).subscribe({
      next: (data) => {
        console.log('✅ Datos recibidos:', data);
        console.log('🔍 Estado recibido:', data.estados_id, data.estado);

        // Mapear datos del backend al frontend
        this.citaData = {
          id: data.id,
          cliente_nombre: data.cliente_nombre || data.nombre,
          cliente_email: data.cliente_email || data.email,
          tipo_servicio: data.tipo_servicio || data.tipo_cita,
          fecha: data.fecha || data.fecha_cita,
          estado: this.mapEstado(data.estados_id || data.estado),
          personal_asignado: data.personal_asignado || data.personal_servicio,
          tiempo_estimado: data.tiempo_estimado,
          nota: data.nota,
          cliente_telefono: data.cliente_telefono || data.numero_telefono,
          direccion: data.direccion
        };

        console.log('✅ Estado mapeado:', this.citaData.estado);

        // 🔥 Si no venía el parámetro status=already, marcar como exitosa
        if (!this.alreadyConfirmed) {
          this.confirmacionExitosa = true;
        }

        this.success = true;
        this.error = false;
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error:', err);
        this.error = true;
        this.loading = false;

        if (err.status === 0) {
          this.errorMessage = 'No se puede conectar con el servidor';
        } else if (err.status === 404) {
          this.errorMessage = 'Cita no encontrada';
        } else {
          this.errorMessage = err.error?.message || 'Error al cargar la cita';
        }
      }
    });
  }

  // Mapear el estados_id del backend a texto
  private mapEstado(estadoId: number | string): string {
    if (typeof estadoId === 'string') return estadoId;

    const estados: { [key: number]: string } = {
      1: 'reservada',
      2: 'confirmada',
      3: 'cancelada',
      4: 'completada'
    };
    return estados[estadoId] || 'reservada';
  }

  volverAlInicio(): void {
    this.router.navigate(['/cliente-final/personalizacion']);
  }

  contactarSoporte(): void {
    // 🔥 Cambia este número por el de tu negocio
    window.open('https://wa.me/573214782368', '_blank');
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'Fecha no disponible';

    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return fecha;
    }
  }
}
