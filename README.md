# Medi Supply - Web Application

## 🌐 Descripción

Aplicación web desarrollada con **Angular** para la gestión administrativa de pedidos, clientes, productos, rutas de entrega y vendedores.

**Tecnologías:** Angular 17.3.5 • ng-zorro-antd 17.4.0 • Tailwind CSS 3.4.3 • TypeScript 5.4.5 • Firebase • Google Maps API

---

## 👥 Equipo de Desarrollo - G15

| Nombre | Correo |
|--------|--------|
| Juan Sebastian Vargas | js.vargasq1@uniandes.edu.co |
| Manuel Felipe Bejarano | mf.bejaranob1@uniandes.edu.co |
| María Camila Martínez | mc.martinezm12@uniandes.edu.co |
| Héctor Franco | h.franco@uniandes.edu.co |

---

## 📋 Contenido

1. [Requisitos Previos](#requisitos-previos)
2. [Variables de Entorno](#variables-de-entorno)
3. [Instalación Local](#instalación-local)
4. [Ejecución y Desarrollo](#ejecución-y-desarrollo)
5. [Pruebas](#pruebas)
6. [Build de Producción](#build-de-producción)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Despliegue](#despliegue)
9. [Troubleshooting](#troubleshooting)

---

## Requisitos Previos

### Software Requerido

| Software | Versión | Verificación |
|----------|---------|--------------|
| Node.js | v20.12.0 | `node --version` |
| npm | v9.x+ | `npm --version` |
| Angular CLI | v17.x | `ng version` |

### Instalación de Angular CLI

```bash
npm install -g @angular/cli@17
```

---

## Variables de Entorno

### Archivos de Configuración

La aplicación usa dos archivos de environment en `src/environments/`:

**1. `environment.ts` (Desarrollo)**
```typescript
export const environment = {
  production: false,
  apiUrl: 'https://medisupply.hectorfranco.dev',
  firebaseApiKey: 'YOUR_FIREBASE_API_KEY',
  googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY',
  // ... otros endpoints
};
```

**2. `environment.prod.ts` (Producción)**
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://medisupply.hectorfranco.dev',
  firebaseApiKey: 'YOUR_FIREBASE_API_KEY',
  googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY',
  // ... otros endpoints
};
```

### Variables Requeridas

| Variable | Descripción | Dónde Obtenerla |
|----------|-------------|-----------------|
| `apiUrl` | URL del backend | Configuración del servidor |
| `firebaseApiKey` | API Key de Firebase | Firebase Console > Project Settings |
| `googleMapsApiKey` | API Key de Google Maps | Google Cloud Console > Credentials |

**Obtener Firebase API Key:**
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Project Settings > General > Your apps
3. Copia el valor de `apiKey`

**Obtener Google Maps API Key:**
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services > Credentials
3. Crea o usa una API Key existente
4. Habilita: Maps JavaScript API, Geocoding API, Directions API

---

## Instalación Local

```bash
# 1. Clonar repositorio
git clone <url-del-repositorio>
cd frontend-web

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
# Edita src/environments/environment.ts con tus credenciales

# 4. Verificar instalación
ng build --configuration development
```

---

## Ejecución y Desarrollo

### Servidor de Desarrollo

```bash
# Iniciar servidor (http://localhost:4200)
npm start
# o
ng serve

# Puerto específico
ng serve --port 4300

# Con configuración de producción
ng serve --configuration production
```

---

## Pruebas

### Pruebas Unitarias

```bash
# Modo watch
npm test

# Una ejecución
ng test --watch=false

# Con cobertura
npm run test:coverage

# Abrir reporte de cobertura
npm run test:coverage:open
```

**Cobertura Actual:** Statements 78.81% • Branches 61.54% • Functions 81.88% • Lines 79.06%

### Pruebas E2E (Cypress)

```bash
# Modo interactivo
npm run e2e

# Headless
npm run e2e:headless

# CI
npm run e2e:ci

# Pruebas específicas
npm run e2e:smoke    # Pruebas de smoke
npm run e2e:fast     # Pruebas críticas
```

---

## Build de Producción

```bash
# Build estándar
npm run build

# Build optimizado (recomendado)
npm run build-prod

# Build con análisis de bundle
npm run build-prod-state
npm run bundle-report
```

**Salida:** `dist/medisupply/`

---

## CI/CD Pipeline

### Estructura del Pipeline

El pipeline de GitHub Actions incluye 5 jobs principales:

**1. Lint** → Verificación de calidad de código  
**2. Test** → Pruebas unitarias + cobertura  
**3. E2E** → Pruebas end-to-end con Cypress  
**4. Build** → Compilación para producción  
**5. Deploy** → Despliegue automático en Firebase Hosting

### Archivo de Configuración

**Ubicación:** `.github/workflows/web-ci-cd.yml`

**Triggers:**
- Push a `main`, `develop`, `feature/*`
- Pull requests a `main`, `develop`

**Resumen de Jobs:**

```yaml
jobs:
  lint:
    - Ejecuta linter
    
  test:
    - Pruebas unitarias con cobertura
    - Configura variables de entorno
    - Sube reporte a Codecov
    
  e2e:
    - Pruebas E2E con Cypress
    - Guarda screenshots/videos en caso de fallo
    
  build:
    - Compila para producción
    - Genera artefacto del build
    
  deploy:
    - Despliega en Firebase Hosting
    - main → Producción (live)
    - develop → Preview channel
```

### Secrets de GitHub Actions Requeridos

**Configurar en:** Settings > Secrets and variables > Actions

#### Configuración de la Aplicación

| Secret | Descripción |
|--------|-------------|
| `API_URL` | URL del backend |
| `FIREBASE_API_KEY` | API Key de Firebase |
| `GOOGLE_MAPS_API_KEY` | API Key de Google Maps |

#### Configuración de Firebase Hosting

| Secret | Descripción | Cómo Obtenerlo |
|--------|-------------|----------------|
| `FIREBASE_PROJECT_ID` | ID del proyecto | Firebase Console > Project Settings |
| `FIREBASE_SERVICE_ACCOUNT` | Service Account JSON | Ver instrucciones abajo |

### Obtener Firebase Service Account

**Opción 1: Firebase CLI**
```bash
firebase login
firebase login:ci  # Copia el token generado
```

**Opción 2: Google Cloud Console**
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. IAM & Admin > Service Accounts
3. Create Service Account (nombre: `github-actions-deployer`)
4. Role: **Firebase Hosting Admin**
5. Create Key > JSON
6. Copia todo el contenido del JSON al secret

---

## Despliegue

### Despliegue Manual en Firebase Hosting

```bash
# 1. Instalar Firebase CLI
npm install -g firebase-tools

# 2. Login
firebase login

# 3. Inicializar (primera vez)
firebase init hosting
# Public directory: dist/medisupply
# Single-page app: Yes

# 4. Build
npm run build-prod

# 5. Desplegar
firebase deploy --only hosting

# Preview (opcional)
firebase hosting:channel:deploy preview
```

### Despliegue Automático (CI/CD)

**Rama `develop`:**
- Ejecuta todas las pruebas
- Despliega en canal de preview
- URL: `https://PROJECT-ID--preview-RANDOM.web.app`

**Rama `main`:**
- Ejecuta todas las pruebas
- Despliega en producción
- URL: `https://PROJECT-ID.web.app` (o dominio personalizado)

---

## Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Servidor de desarrollo con apertura de navegador |
| `npm run build` | Build para producción |
| `npm run build-prod` | Build optimizado (mayor memoria) |
| `npm test` | Pruebas unitarias (watch mode) |
| `npm run test:coverage` | Pruebas con cobertura |
| `npm run lint` | Ejecutar linter |
| `npm run e2e` | Pruebas E2E interactivas |
| `npm run e2e:ci` | Pruebas E2E para CI |

---

## Arquitectura del Proyecto

```
frontend-web/
├── src/
│   ├── app/
│   │   ├── authentication/        # Login y autenticación
│   │   ├── dashboard/             # Módulo principal
│   │   │   ├── sellers/           # Gestión de vendedores
│   │   │   ├── orders/            # Gestión de pedidos
│   │   │   ├── products/          # Gestión de productos
│   │   │   ├── warehouses/        # Gestión de bodegas
│   │   │   ├── clients/           # Gestión de clientes
│   │   │   ├── create-route/      # Creación de rutas
│   │   │   └── ...
│   │   ├── shared/                # Módulo compartido
│   │   │   ├── components/        # Componentes reutilizables
│   │   │   ├── pipes/             # Pipes personalizados
│   │   │   └── services/          # Servicios de la app
│   │   └── layouts/               # Layouts de la aplicación
│   ├── assets/                    # Recursos estáticos
│   │   └── i18n/                  # Traduciones (en.json, es.json)
│   ├── environments/              # Configuración de entornos
│   └── styles.scss                # Estilos globales
├── cypress/                       # Pruebas E2E
├── dist/                          # Build de producción
├── angular.json                   # Configuración de Angular
├── firebase.json                  # Configuración de Firebase
├── tailwind.config.js             # Configuración de Tailwind
└── package.json                   # Dependencias y scripts
```

### Módulos Principales

- **Authentication**: Login y autenticación con Firebase
- **Dashboard**: Funcionalidades principales (pedidos, rutas, vendedores)
- **Shared**: Componentes, servicios y pipes reutilizables

---

## Troubleshooting

### Error al instalar dependencias

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Google Maps no funciona

**Verificar:**
1. `googleMapsApiKey` configurado en `environment.ts`
2. APIs habilitadas: Maps JavaScript API, Geocoding API, Directions API
3. API key sin restricciones (o con dominio permitido)

### Error de CORS al llamar al backend

**Solución:** Crear `proxy.conf.json`:
```json
{
  "/api": {
    "target": "https://medisupply.hectorfranco.dev",
    "secure": true,
    "changeOrigin": true
  }
}
```

Actualizar `angular.json`:
```json
"serve": {
  "options": {
    "proxyConfig": "proxy.conf.json"
  }
}
```

### Build falla por falta de memoria

```bash
npm run build-prod  # Usa --max_old_space_size=8000
```

### Firebase deploy falla (Error 403)

**Verificar:**
1. Autenticación: `firebase login`
2. Proyecto configurado: `firebase use --add`
3. Permisos en Firebase Console
4. Service Account tiene rol correcto (para CI/CD)

---

## Documentación Adicional

- [Angular Documentation](https://angular.io/docs)
- [ng-zorro-antd Documentation](https://ng.ant.design/docs/introduce/en)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Google Maps Platform](https://developers.google.com/maps/documentation)

---

## Estadísticas

- **Componentes:** 50+
- **Servicios:** 25+
- **Pruebas Unitarias:** 1026 (todas pasando)
- **Cobertura:** 78.81% statements
- **Versión:** 1.0.0

---

**Última actualización:** Noviembre 2025  
**Proyecto Integrado 2 - MISW4502** | Universidad de los Andes
