-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 28-09-2025 a las 03:40:17
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `sincolaapis`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `agendas`
--

CREATE TABLE `agendas` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `nombre` varchar(100) NOT NULL,
  `horarios` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`horarios`)),
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `negocios_id` bigint(20) UNSIGNED NOT NULL,
  `usuarios_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `agendas`
--

INSERT INTO `agendas` (`id`, `creado_en`, `actualizado_en`, `nombre`, `horarios`, `activo`, `negocios_id`, `usuarios_id`) VALUES
(1, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Agenda Sofía - Estilista', '{\"lunes\": {\"inicio\": \"09:00\", \"fin\": \"17:00\"}, \"martes\": {\"inicio\": \"09:00\", \"fin\": \"17:00\"}, \"miercoles\": {\"inicio\": \"09:00\", \"fin\": \"17:00\"}, \"jueves\": {\"inicio\": \"09:00\", \"fin\": \"17:00\"}, \"viernes\": {\"inicio\": \"09:00\", \"fin\": \"17:00\"}, \"sabado\": {\"inicio\": \"08:00\", \"fin\": \"16:00\"}}', 1, 1, 5),
(2, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Agenda Dr. Diego', '{\"lunes\": {\"inicio\": \"08:00\", \"fin\": \"16:00\"}, \"martes\": {\"inicio\": \"08:00\", \"fin\": \"16:00\"}, \"miercoles\": {\"inicio\": \"08:00\", \"fin\": \"16:00\"}, \"jueves\": {\"inicio\": \"08:00\", \"fin\": \"16:00\"}, \"viernes\": {\"inicio\": \"08:00\", \"fin\": \"14:00\"}}', 1, 2, 6),
(3, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Agenda Valentina - Barbera', '{\"martes\": {\"inicio\": \"10:00\", \"fin\": \"18:00\"}, \"miercoles\": {\"inicio\": \"10:00\", \"fin\": \"18:00\"}, \"jueves\": {\"inicio\": \"10:00\", \"fin\": \"18:00\"}, \"viernes\": {\"inicio\": \"10:00\", \"fin\": \"18:00\"}, \"sabado\": {\"inicio\": \"09:00\", \"fin\": \"17:00\"}}', 1, 3, 7),
(4, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Agenda Masajista Spa', '{\"lunes\": {\"inicio\": \"10:00\", \"fin\": \"19:00\"}, \"martes\": {\"inicio\": \"10:00\", \"fin\": \"19:00\"}, \"miercoles\": {\"inicio\": \"10:00\", \"fin\": \"19:00\"}, \"jueves\": {\"inicio\": \"10:00\", \"fin\": \"19:00\"}, \"viernes\": {\"inicio\": \"10:00\", \"fin\": \"19:00\"}, \"sabado\": {\"inicio\": \"09:00\", \"fin\": \"18:00\"}}', 1, 4, 3);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `appointments`
--

CREATE TABLE `appointments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `usuarios_id` bigint(20) UNSIGNED NOT NULL,
  `negocios_id` bigint(20) UNSIGNED NOT NULL,
  `servicios_id` bigint(20) UNSIGNED NOT NULL,
  `estados_id` bigint(20) UNSIGNED NOT NULL,
  `nota` text DEFAULT NULL,
  `fecha` datetime NOT NULL,
  `fecha_fin` datetime NOT NULL,
  `tiempo_estimado` int(11) DEFAULT NULL,
  `descripcion_cancel` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `appointments`
--

INSERT INTO `appointments` (`id`, `creado_en`, `actualizado_en`, `usuarios_id`, `negocios_id`, `servicios_id`, `estados_id`, `nota`, `fecha`, `fecha_fin`, `tiempo_estimado`, `descripcion_cancel`) VALUES
(1, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 8, 1, 1, 4, 'Primera vez en el salón, quiere un cambio de look', '2025-09-05 10:00:00', '2025-09-05 11:30:00', 90, NULL),
(2, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 10, 1, 1, 4, 'Cliente frecuente, corte habitual', '2025-09-05 14:00:00', '2025-09-05 15:30:00', 90, NULL),
(3, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 12, 1, 3, 4, 'Quiere manicure para evento especial', '2025-09-06 09:00:00', '2025-09-06 10:00:00', 60, NULL),
(4, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 14, 1, 2, 4, 'Tinte completo, cambio de color', '2025-09-07 11:00:00', '2025-09-07 14:00:00', 180, NULL),
(5, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 9, 2, 5, 6, 'Control rutinario, se siente bien', '2025-09-05 09:00:00', '2025-09-05 09:30:00', 30, NULL),
(6, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 11, 2, 6, 4, 'Dolor de espalda por trabajo de oficina', '2025-09-05 15:00:00', '2025-09-05 16:00:00', 60, NULL),
(7, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 13, 2, 7, 4, 'Sesión de fisioterapia por lesión deportiva', '2025-09-06 08:00:00', '2025-09-06 08:45:00', 45, NULL),
(8, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 15, 3, 8, 4, 'Corte ejecutivo para reunión importante', '2025-09-05 16:00:00', '2025-09-05 16:45:00', 45, NULL),
(9, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 9, 3, 10, 4, 'Combo completo, primera vez', '2025-09-06 11:00:00', '2025-09-06 12:00:00', 60, NULL),
(10, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 8, 4, 11, 4, 'Muy estresada del trabajo, necesita relajarse', '2025-09-07 10:00:00', '2025-09-07 11:30:00', 90, NULL),
(11, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 12, 4, 12, 4, 'Limpieza facial mensual', '2025-09-07 14:00:00', '2025-09-07 15:15:00', 75, NULL),
(12, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 10, 1, 1, 6, 'Corte y peinado para matrimonio', '2025-08-25 15:00:00', '2025-08-25 16:30:00', 90, NULL),
(13, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 11, 2, 6, 6, 'Masaje por contractura muscular', '2025-08-28 10:00:00', '2025-08-28 11:00:00', 60, NULL),
(14, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 13, 3, 8, 5, 'No pudo asistir por trabajo', '2025-09-03 17:00:00', '2025-09-03 17:45:00', 45, 'Surgió una reunión de trabajo de última hora');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `businesses`
--

CREATE TABLE `businesses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `nit` varchar(20) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `direccion` text DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `estados_id` bigint(20) UNSIGNED NOT NULL,
  `tipo_servicio_id` bigint(20) UNSIGNED NOT NULL,
  `planes_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `businesses`
--

INSERT INTO `businesses` (`id`, `creado_en`, `actualizado_en`, `nit`, `nombre`, `direccion`, `telefono`, `estados_id`, `tipo_servicio_id`, `planes_id`) VALUES
(1, '2025-09-18 20:16:30', '2025-09-18 20:16:30', '123456789', 'Negocio Ejemplo', 'Calle 456', '1234567', 1, 1, 1),
(2, '2025-09-18 23:33:45', '2025-09-18 23:33:45', '136433', 'sin colita', 'calle 5', '316351', 1, 1, 1),
(3, '2025-09-25 00:33:09', '2025-09-25 00:33:09', '436541', 'luz encargo', 'carrera 4', '3156413', 1, 1, 1),
(4, '2025-09-24 20:18:05', '2025-09-24 20:18:05', '900123456-7', 'Salón de Belleza Glamour', 'Calle 123 #45-67, Bogotá', '3101234567', 1, 6, 2),
(5, '2025-09-24 20:18:05', '2025-09-24 20:18:05', '900234567-8', 'Centro Médico Vida Sana', 'Carrera 15 #32-18, Bogotá', '3109876543', 1, 7, 3),
(6, '2025-09-24 20:18:05', '2025-09-24 20:18:05', '900345678-9', 'Barbería El Clásico', 'Avenida 19 #123-45, Bogotá', '3112345678', 1, 6, 1),
(7, '2025-09-24 20:18:05', '2025-09-24 20:18:05', '900456789-0', 'Spa Relajación Total', 'Calle 85 #11-23, Bogotá', '3198765432', 1, 6, 3),
(8, '2025-09-24 20:18:05', '2025-09-24 20:18:05', '900567890-1', 'Clínica Dental Sonrisa', 'Carrera 7 #72-35, Bogotá', '3187654321', 1, 7, 2),
(9, '2025-09-24 20:18:05', '2025-09-24 20:18:05', '900678901-2', 'Instituto Académico Futuro', 'Calle 26 #68-90, Bogotá', '3176543210', 1, 8, 2),
(10, '2025-09-24 20:18:05', '2025-09-24 20:18:05', '900789012-3', 'Consultores TechSoft', 'Carrera 11 #93-07, Bogotá', '3165432109', 1, 9, 4),
(11, '2025-09-24 20:18:05', '2025-09-24 20:18:05', '900890123-4', 'Gimnasio FitLife', 'Avenida 68 #45-12, Bogotá', '3154321098', 1, 7, 2),
(12, '2025-09-26 01:48:41', '2025-09-26 01:48:41', '1356151', 'coco', 'calle 4', '424545', 1, 3, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categories`
--

CREATE TABLE `categories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `nombre` varchar(255) NOT NULL,
  `abreviatura` varchar(255) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `grupo` varchar(255) DEFAULT NULL,
  `estados_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `categories`
--

INSERT INTO `categories` (`id`, `creado_en`, `actualizado_en`, `nombre`, `abreviatura`, `descripcion`, `grupo`, `estados_id`) VALUES
(1, '2025-09-18 20:16:30', '2025-09-18 20:16:30', 'Cédula', 'CC', 'Cédula de ciudadanía', 'identificacion', 1),
(2, '2025-09-18 20:16:30', '2025-09-18 20:16:30', 'NIT', 'NIT', 'Número de Identificación Tributaria', 'identificacion', 1),
(3, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Cédula de Ciudadanía', 'CC', 'Documento de identidad nacional', 'identificacion', 1),
(4, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Cédula de Extranjería', 'CE', 'Documento para extranjeros', 'identificacion', 1),
(5, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Tarjeta de Identidad', 'TI', 'Documento para menores de edad', 'identificacion', 1),
(6, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'NIT', 'NIT', 'Número de Identificación Tributaria', 'identificacion', 1),
(7, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'RUT', 'RUT', 'Registro Único Tributario', 'identificacion', 1),
(8, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Belleza', 'BLZ', 'Servicios de belleza y estética', 'negocio', 1),
(9, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Salud', 'SLD', 'Servicios de salud y bienestar', 'negocio', 1),
(10, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Educación', 'EDU', 'Servicios educativos', 'negocio', 1),
(11, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Consultoría', 'CNS', 'Servicios de consultoría', 'negocio', 1),
(12, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Tecnología', 'TEC', 'Servicios tecnológicos', 'negocio', 1),
(13, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Corte de Cabello', 'CORTE', 'Servicios de corte y peinado', 'servicio', 1),
(14, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Manicure', 'MANI', 'Servicios de manicure y pedicure', 'servicio', 1),
(15, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Masajes', 'MASJ', 'Servicios de masajes terapéuticos', 'servicio', 1),
(16, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Consulta Médica', 'CONS', 'Consultas médicas generales', 'servicio', 1),
(17, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Terapia', 'TERP', 'Servicios de terapia', 'servicio', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `customizations`
--

CREATE TABLE `customizations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `negocios_id` bigint(20) UNSIGNED NOT NULL,
  `nombre_comercial` varchar(200) DEFAULT NULL COMMENT 'Ej: MK Nails Salon - se muestra al cliente',
  `eslogan` varchar(300) DEFAULT NULL COMMENT 'Ej: Las mejores uñas pensando en ti...',
  `descripcion_negocio` text DEFAULT NULL COMMENT 'Descripción que ve el cliente',
  `color_primario` varchar(7) NOT NULL DEFAULT '#e91e63' COMMENT 'Color principal (rosado actual)',
  `color_secundario` varchar(7) NOT NULL DEFAULT '#c2185b' COMMENT 'Color hover/secundario',
  `color_fondo_izquierdo` varchar(7) NOT NULL DEFAULT '#f8d7da' COMMENT 'Fondo gradiente izquierdo',
  `color_fondo_derecho` varchar(7) NOT NULL DEFAULT '#d1477a' COMMENT 'Fondo gradiente derecho',
  `color_texto_principal` varchar(7) NOT NULL DEFAULT '#333333' COMMENT 'Color texto principal',
  `color_texto_secundario` varchar(7) NOT NULL DEFAULT '#666666' COMMENT 'Color texto secundario',
  `logo_principal` varchar(500) DEFAULT NULL COMMENT 'Logo grande del lado izquierdo',
  `logo_pequeno` varchar(500) DEFAULT NULL COMMENT 'Logo pequeño del header derecho',
  `favicon` varchar(500) DEFAULT NULL COMMENT 'Icono de la pestaña',
  `duracion_slot_minutos` int(11) NOT NULL DEFAULT 30 COMMENT 'Duración de cada slot de tiempo',
  `anticipacion_minima_horas` int(11) NOT NULL DEFAULT 2 COMMENT 'Horas mínimas para agendar',
  `horario_atencion_inicio` time NOT NULL DEFAULT '09:00:00' COMMENT 'Hora inicio atención',
  `horario_atencion_fin` time NOT NULL DEFAULT '18:00:00' COMMENT 'Hora fin atención',
  `dias_atencion` varchar(20) NOT NULL DEFAULT 'L,M,M,J,V,S' COMMENT 'Días de atención separados por coma',
  `maximo_citas_dia` int(11) NOT NULL DEFAULT 20,
  `titulo_principal` varchar(100) NOT NULL DEFAULT '¡Agenda SinCola!',
  `subtitulo_formulario` varchar(200) NOT NULL DEFAULT 'Por favor ingresa los siguientes datos para realizar tu reserva',
  `mensaje_bienvenida` text DEFAULT NULL COMMENT 'Mensaje del lado izquierdo',
  `mensaje_confirmacion` text DEFAULT NULL COMMENT 'Mensaje del modal de confirmación',
  `texto_seguir_redes` varchar(100) NOT NULL DEFAULT 'Síguenos en nuestras redes sociales',
  `facebook_url` varchar(500) DEFAULT NULL,
  `instagram_url` varchar(500) DEFAULT NULL,
  `whatsapp_numero` varchar(20) DEFAULT NULL COMMENT 'Número con código país: +573001234567',
  `mostrar_redes_sociales` tinyint(1) NOT NULL DEFAULT 1,
  `acepta_efectivo` tinyint(1) NOT NULL DEFAULT 1,
  `acepta_tarjeta` tinyint(1) NOT NULL DEFAULT 1,
  `acepta_nequi` tinyint(1) NOT NULL DEFAULT 1,
  `acepta_transferencia` tinyint(1) NOT NULL DEFAULT 0,
  `texto_metodos_pago` varchar(200) NOT NULL DEFAULT 'Métodos de pago aceptados por',
  `mostrar_precios_publicos` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Si se muestran precios antes de agendar',
  `requiere_confirmacion_email` tinyint(1) NOT NULL DEFAULT 1,
  `requiere_confirmacion_telefono` tinyint(1) NOT NULL DEFAULT 0,
  `permite_cancelacion_cliente` tinyint(1) NOT NULL DEFAULT 1,
  `horas_limite_cancelacion` int(11) NOT NULL DEFAULT 24,
  `configuracion_extra` text DEFAULT NULL COMMENT 'JSON para configuraciones específicas'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `customizations`
--

INSERT INTO `customizations` (`id`, `created_at`, `updated_at`, `negocios_id`, `nombre_comercial`, `eslogan`, `descripcion_negocio`, `color_primario`, `color_secundario`, `color_fondo_izquierdo`, `color_fondo_derecho`, `color_texto_principal`, `color_texto_secundario`, `logo_principal`, `logo_pequeno`, `favicon`, `duracion_slot_minutos`, `anticipacion_minima_horas`, `horario_atencion_inicio`, `horario_atencion_fin`, `dias_atencion`, `maximo_citas_dia`, `titulo_principal`, `subtitulo_formulario`, `mensaje_bienvenida`, `mensaje_confirmacion`, `texto_seguir_redes`, `facebook_url`, `instagram_url`, `whatsapp_numero`, `mostrar_redes_sociales`, `acepta_efectivo`, `acepta_tarjeta`, `acepta_nequi`, `acepta_transferencia`, `texto_metodos_pago`, `mostrar_precios_publicos`, `requiere_confirmacion_email`, `requiere_confirmacion_telefono`, `permite_cancelacion_cliente`, `horas_limite_cancelacion`, `configuracion_extra`) VALUES
(1, NULL, NULL, 1, 'Glamour Beauty Studio', 'Tu belleza es nuestra pasión', 'El mejor salón de belleza en Bogotá. Ofrecemos servicios de alta calidad con productos premium y profesionales especializados.', '#E91E63', '#C2185B', '#F8D7DA', '#D1477A', '#333333', '#666666', 'https://example.com/logos/glamour-main.png', 'https://example.com/logos/glamour-small.png', 'https://example.com/favicon/glamour.ico', 30, 2, '09:00:00', '18:00:00', 'L,M,M,J,V,S', 25, '¡Agenda tu Cita en Glamour!', 'Completa tus datos para reservar tu cita de belleza', 'Bienvenida a Glamour Beauty Studio. Aquí transformamos tu imagen con los mejores profesionales y productos de alta calidad.', '¡Excelente! Tu cita ha sido agendada. Te enviaremos un recordatorio por WhatsApp.', 'Síguenos para tips de belleza y promociones', 'https://facebook.com/glamourbeauty', 'https://instagram.com/glamourbeauty', '+573101234567', 1, 1, 1, 1, 0, 'Métodos de pago aceptados en Glamour Beauty', 1, 1, 0, 1, 24, '{\"recordatorios_whatsapp\": true, \"promociones_activas\": true, \"programa_fidelidad\": true}'),
(2, NULL, NULL, 2, 'Centro Médico Vida Sana', 'Tu salud es lo primero', 'Centro médico integral con profesionales especializados en medicina general, fisioterapia y bienestar.', '#2196F3', '#1976D2', '#E3F2FD', '#1565C0', '#212121', '#757575', 'https://example.com/logos/vidasana-main.png', 'https://example.com/logos/vidasana-small.png', 'https://example.com/favicon/vidasana.ico', 30, 4, '07:00:00', '17:00:00', 'L,M,M,J,V', 30, 'Agenda tu Consulta Médica', 'Ingresa tus datos para programar tu cita médica', 'En Centro Médico Vida Sana cuidamos tu salud con atención personalizada y profesionales altamente calificados.', 'Tu cita médica ha sido confirmada. Por favor llega 15 minutos antes.', 'Síguenos para consejos de salud', 'https://facebook.com/centrovidasana', 'https://instagram.com/centrovidasana', '+573109876543', 1, 1, 1, 0, 1, 'Métodos de pago Centro Médico Vida Sana', 0, 1, 1, 1, 48, '{\"historia_clinica_digital\": true, \"recordatorios_sms\": true, \"telemedicina\": false}'),
(3, NULL, NULL, 3, 'Barbería El Clásico', 'Tradición y estilo masculino', 'Barbería tradicional especializada en cortes clásicos y modernos para el hombre de hoy.', '#8B4513', '#A0522D', '#F5DEB3', '#CD853F', '#2F4F4F', '#696969', 'https://example.com/logos/elclasico-main.png', 'https://example.com/logos/elclasico-small.png', 'https://example.com/favicon/elclasico.ico', 15, 1, '10:00:00', '19:00:00', 'M,M,J,V,S', 20, 'Reserva en El Clásico', 'Datos para tu cita en la mejor barbería', 'Bienvenido a Barbería El Clásico. Tradición, calidad y estilo en cada corte.', '¡Listo! Tu cita está confirmada. Te esperamos en El Clásico.', 'Síguenos para tendencias masculinas', 'https://facebook.com/barberiaelclasico', 'https://instagram.com/barberiaelclasico', '+573112345678', 1, 1, 1, 1, 0, 'Formas de pago en Barbería El Clásico', 1, 1, 0, 1, 12, '{\"cortes_tendencia\": true, \"productos_masculinos\": true, \"membresía_mensual\": true}'),
(4, NULL, NULL, 4, 'Spa Relajación Total', 'Renueva tu energía, renueva tu vida', 'Spa de lujo especializado en tratamientos de relajación y bienestar integral.', '#20B2AA', '#008B8B', '#E0FFFF', '#48D1CC', '#2F4F4F', '#708090', 'https://example.com/logos/spatotal-main.png', 'https://example.com/logos/spatotal-small.png', 'https://example.com/favicon/spatotal.ico', 60, 6, '09:00:00', '20:00:00', 'L,M,M,J,V,S,D', 15, 'Reserva tu Momento de Relajación', 'Completa el formulario para agendar tu sesión de bienestar', 'Escape del estrés diario en nuestro oasis de tranquilidad. Tratamientos premium con terapeutas certificados.', 'Tu sesión de relajación está confirmada. Prepárate para desconectar del mundo.', 'Síguenos para tips de bienestar', 'https://facebook.com/sparelajacion', 'https://instagram.com/sparelajacion', '+573198765432', 1, 1, 1, 1, 1, 'Opciones de pago Spa Relajación Total', 1, 1, 0, 1, 24, '{\"aromaterapia\": true, \"musicoterapia\": true, \"tratamientos_parejas\": true}'),
(5, NULL, NULL, 5, 'Clínica Dental Sonrisa', 'Tu sonrisa perfecta nos inspira', 'Clínica dental moderna con tecnología de vanguardia y especialistas en odontología integral.', '#00BCD4', '#0097A7', '#E0F2F1', '#00ACC1', '#263238', '#546E7A', 'https://example.com/logos/sonrisa-main.png', 'https://example.com/logos/sonrisa-small.png', 'https://example.com/favicon/sonrisa.ico', 45, 3, '08:00:00', '18:00:00', 'L,M,M,J,V', 20, 'Agenda tu Cita Dental', 'Datos para programar tu consulta odontológica', 'En Clínica Dental Sonrisa cuidamos tu salud oral con la mejor tecnología y profesionales especializados.', 'Tu cita dental está confirmada. Recuerda traer tu documento de identidad.', 'Síguenos para cuidados dentales', 'https://facebook.com/clinicasonrisa', 'https://instagram.com/clinicasonrisa', '+573187654321', 1, 1, 1, 0, 1, 'Formas de pago Clínica Dental', 1, 1, 1, 1, 48, '{\"odontologia_digital\": true, \"sedacion_consciente\": true, \"garantia_tratamientos\": true}'),
(6, NULL, NULL, 6, 'Instituto Académico Futuro', 'Educación de calidad para tu futuro', 'Instituto educativo especializado en cursos técnicos y capacitaciones profesionales.', '#FF9800', '#F57C00', '#FFF3E0', '#FB8C00', '#212121', '#616161', 'https://example.com/logos/futuro-main.png', 'https://example.com/logos/futuro-small.png', 'https://example.com/favicon/futuro.ico', 120, 12, '06:00:00', '22:00:00', 'L,M,M,J,V,S', 50, 'Reserva tu Asesoría Académica', 'Completa el formulario para agendar tu cita educativa', 'En Instituto Académico Futuro te preparamos para los desafíos del mañana con educación de calidad.', 'Tu asesoría académica está programada. Te contactaremos para confirmar detalles.', 'Síguenos para oportunidades educativas', 'https://facebook.com/institutofuturo', 'https://instagram.com/institutofuturo', '+573176543210', 1, 1, 1, 1, 1, 'Opciones de pago Instituto Futuro', 1, 1, 0, 1, 72, '{\"cursos_virtuales\": true, \"certificaciones_internacionales\": true, \"bolsa_empleo\": true}'),
(7, NULL, NULL, 7, 'TechSoft Consultores', 'Innovación tecnológica a tu alcance', 'Empresa consultora especializada en soluciones tecnológicas y transformación digital.', '#9C27B0', '#7B1FA2', '#F3E5F5', '#8E24AA', '#1A1A1A', '#424242', 'https://example.com/logos/techsoft-main.png', 'https://example.com/logos/techsoft-small.png', 'https://example.com/favicon/techsoft.ico', 60, 24, '08:00:00', '17:00:00', 'L,M,M,J,V', 10, 'Agenda tu Consultoría Tech', 'Información para programar tu consulta tecnológica', 'TechSoft te acompaña en la transformación digital de tu empresa con soluciones innovadoras.', 'Tu consultoría tecnológica está agendada. Prepara la información de tu proyecto.', 'Síguenos para tendencias tech', 'https://facebook.com/techsoftconsultores', 'https://instagram.com/techsoftconsultores', '+573165432109', 1, 0, 1, 1, 1, 'Modalidades de pago TechSoft', 0, 1, 1, 1, 48, '{\"consultoria_remota\": true, \"soporte_24_7\": true, \"metodologias_agiles\": true}'),
(8, NULL, NULL, 8, 'Gimnasio FitLife', 'Transforma tu cuerpo, transforma tu vida', 'Gimnasio moderno con equipos de última generación y entrenadores personalizados.', '#4CAF50', '#388E3C', '#E8F5E8', '#43A047', '#1B5E20', '#4E342E', 'https://example.com/logos/fitlife-main.png', 'https://example.com/logos/fitlife-small.png', 'https://example.com/favicon/fitlife.ico', 60, 2, '05:00:00', '23:00:00', 'L,M,M,J,V,S,D', 40, 'Agenda tu Entrenamiento', 'Datos para reservar tu sesión de entrenamiento', 'En FitLife encontrarás el ambiente perfecto para alcanzar tus metas fitness con el mejor equipo.', 'Tu sesión de entrenamiento está confirmada. ¡Prepárate para dar lo mejor!', 'Síguenos para rutinas y motivación', 'https://facebook.com/gimnasofitlife', 'https://instagram.com/gimnasofitlife', '+573154321098', 1, 1, 1, 1, 0, 'Formas de pago Gimnasio FitLife', 1, 0, 0, 1, 6, '{\"clases_grupales\": true, \"entrenamiento_personalizado\": true, \"nutricion_deportiva\": true}');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000001_create_cache_table', 1),
(2, '0001_01_01_000002_create_jobs_table', 1),
(3, '2025_07_31_235940_create_statuses_table', 1),
(4, '2025_07_31_235941_create_categories_table', 1),
(5, '2025_07_31_235942_create_roles_table', 1),
(6, '2025_07_31_235943_create_plans_table', 1),
(7, '2025_07_31_235944_create_businesses_table', 1),
(8, '2025_07_31_235945_create_users_table', 1),
(9, '2025_07_31_235946_create_services_table', 1),
(10, '2025_07_31_235949_create_appointments_table', 1),
(11, '2025_07_31_235950_create_agendas_table', 1),
(12, '2025_08_01_002245_create_personal_access_tokens_table', 1),
(13, '2025_09_02_203900_create_customizations_table', 1),
(14, '2025_09_02_211117_add_fields_to_services_table', 1),
(15, '2025_09_16_004139_create_sessions_table', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 'App\\Models\\User', 1, 'auth_token', '3ba8d45f39419cf87a464c1da41ea32b6bbba52afe0a06b868db8980b1554c35', '[\"*\"]', NULL, NULL, '2025-09-18 20:16:52', '2025-09-18 20:16:52'),
(2, 'App\\Models\\User', 1, 'auth_token', '7a10f3441bad4b5afae13c6343e5aae8dda313e03b75b79cc314576812409780', '[\"*\"]', NULL, NULL, '2025-09-18 20:17:16', '2025-09-18 20:17:16'),
(3, 'App\\Models\\User', 1, 'auth_token', '16299af9aa84f638a1662b0a6feaa0374eec7c3816627ff483e2f69659758c67', '[\"*\"]', '2025-09-18 21:23:41', NULL, '2025-09-18 20:27:21', '2025-09-18 21:23:41'),
(4, 'App\\Models\\User', 1, 'auth_token', '9b604df2d99f80ba349513a34f6fe8f6d049fbbd3f9bb3da6319b94ba45d7940', '[\"*\"]', '2025-09-18 21:30:49', NULL, '2025-09-18 21:26:54', '2025-09-18 21:30:49'),
(5, 'App\\Models\\User', 4, 'auth_token', '6af3636744b4f51684871cbf94d53d64a03215f5ec71ea570c0e8774a554c62e', '[\"*\"]', NULL, NULL, '2025-09-18 21:31:04', '2025-09-18 21:31:04'),
(6, 'App\\Models\\User', 1, 'auth_token', 'abe9ed83a70913916932373a0efd187c5c7affb0a880de8d9337b42b766b450a', '[\"*\"]', NULL, NULL, '2025-09-18 22:40:48', '2025-09-18 22:40:48'),
(7, 'App\\Models\\User', 1, 'auth_token', '9c763577815d278940bf73cbcfe7989a73474d1f732008aa40af2887847e5286', '[\"*\"]', '2025-09-18 23:10:26', NULL, '2025-09-18 22:41:12', '2025-09-18 23:10:26'),
(8, 'App\\Models\\User', 9, 'auth_token', '774d460d4bdaf4b433656c5cb1d33b1b0bfa5f50631cd107d02db3f38e7b68d9', '[\"*\"]', '2025-09-18 23:18:34', NULL, '2025-09-18 23:12:46', '2025-09-18 23:18:34'),
(9, 'App\\Models\\User', 12, 'auth_token', 'c93f5dcbab6f3b43744d927e6962ebebe184bc7bb7ccaced896c721e96bf47b4', '[\"*\"]', '2025-09-18 23:33:45', NULL, '2025-09-18 23:31:17', '2025-09-18 23:33:45'),
(10, 'App\\Models\\User', 13, 'auth_token', '15bfee10f4891432c2caabd92a6e676f22a84e84e737d9eb864076086599d1c7', '[\"*\"]', NULL, NULL, '2025-09-24 23:21:08', '2025-09-24 23:21:08'),
(11, 'App\\Models\\User', 13, 'auth_token', 'd28138da082d5b37ba0884aa65b0725fa77816c6d466eced5b709c945304bc3f', '[\"*\"]', NULL, NULL, '2025-09-24 23:21:15', '2025-09-24 23:21:15'),
(12, 'App\\Models\\User', 13, 'auth_token', 'ac885389693b74a41a7f3edd499f57f45c868e8fefff2be40a8c0834c82bf3f3', '[\"*\"]', NULL, NULL, '2025-09-24 23:21:38', '2025-09-24 23:21:38'),
(13, 'App\\Models\\User', 12, 'auth_token', '1bcb32ffca93079977ddfaf781a55544291f3d795bcc2c8c3460d9e775dc6b29', '[\"*\"]', NULL, NULL, '2025-09-24 23:22:52', '2025-09-24 23:22:52'),
(14, 'App\\Models\\User', 13, 'auth_token', 'b38ccbda508c6b04b2e7c2db4b9fc756ace57e37b36c91111969a5c7d330e4e4', '[\"*\"]', '2025-09-25 00:33:09', NULL, '2025-09-25 00:20:08', '2025-09-25 00:33:09'),
(15, 'App\\Models\\User', 12, 'auth_token', '3ffa8fc708a6fa1c36ea0476bfae692d49f64b55ff8fe09a2a132fe2de7c22df', '[\"*\"]', NULL, NULL, '2025-09-25 00:22:18', '2025-09-25 00:22:18'),
(16, 'App\\Models\\User', 12, 'auth_token', '5b81c6ea560c8200bd11b0a37e6ff8ac17e9e9e2d6e1d32d8b290c4bd78e60af', '[\"*\"]', NULL, NULL, '2025-09-25 00:22:20', '2025-09-25 00:22:20'),
(17, 'App\\Models\\User', 14, 'auth_token', 'f4e026556677c2b7d89b971d983222fef48d856e7c2d114351595a79e7112b3f', '[\"*\"]', NULL, NULL, '2025-09-25 00:35:23', '2025-09-25 00:35:23'),
(18, 'App\\Models\\User', 14, 'auth_token', 'e7a9443793968b5c016612891a453f8c82458a5a9152bac52addc059b9b4562c', '[\"*\"]', NULL, NULL, '2025-09-25 00:35:24', '2025-09-25 00:35:24'),
(19, 'App\\Models\\User', 14, 'auth_token', '89cfb69fcffeb6a320616e40d3823f227da011c4236ff89aa3ea69d05f756f8e', '[\"*\"]', NULL, NULL, '2025-09-25 01:09:49', '2025-09-25 01:09:49'),
(20, 'App\\Models\\User', 12, 'auth_token', 'c80c5faf688d78f3cf398bcc11fa3a91c6c52487718b7c8b68bc0389feeb0717', '[\"*\"]', NULL, NULL, '2025-09-25 02:10:09', '2025-09-25 02:10:09'),
(21, 'App\\Models\\User', 12, 'auth_token', '3955a1a37539cdd15b006e11a9ec0f908418e96e51d36267dcd3392c9315ac64', '[\"*\"]', '2025-09-26 01:48:41', NULL, '2025-09-25 05:58:37', '2025-09-26 01:48:41'),
(22, 'App\\Models\\User', 33, 'auth_token', 'af85c0b2d8c640d28009464a5664fd32e424c32d3ea4612c0d8a656342b4ea2b', '[\"*\"]', '2025-09-26 03:08:38', NULL, '2025-09-26 01:50:37', '2025-09-26 03:08:38'),
(23, 'App\\Models\\User', 12, 'auth_token', '71e0e69bec3683477e51ace865fa45ccb884e406a04d3fdace9dc573a511f1a4', '[\"*\"]', '2025-09-26 21:11:20', NULL, '2025-09-26 21:11:13', '2025-09-26 21:11:20'),
(24, 'App\\Models\\User', 12, 'auth_token', '896a2d5565bfc6df376ea180fc1c265a95e8c9b25a9a10f7bae7dcdd8f53605b', '[\"*\"]', NULL, NULL, '2025-09-26 21:11:16', '2025-09-26 21:11:16'),
(25, 'App\\Models\\User', 12, 'auth_token', '7cf2880cceb07686587540594e8ec145d7b950faadcaee9792aa89638e3def87', '[\"*\"]', '2025-09-28 06:38:16', NULL, '2025-09-26 21:11:17', '2025-09-28 06:38:16');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `plans`
--

CREATE TABLE `plans` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `nombre` varchar(100) NOT NULL,
  `caracteristicas` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`caracteristicas`)),
  `descuentos` int(11) DEFAULT NULL,
  `estados_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `plans`
--

INSERT INTO `plans` (`id`, `creado_en`, `actualizado_en`, `nombre`, `caracteristicas`, `descuentos`, `estados_id`) VALUES
(1, '2025-09-18 20:16:30', '2025-09-18 20:16:30', 'Plan Básico', '{\"limite_usuarios\":10,\"soporte\":\"Email\",\"acceso\":\"B\\u00e1sico\"}', 0, 1),
(2, '2025-09-18 20:16:30', '2025-09-18 20:16:30', 'Plan Premium', '{\"limite_usuarios\":50,\"soporte\":\"Tel\\u00e9fono y Email\",\"acceso\":\"Completo\"}', 10, 1),
(3, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Plan Básico', '{\"max_usuarios\": 5, \"max_servicios\": 10, \"soporte\": \"email\"}', 0, 1),
(4, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Plan Estándar', '{\"max_usuarios\": 15, \"max_servicios\": 25, \"soporte\": \"chat\"}', 10, 1),
(5, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Plan Premium', '{\"max_usuarios\": 50, \"max_servicios\": 100, \"soporte\": \"24/7\"}', 20, 1),
(6, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Plan Empresarial', '{\"max_usuarios\": 200, \"max_servicios\": 500, \"soporte\": \"dedicado\"}', 30, 1),
(7, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Plan Prueba', '{\"max_usuarios\": 2, \"max_servicios\": 5, \"duracion_dias\": 30}', 0, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `nombre` varchar(25) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `estados_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id`, `creado_en`, `actualizado_en`, `nombre`, `descripcion`, `estados_id`) VALUES
(1, '2025-09-18 20:16:30', '2025-09-18 20:16:30', 'Administrador', 'Rol admin', 1),
(2, '2025-09-18 20:16:30', '2025-09-18 20:16:30', 'Cliente', 'Rol cliente', 1),
(3, '2025-09-18 20:16:30', '2025-09-18 20:16:30', 'Empleado', 'Rol empleado', 1),
(4, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Admin', 'Administrador del sistema', 1),
(5, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Cliente', 'Cliente del negocio', 1),
(6, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Empleado', 'Empleado del negocio', 1),
(7, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Propietario', 'Propietario del negocio', 1),
(8, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Recepcionista', 'Recepcionista del negocio', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `services`
--

CREATE TABLE `services` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `abreviatura` varchar(10) DEFAULT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `tiempo_estimado` int(11) DEFAULT NULL,
  `precio` decimal(10,2) DEFAULT NULL,
  `tipos_id` bigint(20) UNSIGNED NOT NULL,
  `estados_id` bigint(20) UNSIGNED NOT NULL,
  `negocios_id` bigint(20) UNSIGNED NOT NULL,
  `orden_visualizacion` int(11) NOT NULL DEFAULT 1,
  `recomendaciones` text DEFAULT NULL,
  `requiere_cita_previa` tinyint(1) NOT NULL DEFAULT 1,
  `color_servicio` varchar(7) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `services`
--

INSERT INTO `services` (`id`, `creado_en`, `actualizado_en`, `abreviatura`, `nombre`, `descripcion`, `tiempo_estimado`, `precio`, `tipos_id`, `estados_id`, `negocios_id`, `orden_visualizacion`, `recomendaciones`, `requiere_cita_previa`, `color_servicio`) VALUES
(1, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'CORTE-F', 'Corte Femenino', 'Corte de cabello para damas con lavado y secado', 90, 45000.00, 11, 1, 1, 1, 'Traer foto de referencia del corte deseado', 1, '#FF69B4'),
(2, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'TINTE', 'Tinte Completo', 'Aplicación de tinte permanente con tratamiento', 180, 85000.00, 11, 1, 1, 2, 'No lavar el cabello 24 horas antes', 1, '#9932CC'),
(3, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'MANI-ESP', 'Manicure Española', 'Manicure completa con esmaltado tradicional', 60, 25000.00, 12, 1, 1, 3, 'No usar cremas en las manos antes del servicio', 1, '#FF1493'),
(4, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'PEDI-SPA', 'Pedicure Spa', 'Pedicure relajante con exfoliación y masaje', 75, 35000.00, 12, 1, 1, 4, 'Usar sandalias cómodas', 1, '#DA70D6'),
(5, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'CONS-GEN', 'Consulta General', 'Consulta médica general con examen físico', 30, 80000.00, 14, 1, 2, 1, 'Llevar documentos de identidad y EPS', 1, '#4169E1'),
(6, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'MASJ-REL', 'Masaje Relajante', 'Masaje terapéutico para relajación muscular', 60, 65000.00, 13, 1, 2, 2, 'Ropa cómoda, no comer 2 horas antes', 1, '#20B2AA'),
(7, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'FISIO', 'Fisioterapia', 'Sesión de fisioterapia rehabilitación', 45, 55000.00, 15, 1, 2, 3, 'Traer ropa deportiva y toalla', 1, '#32CD32'),
(8, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'CORTE-M', 'Corte Masculino', 'Corte de cabello tradicional para hombres', 45, 25000.00, 11, 1, 3, 1, 'Cabello limpio, traer foto de referencia', 1, '#8B4513'),
(9, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'BARBA', 'Arreglo de Barba', 'Recorte y arreglo profesional de barba', 30, 20000.00, 11, 1, 3, 2, 'Barba con al menos 3 días de crecimiento', 1, '#A0522D'),
(10, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'COMBO-CB', 'Combo Corte + Barba', 'Servicio completo de corte y arreglo de barba', 60, 40000.00, 11, 1, 3, 3, 'Servicio más popular, incluye lavado', 1, '#CD853F'),
(11, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'MASJ-SUE', 'Masaje Sueco', 'Masaje sueco tradicional de cuerpo completo', 90, 120000.00, 13, 1, 4, 1, 'No comer 2 horas antes, traer ropa interior cómoda', 1, '#8FBC8F'),
(12, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'FACIAL', 'Limpieza Facial', 'Limpieza facial profunda con extracciones', 75, 75000.00, 6, 1, 4, 2, 'No usar maquillaje el día del tratamiento', 1, '#98FB98'),
(13, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'REFLEX', 'Reflexología', 'Masaje terapéutico en pies y manos', 50, 50000.00, 13, 1, 4, 3, 'Pies limpios, no usar cremas antes', 1, '#90EE90');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `statuses`
--

CREATE TABLE `statuses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `nombre` varchar(50) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `grupo` varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `statuses`
--

INSERT INTO `statuses` (`id`, `creado_en`, `actualizado_en`, `nombre`, `descripcion`, `grupo`) VALUES
(1, '2025-09-18 20:16:30', '2025-09-18 20:16:30', 'Activo', 'Estado activo', 'general'),
(2, '2025-09-18 20:16:30', '2025-09-18 20:16:30', 'Inactivo', 'Estado inactivo', 'general'),
(3, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Activo', 'Estado activo del elemento', 'general'),
(4, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Inactivo', 'Estado inactivo del elemento', 'general'),
(5, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Pendiente', 'Estado pendiente de aprobación', 'general'),
(6, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Confirmada', 'Cita confirmada por el cliente', 'citas'),
(7, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Cancelada', 'Cita cancelada', 'citas'),
(8, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Completada', 'Cita completada exitosamente', 'citas'),
(9, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'No Show', 'Cliente no se presentó a la cita', 'citas'),
(10, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'En Proceso', 'Servicio en ejecución', 'servicios'),
(11, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Suspendido', 'Temporalmente suspendido', 'general'),
(12, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Bloqueado', 'Acceso bloqueado', 'usuarios');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `nombres` varchar(30) NOT NULL,
  `apellidos` varchar(30) NOT NULL,
  `email` varchar(100) NOT NULL,
  `nacimiento` date DEFAULT NULL,
  `genero` enum('M','F','O') NOT NULL DEFAULT 'O',
  `clave` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `tipo_identificacion_id` bigint(20) UNSIGNED NOT NULL,
  `identificacion` varchar(20) NOT NULL,
  `celular` varchar(20) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `direccion` text DEFAULT NULL,
  `terminos_condiciones` tinyint(1) NOT NULL DEFAULT 0,
  `estados_id` bigint(20) UNSIGNED NOT NULL,
  `roles_id` bigint(20) UNSIGNED NOT NULL,
  `negocios_id` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`id`, `creado_en`, `actualizado_en`, `nombres`, `apellidos`, `email`, `nacimiento`, `genero`, `clave`, `remember_token`, `tipo_identificacion_id`, `identificacion`, `celular`, `telefono`, `direccion`, `terminos_condiciones`, `estados_id`, `roles_id`, `negocios_id`) VALUES
(1, '2025-09-18 20:16:33', '2025-09-18 20:16:33', 'Test', 'User', 'test@example.com', '1998-09-22', 'M', '$2y$12$aFRKEgIsAg3UKsVvASJYFuprQW1NWrtJT6LnjmUMTbUQWCAT56u32', '5GXtWCcNLw', 1, '123456789', '+1-678-538-7098', '+1-928-415-7417', '2873 Ziemann Freeway\nSchmittport, CT 58822-9163', 1, 1, 1, 1),
(2, '2025-09-18 21:19:45', '2025-09-18 21:19:45', 'yuli', 'flor', 'yul@gmail.com', NULL, 'O', '$2y$12$uAJKiItzGJYkD9cWd.ghDer4e0Z7Jl3fwfzufacFfS0m9X4B8namG', NULL, 1, '1144101112', '3183887199', '3183887199', 'calle 4 #2-2', 1, 1, 2, 1),
(3, '2025-09-18 21:22:52', '2025-09-18 21:22:52', 'mauro', 'quien', 'mau@gmail.com', NULL, 'O', '$2y$12$rAxEk3.oj9CfUnYJHyZALOTDIu1hR8SNBzoAefEIVGM888UP1xoGO', NULL, 1, '41253486', '3183887199', '3183887199', 'calle4', 1, 1, 2, 1),
(4, '2025-09-18 21:30:24', '2025-09-18 21:30:24', 'eliza', 'flio', 'el@gmail.com', NULL, 'O', '$2y$12$54d4.I6lfE2nkdvsc72g3.CYQ10CYa71wtPjwE2ubYb/r.5WMY2yu', NULL, 1, '1144101112', '3183887199', '3183887199', 'calle 5 #95-4', 1, 1, 2, 1),
(5, '2025-09-18 22:44:54', '2025-09-18 22:44:54', 'sola', 'soledad', 'sol@gmail.com', NULL, 'O', '$2y$12$nwr3vt0cJ3EORWUHYx/cvucbWi4jUlo4f6gT8KSHxwZNGj3QZJvyi', NULL, 1, '1144101112', '3183887199', '3183887199', 'calle 4 #3-23', 1, 1, 2, 1),
(6, '2025-09-18 22:51:26', '2025-09-18 22:51:26', 'pepito', 'perez', 'pere@gmail.com', NULL, 'O', '$2y$12$NNv.oZiS1lFl94ToM/J6YuNkKpiPk5iWPNCNVWTdSRJmnEZPN3R8G', NULL, 1, '114412163', '3183887199', '3187956', 'cao', 1, 1, 2, 1),
(7, '2025-09-18 22:56:02', '2025-09-18 22:56:02', 'holi', 'kkhyh', 'ho@gmail.com', NULL, 'O', '$2y$12$XNwk7nvLLRss56u7GeX5QuBK6EbZcOkn9Q/DtSub8pf1SjYhjTIaK', NULL, 1, '31', '2313', '23103', '310', 1, 1, 2, 1),
(8, '2025-09-18 23:03:16', '2025-09-18 23:03:16', 'eugenio', 'derbez', 'eu@gmail.com', NULL, 'O', '$2y$12$ZHktQlKuc6ogugvBiVcmo.v5jcbrcZY8GfMvmrlPJxdYJKCoY8y9K', NULL, 1, '13134513', '31646', '310635433', 'calle 4', 1, 1, 2, 1),
(9, '2025-09-18 23:09:41', '2025-09-18 23:09:41', 'artemis', 'peres', 'art@gmail.com', NULL, 'O', '$2y$12$Pjz0oz/zk9MFTXulp6/wIurcZSH3Ebh49gvjbmOPYT8/jV0yldkKa', NULL, 1, '1314545', '3183887199', '3183887199', 'calle 4', 1, 1, 2, 1),
(10, '2025-09-18 23:13:40', '2025-09-18 23:13:40', 'ester', 'flor', 'es@gmail.com', NULL, 'O', '$2y$12$c1QGNQqNm7458XSMuyw.2eWzKcjl8ZkUapy6jqq396AOi11zUjUIq', NULL, 1, '43613566416', '319861663', '6132384', 'calle', 1, 1, 2, 1),
(11, '2025-09-18 23:17:43', '2025-09-18 23:17:43', 'renesme', 'pere<', 'mlfe@gmail.com', NULL, 'O', '$2y$12$5QCI3DGno/qmouqONcD4T.GzeYFChhoL1MK9al44MiF.9erjzD.a.', NULL, 1, '4146341', '323654163', '105241', 'calle 5', 1, 1, 2, 1),
(12, '2025-09-18 23:17:59', '2025-09-18 23:17:59', 'renesme', 'perez', 'rene@gmail.com', NULL, 'O', '$2y$12$L3pfawxRjEE.jMwoZDHXjusmRTsfBLSCEhz11Tnuzwbpyyu/9g54y', NULL, 1, '4146341', '323654163', '105241', 'calle 5', 1, 1, 2, 1),
(13, '2025-09-18 23:33:12', '2025-09-18 23:33:12', 'vale', 'cdsada', 'val@gmail.com', NULL, 'O', '$2y$12$dM7ALe0uABn3SngJ8HaR0eN1f4NzIuJGGzCWwy2Vrfl/joR07uqrG', NULL, 1, '3110325', '315364', '31513', 'calle', 1, 1, 2, 1),
(14, '2025-09-25 00:32:25', '2025-09-25 00:32:25', 'helen', 'mina', 'helendiaz@gmail.com', NULL, 'O', '$2y$12$uTK2tGi68uCY67BvMXixke9M8GyXK22Z.rx723AaGsnFph0UXDHte', NULL, 1, '114423563', '3183156', '2153453', 'calle 5', 1, 1, 2, 1),
(15, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Juan Carlos', 'Rodríguez López', 'admin@sincola.com', '1985-03-15', 'M', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 1, '10234567890', '3201234567', '6011234567', 'Calle 100 #15-30, Bogotá', 1, 1, 1, NULL),
(16, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'María Elena', 'García Fernández', 'maria.admin@sincola.com', '1990-07-22', 'F', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 1, '52987654321', '3189876543', '6019876543', 'Carrera 13 #85-42, Bogotá', 1, 1, 1, NULL),
(17, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Carlos Alberto', 'Mendoza Silva', 'carlos@glamour.com', '1982-11-08', 'M', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 1, '80123456789', '3112233445', '6012233445', 'Calle 123 #45-67, Bogotá', 1, 1, 4, 1),
(18, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Ana Patricia', 'Vásquez Torres', 'ana@vidasana.com', '1978-05-14', 'F', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 1, '41567890123', '3143344556', '6013344556', 'Carrera 15 #32-18, Bogotá', 1, 1, 4, 2),
(19, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Miguel Ángel', 'Herrera Gómez', 'miguel@elclasico.com', '1975-09-30', 'M', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 1, '79876543210', '3154455667', '6014455667', 'Avenida 19 #123-45, Bogotá', 1, 1, 4, 3),
(20, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Sofía', 'Ramírez Castro', 'sofia@glamour.com', '1995-02-18', 'F', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 1, '1098765432', '3165566778', NULL, 'Calle 45 #12-34, Bogotá', 1, 1, 3, 1),
(21, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Diego', 'Morales Ruiz', 'diego@vidasana.com', '1988-12-03', 'M', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 1, '1087654321', '3176677889', NULL, 'Carrera 8 #56-78, Bogotá', 1, 1, 3, 2),
(22, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Valentina', 'Jiménez Peña', 'valentina@elclasico.com', '1992-06-25', 'F', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 1, '1076543210', '3187788990', NULL, 'Calle 67 #89-01, Bogotá', 1, 1, 3, 3),
(23, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Andrea', 'López Martín', 'andrea.lopez@email.com', '1993-04-12', 'F', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 1, '1065432109', '3198899001', NULL, 'Calle 34 #67-89, Bogotá', 1, 1, 2, NULL),
(24, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Roberto', 'González Díaz', 'roberto.gonzalez@email.com', '1987-08-20', 'M', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 1, '1054321098', '3200990112', NULL, 'Carrera 20 #45-12, Bogotá', 1, 1, 2, NULL),
(25, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Camila', 'Sánchez Vargas', 'camila.sanchez@email.com', '1996-01-07', 'F', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 1, '1043210987', '3210001223', NULL, 'Avenida 9 #78-90, Bogotá', 1, 1, 2, NULL),
(26, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Fernando', 'Castillo Mejía', 'fernando.castillo@email.com', '1991-10-15', 'M', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 1, '1032109876', '3221112334', NULL, 'Calle 52 #23-45, Bogotá', 1, 1, 2, NULL),
(27, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Isabella', 'Torres Rojas', 'isabella.torres@email.com', '1989-12-28', 'F', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 1, '1021098765', '3232223445', NULL, 'Carrera 30 #67-23, Bogotá', 1, 1, 2, NULL),
(28, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Alejandro', 'Muñoz Ortega', 'alejandro.munoz@email.com', '1994-03-11', 'M', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 1, '1010987654', '3243334556', NULL, 'Calle 78 #34-56, Bogotá', 1, 1, 2, NULL),
(29, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Daniela', 'Restrepo Luna', 'daniela.restrepo@email.com', '1997-09-05', 'F', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 1, '1009876543', '3254445667', NULL, 'Avenida 45 #12-78, Bogotá', 1, 1, 2, NULL),
(30, '2025-09-24 20:18:05', '2025-09-24 20:18:05', 'Sebastián', 'Aguilar Vera', 'sebastian.aguilar@email.com', '1986-06-18', 'M', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 1, '998765432', '3265556778', NULL, 'Carrera 50 #89-12, Bogotá', 1, 1, 2, NULL),
(31, '2025-09-26 01:39:45', '2025-09-26 01:39:45', 'david', 'marin', 'marin@gmail.com', NULL, 'O', '$2y$12$DyK1hCaDaMCxgWb.oi5suetJuZX0BdYnEDLictdEMlqmfr4cQS6N2', NULL, 1, '114535', '31834646', '316466', 'calle3', 1, 1, 2, 1),
(32, '2025-09-26 01:41:31', '2025-09-26 01:41:31', 'david', 'marin', 'david@gmail.com', NULL, 'O', '$2y$12$tBx1.UUC78xd4hl0QhYjrevGdSC6lsn1NiTeHovJ0VPjtMheq5NgG', NULL, 1, '3136513', '3138613', '03134361', 'calle', 1, 1, 2, 1),
(33, '2025-09-26 01:48:14', '2025-09-26 01:48:14', 'david', 'marin', 'daviiiiid@gmail.com', NULL, 'O', '$2y$12$fWx2D1rviEJTBtTv25OG.OfJUEUPtbNmublYDiMZHevErdx63Ik9e', NULL, 1, '3136513', '3138613', '03134361', 'calle', 1, 1, 2, 1);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `agendas`
--
ALTER TABLE `agendas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `agendas_negocios_id_foreign` (`negocios_id`),
  ADD KEY `agendas_usuarios_id_foreign` (`usuarios_id`);

--
-- Indices de la tabla `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `appointments_usuarios_id_foreign` (`usuarios_id`),
  ADD KEY `appointments_negocios_id_foreign` (`negocios_id`),
  ADD KEY `appointments_servicios_id_foreign` (`servicios_id`),
  ADD KEY `appointments_estados_id_foreign` (`estados_id`);

--
-- Indices de la tabla `businesses`
--
ALTER TABLE `businesses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `businesses_nit_unique` (`nit`),
  ADD KEY `businesses_estados_id_foreign` (`estados_id`),
  ADD KEY `businesses_tipo_servicio_id_foreign` (`tipo_servicio_id`),
  ADD KEY `businesses_planes_id_foreign` (`planes_id`);

--
-- Indices de la tabla `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`);

--
-- Indices de la tabla `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`);

--
-- Indices de la tabla `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `categories_estados_id_foreign` (`estados_id`);

--
-- Indices de la tabla `customizations`
--
ALTER TABLE `customizations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `customizations_negocios_id_unique` (`negocios_id`),
  ADD KEY `customizations_negocios_id_index` (`negocios_id`);

--
-- Indices de la tabla `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indices de la tabla `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indices de la tabla `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Indices de la tabla `plans`
--
ALTER TABLE `plans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `plans_estados_id_foreign` (`estados_id`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `roles_estados_id_foreign` (`estados_id`);

--
-- Indices de la tabla `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`),
  ADD KEY `services_tipos_id_foreign` (`tipos_id`),
  ADD KEY `services_estados_id_foreign` (`estados_id`),
  ADD KEY `services_negocios_id_foreign` (`negocios_id`);

--
-- Indices de la tabla `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indices de la tabla `statuses`
--
ALTER TABLE `statuses`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD KEY `users_tipo_identificacion_id_foreign` (`tipo_identificacion_id`),
  ADD KEY `users_estados_id_foreign` (`estados_id`),
  ADD KEY `users_roles_id_foreign` (`roles_id`),
  ADD KEY `users_negocios_id_foreign` (`negocios_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `agendas`
--
ALTER TABLE `agendas`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de la tabla `businesses`
--
ALTER TABLE `businesses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `categories`
--
ALTER TABLE `categories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT de la tabla `customizations`
--
ALTER TABLE `customizations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT de la tabla `plans`
--
ALTER TABLE `plans`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `services`
--
ALTER TABLE `services`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `statuses`
--
ALTER TABLE `statuses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `agendas`
--
ALTER TABLE `agendas`
  ADD CONSTRAINT `agendas_negocios_id_foreign` FOREIGN KEY (`negocios_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `agendas_usuarios_id_foreign` FOREIGN KEY (`usuarios_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_estados_id_foreign` FOREIGN KEY (`estados_id`) REFERENCES `statuses` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `appointments_negocios_id_foreign` FOREIGN KEY (`negocios_id`) REFERENCES `businesses` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `appointments_servicios_id_foreign` FOREIGN KEY (`servicios_id`) REFERENCES `services` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `appointments_usuarios_id_foreign` FOREIGN KEY (`usuarios_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `businesses`
--
ALTER TABLE `businesses`
  ADD CONSTRAINT `businesses_estados_id_foreign` FOREIGN KEY (`estados_id`) REFERENCES `statuses` (`id`),
  ADD CONSTRAINT `businesses_planes_id_foreign` FOREIGN KEY (`planes_id`) REFERENCES `plans` (`id`),
  ADD CONSTRAINT `businesses_tipo_servicio_id_foreign` FOREIGN KEY (`tipo_servicio_id`) REFERENCES `categories` (`id`);

--
-- Filtros para la tabla `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_estados_id_foreign` FOREIGN KEY (`estados_id`) REFERENCES `statuses` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Filtros para la tabla `customizations`
--
ALTER TABLE `customizations`
  ADD CONSTRAINT `customizations_negocios_id_foreign` FOREIGN KEY (`negocios_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `plans`
--
ALTER TABLE `plans`
  ADD CONSTRAINT `plans_estados_id_foreign` FOREIGN KEY (`estados_id`) REFERENCES `statuses` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `roles`
--
ALTER TABLE `roles`
  ADD CONSTRAINT `roles_estados_id_foreign` FOREIGN KEY (`estados_id`) REFERENCES `statuses` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `services`
--
ALTER TABLE `services`
  ADD CONSTRAINT `services_estados_id_foreign` FOREIGN KEY (`estados_id`) REFERENCES `statuses` (`id`),
  ADD CONSTRAINT `services_negocios_id_foreign` FOREIGN KEY (`negocios_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `services_tipos_id_foreign` FOREIGN KEY (`tipos_id`) REFERENCES `categories` (`id`);

--
-- Filtros para la tabla `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_estados_id_foreign` FOREIGN KEY (`estados_id`) REFERENCES `statuses` (`id`),
  ADD CONSTRAINT `users_negocios_id_foreign` FOREIGN KEY (`negocios_id`) REFERENCES `businesses` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `users_roles_id_foreign` FOREIGN KEY (`roles_id`) REFERENCES `roles` (`id`),
  ADD CONSTRAINT `users_tipo_identificacion_id_foreign` FOREIGN KEY (`tipo_identificacion_id`) REFERENCES `categories` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
