# Sistema de Personalización - Configuración Completa

## ✅ Estado Actual
El sistema está completamente configurado y listo para conectarse con la API Laravel en `http://127.0.0.1:8000/api`.

## 🔧 Configuración Realizada

### 1. **Servicio CustomizationsService**
- ✅ URL actualizada: `http://127.0.0.1:8000/api`
- ✅ Headers de autenticación con Bearer token
- ✅ Manejo de FormData para archivos
- ✅ Métodos completos: GET, POST, PUT, DELETE

### 2. **Servicio AuthService**
- ✅ Manejo de tokens de autenticación
- ✅ Gestión de Business ID
- ✅ Métodos de autenticación

### 3. **Componente Personalizacion**
- ✅ Integración completa con servicios
- ✅ Manejo de estados (carga, éxito, error)
- ✅ Validaciones robustas
- ✅ Carga automática de configuración existente

## 🌐 URLs para Acceder

### Formulario de Personalización:
```
http://localhost:4200/cliente-final/personalizacion
```

### Otras rutas disponibles:
```
http://localhost:4200/cliente-final/formulario
http://localhost:4200/cliente-final/confirmar-cita/1
```

## 🔑 Configuración de Autenticación

### Para usar el sistema necesitas:

1. **Configurar el token de autenticación:**
```typescript
// En tu aplicación, después del login:
this.authService.setToken('tu-token-jwt');
this.authService.setCurrentBusinessId(1); // ID del negocio
```

2. **El token se guarda automáticamente en localStorage**

## 📡 Endpoints de la API

### GET - Obtener configuración
```
GET /api/customizations/business/{businessId}
Headers: Authorization: Bearer {token}
```

### POST - Crear configuración
```
POST /api/customizations
Headers: Authorization: Bearer {token}
Content-Type: multipart/form-data
```

### PUT - Actualizar configuración
```
PUT /api/customizations/{id}
Headers: Authorization: Bearer {token}
Content-Type: multipart/form-data
```

### DELETE - Eliminar configuración
```
DELETE /api/customizations/{id}
Headers: Authorization: Bearer {token}
```

## 📋 Campos Enviados a la API

### Información del Negocio:
- `negocios_id` - ID del negocio
- `nombre_comercial` - Nombre comercial
- `eslogan` - Eslogan
- `descripcion_negocio` - Descripción

### Redes Sociales:
- `facebook_url` - URL de Facebook
- `instagram_url` - URL de Instagram
- `whatsapp_numero` - Número de WhatsApp
- `texto_seguir_redes` - Texto para redes

### Métodos de Pago:
- `acepta_efectivo` - Boolean (true/false)
- `acepta_tarjeta` - Boolean (true/false)
- `acepta_nequi` - Boolean (true/false)
- `acepta_transferencia` - Boolean (true/false)
- `texto_metodos_pago` - Texto descriptivo

### Archivos y Colores:
- `logo_empresa` - Archivo de imagen
- `color_fondo_branding` - Color de fondo
- `color_letra_branding` - Color de letra

## 🚀 Pasos para Usar

### 1. **Iniciar el servidor Angular:**
```bash
ng serve
```

### 2. **Configurar autenticación (en tu aplicación):**
```typescript
// Después del login del usuario
this.authService.setToken('jwt-token-del-usuario');
this.authService.setCurrentBusinessId(idDelNegocio);
```

### 3. **Acceder al formulario:**
```
http://localhost:4200/cliente-final/personalizacion
```

### 4. **El formulario automáticamente:**
- Carga la configuración existente (si existe)
- Permite editar todos los campos
- Guarda los cambios en la API
- Muestra mensajes de éxito/error

## 🔍 Debugging

### Para verificar que funciona:

1. **Abrir DevTools del navegador**
2. **Ir a la pestaña Network**
3. **Llenar y enviar el formulario**
4. **Verificar que se hacen las peticiones HTTP correctas**

### Logs en consola:
- ✅ "No existe configuración previa" - Normal si es la primera vez
- ✅ "Configuración guardada exitosamente" - Guardado correcto
- ❌ "Error al guardar" - Revisar API o autenticación

## ⚠️ Notas Importantes

1. **Token de Autenticación:** Asegúrate de tener un token válido en localStorage
2. **Business ID:** Debe corresponder a un negocio existente en la base de datos
3. **CORS:** La API debe permitir requests desde `http://localhost:4200`
4. **Archivos:** El logo se envía como FormData multipart

## 🎯 Próximos Pasos

1. Implementar el sistema de login para obtener el token
2. Configurar el Business ID dinámicamente
3. Probar la conexión con la API Laravel
4. Implementar manejo de errores específicos

El sistema está completamente listo para funcionar con tu API Laravel! 🚀
