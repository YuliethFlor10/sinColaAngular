// 📋 CONFIGURACIÓN PARA CONEXIÓN CON LARAVEL
// Este archivo contiene las configuraciones necesarias para conectar Angular con Laravel

export const API_CONFIG = {
  // 🔥 URLs de la API - AJUSTA SEGÚN TU CONFIGURACIÓN
  BASE_URL: 'http://localhost:8000/api',
  APPOINTMENTS_ENDPOINT: '/appointments',
  
  // URLs alternativas para probar diferentes configuraciones
  ALTERNATIVE_URLS: [
    'http://127.0.0.1:8000/api/appointments',
    'http://localhost:8000/api/citas',
    'http://127.0.0.1:8000/api/citas',
    'http://localhost:8000/api/appointment',
    'http://127.0.0.1:8000/api/appointment'
  ],
  
  // Headers HTTP
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  
  // Configuración de timeout
  TIMEOUT: 10000, // 10 segundos
  
  // Configuración de reintentos
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000 // 1 segundo
};

// 📋 ESTRUCTURA DE DATOS ESPERADA EN LARAVEL
export interface LaravelAppointment {
  id?: number;
  nombre: string;
  email: string;
  tipo_documento: string;
  numero_documento: string;
  fecha_nacimiento: string;
  numero_telefono: string;
  tipo_cita: string;
  personal_servicio: string;
  fecha_cita: string; // Formato: YYYY-MM-DD
  hora_cita: string; // Formato: HH:MM
  nota?: string;
  negocios_id: number;
  servicios_id: number;
  estados_id: number;
  usuarios_id: number;
  tiempo_estimado?: number;
  descripcion_cancel?: string;
  created_at?: string;
  updated_at?: string;
}

// 📋 MAPEO DE SERVICIOS
export const SERVICE_MAPPING = {
  'manicure': { id: 1, name: 'Manicure Clásico', duration: 45, price: 25000 },
  'pedicure': { id: 2, name: 'Pedicure Spa', duration: 60, price: 30000 },
  'gelish': { id: 3, name: 'Uñas en Gelish', duration: 60, price: 35000 },
  'acrilicas': { id: 4, name: 'Uñas Acrílicas', duration: 90, price: 50000 },
  'pestanas': { id: 5, name: 'Pestañas', duration: 75, price: 40000 }
};

// 📋 MAPEO DE ESTADOS
export const STATUS_MAPPING = {
  'reserved': { id: 1, name: 'Reservada' },
  'confirmed': { id: 2, name: 'Confirmada' },
  'cancelled': { id: 3, name: 'Cancelada' },
  'completed': { id: 4, name: 'Completada' }
};

// 📋 CONFIGURACIÓN DE PERSONAL
export const STAFF_CONFIG = {
  'pepita-perez': { id: 'pepita-perez', name: 'Pepita Perez', displayName: 'Pepita Perez' },
  'luna-lunera': { id: 'luna-lunera', name: 'Luna Lunera', displayName: 'Luna Lunera' },
  'patricia-fernandez': { id: 'patricia-fernandez', name: 'Patricia Fernandez', displayName: 'Patricia Fernandez' }
};

// 📋 INSTRUCCIONES PARA LARAVEL
export const LARAVEL_SETUP_INSTRUCTIONS = `
🔥 CONFIGURACIÓN NECESARIA EN LARAVEL:

1. 📁 Crear migración para la tabla appointments:
   php artisan make:migration create_appointments_table

2. 📋 Estructura de la tabla appointments:
   - id (bigint, primary key, auto increment)
   - nombre (varchar 255)
   - email (varchar 255)
   - tipo_documento (varchar 50)
   - numero_documento (varchar 50)
   - fecha_nacimiento (date)
   - numero_telefono (varchar 20)
   - tipo_cita (varchar 100)
   - personal_servicio (varchar 100)
   - fecha_cita (date)
   - hora_cita (time)
   - nota (text, nullable)
   - negocios_id (bigint, default 1)
   - servicios_id (bigint, default 1)
   - estados_id (bigint, default 1)
   - usuarios_id (bigint, default 1)
   - tiempo_estimado (int, default 60)
   - descripcion_cancel (text, nullable)
   - created_at (timestamp)
   - updated_at (timestamp)

3. 🎯 Crear modelo Appointment:
   php artisan make:model Appointment

4. 🛠️ Crear controlador AppointmentController:
   php artisan make:controller Api/AppointmentController --api

5. 🛣️ Configurar rutas en routes/api.php:
   Route::apiResource('appointments', App\\Http\\Controllers\\Api\\AppointmentController::class);

6. 🔧 Configurar CORS en config/cors.php:
   'allowed_origins' => ['http://localhost:4200', 'http://127.0.0.1:4200']

7. 🚀 Ejecutar migración:
   php artisan migrate

8. 📊 Insertar datos de prueba:
   php artisan tinker
   App\\Models\\Appointment::create([
       'nombre' => 'Cliente Prueba',
       'email' => 'cliente@prueba.com',
       'tipo_documento' => 'CC',
       'numero_documento' => '12345678',
       'fecha_nacimiento' => '1990-01-01',
       'numero_telefono' => '3001234567',
       'tipo_cita' => 'manicure',
       'personal_servicio' => 'Pepita Perez',
       'fecha_cita' => '2024-01-15',
       'hora_cita' => '10:00:00',
       'nota' => 'Cita de prueba',
       'negocios_id' => 1,
       'servicios_id' => 1,
       'estados_id' => 1,
       'usuarios_id' => 1
   ]);
`;

// 📋 FUNCIONES DE UTILIDAD
export class ApiUtils {
  static buildUrl(endpoint: string): string {
    return `${API_CONFIG.BASE_URL}${endpoint}`;
  }
  
  static getHeaders(): any {
    return API_CONFIG.HEADERS;
  }
  
  static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  static formatTime(time: string): string {
    return time.includes(':') ? time : `${time}:00`;
  }
  
  static mapServiceToId(serviceName: string): number {
    return SERVICE_MAPPING[serviceName as keyof typeof SERVICE_MAPPING]?.id || 1;
  }
  
  static mapStatusToId(status: string): number {
    return STATUS_MAPPING[status as keyof typeof STATUS_MAPPING]?.id || 1;
  }
}

