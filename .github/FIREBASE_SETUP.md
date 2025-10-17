# Firebase Hosting Setup

## 🔥 Configuración Requerida

### 1. Crear Proyecto Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto llamado `medisupply-web`
3. Habilita Firebase Hosting
4. Anota el **Project ID**

### 2. Configurar Service Account

1. Ve a **Project Settings** → **Service Accounts**
2. Genera una nueva clave privada (JSON)
3. Descarga el archivo JSON

### 3. Configurar GitHub Secrets

En el repositorio, ve a **Settings** → **Secrets and variables** → **Actions**

Agrega estos secrets:

```
FIREBASE_PROJECT_ID=medisupply-web
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"medisupply-web",...}
```

### 4. Estructura de Archivos

```
frontend-web/
├── firebase.json          # Configuración de hosting
├── .firebaserc           # ID del proyecto
└── .github/workflows/ci.yml  # Pipeline con deploy
```

### 5. Deploy Automático

El deploy se ejecuta automáticamente cuando:
- Se hace push a la rama `main`
- Los tests pasan correctamente
- El build se completa exitosamente

### 6. URLs

- **Desarrollo**: `http://localhost:4200`
- **Producción**: `https://medisupply-web.web.app`

## 🚀 Comandos Útiles

```bash
# Deploy manual
firebase deploy

# Deploy solo hosting
firebase deploy --only hosting

# Ver logs
firebase hosting:channel:list
```

## 📋 Checklist

- [ ] Proyecto Firebase creado
- [ ] Hosting habilitado
- [ ] Service Account configurado
- [ ] GitHub Secrets configurados
- [ ] Pipeline funcionando
- [ ] Deploy automático activo
