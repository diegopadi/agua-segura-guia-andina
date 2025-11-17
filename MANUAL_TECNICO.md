# MANUAL TÉCNICO - APP ACELERADORES PEDAGÓGICOS

**Versión:** 1.0  
**Fecha:** Noviembre 2024  
**Proyecto:** Docentes.IA - App Aceleradores Pedagógicos de Seguridad Hídrica

---

## 📋 ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Base de Datos](#base-de-datos)
6. [Autenticación y Autorización](#autenticación-y-autorización)
7. [Funcionalidades Implementadas](#funcionalidades-implementadas)
8. [Funcionalidades Pendientes](#funcionalidades-pendientes)
9. [Edge Functions (Backend)](#edge-functions-backend)
10. [Sistema de Diseño](#sistema-de-diseño)
11. [Rutas y Navegación](#rutas-y-navegación)
12. [Componentes Clave](#componentes-clave)
13. [Hooks Personalizados](#hooks-personalizados)
14. [Problemas de Seguridad Identificados](#problemas-de-seguridad-identificados)
15. [Guía de Desarrollo](#guía-de-desarrollo)
16. [Deployment](#deployment)

---

## 1. RESUMEN EJECUTIVO

### ¿Qué es esta aplicación?

**Docentes.IA** es una plataforma web educativa basada en inteligencia artificial que ayuda a docentes peruanos a diseñar unidades didácticas completas sobre seguridad hídrica. La aplicación está alineada al Currículo Nacional de Educación Básica (CNEB) de Perú.

### Estado Actual del Desarrollo

**Porcentaje de Completitud Estimado:** ~75%

- ✅ **Completado:** Arquitectura base, autenticación, flujos principales (Etapa 1, 2, 3), generación de documentos PDF, integración con OpenAI
- ⚠️ **En Desarrollo:** Sistema CNPIE (proyectos 2A, 2B, 2C), repositorio de documentos, mejoras de UX
- ❌ **Pendiente:** Seguridad (autorización admin), validación de archivos, pruebas exhaustivas, documentación técnica completa

### Usuarios Objetivo

1. **Docentes de educación básica** en Perú (usuarios principales)
2. **Administradores del sistema** (gestión de usuarios y contenidos)
3. **Equipos pedagógicos** (revisión y análisis de propuestas)

---

## 2. ARQUITECTURA DEL SISTEMA

### Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React + Vite)                 │
│  - Interface de usuario                                      │
│  - Gestión de estado (React Query)                           │
│  - Routing (React Router)                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  SUPABASE BACKEND                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │ Edge Functions│  │    Storage   │      │
│  │   Database   │  │   (Deno TS)  │  │  (Archivos)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐                                            │
│  │     Auth     │  (Gestión de usuarios)                    │
│  └──────────────┘                                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVICIOS EXTERNOS                        │
│  - OpenAI API (GPT-4) para generación de contenido IA       │
│  - Almacenamiento de archivos (PDFs, DOCs)                  │
└─────────────────────────────────────────────────────────────┘
```

### Patrones de Arquitectura

1. **Frontend:** Component-Based Architecture (React)
2. **Backend:** Serverless Functions (Supabase Edge Functions)
3. **Base de Datos:** Relational Database (PostgreSQL vía Supabase)
4. **Estado:** Client-side state management con React Query para cache y sincronización

---

## 3. STACK TECNOLÓGICO

### Frontend

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| **React** | 18.3.1 | Framework UI principal |
| **TypeScript** | Latest | Type safety |
| **Vite** | Latest | Build tool y dev server |
| **React Router** | 6.26.2 | Routing |
| **TanStack Query** | 5.56.2 | Server state management |
| **Tailwind CSS** | Latest | Styling |
| **shadcn/ui** | Latest | Component library |
| **Lucide React** | 0.462.0 | Iconografía |

### Backend (Supabase)

| Tecnología | Propósito |
|-----------|-----------|
| **PostgreSQL** | Base de datos relacional |
| **Edge Functions** | Serverless functions (Deno/TypeScript) |
| **Supabase Auth** | Autenticación de usuarios |
| **Supabase Storage** | Almacenamiento de archivos |

### Servicios Externos

- **OpenAI API** (GPT-4): Generación de contenido pedagógico con IA

---

## 4. ESTRUCTURA DEL PROYECTO

```
app-aceleradores/
├── src/
│   ├── assets/              # Imágenes y recursos estáticos
│   ├── components/          # Componentes React reutilizables
│   │   ├── auth/           # Componentes de autenticación
│   │   ├── cnpie/          # Componentes específicos CNPIE
│   │   ├── ui/             # Componentes UI base (shadcn)
│   │   └── ...
│   ├── hooks/              # Custom React hooks
│   ├── integrations/       # Integraciones externas
│   │   └── supabase/      # Cliente y tipos de Supabase
│   ├── lib/               # Utilidades y helpers
│   ├── pages/             # Componentes de página (routing)
│   │   ├── admin/         # Páginas de administración
│   │   ├── cnpie/         # Páginas del sistema CNPIE
│   │   ├── etapa1/        # Páginas Etapa 1
│   │   ├── etapa2/        # Páginas Etapa 2
│   │   ├── etapa3/        # Páginas Etapa 3
│   │   └── proyectos/     # Páginas de proyectos
│   ├── styles/            # Estilos CSS adicionales
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Funciones de utilidad
│   ├── App.tsx            # Componente principal
│   ├── main.tsx           # Entry point
│   └── index.css          # Estilos globales + design tokens
│
├── supabase/
│   ├── functions/         # Edge Functions (serverless backend)
│   │   ├── _shared/       # Código compartido
│   │   ├── admin-*/       # Funciones de administración
│   │   ├── analyze-*/     # Funciones de análisis IA
│   │   ├── generate-*/    # Funciones de generación de contenido
│   │   └── ...
│   ├── migrations/        # Migraciones de base de datos
│   └── config.toml        # Configuración de Supabase
│
├── public/               # Archivos públicos estáticos
└── [archivos de configuración]
```

---

## 5. BASE DE DATOS

### Esquema de Tablas Principales

#### `profiles`
Información adicional de usuarios (extiende auth.users)
```sql
- id (uuid, PK)
- user_id (uuid, FK a auth.users)
- full_name (text)
- phone (text)
- ie_name (text) -- Nombre de institución educativa
- ie_region, ie_province, ie_district (text)
- area_docencia (text)
- created_at, updated_at (timestamptz)
```

#### `acelerador_sessions`
Sesiones de trabajo en aceleradores (Etapas 1, 2, 3)
```sql
- id (uuid, PK)
- user_id (uuid, FK)
- acelerador_number (int) -- 1, 2, 3, 4, 5, 8, 9, 10
- current_step (int) -- Paso actual en el acelerador
- session_data (jsonb) -- Datos del formulario
- status (text) -- 'active', 'completed'
- created_at, updated_at (timestamptz)
```

#### `unidades_aprendizaje`
Unidades didácticas generadas (Etapa 3)
```sql
- id (uuid, PK)
- user_id (uuid, FK)
- titulo (text)
- area_curricular (text)
- grado (text)
- numero_sesiones (int)
- duracion_min (int)
- proposito (text)
- evidencias (text)
- competencias_ids (text[])
- estado (text) -- 'draft', 'completed', 'closed'
- created_at, updated_at (timestamptz)
```

#### `sesiones_clase`
Sesiones de aprendizaje individuales
```sql
- id (uuid, PK)
- unidad_id (uuid, FK a unidades_aprendizaje)
- user_id (uuid, FK)
- session_index (int)
- titulo (text)
- inicio, desarrollo, cierre (text) -- Fases de la sesión
- evidencias (text[])
- estado (text)
- created_at, updated_at (timestamptz)
```

#### `rubricas_evaluacion`
Rúbricas de evaluación
```sql
- id (uuid, PK)
- unidad_id (uuid, FK a unidades_aprendizaje)
- user_id (uuid, FK)
- estructura (jsonb) -- Estructura JSON de la rúbrica
- estado (text)
- created_at, updated_at (timestamptz)
```

#### `cnpie_proyectos`
Proyectos del sistema CNPIE (2A, 2B, 2C)
```sql
- id (uuid, PK)
- user_id (uuid, FK)
- tipo_proyecto (text) -- '2A', '2B', '2C'
- etapa_actual, acelerador_actual (int)
- datos_aceleradores (jsonb)
- documentos_postulacion (jsonb)
- created_at, updated_at (timestamptz)
```

#### `cnpie_rubricas`
Rúbricas de evaluación CNPIE
```sql
- id (uuid, PK)
- categoria (text) -- '2A', '2B', '2C'
- criterio (text)
- indicador (text)
- puntaje_maximo (int)
- descripcion (text)
- orden (int)
```

#### `surveys` y relacionadas
Sistema de encuestas
```sql
surveys:
- id (uuid, PK)
- user_id (uuid, FK)
- title, description (text)
- status (text) -- 'active', 'closed'
- participant_token (text) -- Token público

survey_questions:
- id (uuid, PK)
- survey_id (uuid, FK)
- question_text (text)
- question_type (text) -- 'text', 'multiple_choice', etc.
- order_number (int)

survey_responses:
- id (uuid, PK)
- survey_id (uuid, FK)
- participant_token (text)
- question_id (uuid, FK)
- response_data (jsonb)
```

#### `files`
Archivos subidos por usuarios
```sql
- id (uuid, PK)
- user_id (uuid, FK)
- url (text) -- URL de Supabase Storage
- original_name (text)
- file_type (text)
- size_bytes (int)
- created_at (timestamptz)
```

### Storage Buckets

1. **`user_uploads`** (público): Archivos subidos por usuarios (PDFs, DOCs)
2. **`diagnosticos-pdf`** (privado): PDFs generados de diagnósticos

---

## 6. AUTENTICACIÓN Y AUTORIZACIÓN

### Sistema de Autenticación

- **Provider:** Supabase Auth
- **Métodos soportados:** Email/Password
- **Flujo:** 
  1. Usuario se registra con email/password
  2. Se crea entrada en `auth.users` (Supabase)
  3. Se crea perfil en `profiles` (trigger automático)
  4. JWT token se almacena en localStorage
  5. `AuthGuard` protege rutas privadas

### Roles

**⚠️ ADVERTENCIA DE SEGURIDAD:** El sistema de roles actualmente NO está implementado correctamente.

- **Rol Admin:** 
  - Definido por password hardcodeado en cliente (`docentesia2025`)
  - ❌ **CRÍTICO:** Sin validación server-side
  - ❌ **CRÍTICO:** Password expuesto en código fuente

- **Rol Usuario:** Por defecto para todos los usuarios registrados

### Componentes de Auth

- `src/hooks/useAuth.tsx`: Hook principal de autenticación
- `src/components/auth/AuthGuard.tsx`: Protección de rutas
- `src/components/auth/LoginForm.tsx`: Formulario de login
- `src/components/auth/RegisterForm.tsx`: Formulario de registro
- `src/pages/Admin.tsx`: Página de administración (vulnerabilidad)

---

## 7. FUNCIONALIDADES IMPLEMENTADAS

### ✅ Completado al 100%

#### Etapa 1: Diagnóstico Institucional

**Acelerador 1 - Diagnóstico Institucional**
- ✅ Upload de PEI (PDF)
- ✅ Formulario de contexto institucional
- ✅ Análisis con IA (GPT-4) del PEI
- ✅ Detección de información faltante
- ✅ Preguntas adicionales dinámicas
- ✅ Generación de reporte PDF diagnóstico
- ✅ Guardado de progreso
- **Archivo principal:** `src/pages/etapa1/Acelerador1.tsx`

**Acelerador 2 - Evaluación Diagnóstica**
- ✅ Generación de encuesta para estudiantes
- ✅ Sistema de encuestas públicas (compartir con token)
- ✅ Recolección de respuestas anónimas
- ✅ Análisis de resultados con IA
- ✅ Generación de reporte diagnóstico estudiantil
- **Archivo principal:** `src/pages/etapa1/Acelerador2.tsx`

**Acelerador 3 - Capacidades Docentes**
- ✅ Cuestionario de autoevaluación docente
- ✅ Análisis de capacidades con IA
- ✅ Generación de reporte de prioridades
- ✅ Recomendaciones pedagógicas
- **Archivo principal:** `src/pages/etapa1/Acelerador3.tsx`

#### Etapa 2: Diseño Pedagógico

**Acelerador 4 - Estrategias Metodológicas**
- ✅ Selección de prioridades (de Acelerador 3)
- ✅ Generación de estrategias pedagógicas con IA
- ✅ Refinamiento interactivo de estrategias
- ✅ Generación de reporte de estrategias
- **Archivo principal:** `src/pages/etapa2/Acelerador4.tsx`

**Acelerador 5 - Diseño de Unidad de Aprendizaje**
- ✅ Wizard de 8 pasos para diseño de unidad
- ✅ Información básica de la unidad
- ✅ Situación significativa y propósito
- ✅ Selección de competencias del CNEB
- ✅ Generación de estructura de sesiones con IA
- ✅ Feedback interactivo con chat IA
- ✅ Generación de materiales educativos
- ✅ Preview final y exportación
- **Archivo principal:** `src/pages/etapa2/Acelerador5.tsx`

#### Etapa 3: Desarrollo de Sesiones

**Acelerador 8 - Sesiones de Aprendizaje**
- ✅ Generación automática de sesiones completas
- ✅ Estructura: Inicio, Desarrollo, Cierre
- ✅ Edición de sesiones
- ✅ Exportación a PDF
- ✅ Vista previa de documentos
- **Archivo principal:** `src/pages/etapa3/Acelerador8.tsx`

**Acelerador 9 - Rúbricas de Evaluación**
- ✅ Generación de rúbricas alineadas a competencias
- ✅ Edición de rúbricas
- ✅ Exportación a PDF
- **Archivo principal:** `src/pages/etapa3/Acelerador9.tsx`

**Acelerador 10 - Instrumentos de Evaluación**
- ✅ Generación de instrumentos por sesión
- ✅ Edición de instrumentos
- ✅ Exportación a PDF
- **Archivo principal:** `src/pages/etapa3/Acelerador10.tsx`

### ⚠️ Implementado al 50-80%

#### Sistema CNPIE (Proyectos 2A, 2B, 2C)

**Estado:** Arquitectura completa, funcionalidades principales implementadas, pendiente testing exhaustivo

**Proyecto 2A - Propuesta Pedagógica**
- ✅ Estructura de 3 etapas
- ✅ Etapa 1: Upload de documentos y extracción con IA
- ✅ Etapa 2: 7 aceleradores de desarrollo
- ✅ Etapa 3: Documento final
- ⚠️ Validación de documentos incompleta
- ⚠️ Sistema de evaluación predictiva (parcial)
- **Archivos:** `src/pages/cnpie/2a/*`

**Proyectos 2B y 2C**
- ✅ Rutas creadas
- ❌ Implementación pendiente (similar a 2A)
- **Archivos:** `src/pages/proyectos/Proyecto2B.tsx`, `Proyecto2C.tsx`

#### Repositorio de Documentos

- ✅ Upload de múltiples archivos
- ✅ Gestión de archivos (ver, eliminar)
- ✅ Extracción de datos con IA (`extract-repository-data`)
- ⚠️ Validación de archivos insuficiente (seguridad)
- **Archivo:** `src/pages/Repositorio.tsx`

#### Panel de Administración

- ✅ Interfaz de administración básica
- ✅ Lista de usuarios
- ✅ Reset de contraseña
- ✅ Eliminación de usuarios
- ❌ **SIN AUTORIZACIÓN SERVER-SIDE** (vulnerabilidad crítica)
- **Archivos:** `src/pages/admin/*`

### ❌ No Implementado / Pendiente

1. **Sistema de Notificaciones:** No hay sistema de notificaciones push o email
2. **Historial de Versiones:** No hay versionado de documentos generados
3. **Exportación a DOCX:** Sólo se exporta a PDF
4. **Colaboración:** No hay funcionalidades colaborativas entre docentes
5. **Analytics/Métricas:** No hay dashboard de métricas de uso
6. **Búsqueda Avanzada:** No hay buscador de unidades o documentos
7. **Plantillas Predefinidas:** No hay biblioteca de plantillas
8. **Feedback de Calidad:** No hay sistema de evaluación de calidad de outputs
9. **Integración CNEB Completa:** Catálogo de competencias limitado
10. **Multiplataforma:** No hay apps móviles nativas

---

## 8. EDGE FUNCTIONS (BACKEND)

### Categorías de Edge Functions

#### Administración (6 funciones)
```
admin-get-users           - Lista todos los usuarios
admin-get-user-details    - Obtiene detalles de un usuario
admin-delete-user         - Elimina un usuario
admin-reset-password      - Resetea password a default
```
⚠️ **VULNERABILIDAD CRÍTICA:** Sin validación de autorización server-side

#### Análisis con IA (12 funciones)
```
analyze-pei                    - Analiza PEI institucional
analyze-unit-coherence         - Valida coherencia de unidad
analyze-cnpie-[criterio]       - Analiza proyectos CNPIE (6 funciones)
extract-diagnostico-text       - Extrae texto de diagnóstico
extract-repository-data        - Extrae datos de archivos del repositorio
```

#### Generación de Contenido (23 funciones)
```
generate-report                         - Reporte diagnóstico institucional
generate-acelerador2-report            - Reporte diagnóstico estudiantil
generate-priority-report               - Reporte de prioridades docentes
generate-strategies-ac4                - Estrategias metodológicas
generate-strategies-report             - Reporte de estrategias
generate-borrador-unidad-ac5          - Borrador de unidad
generate-estructura-sesiones-ac5       - Estructura de sesiones
generate-documento-final-ac5          - Documento final unidad
generate-session-structure            - Estructura de sesión individual
generate-rubricas-sesion              - Rúbricas por sesión
generate-evaluation-rubric            - Rúbrica de evaluación
generate-materials-ac5                - Materiales educativos
generate-feedback-ac5                 - Feedback de unidad
generate-situation-purpose-ac5        - Situación y propósito
generate-competencias-cneb            - Competencias CNEB
...y más
```

#### Encuestas (4 funciones)
```
generate-survey-questions      - Genera preguntas de encuesta
generate-survey-report        - Genera reporte de encuesta
correct-survey-questions      - Corrige/valida preguntas
generate-teacher-questions    - Genera preguntas para docentes
```

#### CNPIE (7 funciones)
```
evaluate-cnpie-project         - Evaluación predictiva de proyecto
analyze-cnpie-[6 criterios]    - Análisis por criterio
```

#### Utilidades (7 funciones)
```
get-accelerator3-results       - Obtiene resultados de acelerador 3
get-unidad-sesiones           - Obtiene sesiones de una unidad
prepare-sesion-clase          - Prepara sesión para exportación
exportar-sesion-html          - Exporta sesión a HTML
recommend-project-type        - Recomienda tipo de proyecto
validate-etapa3-coherence     - Valida coherencia de Etapa 3
a8-ping                       - Health check
```

### Configuración de Funciones

**Archivo:** `supabase/config.toml`

**Funciones públicas (verify_jwt = false):**
- `analyze-pei`
- `generate-report`
- `generate-teacher-capacity-questionnaire`
- `generate-priority-report`

⚠️ Estas funciones son llamables sin autenticación, lo que puede causar:
- Abuso de recursos
- Consumo excesivo de API OpenAI
- Necesitan rate limiting

---

## 9. SISTEMA DE DISEÑO

### Paleta de Colores (Tema: Agua Segura)

**Colores Principales:**
```css
--primary: hsl(193, 100%, 23%)       /* Deep Ocean Blue #005F73 */
--secondary: hsl(172, 70%, 45%)      /* Teal Splash #2EC4B6 */
--accent: hsl(200, 100%, 41%)        /* Sky Blue #0E8CC3 */
--background: hsl(240, 20%, 97%)     /* Soft Wave #F0F4F8 */
--foreground: hsl(207, 40%, 8%)      /* Dark Navy #001219 */
```

**Colores Semánticos:**
```css
--success: hsl(143, 60%, 40%)        /* Sea Green */
--warning: hsl(37, 100%, 71%)        /* Sunset Yellow */
--destructive: hsl(356, 75%, 53%)    /* Coral Red */
```

**Sidebar:**
```css
--sidebar-background: hsl(193, 100%, 23%)  /* Deep Ocean Blue */
--sidebar-foreground: hsl(172, 42%, 90%)   /* Light Foam */
```

### Tipografía

- **Font Family:** System fonts (default de Tailwind)
- **Tamaños:** Escala modular de Tailwind CSS

### Componentes UI

**Biblioteca:** shadcn/ui (componentes copiables y personalizables)

**Componentes disponibles:**
- Accordion, Alert, AlertDialog
- Avatar, Badge, Breadcrumb
- Button, Calendar, Card, Carousel
- Checkbox, Collapsible, Command
- Dialog, Drawer, Dropdown Menu
- Form, Input, Label, Select
- Sheet, Sidebar, Skeleton
- Table, Tabs, Textarea, Toast
- Tooltip, ...y más (60+ componentes)

### Responsive Design

- **Breakpoints de Tailwind:**
  - `sm`: 640px
  - `md`: 768px
  - `lg`: 1024px
  - `xl`: 1280px
  - `2xl`: 1400px (customizado)

---

## 10. RUTAS Y NAVEGACIÓN

### Rutas Públicas

```
/encuesta/:token          PublicSurvey (sin autenticación)
```

### Rutas Protegidas (requieren auth)

#### Principal
```
/                         Inicio (dashboard)
/ayuda                   Ayuda
/documentos              Documentos generados
/pitch                   Pitch (métricas)
```

#### Proyectos
```
/proyectos               Lista de proyectos
/proyectos/generacion    Generación de proyectos
/proyectos/manual        Manual de proyectos
/proyectos/2a            Proyecto CNPIE 2A
/proyectos/2b            Proyecto CNPIE 2B
/proyectos/2c            Proyecto CNPIE 2C
/repositorio             Repositorio de archivos
/mini-cambio-proyecto    Cambio de proyecto
```

#### Etapa 1 - Diagnóstico
```
/etapa1                  Overview Etapa 1
/etapa1/acelerador1      Diagnóstico Institucional
/etapa1/acelerador2      Evaluación Diagnóstica
/etapa1/acelerador3      Capacidades Docentes
```

#### Etapa 2 - Diseño Pedagógico
```
/etapa2                  Overview Etapa 2
/etapa2/acelerador4      Estrategias Metodológicas
/etapa2/acelerador5      Diseño de Unidad
```

#### Etapa 3 - Desarrollo de Sesiones
```
/etapa3                    Overview Etapa 3
/etapa3/acelerador8        Sesiones de Aprendizaje
/etapa3/acelerador9        Rúbricas de Evaluación
/etapa3/acelerador10       Instrumentos de Evaluación
/etapa3/evaluacion-final   Evaluación Final
/etapa3/vista-final/:id    Vista Final de Unidad
```

#### CNPIE (Proyectos 2A, 2B, 2C)
```
/cnpie/2a/etapa1/acelerador1       Acelerador 1 (2A)
/cnpie/2a/etapa2/overview          Overview Etapa 2 (2A)
/cnpie/2a/etapa2/acelerador[2-7]   Aceleradores 2-7 (2A)
/cnpie/2a/etapa2/evaluacion-final  Evaluación Final (2A)
/cnpie/2a/etapa3/acelerador8       Acelerador 8 (2A)
/cnpie/2a/proyecto-completado      Proyecto Completado (2A)
```

#### Administración
```
/admin                   Panel Admin (vulnerabilidad)
/admin/users             Gestión de Usuarios
/admin/users/:userId     Detalles de Usuario
```

---

## 11. COMPONENTES CLAVE

### Componentes de Layout

**`Layout.tsx`**
- Wrapper principal con Sidebar
- Navegación principal
- Manejo de responsive

**`AppSidebar.tsx`**
- Sidebar de navegación
- Menú dinámico según ruta
- Indicadores de progreso

### Componentes de Autenticación

**`AuthGuard.tsx`**
- Protección de rutas
- Redirección a login si no autenticado

**`LoginForm.tsx`, `RegisterForm.tsx`**
- Formularios de autenticación
- Validación con Zod
- Integración con Supabase Auth

**`ProfileForm.tsx`**
- Edición de perfil de usuario
- Update de datos personales

**`ChangePasswordForm.tsx`**
- Cambio de contraseña

### Componentes CNPIE

**`CNPIEAcceleratorLayout.tsx`**
- Layout compartido para aceleradores CNPIE
- Navegación entre aceleradores
- Progress tracking

**`SmartDocumentLoader.tsx`**
- Upload inteligente de documentos
- Extracción automática con IA
- Preview de datos extraídos

**`CNPIERubricViewer.tsx`**
- Visualización de rúbricas CNPIE
- Scores por criterio

**`CNPIEValidationModal.tsx`**
- Validación de datos antes de completar

**`ExtractionPreviewModal.tsx`**
- Preview de datos extraídos de documentos
- Confirmación antes de usar

### Componentes de Formularios

**`QuestionsForm.tsx`**
- Formulario dinámico de preguntas
- Múltiples tipos de input
- Validación

**`CompetenciasMultiSelect.tsx`**
- Selector de competencias del CNEB
- Multi-selección con búsqueda

**`RepositoryFilePicker.tsx`**
- Selector de archivos del repositorio
- Preview de archivos

### Componentes de Etapas

**Etapa 1:**
- `PEIUploader.tsx`: Upload de PEI
- `AIAnalysis.tsx`: Análisis IA de completitud
- `ReportViewer.tsx`: Visualización de reportes
- `ParticipantList.tsx`: Lista de participantes de encuesta
- `StudentCharacteristics.tsx`: Características de estudiantes

**Etapa 2:**
- `Step1Welcome.tsx` - `Step8FinalPreview.tsx`: Wizard de 8 pasos
- `InteractiveChatStep.tsx`: Chat con IA para refinamiento
- `StrategiesViewerStep.tsx`: Visualización de estrategias

**Etapa 3:**
- Componentes de edición de sesiones
- Generadores de rúbricas
- Exportadores de PDF

---

## 12. HOOKS PERSONALIZADOS

### Hooks de Estado Global

**`useAuth.tsx`**
- Gestión de autenticación
- Login, logout, register
- Estado del usuario actual
- Verificación de sesión

**`useProfile.tsx`**
- Gestión del perfil de usuario
- CRUD de datos de perfil
- Sincronización con Supabase

### Hooks de Features

**`useCNPIEProject.tsx`**
- Gestión de proyectos CNPIE
- Guardado de datos por acelerador
- Validación de aceleradores
- Progress tracking

**`useEtapa3V2.tsx`**
- Gestión de Etapa 3
- Unidades de aprendizaje
- Sesiones de clase
- Rúbricas de evaluación

**`useCNPIERubric.tsx`**
- Carga de rúbricas CNPIE
- Filtrado por categoría (2A, 2B, 2C)
- Cálculo de scores

**`useAcceleratorProgress.tsx`**
- Seguimiento de progreso en aceleradores
- Porcentajes de completitud
- Estado de sesiones

**`useFileManager.tsx`**
- Gestión de archivos en Storage
- Upload, delete
- Listado de archivos del usuario

**`useDocumentExtraction.tsx`**
- Extracción de datos de documentos con IA
- Estado de extracción
- Manejo de errores

### Hooks de UI

**`useDebounce.tsx`**
- Debouncing de valores
- Útil para búsquedas

**`use-mobile.tsx`**
- Detección de dispositivo móvil
- Responsive hooks

**`use-toast.ts`**
- Sistema de notificaciones toast
- Integración con sonner

---

## 13. PROBLEMAS DE SEGURIDAD IDENTIFICADOS

### 🚨 CRÍTICOS (Requieren atención inmediata)

#### 1. Admin Functions Sin Autorización
**Severidad:** Crítica  
**Ubicación:** 
- `supabase/functions/admin-reset-password/index.ts`
- `supabase/functions/admin-delete-user/index.ts`
- `supabase/functions/admin-get-users/index.ts`

**Problema:**
Las funciones de administración NO validan que el caller sea admin. Cualquier usuario autenticado puede:
- Eliminar cualquier usuario
- Resetear cualquier contraseña al default conocido
- Acceder a lista completa de usuarios

**Solución requerida:**
```typescript
// Agregar al inicio de cada función admin:
const authHeader = req.headers.get('Authorization');
if (!authHeader) throw new Error('Unauthorized');

const jwt = authHeader.replace('Bearer ', '');
const { data: { user } } = await supabaseAdmin.auth.getUser(jwt);

if (user?.user_metadata?.role !== 'admin') {
  throw new Error('Forbidden: Admin access required');
}
```

#### 2. Password de Admin Hardcodeado en Cliente
**Severidad:** Crítica  
**Ubicación:** `src/pages/Admin.tsx` línea 10

**Problema:**
```typescript
const ADMIN_PASSWORD = "docentesia2025";
```
El password está visible en el código fuente del cliente. Cualquiera puede:
1. Abrir DevTools
2. Buscar "ADMIN_PASSWORD"
3. Acceder al panel admin

**Solución requerida:**
- Eliminar password de cliente completamente
- Implementar role-based access control con user metadata
- Validar role='admin' en server-side

#### 3. Validación de Archivos Insuficiente
**Severidad:** Crítica  
**Ubicación:** `supabase/functions/extract-repository-data/index.ts`

**Problemas:**
- No valida MIME types (solo extensión de archivo)
- No limita tamaño de archivo
- No sanitiza contenido antes de enviar a OpenAI
- Vulnerable a prompt injection

**Solución requerida:**
- Validar MIME type real del archivo
- Límites de tamaño (ej: 10MB por archivo)
- Usar librerías especializadas para parsing (no raw decoding)
- Sanitización de texto extraído

### ⚠️ MEDIOS

#### 4. Password Default Expuesto
**Severidad:** Media  
**Ubicación:** Múltiples archivos

**Problema:**
Password "AguaSegura2025" hardcodeado en:
- `src/hooks/useAuth.tsx`
- `src/pages/admin/UserManagement.tsx`
- `supabase/functions/admin-reset-password/index.ts`
- Mostrado en toasts en texto plano

**Solución requerida:**
- Generar passwords temporales aleatorios
- Enviar por email (no mostrar en UI)
- Forzar cambio de password en primer login

#### 5. Edge Functions Públicas Sin Rate Limiting
**Severidad:** Media  
**Ubicación:** `supabase/config.toml` (verify_jwt = false)

**Funciones afectadas:**
- `analyze-pei`
- `generate-report`
- `generate-teacher-capacity-questionnaire`
- `generate-priority-report`

**Problema:**
Funciones costosas (OpenAI API) sin autenticación. Pueden ser abusadas para:
- Drenar créditos de OpenAI
- DoS por spam de requests

**Solución requerida:**
Si deben ser públicas:
- Implementar rate limiting por IP
- Agregar CAPTCHA
- Límites de tamaño de request

Si no deben ser públicas:
- Cambiar `verify_jwt = true`

### ℹ️ INFORMATIVOS

#### 6. Survey Participants Insert Sin Restricción
**Estado:** Marcado como diseño intencional

El sistema de encuestas permite inserción anónima sin límites. Es funcionalidad core pero considerar rate limiting si hay abuso.

---

## 14. GUÍA DE DESARROLLO

### Setup Local

```bash
# 1. Clonar repositorio
git clone [URL_DEL_REPO]
cd app-aceleradores

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
# Crear .env con:
VITE_SUPABASE_URL=https://ihgfqdmcndcyzzsbliyp.supabase.co
VITE_SUPABASE_ANON_KEY=[tu_anon_key]
VITE_SUPABASE_PUBLISHABLE_KEY=[tu_publishable_key]

# 4. Iniciar dev server
npm run dev
```

### Comandos Disponibles

```bash
npm run dev          # Dev server (http://localhost:5173)
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint
npm run type-check   # TypeScript checking
```

### Estructura de Desarrollo

**Agregar nueva página:**
1. Crear archivo en `src/pages/`
2. Agregar ruta en `src/App.tsx`
3. Agregar link en `src/components/AppSidebar.tsx` (si aplica)

**Agregar nuevo componente:**
1. Crear en `src/components/` (o subcarpeta apropiada)
2. Usar TypeScript para props
3. Usar Tailwind CSS con tokens de diseño
4. Documentar props con JSDoc

**Agregar nueva Edge Function:**
```bash
# Crear nueva función
cd supabase/functions
mkdir mi-nueva-funcion
cd mi-nueva-funcion
touch index.ts

# Configurar en config.toml
[functions.mi-nueva-funcion]
verify_jwt = true  # o false si es pública

# Deployar
supabase functions deploy mi-nueva-funcion
```

**Convenciones de Código:**
- **Nombres de archivo:** PascalCase para componentes, camelCase para utils
- **Componentes:** Functional components con TypeScript
- **Hooks:** Prefix `use` (ej: `useMyHook`)
- **Tipos:** Interfaces para props, Types para unions/utility types
- **Estilos:** Tailwind CSS con tokens de diseño, NO estilos inline
- **State management:** React Query para server state, useState/useReducer para local state

### Testing (Pendiente de implementación)

**Frameworks recomendados:**
- **Unit/Integration:** Vitest + React Testing Library
- **E2E:** Playwright o Cypress

---

## 15. DEPLOYMENT

### Frontend (Lovable)

**Método principal:** Lovable Platform
- Click en "Publish" en dashboard de Lovable
- Frontend se despliega automáticamente
- URL: `[proyecto].lovable.app`

**Configuración de dominio custom:**
- Ir a Project > Settings > Domains
- Conectar dominio propio (requiere plan paid)

### Backend (Supabase)

**Edge Functions:**
- Backend se despliega automáticamente en cada push
- No requiere acción manual para funciones

**Database Migrations:**
- Se ejecutan automáticamente en deploy

### Variables de Entorno

**Frontend (.env):**
```env
VITE_SUPABASE_URL=https://ihgfqdmcndcyzzsbliyp.supabase.co
VITE_SUPABASE_ANON_KEY=[anon_key]
VITE_SUPABASE_PUBLISHABLE_KEY=[publishable_key]
```

**Backend (Supabase Secrets):**
```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_DB_URL
OPENAI_API_KEY
```

### Monitoreo

**Logs de Edge Functions:**
- Dashboard de Supabase > Functions > [nombre función] > Logs

**Métricas:**
- Dashboard de Lovable > Analytics
- Dashboard de Supabase > Reports

---

## 16. RESUMEN DE ESTADO Y PRÓXIMOS PASOS

### Estado Actual (Resumen)

| Área | Estado | Completitud |
|------|--------|-------------|
| **Arquitectura** | ✅ Completo | 100% |
| **Autenticación** | ✅ Completo | 100% |
| **Etapa 1** | ✅ Completo | 100% |
| **Etapa 2** | ✅ Completo | 100% |
| **Etapa 3** | ✅ Completo | 100% |
| **Sistema CNPIE** | ⚠️ Parcial | 70% |
| **Repositorio** | ⚠️ Parcial | 60% |
| **Admin Panel** | ⚠️ Con vulnerabilidades | 50% |
| **Seguridad** | ❌ Crítico | 30% |
| **Testing** | ❌ No implementado | 0% |
| **Documentación** | ⚠️ Básica | 40% |

### Prioridades Inmediatas

**🔴 CRÍTICO (Hacer YA):**
1. **Seguridad Admin:** Implementar autorización server-side para funciones admin
2. **Remove Hardcoded Password:** Eliminar password hardcodeado de cliente
3. **File Validation:** Agregar validación robusta de archivos subidos

**🟠 ALTO (1-2 semanas):**
4. Completar sistema CNPIE (proyectos 2B y 2C)
5. Implementar rate limiting en funciones públicas
6. Agregar validación exhaustiva de inputs
7. Testing básico (unit tests críticos)

**🟡 MEDIO (1 mes):**
8. Mejorar UX/UI según feedback de usuarios
9. Agregar analytics y métricas
10. Implementar sistema de versiones de documentos
11. Agregar búsqueda y filtros avanzados

**🟢 BAJO (Backlog):**
12. Exportación a DOCX
13. Sistema de notificaciones
14. Funcionalidades colaborativas
15. Apps móviles nativas
16. Biblioteca de plantillas

### Recomendaciones Finales

1. **Seguridad primero:** No lanzar a producción sin arreglar vulnerabilidades críticas
2. **Testing:** Implementar tests antes de agregar más features
3. **Documentación:** Mantener este manual actualizado con cada cambio mayor
4. **Code Review:** Establecer proceso de code review antes de merge
5. **Monitoreo:** Configurar alertas para errores críticos en producción
6. **Backup:** Establecer política de backups de base de datos
7. **Performance:** Monitorear performance de Edge Functions (costos de OpenAI)

---

## CONTACTO Y RECURSOS

**Documentación Externa:**
- [Lovable Docs](https://docs.lovable.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [React Docs](https://react.dev/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Docs](https://ui.shadcn.com/)

**Repositorio:** [URL del repositorio Git]

**Equipo de Desarrollo:** [Contactos]

---

**Última actualización:** Noviembre 2024  
**Versión del Manual:** 1.0  
**Mantenedor:** [Nombre del equipo/persona]