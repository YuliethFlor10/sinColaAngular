import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface CitaData {
  id: number;
  cliente_nombre: string;
  fecha: string;
  hora: string;
  servicio: string;
  duracion: string;
  profesional: string;
  direccion: string;
  telefono: string;
  observaciones?: string;
  estado: string;
}

interface ApiResponse {
  success: boolean;
  data: CitaData;
  message: string;
}

@Component({
  selector: 'app-confirmar-cita',
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

  // URLs de la API Laravel
  private apiUrl = 'http://localhost:8000/api'; // Ajusta según tu configuración

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Obtener parámetros de la URL
    this.citaId = this.route.snapshot.paramMap.get('id');
    this.token = this.route.snapshot.queryParamMap.get('token');

    if (this.citaId && this.token) {
      this.cargarDatosCita();
    } else {
      this.error = 'Enlace inválido o expirado';
      this.loading = false;
    }

    // Inicializar efectos después de que se carga la vista
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

    this.http.get<ApiResponse>(`${this.apiUrl}/citas/${this.citaId}/confirmar?token=${this.token}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.citaData = response.data;
          } else {
            this.error = response.message || 'Error al cargar los datos de la cita';
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error:', error);
          this.error = 'Error de conexión. Intenta nuevamente.';
          this.loading = false;
        }
      });
  }

  confirmarCita(): void {
    if (!this.citaId || !this.token) return;

    const payload = {
      accion: 'confirmar',
      token: this.token
    };

    this.http.put<ApiResponse>(`${this.apiUrl}/citas/${this.citaId}/estado`, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.mostrarConfirmacion();
          } else {
            this.mostrarNotificacion(response.message || 'Error al confirmar la cita', 'error');
          }
        },
        error: (error) => {
          console.error('Error:', error);
          this.mostrarNotificacion('Error de conexión. Intenta nuevamente.', 'error');
        }
      });
  }

  cancelarCita(): void {
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

    const payload = {
      accion: 'cancelar',
      token: this.token
    };

    this.http.put<ApiResponse>(`${this.apiUrl}/citas/${this.citaId}/estado`, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.cerrarModal();
            this.mostrarNotificacion('Cita cancelada exitosamente', 'success');
            // Actualizar datos para mostrar el nuevo estado
            setTimeout(() => {
              this.cargarDatosCita();
            }, 1000);
          } else {
            this.mostrarNotificacion(response.message || 'Error al cancelar la cita', 'error');
          }
        },
        error: (error) => {
          console.error('Error:', error);
          this.mostrarNotificacion('Error de conexión. Intenta nuevamente.', 'error');
        }
      });
  }

  cerrarModal(): void {
    const modal = document.getElementById('cancelModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  // Métodos para formateo de datos
  formatearFecha(fecha: string): string {
    if (!fecha) return '';

    const fechaObj = new Date(fecha);
    const opciones: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    return fechaObj.toLocaleDateString('es-ES', opciones);
  }

  formatearHora(hora: string): string {
    if (!hora) return '';

    const [horas, minutos] = hora.split(':');
    const horaNum = parseInt(horas);
    const ampm = horaNum >= 12 ? 'PM' : 'AM';
    const hora12 = horaNum % 12 || 12;

    return `${hora12.toString().padStart(2, '0')}:${minutos} ${ampm}`;
  }

  formatearTelefono(numero: string): string {
    if (!numero) return '';

    const numeroLimpio = numero.replace(/\D/g, '');

    if (numeroLimpio.length === 11) {
      return numeroLimpio.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
    }
    return numero;
  }

  // Funciones para redes sociales
  abrirWhatsApp(): void {
    if (this.citaData?.telefono) {
      window.open(`https://wa.me/57${this.citaData.telefono}`, '_blank');
    }
  }

  abrirInstagram(): void {
    this.mostrarNotificacion('Síguenos en Instagram @mknailssalon', 'info');
  }

  abrirFacebook(): void {
    this.mostrarNotificacion('Síguenos en Facebook: MK Nails Salon', 'info');
  }

  // Función para mostrar confirmación exitosa
  private mostrarConfirmacion(): void {
    const overlay = document.createElement('div');
    overlay.className = 'confirmation-overlay';

    const confirmacion = document.createElement('div');
    confirmacion.className = 'confirmation-modal';

    const iconoCheck = document.createElement('div');
    iconoCheck.className = 'check-icon';
    iconoCheck.innerHTML = '✓';

    const titulo = document.createElement('h2');
    titulo.textContent = 'Tu cita fue confirmada exitosamente !';
    titulo.className = 'confirmation-title';

    const mensaje = document.createElement('p');
    mensaje.textContent = 'Recuerda que, si surge algún imprevisto y necesitas cancelar la cita, el enlace permanecerá habilitado para que puedas hacerlo en cualquier momento.';
    mensaje.className = 'confirmation-message';

    const botonAceptar = document.createElement('button');
    botonAceptar.textContent = 'Aceptar';
    botonAceptar.className = 'confirmation-btn';

    const cerrarConfirmacion = () => {
      overlay.classList.add('closing');
      setTimeout(() => {
        document.body.removeChild(overlay);
        // Actualizar datos para mostrar el nuevo estado
        this.cargarDatosCita();
      }, 300);
    };

    botonAceptar.addEventListener('click', cerrarConfirmacion);

    confirmacion.appendChild(iconoCheck);
    confirmacion.appendChild(titulo);
    confirmacion.appendChild(mensaje);
    confirmacion.appendChild(botonAceptar);
    overlay.appendChild(confirmacion);

    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.classList.add('show');
    }, 10);

    // Cerrar con Escape
    const cerrarConEscape = (e: Event) => {
      const keyEvent = e as KeyboardEvent;
      if (keyEvent.key === 'Escape') {
        cerrarConfirmacion();
        document.removeEventListener('keydown', cerrarConEscape);
      }
    };
    document.addEventListener('keydown', cerrarConEscape);

    // Cerrar al hacer click fuera
    overlay.addEventListener('click', (e: Event) => {
      if (e.target === overlay) {
        cerrarConfirmacion();
      }
    });
  }

  // Función para mostrar notificaciones
  private mostrarNotificacion(mensaje: string, tipo: 'success' | 'error' | 'info' = 'info'): void {
    const notificacion = document.createElement('div');
    notificacion.className = `notification notification-${tipo}`;
    notificacion.textContent = mensaje;

    document.body.appendChild(notificacion);

    setTimeout(() => {
      notificacion.classList.add('show');
    }, 100);

    setTimeout(() => {
      notificacion.classList.add('hide');
      setTimeout(() => {
        if (document.body.contains(notificacion)) {
          document.body.removeChild(notificacion);
        }
      }, 300);
    }, 3000);
  }

  // Inicializar efectos visuales
  private inicializarEfectos(): void {
    // Animación del logo
    const logoCircle = document.querySelector('.logo-circle') as HTMLElement;
    if (logoCircle) {
      logoCircle.style.animation = 'pulse 2s infinite';
    }

    // Efectos ripple en botones
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
      button.addEventListener('click', this.crearEfectoRipple);
    });

    // Navegación por teclado
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
    button.style.position = 'relative';
    button.appendChild(ripple);

    setTimeout(() => {
      if (button.contains(ripple)) {
        button.removeChild(ripple);
      }
    }, 600);
  }
}
// Interfaces para tipado
interface NotificacionConfig {
  mensaje: string;
  tipo: 'success' | 'error' | 'info';
}

interface CitaInfo {
  nombre: string;
  fecha: string;
  hora: string;
  servicio: string;
}

// Clase principal para manejar la funcionalidad de confirmar cita
export class ConfirmarCitaService {

  // Funciones para manejar los botones de confirmar y cancelar
  public static confirmarCita(): void {
    this.mostrarConfirmacion();
  }

  public static cancelarCita(): void {
    const modal = document.getElementById('cancelModal') as HTMLElement;
    if (modal) {
      modal.style.display = 'block';
    }
  }

  public static cerrarModal(): void {
    const cancelModal = document.getElementById('cancelModal') as HTMLElement;
    if (cancelModal) {
      cancelModal.style.display = 'none';
    }
  }

  // Cerrar modal al hacer click fuera de él
  public static configurarEventosModal(): void {
    window.onclick = (event: MouseEvent): void => {
      const cancelModal = document.getElementById('cancelModal') as HTMLElement;

      if (event.target === cancelModal) {
        cancelModal.style.display = 'none';
      }
    };
  }

  // Cerrar modal con la tecla Escape
  public static configurarTeclaEscape(): void {
    document.addEventListener('keydown', (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        this.cerrarModal();
      }
    });
  }

  // Animación del logo al cargar la página
  public static inicializarAnimacionLogo(): void {
    window.addEventListener('load', (): void => {
      const logoCircle = document.querySelector('.logo-circle') as HTMLElement;
      if (logoCircle) {
        logoCircle.style.animation = 'pulse 2s infinite';
      }
    });
  }

  // Función para hacer los botones más interactivos
  public static configurarBotonesInteractivos(): void {
    document.addEventListener('DOMContentLoaded', (): void => {
      // Agregar efectos de sonido virtual (feedback visual)
      const buttons = document.querySelectorAll('.btn') as NodeListOf<HTMLElement>;

      buttons.forEach((button: HTMLElement) => {
        button.addEventListener('click', function(this: HTMLElement): void {
          // Crear efecto de "ripple" al hacer click
          const ripple = document.createElement('span') as HTMLSpanElement;
          ripple.style.position = 'absolute';
          ripple.style.borderRadius = '50%';
          ripple.style.background = 'rgba(255, 255, 255, 0.6)';
          ripple.style.transform = 'scale(0)';
          ripple.style.animation = 'ripple 0.6s linear';
          ripple.style.left = '50%';
          ripple.style.top = '50%';
          ripple.style.marginLeft = '-10px';
          ripple.style.marginTop = '-10px';
          ripple.style.width = '20px';
          ripple.style.height = '20px';

          this.style.position = 'relative';
          this.appendChild(ripple);

          setTimeout(() => {
            if (ripple.parentNode) {
              ripple.remove();
            }
          }, 600);
        });
      });

      // Agregar la animación ripple al CSS dinámicamente
      this.agregarEstilosRipple();
    });
  }

  // Agregar estilos CSS dinámicamente
  private static agregarEstilosRipple(): void {
    const style = document.createElement('style') as HTMLStyleElement;
    style.textContent = `
      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Función para validar y formatear el número de teléfono
  public static formatearTelefono(numero: string): string {
    if (!numero) return '';

    // Remover todos los caracteres no numéricos
    const numeroLimpio = numero.replace(/\D/g, '');

    // Formatear como teléfono colombiano
    if (numeroLimpio.length === 11) {
      return numeroLimpio.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
    }
    return numero;
  }

  // Aplicar formato al número de teléfono cuando la página carga
  public static configurarFormatoTelefono(): void {
    document.addEventListener('DOMContentLoaded', (): void => {
      const telefonoElement = document.querySelector('.info-item:nth-child(8) .info-value') as HTMLElement;
      if (telefonoElement) {
        const numeroOriginal = telefonoElement.textContent || '';
        telefonoElement.textContent = this.formatearTelefono(numeroOriginal);
      }
    });
  }

  // Función para agregar funcionalidad a los iconos sociales
  public static configurarIconosSociales(): void {
    document.addEventListener('DOMContentLoaded', (): void => {
      const socialIcons = document.querySelectorAll('.social-icon') as NodeListOf<HTMLElement>;

      socialIcons.forEach((icon: HTMLElement) => {
        icon.addEventListener('click', (e: MouseEvent): void => {
          e.preventDefault();

          if (icon.classList.contains('whatsapp')) {
            // Abrir WhatsApp con número del salón
            window.open('https://wa.me/5732147823682', '_blank');
          } else if (icon.classList.contains('instagram')) {
            // Mostrar mensaje de Instagram
            this.mostrarNotificacion('Síguenos en Instagram @mknailssalon', 'info');
          } else if (icon.classList.contains('facebook')) {
            // Mostrar mensaje de Facebook
            this.mostrarNotificacion('Síguenos en Facebook: MK Nails Salon', 'info');
          }
        });
      });
    });
  }

  // Función para hacer la página más accesible
  public static configurarAccesibilidad(): void {
    document.addEventListener('DOMContentLoaded', (): void => {
      // Agregar navegación por teclado para los botones
      const botones = document.querySelectorAll('.btn, .modal-btn') as NodeListOf<HTMLElement>;

      botones.forEach((boton: HTMLElement) => {
        boton.addEventListener('keydown', (e: KeyboardEvent): void => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            boton.click();
          }
        });
      });

      // Hacer que los modales sean accesibles
      const modales = document.querySelectorAll('.modal') as NodeListOf<HTMLElement>;
      modales.forEach((modal: HTMLElement) => {
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
      });
    });
  }

  // Función para mostrar notificaciones toast
  public static mostrarNotificacion(mensaje: string, tipo: 'success' | 'error' | 'info' = 'info'): void {
    const notificacion = document.createElement('div') as HTMLDivElement;

    const colores: Record<'success' | 'error' | 'info', string> = {
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

    // Animar entrada
    setTimeout(() => {
      notificacion.style.transform = 'translateX(0)';
    }, 100);

    // Remover después de 3 segundos
    setTimeout(() => {
      notificacion.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (document.body.contains(notificacion)) {
          document.body.removeChild(notificacion);
        }
      }, 300);
    }, 3000);
  }

  // Función para mostrar la confirmación como en la imagen
  public static mostrarConfirmacion(): void {
    // Crear overlay
    const overlay = document.createElement('div') as HTMLDivElement;
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

    // Crear contenedor de confirmación
    const confirmacion = document.createElement('div') as HTMLDivElement;
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

    // Crear icono de check verde
    const iconoCheck = document.createElement('div') as HTMLDivElement;
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

    // Crear título
    const titulo = document.createElement('h2') as HTMLHeadingElement;
    titulo.style.cssText = `
      color: #4CAF50;
      font-size: 1.8em;
      margin-bottom: 20px;
      font-weight: bold;
    `;
    titulo.textContent = 'Tu cita fue confirmada exitosamente !';

    // Crear mensaje
    const mensaje = document.createElement('p') as HTMLParagraphElement;
    mensaje.style.cssText = `
      color: #333;
      font-size: 1.1em;
      line-height: 1.5;
      margin-bottom: 30px;
    `;
    mensaje.textContent = 'Recuerda que, si surge algún imprevisto y necesitas cancelar la cita, el enlace permanecerá habilitado para que puedas hacerlo en cualquier momento.';

    // Crear botón Aceptar
    const botonAceptar = document.createElement('button') as HTMLButtonElement;
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

    // Función para cerrar la confirmación
    const cerrarConfirmacion = (): void => {
      overlay.style.opacity = '0';
      confirmacion.style.transform = 'scale(0.8)';
      setTimeout(() => {
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay);
        }
      }, 300);
    };

    // Efectos hover para el botón
    botonAceptar.addEventListener('mouseenter', (): void => {
      botonAceptar.style.background = '#ff1493';
      botonAceptar.style.transform = 'translateY(-2px)';
      botonAceptar.style.boxShadow = '0 5px 15px rgba(255, 20, 147, 0.4)';
    });

    botonAceptar.addEventListener('mouseleave', (): void => {
      botonAceptar.style.background = '#ff69b4';
      botonAceptar.style.transform = 'translateY(0)';
      botonAceptar.style.boxShadow = 'none';
    });

    botonAceptar.addEventListener('click', cerrarConfirmacion);

    // Ensamblar elementos
    confirmacion.appendChild(iconoCheck);
    confirmacion.appendChild(titulo);
    confirmacion.appendChild(mensaje);
    confirmacion.appendChild(botonAceptar);
    overlay.appendChild(confirmacion);

    // Agregar al body
    document.body.appendChild(overlay);

    // Animar entrada
    setTimeout(() => {
      overlay.style.opacity = '1';
      confirmacion.style.transform = 'scale(1)';
    }, 10);

    // Cerrar con Escape
    const cerrarConEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        cerrarConfirmacion();
        document.removeEventListener('keydown', cerrarConEscape);
      }
    };
    document.addEventListener('keydown', cerrarConEscape);

    // Cerrar al hacer click fuera
    overlay.addEventListener('click', (e: MouseEvent): void => {
      if (e.target === overlay) {
        cerrarConfirmacion();
      }
    });
  }

  // Método para inicializar todas las funcionalidades
  public static inicializar(): void {
    this.configurarEventosModal();
    this.configurarTeclaEscape();
    this.inicializarAnimacionLogo();
    this.configurarBotonesInteractivos();
    this.configurarFormatoTelefono();
    this.configurarIconosSociales();
    this.configurarAccesibilidad();
  }
}

// Funciones globales para compatibilidad (si es necesario)
declare global {
  interface Window {
    confirmarCita: () => void;
    cancelarCita: () => void;
    cerrarModal: () => void;
    mostrarNotificacion: (mensaje: string, tipo?: 'success' | 'error' | 'info') => void;
  }
}

// Exportar funciones para uso global si es necesario
window.confirmarCita = ConfirmarCitaService.confirmarCita.bind(ConfirmarCitaService);
window.cancelarCita = ConfirmarCitaService.cancelarCita.bind(ConfirmarCitaService);
window.cerrarModal = ConfirmarCitaService.cerrarModal.bind(ConfirmarCitaService);
window.mostrarNotificacion = ConfirmarCitaService.mostrarNotificacion.bind(ConfirmarCitaService);

// Inicializar automáticamente cuando se carga el módulo
ConfirmarCitaService.inicializar();
