import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private baseUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    
    if (!token) {
      console.warn('⚠️ No se encontró token de autenticación');
    } else {
      console.log('✅ Token encontrado');
    }
    
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Obtener todos los usuarios filtrados por roles permitidos
  getUsers(): Observable<any[]> {
    console.log('🔍 Solicitando usuarios desde:', `${this.baseUrl}/users`);
    
    return this.http.get(`${this.baseUrl}/users`, { headers: this.getHeaders() })
      .pipe(
        tap((response: any) => {
          console.log('📦 Respuesta raw de usuarios:', response);
        }),
        map((res: any) => {
          let users = res.data || res.users || res;
          
          if (typeof res === 'object' && !Array.isArray(res)) {
            users = res.data || res.users || [];
          }
          
          if (!Array.isArray(users)) {
            console.error('❌ La respuesta de usuarios no es un array:', users);
            return [];
          }
          
          console.log(`📋 Total de usuarios recibidos: ${users.length}`);
          
          if (users.length > 0) {
            console.log('👤 Ejemplo de usuario:', users[0]);
          }
          
          const filteredUsers = users.filter((user: any) => {
            if (!user) {
              console.warn('⚠️ Usuario nulo o indefinido encontrado');
              return false;
            }
            
            let roleName = '';
            
            if (user.role) {
              if (typeof user.role === 'string') {
                roleName = user.role;
              } else if (user.role.nombre) {
                roleName = user.role.nombre;
              } else if (user.role.name) {
                roleName = user.role.name;
              }
            }
            
            if (!roleName && user.roles_id) {
              const roleMap: any = {
                1: 'administrador',
                2: 'cliente',
                3: 'empleado',
                4: 'propietario'
              };
              roleName = roleMap[user.roles_id] || '';
            }
            
            roleName = roleName.toString().toLowerCase().trim();
            
            const fullName = `${user.nombres || ''} ${user.apellidos || ''}`.trim() || user.email || 'Sin nombre';
            
            console.log(`👤 Usuario ID ${user.id}: "${fullName}" - rol="${roleName}"`);
            
            const isAllowed = roleName === 'administrador' || 
                             roleName === 'empleado' || 
                             roleName === 'propietario';
            
            if (isAllowed) {
              console.log(`   ✅ Usuario permitido: ${fullName}`);
            }
            
            return isAllowed;
          });
          
          console.log(`✅ Usuarios filtrados por rol: ${filteredUsers.length} de ${users.length} totales`);
          
          return filteredUsers;
        }),
        catchError((err: HttpErrorResponse) => {
          console.error('❌ Error obteniendo usuarios:', err);
          console.error('Status:', err.status);
          console.error('Mensaje:', err.message);
          console.error('Error completo:', err.error);
          return of([]);
        })
      );
  }

  // Obtener todos los servicios
  getServices(): Observable<any[]> {
    console.log('🔍 Solicitando servicios desde:', `${this.baseUrl}/services`);
    
    return this.http.get(`${this.baseUrl}/services`, { headers: this.getHeaders() })
      .pipe(
        tap((response: any) => {
          console.log('📦 Respuesta raw de servicios:', response);
        }),
        map((res: any) => {
          const services = res.data || res.services || res || [];
          console.log(`✅ Servicios recibidos: ${Array.isArray(services) ? services.length : 0}`);
          
          if (Array.isArray(services) && services.length > 0) {
            console.log('🛠️ Ejemplo de servicio:', services[0]);
          }
          
          return Array.isArray(services) ? services : [];
        }),
        catchError((err: HttpErrorResponse) => {
          console.error('❌ Error obteniendo servicios:', err);
          console.error('Status:', err.status);
          console.error('Error completo:', err.error);
          return of([]);
        })
      );
  }

  // 🔥 OBTENER CITAS CON VERIFICACIÓN DE RELACIONES
  getAppointments(): Observable<any[]> {
    console.log('🔍 Solicitando citas desde:', `${this.baseUrl}/appointments`);
    
    return this.http.get(`${this.baseUrl}/appointments`, { headers: this.getHeaders() })
      .pipe(
        tap((response: any) => {
          console.log('📦 ============ RESPUESTA COMPLETA DE CITAS ============');
          console.log(response);
          console.log('======================================================');
        }),
        map((res: any) => {
          const appointments = res.data || res.appointments || res || [];
          
          console.log(`✅ Citas recibidas: ${Array.isArray(appointments) ? appointments.length : 0}`);
          
          if (Array.isArray(appointments) && appointments.length > 0) {
            console.log('📅 ============ PRIMERA CITA COMPLETA ============');
            console.log(JSON.stringify(appointments[0], null, 2));
            console.log('================================================');
            
            console.log('📊 Campos disponibles:', Object.keys(appointments[0]));
            console.log('🆔 ID Usuario:', appointments[0].usuarios_id || appointments[0].user_id || 'NO ENCONTRADO');
            console.log('🛠️ ID Servicio:', appointments[0].servicios_id || appointments[0].service_id || 'NO ENCONTRADO');
            console.log('📅 Fecha:', appointments[0].fecha || appointments[0].date || 'NO ENCONTRADO');
            console.log('📋 Estado:', appointments[0].status?.nombre || appointments[0].status_name || 'NO ENCONTRADO');
            
            // 🔥 VERIFICAR SI SERVICE VIENE POBLADO
            if (appointments[0].service) {
              console.log('✅✅✅ SERVICE CARGADO CORRECTAMENTE:', appointments[0].service);
            } else {
              console.warn('⚠️⚠️⚠️ SERVICE ES NULL - Backend no está haciendo eager loading');
              console.warn('💡 SOLUCIÓN: Verificar que AppointmentController use ->with([\'service\'])');
            }
            
            // Mostrar TODAS las citas con sus fechas
            console.log('📋 ============ TODAS LAS CITAS ============');
            appointments.forEach((apt: any, index: number) => {
              const serviceInfo = apt.service 
                ? `✅ Service: ${apt.service.nombre || apt.service.name}` 
                : '❌ Service: NULL';
              console.log(`  ${index + 1}. ID: ${apt.id}, Usuario: ${apt.usuarios_id || apt.user_id}, Fecha: ${apt.fecha || apt.date}, Estado: ${apt.status?.nombre || apt.status_name || 'N/A'}, ${serviceInfo}`);
            });
            console.log('===========================================');
          } else {
            console.error('❌❌❌ NO SE RECIBIERON CITAS ❌❌❌');
            console.error('Tipo de appointments:', typeof appointments);
            console.error('Es array?:', Array.isArray(appointments));
            console.error('Valor:', appointments);
          }
          
          return Array.isArray(appointments) ? appointments : [];
        }),
        catchError((err: HttpErrorResponse) => {
          console.error('❌❌❌ ERROR OBTENIENDO CITAS ❌❌❌');
          console.error('Status:', err.status);
          console.error('Error completo:', err);
          return of([]);
        })
      );
  }

  // Obtener todo de una vez
  getAllData(): Observable<any> {
    console.log('🚀 Iniciando carga de todos los datos...');
    
    return forkJoin({
      users: this.getUsers(),
      services: this.getServices(),
      appointments: this.getAppointments()
    }).pipe(
      map(data => {
        console.log('📊 ===== RESUMEN DE DATOS CARGADOS =====');
        console.log(`👥 Usuarios: ${data.users.length}`);
        console.log(`🛠️ Servicios: ${data.services.length}`);
        console.log(`📅 Citas: ${data.appointments.length}`);
        console.log('========================================');
        
        // Mostrar detalle de usuarios por rol
        if (data.users.length > 0) {
          const roleCount: any = {};
          data.users.forEach((user: any) => {
            const role = user.role?.nombre || user.role || 'sin rol';
            roleCount[role] = (roleCount[role] || 0) + 1;
          });
          console.log('📈 Usuarios por rol:', roleCount);
        }
        
        // 🔥 VERIFICAR QUE LAS CITAS TENGAN EL SERVICE CARGADO
        if (data.appointments.length > 0) {
          const citasConService = data.appointments.filter((apt: any) => apt.service !== null && apt.service !== undefined).length;
          const citasSinService = data.appointments.length - citasConService;
          
          console.log('🔍 ===== VERIFICACIÓN DE RELACIONES =====');
          console.log(`✅ Citas CON service cargado: ${citasConService}`);
          console.log(`❌ Citas SIN service cargado: ${citasSinService}`);
          
          if (citasSinService > 0) {
            console.error('⚠️⚠️⚠️ PROBLEMA DETECTADO ⚠️⚠️⚠️');
            console.error('El backend NO está cargando la relación service');
            console.error('Verifica que AppointmentController->index() use:');
            console.error('Appointment::with([\'user\', \'business\', \'status\', \'service\', \'agenda\'])');
          } else {
            console.log('✅✅✅ TODAS LAS CITAS TIENEN SERVICE CARGADO');
          }
          console.log('=========================================');
          
          // Mostrar detalle de citas por estado
          const statusCount: any = {};
          data.appointments.forEach((apt: any) => {
            const status = apt.status?.nombre || apt.status_name || 'sin estado';
            statusCount[status] = (statusCount[status] || 0) + 1;
          });
          console.log('📊 Citas por estado:', statusCount);
        } else {
          console.warn('⚠️ NO HAY CITAS CARGADAS - Verifica:');
          console.warn('   1. Que el endpoint /api/appointments funcione');
          console.warn('   2. Que el usuario tenga permisos');
          console.warn('   3. Que existan citas en la base de datos');
        }
        
        return data;
      }),
      catchError((err: any) => {
        console.error('❌ Error crítico al cargar todos los datos:', err);
        return of({ users: [], services: [], appointments: [] });
      })
    );
  }

  // ==========================================
  // MÉTODO ALTERNATIVO: Generar informe con backend
  // ==========================================
  generateReport(filters: {
    start_date: string;
    end_date: string;
    user_id?: number | null;
    role?: string;
    status?: string;
  }): Observable<any> {
    console.log('📊 Generando informe con filtros:', filters);
    
    return this.http.post(`${this.baseUrl}/reports`, filters, { headers: this.getHeaders() })
      .pipe(
        tap((response: any) => {
          console.log('✅ Informe generado exitosamente:', response);
        }),
        catchError((err: HttpErrorResponse) => {
          console.error('❌ Error generando informe:', err);
          return of({
            user_info: null,
            services: [],
            appointments: [],
            monthly: [],
            daily: [],
            totals: {
              total_services: 0,
              total_appointments: 0,
              total_value: 0,
              pending_appointments: 0,
              completed_appointments: 0,
              active_users: 0
            }
          });
        })
      );
  }

  // Obtener usuarios para el selector
  getUsersForReports(): Observable<any[]> {
    console.log('🔍 Solicitando usuarios para informes');
    
    return this.http.get(`${this.baseUrl}/users/for-reports`, { headers: this.getHeaders() })
      .pipe(
        tap((response: any) => {
          console.log('📦 Respuesta de usuarios para informes:', response);
        }),
        map((res: any) => {
          const users = res.data || res.users || res || [];
          console.log(`✅ Usuarios para informes: ${Array.isArray(users) ? users.length : 0}`);
          return Array.isArray(users) ? users : [];
        }),
        catchError((err: HttpErrorResponse) => {
          console.error('❌ Error obteniendo usuarios para informes:', err);
          return of([]);
        })
      );
  }

  // Estadísticas rápidas
  getQuickStats(): Observable<any> {
    console.log('📈 Solicitando estadísticas rápidas');
    
    return this.http.get(`${this.baseUrl}/reports/quick-stats`, { headers: this.getHeaders() })
      .pipe(
        tap((response: any) => {
          console.log('✅ Estadísticas rápidas:', response);
        }),
        map((res: any) => res.data || {}),
        catchError((err: HttpErrorResponse) => {
          console.error('❌ Error obteniendo estadísticas rápidas:', err);
          return of({
            today_appointments: 0,
            pending_appointments: 0,
            active_services: 0,
            active_users: 0
          });
        })
      );
  }
}