import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface CitaData {
  id: number;
  cliente_nombre: string;
  cliente_email: string;
  cliente_telefono: string;
  fecha: string;
  hora: string;
  servicio: string;
  duracion: string;
  precio: string;
  recomendaciones?: string;
  negocio_nombre: string;
  direccion: string;
  telefono: string;
  estado: string;
  observaciones?: string;
  puede_cancelar: boolean;
  puede_confirmar: boolean;
}

interface ApiResponse {
  success?: boolean;
  message?: string;
  data?: CitaData;
  id?: number;
  cliente_nombre?: string;
  cliente_email?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-confirmar-cita',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmar-cita.component.html',
  styleUrls: ['./confirmar-cita.component.css']
})
export class ConfirmarCitaComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  citaData: CitaData | null = null;
  loading = true;
  error = '';
  citaId: string | null = null;
  token: string | null = null;

  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.citaId = this.route.snapshot.paramMap.get('id');
    this.token = this.route.snapshot.queryParamMap.get('token');

    console.log('🔍 Parámetros recibidos:', { citaId: this.citaId, token: this.token });

    if (this.citaId && this.token) {
      this.cargarDatosCita();
    } else {
      this.error = 'Enlace inválido o expirado. Verifica el enlace recibido.';
      this.loading = false;
    }

    setTimeout(() => {
      this.inicializarEfectos();
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarDatosCita(): void {
    this.loading = true;
    this.error = '';

    console.log('📡 Llamando a la API:', `${this.apiUrl}/citas/${this.citaId}/confirmar?token=${this.token}`);

    this.http.get<ApiResponse>(`${this.apiUrl}/citas/${this.citaId}/confirmar?token=${this.token}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Respuesta de la API:', response);

          if (response.data) {
            this.citaData = response.data;
            console.log('📋 Datos cargados desde response.data:', this.citaData);
          } else if (response.id) {
            this.citaData = response as any as CitaData;
            console.log('📋 Datos cargados directamente desde root:', this.citaData);
          } else if (response.success === false) {
            this.error = response.message || 'Error al cargar los datos de la cita';
            console.error('❌ Error de la API:', this.error);
          } else {
            this.error = 'Formato de respuesta inesperado';
            console.error('❌ Respuesta sin formato esperado:', response);
          }

          this.loading = false;
          this.cdr.detectChanges();
          console.log('🔄 Vista actualizada. Loading:', this.loading, 'citaData:', this.citaData);
        },
        error: (error) => {
          console.error('❌ Error al cargar cita:', error);

          if (error.status === 0) {
            this.error = 'No se puede conectar con el servidor. Verifica que Laravel esté ejecutándose en http://localhost:8000';
          } else if (error.status === 404) {
            this.error = 'Cita no encontrada. El enlace puede haber expirado.';
          } else if (error.status === 401) {
            this.error = 'Token inválido o expirado. Solicita un nuevo enlace de confirmación.';
          } else {
            this.error = error.error?.message || 'Error de conexión. Intenta nuevamente.';
          }

          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  confirmarCita(): void {
    if (!this.citaId || !this.token || !this.citaData) return;

    if (!this.citaData.puede_confirmar) {
      this.mostrarNotificacion('Esta cita ya ha sido confirmada o no puede ser confirmada', 'error');
      return;
    }

    console.log('✅ Confirmando cita...');

    const payload = {
      accion: 'confirmar',
      token: this.token
    };

    this.http.put<ApiResponse>(`${this.apiUrl}/citas/${this.citaId}/estado`, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Cita confirmada:', response);

          if (response.success) {
            this.mostrarConfirmacion();
            setTimeout(() => {
              this.cargarDatosCita();
            }, 1000);
          } else {
            this.mostrarNotificacion(response.message || 'Error al confirmar la cita', 'error');
          }
        },
        error: (error) => {
          console.error('❌ Error al confirmar:', error);
          this.mostrarNotificacion(
            error.error?.message || 'Error de conexión. Intenta nuevamente.',
            'error'
          );
        }
      });
  }

  cancelarCita(): void {
    if (!this.citaData) return;

    if (!this.citaData.puede_cancelar) {
      this.mostrarNotificacion('Esta cita no puede ser cancelada', 'error');
      return;
    }

    this.mostrarModalCancelar();
  }

  private mostrarModalCancelar(): void {
    const modal = document.getElementById('cancelModal');
    if (modal) {
      modal.style.display = 'block';
    }
  }

  confirmarCancelacion(): void {
    if (!this.citaId || !this.token) return;

    console.log('❌ Cancelando cita...');

    const payload = {
      accion: 'cancelar',
      token: this.token,
      descripcion_cancel: 'Cancelada por el cliente desde el enlace de confirmación'
    };

    this.http.put<ApiResponse>(`${this.apiUrl}/citas/${this.citaId}/estado`, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Cita cancelada:', response);

          if (response.success) {
            this.cerrarModal();
            this.mostrarNotificacion('Cita cancelada exitosamente', 'success');
            setTimeout(() => {
              this.cargarDatosCita();
            }, 1000);
          } else {
            this.mostrarNotificacion(response.message || 'Error al cancelar la cita', 'error');
          }
        },
        error: (error) => {
          console.error('❌ Error al cancelar:', error);
          this.mostrarNotificacion(
            error.error?.message || 'Error de conexión. Intenta nuevamente.',
            'error'
          );
        }
      });
  }

  cerrarModal(): void {
    const modal = document.getElementById('cancelModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  abrirWhatsApp(): void {
    if (this.citaData?.telefono) {
      const numero = this.citaData.telefono.replace(/\D/g, '');
      window.open(`https://wa.me/57${numero}`, '_blank');
    }
  }

  abrirInstagram(): void {
    this.mostrarNotificacion('Síguenos en Instagram @mknailssalon', 'info');
  }

  abrirFacebook(): void {
    this.mostrarNotificacion('Síguenos en Facebook: MK Nails Salon', 'info');
  }

  private mostrarConfirmacion(): void {
    const overlay = document.createElement('div');
    overlay.className = 'confirmation-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    const confirmacion = document.createElement('div');
    confirmacion.className = 'confirmation-modal';
    confirmacion.style.cssText = `
      background: white;
      padding: 40px;
      border-radius: 15px;
      text-align: center;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      transform: scale(0.8);
      transition: transform 0.3s ease;
    `;

    const iconoCheck = document.createElement('div');
    iconoCheck.style.cssText = `
      width: 80px;
      height: 80px;
      background: #4CAF50;
      border-radius: 50%;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 40px;
      font-weight: bold;
    `;
    iconoCheck.innerHTML = '✓';

    const titulo = document.createElement('h2');
    titulo.style.cssText = `
      color: #4CAF50;
      font-size: 1.8em;
      margin-bottom: 20px;
      font-weight: bold;
    `;
    titulo.textContent = '¡Tu cita fue confirmada exitosamente!';

    const mensaje = document.createElement('p');
    mensaje.style.cssText = `
      color: #333;
      font-size: 1.1em;
      line-height: 1.5;
      margin-bottom: 30px;
    `;
    mensaje.textContent = 'Recuerda que, si surge algún imprevisto y necesitas cancelar la cita, el enlace permanecerá habilitado para que puedas hacerlo en cualquier momento.';

    const botonAceptar = document.createElement('button');
    botonAceptar.style.cssText = `
      background: #ff69b4;
      color: white;
      border: none;
      padding: 12px 40px;
      border-radius: 25px;
      font-size: 1.1em;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
    `;
    botonAceptar.textContent = 'Aceptar';

    const cerrarConfirmacion = () => {
      overlay.style.opacity = '0';
      confirmacion.style.transform = 'scale(0.8)';
      setTimeout(() => {
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay);
        }
      }, 300);
    };

    botonAceptar.addEventListener('mouseenter', () => {
      botonAceptar.style.background = '#ff1493';
      botonAceptar.style.transform = 'translateY(-2px)';
      botonAceptar.style.boxShadow = '0 5px 15px rgba(255, 20, 147, 0.4)';
    });

    botonAceptar.addEventListener('mouseleave', () => {
      botonAceptar.style.background = '#ff69b4';
      botonAceptar.style.transform = 'translateY(0)';
      botonAceptar.style.boxShadow = 'none';
    });

    botonAceptar.addEventListener('click', cerrarConfirmacion);

    confirmacion.appendChild(iconoCheck);
    confirmacion.appendChild(titulo);
    confirmacion.appendChild(mensaje);
    confirmacion.appendChild(botonAceptar);
    overlay.appendChild(confirmacion);

    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.style.opacity = '1';
      confirmacion.style.transform = 'scale(1)';
    }, 10);

    const cerrarConEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cerrarConfirmacion();
        document.removeEventListener('keydown', cerrarConEscape);
      }
    };
    document.addEventListener('keydown', cerrarConEscape);

    overlay.addEventListener('click', (e: MouseEvent) => {
      if (e.target === overlay) {
        cerrarConfirmacion();
      }
    });
  }

  private mostrarNotificacion(mensaje: string, tipo: 'success' | 'error' | 'info' = 'info'): void {
    const existingToast = document.querySelector('.notification');
    if (existingToast) {
      existingToast.remove();
    }

    const notificacion = document.createElement('div');
    notificacion.className = 'notification';

    const colores = {
      'success': '#4CAF50',
      'error': '#f44336',
      'info': '#2196F3'
    };

    notificacion.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      background: ${colores[tipo]};
      color: white;
      border-radius: 5px;
      z-index: 10000;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      transform: translateX(100%);
      transition: transform 0.3s ease;
      max-width: 300px;
    `;
    notificacion.textContent = mensaje;

    document.body.appendChild(notificacion);

    setTimeout(() => {
      notificacion.style.transform = 'translateX(0)';
    }, 100);

    setTimeout(() => {
      notificacion.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (document.body.contains(notificacion)) {
          document.body.removeChild(notificacion);
        }
      }, 300);
    }, 3000);
  }

  private inicializarEfectos(): void {
    const logoCircle = document.querySelector('.logo-circle') as HTMLElement;
    if (logoCircle) {
      logoCircle.style.animation = 'pulse 2s infinite';
    }

    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
      button.addEventListener('click', this.crearEfectoRipple);
    });

    const botones = document.querySelectorAll('.btn, .modal-btn');
    botones.forEach(boton => {
      boton.addEventListener('keydown', (e: Event) => {
        const keyEvent = e as KeyboardEvent;
        if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
          keyEvent.preventDefault();
          (boton as HTMLElement).click();
        }
      });
    });
  }

  private crearEfectoRipple(event: Event): void {
    const button = event.currentTarget as HTMLElement;
    const ripple = document.createElement('span');

    ripple.className = 'ripple-effect';
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.6);
      transform: scale(0);
      animation: ripple 0.6s linear;
      left: 50%;
      top: 50%;
      margin-left: -10px;
      margin-top: -10px;
      width: 20px;
      height: 20px;
    `;

    button.style.position = 'relative';
    button.appendChild(ripple);

    setTimeout(() => {
      if (button.contains(ripple)) {
        button.removeChild(ripple);
      }
    }, 600);
  }
}
