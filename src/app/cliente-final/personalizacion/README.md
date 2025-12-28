# Sistema de Personalización de Branding

## Descripción
Este sistema permite personalizar la configuración de branding de un negocio, incluyendo información básica, redes sociales, métodos de pago y colores del tema.

## Campos Disponibles

### Información del Negocio
- **nombre_comercial** (requerido): Nombre comercial del negocio (máximo 200 caracteres)
- **eslogan**: Eslogan del negocio (máximo 300 caracteres)
- **descripcion_negocio**: Descripción detallada del negocio

### Redes Sociales
- **facebook_url**: URL de Facebook (debe comenzar con http:// o https://)
- **instagram_url**: URL de Instagram (debe comenzar con http:// o https://)
- **whatsapp_numero**: Número de WhatsApp con código de país (ej: +573001234567)
- **texto_seguir_redes**: Texto para invitar a seguir las redes sociales (máximo 100 caracteres)

### Métodos de Pago
- **acepta_efectivo**: Boolean - Acepta pagos en efectivo
- **acepta_tarjeta**: Boolean - Acepta pagos con tarjeta
- **acepta_nequi**: Boolean - Acepta pagos con Nequi
- **acepta_transferencia**: Boolean - Acepta transferencias bancarias
- **texto_metodos_pago**: Texto descriptivo de métodos de pago (máximo 200 caracteres)

### Archivos y Colores
- **logo_empresa**: Archivo de imagen del logo (JPG, PNG, GIF - máximo 5MB)
- **color_fondo_branding**: Color de fondo del branding (selector de color)
- **color_letra_branding**: Color de texto del branding (selector de color)

## Servicios

### CustomizationsService
Servicio para manejar la comunicación con la API de customizations.

#### Métodos disponibles:
- `getCustomizationByBusinessId(businessId: number)`: Obtiene la configuración por ID de negocio
- `createCustomization(customization: BrandingConfig, businessId: number)`: Crea nueva configuración
- `updateCustomization(id: number, customization: BrandingConfig)`: Actualiza configuración existente
- `deleteCustomization(id: number)`: Elimina configuración

## Uso

### 1. Importar el servicio
```typescript
import { CustomizationsService } from './services/customizations.service';
```

### 2. Inyectar en el constructor
```typescript
constructor(private customizationsService: CustomizationsService) {}
```

### 3. Usar en el componente
El componente `Personalizacion` ya está configurado para usar el servicio automáticamente.

## Configuración de la API

### Endpoints esperados:
- `GET /api/customizations/business/{businessId}` - Obtener configuración por negocio
- `POST /api/customizations` - Crear nueva configuración
- `POST /api/customizations/{id}` - Actualizar configuración
- `DELETE /api/customizations/{id}` - Eliminar configuración

### Estructura de datos esperada:
La API debe manejar FormData para soportar la carga de archivos (logo_empresa).

## Validaciones

### Frontend (Angular)
- Validación de campos requeridos
- Validación de longitud máxima
- Validación de patrones (URLs, números de teléfono)
- Validación de tipos de archivo

### Backend (Laravel)
- Validación de tipos de datos
- Validación de archivos (tamaño, tipo)
- Validación de relaciones (negocios_id)

## Notas Importantes

1. **ID del Negocio**: Actualmente está hardcodeado como `1`. Debe obtenerse del contexto de la aplicación o servicio de autenticación.

2. **URL de la API**: La URL base está configurada como `http://localhost:8000/api`. Debe ajustarse según el entorno.

3. **Manejo de Archivos**: El servicio convierte automáticamente los datos a FormData para manejar la carga de archivos.

4. **Estilos Dinámicos**: Los colores se aplican dinámicamente usando CSS custom properties.

5. **Estados de Carga**: El componente maneja estados de carga, éxito y error con mensajes informativos.
