# CI/CD Pipeline Documentation - Frontend Web

## Overview
Este pipeline de CI/CD está configurado para ejecutar automáticamente pruebas unitarias y builds cuando se crean pull requests hacia las ramas `develop` y `main`.

## Triggers
El pipeline se ejecuta en los siguientes eventos:
- **Pull Request** hacia `develop` o `main`
- **Push** directo a `develop` o `main`

## Jobs

### 1. Test Job
- **Propósito**: Ejecutar pruebas unitarias y linting
- **Configuración**:
  - Node.js 20
  - Cache de npm para velocidad
  - ChromeHeadless para pruebas
  - Coverage reports

**Pasos**:
1. Checkout del código
2. Setup de Node.js con cache
3. Instalación de dependencias (`npm ci`)
4. Ejecución de linting (`npm run lint`)
5. Ejecución de pruebas unitarias con coverage
6. Upload de coverage reports a Codecov

### 2. Build Job
- **Propósito**: Construir la aplicación y generar reportes
- **Dependencia**: Se ejecuta solo si el job de test pasa
- **Configuración**:
  - Node.js 20
  - Cache de npm

**Pasos**:
1. Checkout del código
2. Setup de Node.js con cache
3. Instalación de dependencias (`npm ci`)
4. Build de la aplicación (`npm run build-prod`)
5. Generación de bundle report (`npm run build-prod-state`)
6. Upload de artifacts de build y bundle report

## Scripts Disponibles

### Testing
- `npm run test` - Ejecutar pruebas unitarias

### Linting
- `npm run lint` - Ejecutar linting con TSLint

### Building
- `npm run build` - Build de desarrollo
- `npm run build-prod` - Build de producción
- `npm run build-prod-state` - Build de producción con stats para bundle analyzer
- `npm run bundle-report` - Analizar bundle con webpack-bundle-analyzer

## Configuración de Branch Protection

Para que el pipeline funcione correctamente, configura las siguientes reglas de protección de ramas en GitHub:

1. **Para la rama `develop`**:
   - Require status checks to pass before merging
   - Require branches to be up to date before merging
   - Status checks requeridas: `test`, `build`

2. **Para la rama `main`**:
   - Require status checks to pass before merging
   - Require branches to be up to date before merging
   - Require pull request reviews before merging
   - Status checks requeridas: `test`, `build`

## Coverage Reports

Los reportes de cobertura se generan automáticamente y se suben a Codecov. Puedes ver los reportes en:
- La pestaña "Actions" de GitHub
- El dashboard de Codecov (si está configurado)

## Bundle Analysis

El pipeline genera automáticamente un reporte de bundle que incluye:
- Tamaño de chunks
- Dependencias más pesadas
- Análisis de optimización

Para analizar el bundle localmente:
```bash
npm run build-prod-state
npm run bundle-report
```

## Troubleshooting

### Errores Comunes

1. **Tests fallan**: Revisa que todas las pruebas pasen localmente con `npm run test`
2. **Linting falla**: Ejecuta `npm run lint` para ver problemas de código
3. **Build falla**: Verifica que el proyecto compile localmente con `npm run build-prod`

### Comandos Locales para Debugging

```bash
# Ejecutar el pipeline localmente
npm ci
npm run lint
npm run test -- --watch=false --browsers=ChromeHeadless --code-coverage
npm run build-prod
```

## Configuración Adicional

### Variables de Entorno
Si necesitas variables de entorno específicas para CI, agrégalas en:
- GitHub Repository Settings > Secrets and variables > Actions
- O directamente en el archivo `.github/workflows/ci.yml`

### Cypress Dashboard
Para usar el Cypress Dashboard, configura:
- `CYPRESS_RECORD_KEY` en los secrets del repositorio
- Esto permite ver las pruebas E2E en el dashboard de Cypress

### Notificaciones
Las notificaciones se envían automáticamente a:
- GitHub notifications
- Email del autor del PR
- Slack/Discord (si está configurado)

## Diferencias con Frontend Mobile

| Aspecto | Frontend Mobile (Ionic) | Frontend Web (Angular) |
|---------|------------------------|------------------------|
| Framework | Angular 20 + Ionic 8 | Angular 17 + Ant Design |
| Testing | Karma + Jasmine | Karma + Jasmine |
| E2E | No | No |
| Bundle Analysis | No | Sí (webpack-bundle-analyzer) |
| Coverage | `./coverage/app/lcov.info` | `./coverage/medisupply/lcov.info` |
| Build Output | `dist/` | `dist/medisupply/` |
