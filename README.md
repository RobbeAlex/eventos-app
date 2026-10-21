# 📅 Sistema Integral de Gestión de Eventos y Cotizaciones (`eventos-app`)

**Autor:** Roberto Alejandro Chagra Martínez  
**Tecnologías:** React 19, Vite 8, React Router 7, jsPDF, Node.js, Express 5, PostgreSQL (`pg`) / SQLite3, JWT & Bcrypt  
**Licencia:** MIT License (2026)

---

## 📋 Descripción General

**`eventos-app`** es una aplicación Full-Stack empresarial diseñada para agencias productoras de eventos, salones y coordinadores logísticos. Permite administrar el ciclo completo de operación comercial: gestión de cartera de clientes (CRM), catálogo de servicios y locaciones por categoría, programación de eventos en calendario con **detección automática de conflictos de horario por recinto**, control de estados y generación de cotizaciones formales en formato PDF.

---

## ✨ Características Principales

- **Autenticación y Seguridad JWT**:
  - Inicio de sesión seguro con contraseñas cifradas mediante `bcrypt` (10 rondas de *salt*).
  - Protección de rutas en el cliente (`ProtectedRoute` con `AuthContext`) y validación de tokens Bearer en el backend (`authenticateToken`, vigencia de 24 horas).
  - Inicialización automática de usuarios administradores por defecto (`admin1`, `admin2`, `admin3`).
- **Panel de Control (*Dashboard*)**: Resumen ejecutivo de eventos agendados, ingresos proyectados, clientes registrados y accesos rápidos.
- **Gestión de Eventos y Carrito de Servicios (`Events`)**:
  - Armado interactivo de paquetes por evento seleccionando servicios del catálogo con cantidades y precios unitarios personalizados.
  - **Validación Anti-Colisión de Recintos (`HTTP 409 Conflict`)**: Verifica en base de datos que ningún servicio de categoría `"Lugar"` tenga traslape de fecha/hora (`fecha_hora_inicio < fin_nuevo AND fecha_hora_fin > inicio_nuevo`) antes de confirmar la transacción.
  - Exportación instantánea de cotizaciones y órdenes de servicio en PDF mediante `jspdf` y `jspdf-autotable`.
- **Directorio de Clientes (`Clients`)**: CRUD completo de clientes, empresas, contactos telefónicos, correo electrónico, tipo de evento de interés y notas de seguimiento.
- **Catálogo de Servicios (`Services`)**: Administración de servicios clasificables por categoría (`Lugar`, `Banquete`, `Audio e Iluminación`, `Mobiliario`, `Decoración`, etc.) con precios base.

---

## 🗂️ Estructura del Proyecto

```text
eventos-app/
├── client/                         # 🎨 Frontend SPA (React 19 + Vite 8)
│   ├── src/
│   │   ├── components/
│   │   │   └── Sidebar.jsx         # Navegación lateral y cierre de sesión
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Estado global de sesión JWT y persistencia
│   │   ├── pages/
│   │   │   ├── Login.jsx           # Vista de autenticación
│   │   │   ├── Dashboard.jsx       # Métricas y resumen operativo
│   │   │   ├── Events.jsx          # Calendario/lista de eventos, cotizador y PDF
│   │   │   ├── Clients.jsx         # CRUD de clientes (CRM)
│   │   │   └── Services.jsx        # CRUD de catálogo de servicios y lugares
│   │   ├── App.jsx                 # Enrutador principal y guardias de ruta
│   │   └── main.jsx                # Punto de montaje React
│   ├── package.json
│   └── vite.config.js
│
├── server/                         # ⚙️ Backend API REST (Node.js + Express 5)
│   ├── server.js                   # Endpoints REST, transacciones y middleware JWT
│   ├── database.js                 # Conexión e inicialización de esquema SQL
│   ├── migrate_events.js           # Script de migración de tabla de eventos
│   ├── migrate_services.js         # Script de migración de servicios y carrito
│   ├── seed_services.js            # Poblado inicial (seeding) del catálogo de servicios
│   └── package.json
│
├── DOCUMENTACION_TECNICA.md        # Arquitectura cliente-servidor, ERD y API Reference
├── requirements.txt                # Especificación de dependencias Frontend y Backend
├── .gitignore                      # Reglas de exclusión de Git
└── LICENSE                         # Licencia MIT
```

---

## 🚀 Instalación y Ejecución

### 1. Configurar e iniciar el Servidor Backend (`server/`)
```bash
cd server
npm install
```
Configura el archivo `.env` en `server/.env`:
```env
PORT=3001
SECRET_KEY=tu_clave_secreta_jwt
DATABASE_URL=postgresql://usuario:password@localhost:5432/eventos_db
```
Ejecuta el servidor:
```bash
node server.js
```

### 2. Configurar e iniciar el Cliente Frontend (`client/`)
En una nueva terminal:
```bash
cd client
npm install
npm run dev
```

### 3. Credenciales de Acceso Iniciales
- **Usuario:** `admin1` (o `admin2`, `admin3`)
- **Contraseña:** `password123`

---

## 📄 Documentación Técnica

Consulta [`DOCUMENTACION_TECNICA.md`](file:///g:/Mi%20unidad/Drive.alumno.udg.mx/Proyectos/eventos-app/DOCUMENTACION_TECNICA.md) para revisar el diagrama Entidad-Relación, el algoritmo de detección de traslapes de horario, las migraciones y la especificación detallada de los endpoints REST.
