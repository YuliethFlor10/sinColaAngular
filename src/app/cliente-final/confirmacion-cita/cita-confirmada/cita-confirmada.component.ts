import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface CitaData {
  id: number;
  cliente_nombre: string;
  cliente_email: string;
  cliente_telefono?: string;
  tipo_servicio: string;
  personal_asignado?: string;
  fecha: string;
  tiempo_estimado?: number;
  direccion?: string;
  nota?: string;
  estado: string;
  negocio_nombre?: string;
  negocio_telefono?: string;
}

@Component({
  selector: 'app-cita-confirmada',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cita-confirmada.component.html',
  styleUrls: ['./cita-confirmada.component.css']
})
export class CitaConfirmadaComponent implements OnInit {
  loading: boolean = false; // ⚡ Cambiado a false para evitar spinner innecesario
  error: string = '';
  citaData: CitaData | null = null;
  confirmacionExitosa: boolean = false;
  alreadyConfirmed: boolean = false;

  private apiUrl = 'http://127.0.0.1:8000/api';
  private token: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    console.log('🚀 CitaConfirmadaComponent inicializado');

    // Obtener token y ID de la cita desde la URL
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      const citaId = params['id'] || '';

      console.log('📋 Parámetros recibidos:', {
        token: this.token ? '✅ Presente' : '❌ Ausente',
        citaId: citaId || '❌ Ausente'
      });

      // ✅ SI NO HAY PARÁMETROS, NO HACER NADA (no mostrar error)
      if (!this.token || !citaId) {
        console.log('⚠️ Accediendo sin parámetros - esperando enlace válido');
        this.error = 'Por favor, utiliza el enlace de confirmación que recibiste en tu correo electrónico.';
        this.loading = false;
        return;
      }

      // ✅ SI HAY PARÁMETROS, PROCESAR LA CONFIRMACIÓN
      this.loading = true;
      this.confirmarCita(citaId);
    });
  }

  /**
   * 🔥 CONFIRMAR LA CITA
   */
  private confirmarCita(citaId: string): void {
    console.log(`✅ Confirmando cita ID: ${citaId}`);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    // Endpoint para confirmar cita con token
    const url = `${this.apiUrl}/appointments/${citaId}/confirm?token=${this.token}`;

    this.http.post(url, {}, { headers }).subscribe({
      next: (response: any) => {
        console.log('✅ Respuesta del servidor:', response);

        this.citaData = this.mapearDatosCita(response.data || response);
        this.loading = false;

        // Verificar si ya estaba confirmada
        if (response.message?.includes('ya había sido confirmada') ||
            response.message?.includes('already confirmed')) {
          this.alreadyConfirmed = true;
          this.confirmacionExitosa = false;
        } else {
          this.confirmacionExitosa = true;
          this.alreadyConfirmed = false;
        }
      },
      error: (error) => {
        console.error('❌ Error al confirmar cita:', error);
        this.loading = false;

        if (error.status === 404) {
          this.error = 'Cita no encontrada. El enlace puede haber expirado.';
        } else if (error.status === 400 || error.status === 403) {
          this.error = 'El enlace de confirmación no es válido o ha expirado. Por favor, solicita un nuevo enlace.';
        } else if (error.error?.message) {
          this.error = error.error.message;
        } else {
          this.error = 'No se pudo confirmar la cita. Por favor, intenta nuevamente o contacta soporte.';
        }
      }
    });
  }

  /**
   * 📋 MAPEAR DATOS DE LA CITA
   */
  private mapearDatosCita(data: any): CitaData {
    return {
      id: data.id,
      cliente_nombre: data.client?.nombre_completo || data.cliente_nombre || 'Cliente',
      cliente_email: data.client?.email || data.cliente_email || '',
      cliente_telefono: data.client?.telefono || data.cliente_telefono,
      tipo_servicio: data.service?.nombre || data.tipo_servicio || 'Servicio',
      personal_asignado: data.staff?.nombre_completo || data.personal_asignado,
      fecha: data.fecha_hora || data.fecha,
      tiempo_estimado: data.service?.tiempo_estimado || data.tiempo_estimado,
      direccion: data.business?.direccion || data.direccion,
      nota: data.observaciones || data.nota,
      estado: data.status?.nombre || data.estado || 'confirmada',
      negocio_nombre: data.business?.nombre,
      negocio_telefono: data.business?.telefono
    };
  }

  /**
   * 📅 FORMATEAR FECHA
   */
  formatearFecha(fecha: string): string {
    if (!fecha) return 'Fecha no disponible';

    try {
      const date = new Date(fecha);
      const opciones: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      };

      return date.toLocaleDateString('es-ES', opciones);
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return fecha;
    }
  }

  /**
   * 🏠 VOLVER AL INICIO
   */
  volverAlInicio(): void {
    console.log('🏠 Redirigiendo al inicio...');
    window.location.href = '/';
  }

  /**
   * 💬 CONTACTAR SOPORTE VÍA WHATSAPP
   */
  contactarSoporte(): void {
    console.log('💬 Abriendo WhatsApp...');

    const telefono = this.citaData?.negocio_telefono || '573001234567'; // Número por defecto
    const mensaje = `Hola, tengo una consulta sobre mi cita confirmada (ID: ${this.citaData?.id || 'N/A'})`;
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;

    window.open(url, '_blank');
  }
}
