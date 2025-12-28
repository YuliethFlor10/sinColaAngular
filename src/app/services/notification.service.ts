import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor() {
    this.initNotifications();
  }

  async initNotifications() {
    try {
      // Solicitar permisos
      const permission = await LocalNotifications.requestPermissions();
      if (permission.display === 'granted') {
        console.log('✅ Permisos de notificaciones concedidos');
      } else {
        console.warn('⚠️ Permisos de notificaciones denegados');
      }
    } catch (error) {
      console.error('❌ Error solicitando permisos:', error);
    }
  }

  // Notificación inmediata
  async mostrarNotificacion(titulo: string, mensaje: string, id?: number) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: titulo,
            body: mensaje,
            id: id || Math.floor(Math.random() * 100000),
            schedule: { at: new Date(Date.now() + 1000) }, // 1 segundo después
            sound: undefined,
            attachments: undefined,
            actionTypeId: '',
            extra: null,
            smallIcon: 'ic_stat_icon_config_sample', // 🔥 Icono añadido
            iconColor: '#FF5722' // 🔥 Color del icono
          }
        ]
      });
      console.log('📬 Notificación mostrada:', titulo);
    } catch (error) {
      console.error('❌ Error mostrando notificación:', error);
    }
  }

  // Notificación programada para citas
  async notificarCita(titulo: string, mensaje: string, fechaCita: Date) {
    try {
      const notificationId = Math.floor(Math.random() * 100000);

      await LocalNotifications.schedule({
        notifications: [
          {
            title: titulo,
            body: mensaje,
            id: notificationId,
            schedule: { at: fechaCita },
            sound: undefined,
            attachments: undefined,
            actionTypeId: '',
            extra: { tipo: 'cita' },
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#4CAF50'
          }
        ]
      });

      console.log('📅 Notificación de cita programada para:', fechaCita);
      return notificationId;
    } catch (error) {
      console.error('❌ Error programando notificación de cita:', error);
      return null;
    }
  }

  // Notificar 15 minutos antes de la cita
  async notificarCitaConRecordatorio(titulo: string, mensaje: string, fechaCita: Date) {
    try {
      const fechaRecordatorio = new Date(fechaCita.getTime() - 15 * 60000); // 15 min antes

      const ahora = new Date();

      console.log('📅 Programando notificaciones:');
      console.log('   - Ahora:', ahora.toLocaleString());
      console.log('   - Recordatorio:', fechaRecordatorio.toLocaleString());
      console.log('   - Cita:', fechaCita.toLocaleString());

      // Solo programar si el recordatorio es en el futuro
      if (fechaRecordatorio > ahora) {
        // Notificación de recordatorio
        await LocalNotifications.schedule({
          notifications: [
            {
              title: '🔔 Recordatorio',
              body: `Tu cita "${titulo}" es en 15 minutos`,
              id: Math.floor(Math.random() * 100000),
              schedule: { at: fechaRecordatorio },
              sound: undefined,
              attachments: undefined,
              actionTypeId: '',
              extra: { tipo: 'recordatorio' },
              smallIcon: 'ic_stat_icon_config_sample',
              iconColor: '#FFC107'
            }
          ]
        });
        console.log('✅ Recordatorio programado');
      } else {
        console.warn('⚠️ El recordatorio es en el pasado, no se programó');
      }

      // Notificación de la cita (solo si es en el futuro)
      if (fechaCita > ahora) {
        await this.notificarCita(titulo, mensaje, fechaCita);
        console.log('✅ Notificación de cita programada');
      } else {
        console.warn('⚠️ La cita es en el pasado, no se programó');
      }

    } catch (error) {
      console.error('❌ Error programando notificaciones:', error);
    }
  }

  // Cancelar una notificación
  async cancelarNotificacion(id: number) {
    try {
      await LocalNotifications.cancel({ notifications: [{ id }] });
      console.log('🗑️ Notificación cancelada:', id);
    } catch (error) {
      console.error('❌ Error cancelando notificación:', error);
    }
  }

  // Cancelar todas las notificaciones pendientes
  async cancelarTodasNotificaciones() {
    try {
      const pending = await LocalNotifications.getPending();
      await LocalNotifications.cancel({ notifications: pending.notifications });
      console.log('🗑️ Todas las notificaciones canceladas:', pending.notifications.length);
    } catch (error) {
      console.error('❌ Error cancelando notificaciones:', error);
    }
  }

  // Ver notificaciones pendientes
  async verNotificacionesPendientes() {
    try {
      const pending = await LocalNotifications.getPending();
      console.log('📋 Notificaciones pendientes:', pending.notifications.length);
      pending.notifications.forEach(n => {
        console.log(`   - ID: ${n.id}, Título: ${n.title}, Hora: ${n.schedule?.at}`);
      });
      return pending.notifications;
    } catch (error) {
      console.error('❌ Error obteniendo notificaciones:', error);
      return [];
    }
  }
}
