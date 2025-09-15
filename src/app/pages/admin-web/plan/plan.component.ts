import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdminWeb } from "../admin-web";

export interface Plan {
  id: number;
  nombre: string;
  tipo: 'esencial' | 'avanzado' | 'ilimitado';
  precio: number;
  notificaciones: number; // -1 para ilimitado
  caracteristicas: string[];
  fechaInicio?: Date;
  fechaFin?: Date;
  notificacionesUsadas?: number;
  totalNotificaciones?: number;
  notificacionesRestantes?: number;
}

@Component({
  selector: 'app-plan',
  standalone: true,
  imports: [CommonModule, AdminWeb],
  templateUrl: './plan.component.html',
  styleUrls: ['./plan.component.css'],

})
export class PlanComponent implements OnInit {

  // Datos del plan actual
  planActual: Plan = {
    id: 2,
    nombre: 'Plan Avanzado',
    tipo: 'avanzado',
    precio: 35000,
    notificaciones: 500,
    caracteristicas: [
      'Recordatorio + confirmación',
      'Reprogramación automática',
      'Branding personalizado'
    ],
    fechaInicio: new Date('2025-06-10'),
    fechaFin: new Date('2025-07-10'),
    notificacionesUsadas: 200,
    totalNotificaciones: 500,
    notificacionesRestantes: 300
  };

  // Otros planes disponibles
  otrosPlanes: Plan[] = [
    {
      id: 1,
      nombre: 'Plan Esencial',
      tipo: 'esencial',
      precio: 30000,
      notificaciones: 150,
      caracteristicas: [
        'Funciones básicas',
        'Automatizaciones',
        'Soporte estándar'
      ]
    },
    {
      id: 3,
      nombre: 'Plan Ilimitado',
      tipo: 'ilimitado',
      precio: 70000,
      notificaciones: -1,
      caracteristicas: [
        'Todas las funciones',
        'Estadísticas',
        'Branding avanzado'
      ]
    }
  ];

  // Estado del componente
  cargandoCambioPlan: number | null = null;
  mensaje: string = '';
  tipoMensaje: 'success' | 'error' = 'success';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.calcularNotificacionesRestantes();
    console.log('Componente Plan inicializado');
  }

  /**
   * Calcula las notificaciones restantes del plan actual
   */
  private calcularNotificacionesRestantes(): void {
    if (this.planActual.totalNotificaciones && this.planActual.notificacionesUsadas !== undefined) {
      this.planActual.notificacionesRestantes =
        this.planActual.totalNotificaciones - this.planActual.notificacionesUsadas;
    }
  }

  /**
   * Obtiene la clase CSS para la tarjeta del plan
   */
  getPlanCardClass(tipo: string): string {
    return `lp-plan-${tipo}`;
  }

  /**
   * Obtiene la clase CSS para el header del plan
   */
  getPlanHeaderClass(tipo: string): string {
    return `lp-plan-header-${tipo}`;
  }

  /**
   * TrackBy function para optimizar el renderizado del ngFor
   */
  trackByPlanId(index: number, plan: Plan): number {
    return plan.id;
  }

  /**
   * Maneja el cambio de plan
   */
  async cambiarPlan(planSeleccionado: Plan): Promise<void> {
    try {
      this.cargandoCambioPlan = planSeleccionado.id;
      this.limpiarMensaje();

      console.log(`Cambiando al plan: ${planSeleccionado.nombre}`);

      // Simular llamada a API
      await this.simularCambioPlan(planSeleccionado);

      // Actualizar plan actual
      this.actualizarPlanActual(planSeleccionado);

      this.mostrarMensaje(
        `Plan cambiado exitosamente a ${planSeleccionado.nombre}`,
        'success'
      );

    } catch (error) {
      console.error('Error al cambiar plan:', error);
      this.mostrarMensaje('Error al cambiar el plan. Inténtalo nuevamente.', 'error');
    } finally {
      this.cargandoCambioPlan = null;
    }
  }

  /**
   * Simula la llamada a la API para cambiar plan
   */
  private simularCambioPlan(plan: Plan): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simular posible error (5% de probabilidad)
        if (Math.random() < 0.05) {
          reject(new Error('Error de conectividad'));
        } else {
          resolve();
        }
      }, 2000); // Simular delay de red
    });
  }

  /**
   * Actualiza el plan actual con los datos del nuevo plan
   */
  private actualizarPlanActual(nuevoPlan: Plan): void {
    const fechaInicio = new Date();
    const fechaFin = new Date();
    fechaFin.setMonth(fechaFin.getMonth() + 1); // Un mes después

    this.planActual = {
      ...nuevoPlan,
      fechaInicio,
      fechaFin,
      notificacionesUsadas: 0,
      totalNotificaciones: nuevoPlan.notificaciones === -1 ? undefined : nuevoPlan.notificaciones,
      notificacionesRestantes: nuevoPlan.notificaciones === -1 ? undefined : nuevoPlan.notificaciones
    };

    // Remover el plan seleccionado de otros planes y agregar el anterior
    this.reorganizarPlanes(nuevoPlan.id);
  }

  /**
   * Reorganiza los planes disponibles
   */
  private reorganizarPlanes(nuevoId: number): void {
    const planAnterior = { ...this.planActual };

    // Crear nuevo plan para la lista "otros planes" basado en el anterior
    const planParaOtros: Plan = {
      id: planAnterior.id,
      nombre: planAnterior.nombre,
      tipo: planAnterior.tipo,
      precio: planAnterior.precio,
      notificaciones: planAnterior.notificaciones,
      caracteristicas: planAnterior.caracteristicas
    };

    // Remover el nuevo plan actual de otros planes
    this.otrosPlanes = this.otrosPlanes.filter(plan => plan.id !== nuevoId);

    // Agregar el plan anterior a otros planes si no es el mismo
    if (planAnterior.id !== nuevoId) {
      this.otrosPlanes.push(planParaOtros);
    }

    // Ordenar por precio
    this.otrosPlanes.sort((a, b) => a.precio - b.precio);
  }

  /**
   * Muestra un mensaje temporal
   */
  private mostrarMensaje(texto: string, tipo: 'success' | 'error'): void {
    this.mensaje = texto;
    this.tipoMensaje = tipo;

    // Limpiar mensaje después de 5 segundos
    setTimeout(() => {
      this.limpiarMensaje();
    }, 5000);
  }

  /**
   * Limpia el mensaje actual
   */
  private limpiarMensaje(): void {
    this.mensaje = '';
  }

  /**
   * Navega a la página de gestión de facturación (opcional)
   */
  verFacturacion(): void {
    // Implementar según tu estructura de rutas
    this.router.navigate(['/facturacion']);
  }

  /**
   * Descarga la factura actual (opcional)
   */
  descargarFactura(): void {
    // Implementar descarga de factura
    console.log('Descargando factura del plan actual...');
    this.mostrarMensaje('Descarga iniciada', 'success');
  }

  /**
   * Obtiene el progreso de uso de notificaciones como porcentaje
   */
  get progresoNotificaciones(): number {
    if (!this.planActual.totalNotificaciones || this.planActual.notificacionesUsadas === undefined) {
      return 0;
    }
    return (this.planActual.notificacionesUsadas / this.planActual.totalNotificaciones) * 100;
  }

  /**
   * Determina si el plan actual está próximo a vencer
   */
  get planProximoAVencer(): boolean {
    if (!this.planActual.fechaFin) return false;

    const hoy = new Date();
    const diferenciaDias = Math.ceil(
      (this.planActual.fechaFin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
    );

    return diferenciaDias <= 7; // Próximo a vencer si faltan 7 días o menos
  }
}