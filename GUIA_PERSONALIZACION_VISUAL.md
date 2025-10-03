# 🎨 Guía de Personalización Visual por Cliente

## 🎯 **Objetivo**

Personalizar la apariencia de la aplicación para cada cliente sin tocar código complejo.

---

## 📁 **Archivos a Modificar**

### **1. Logo Principal**

📍 **Ubicación:** `frontend/src/assets/logo-cliente.png`

**Especificaciones:**

- **Formato:** PNG (con transparencia)
- **Tamaño recomendado:** 400×100 px
- **Peso máximo:** 100KB
- **Fondo:** Transparente preferiblemente

**Cómo usarlo:**

```typescript
// En client.config.ts
logoUrl: "/assets/logo-cliente.png";
```

---

### **2. Favicon (Icono de pestaña)**

📍 **Ubicación:** `frontend/src/favicon.ico`

**Especificaciones:**

- **Formato:** ICO o PNG
- **Tamaños:** 16×16, 32×32, 48×48 px
- **Herramienta:** https://favicon.io/favicon-converter/

**Pasos:**

1. Crear favicon en favicon.io desde logo
2. Descargar zip
3. Reemplazar `frontend/src/favicon.ico`

**Cómo usarlo:**

```typescript
// En client.config.ts
faviconUrl: "/favicon.ico";
```

---

### **3. Icono PWA (App instalable)**

📍 **Ubicación:** `frontend/src/assets/icon.png`

**Especificaciones:**

- **Formato:** PNG
- **Tamaños necesarios:** 192×192 y 512×512 px
- **Fondo:** Opaco (no transparente)
- **Peso máximo:** 200KB

**Crear múltiples tamaños:**

```bash
# Necesitas crear:
- icon-192.png (192×192 px)
- icon-512.png (512×512 px)
```

**Actualizar manifest:**

```json
// frontend/src/manifest.webmanifest
{
  "icons": [
    {
      "src": "/assets/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/assets/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

### **4. Colores del Tema**

📍 **Ubicación:** `frontend/src/app/config/client.config.ts`

**Configuración:**

```typescript
{
  clientId: 'tu-cliente',
  appName: 'Tu Clínica',

  // Color principal (botones, links, etc.)
  primaryColor: '#007bff',  // Azul (default)

  // Color secundario
  secondaryColor: '#6c757d',  // Gris

  // Color de acento (hover, focus)
  accentColor: '#0056b3',  // Azul oscuro
}
```

**Paletas sugeridas por tipo de negocio:**

| Tipo                   | Principal              | Secundario          | Ejemplo                 |
| ---------------------- | ---------------------- | ------------------- | ----------------------- |
| **Fisioterapia**       | `#007bff` (Azul)       | `#28a745` (Verde)   | Confianza + Salud       |
| **Masajes Deportivos** | `#dc3545` (Rojo)       | `#fd7e14` (Naranja) | Energía + Dinamismo     |
| **Wellness/Spa**       | `#6f42c1` (Morado)     | `#e83e8c` (Rosa)    | Relajación + Elegancia  |
| **Osteopatía**         | `#20c997` (Verde agua) | `#17a2b8` (Cyan)    | Naturaleza + Modernidad |
| **Estética**           | `#e83e8c` (Rosa)       | `#ffc107` (Dorado)  | Belleza + Lujo          |

**Herramienta para elegir colores:**
https://coolors.co/generate

---

### **5. Tipografía**

📍 **Ubicación:** `frontend/src/styles.scss`

**Cambiar fuente principal:**

```scss
// Importar desde Google Fonts
@import url("https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap");

body {
  font-family: "Roboto", sans-serif;
}
```

**Fuentes recomendadas:**

| Estilo          | Fuente                    | Uso                 |
| --------------- | ------------------------- | ------------------- |
| **Moderna**     | Roboto, Inter, Open Sans  | General             |
| **Elegante**    | Playfair Display, Lora    | Wellness/Spa        |
| **Profesional** | Montserrat, Lato, Poppins | Clínicas médicas    |
| **Deportiva**   | Oswald, Bebas Neue        | Gimnasios, deportes |

---

### **6. Nombre de la Aplicación**

📍 **Ubicación:** `frontend/src/app/config/client.config.ts`

**Configuración:**

```typescript
{
  appName: 'Fisioterapia San Juan',
  appTagline: 'Gestión inteligente de pacientes'  // Opcional
}
```

**También actualizar:**

```json
// frontend/src/manifest.webmanifest
{
  "name": "Fisioterapia San Juan",
  "short_name": "FisioSJ",
  "description": "Sistema de gestión para Fisioterapia San Juan"
}
```

```html
<!-- frontend/src/index.html -->
<title>Fisioterapia San Juan - Gestión</title>
```

---

## 🎨 **Ejemplos de Configuración Completa**

### **Ejemplo 1: Clínica de Fisioterapia**

```typescript
// client.config.ts
{
  clientId: 'fisioterapia-sanjuan',
  appName: 'Fisioterapia San Juan',
  logoUrl: '/assets/fisio-logo.png',
  faviconUrl: '/assets/fisio-favicon.ico',
  primaryColor: '#007bff',      // Azul confianza
  secondaryColor: '#28a745',    // Verde salud
  accentColor: '#0056b3',

  defaultClinicInfo: {
    name: 'Fisioterapia San Juan',
    address: 'Calle Mayor 123, Madrid',
    phone: '+34 911 222 333',
    email: 'info@fisiosanjuan.com',
    schedule: 'Lunes-Viernes: 9:00-20:00'
  }
}
```

**Resultado:**

- Logo azul/verde
- Interfaz profesional y limpia
- Colores que transmiten confianza

---

### **Ejemplo 2: Centro de Masajes Deportivos**

```typescript
// client.config.ts
{
  clientId: 'deportivo-massage',
  appName: 'Deportivo Massage',
  logoUrl: '/assets/deportivo-logo.png',
  faviconUrl: '/assets/deportivo-favicon.ico',
  primaryColor: '#dc3545',      // Rojo energía
  secondaryColor: '#fd7e14',    // Naranja dinamismo
  accentColor: '#c82333',

  defaultClinicInfo: {
    name: 'Deportivo Massage',
    address: 'Av. del Deporte 45, Barcelona',
    phone: '+34 933 444 555',
    email: 'info@deportivomassage.com',
    schedule: 'Lunes-Sábado: 8:00-21:00'
  }
}
```

**Resultado:**

- Logo dinámico rojo/naranja
- Interfaz enérgica y deportiva
- Colores que transmiten acción

---

### **Ejemplo 3: Wellness & Spa**

```typescript
// client.config.ts
{
  clientId: 'wellness-zen',
  appName: 'Wellness Zen',
  logoUrl: '/assets/zen-logo.png',
  faviconUrl: '/assets/zen-favicon.ico',
  primaryColor: '#6f42c1',      // Morado relajación
  secondaryColor: '#e83e8c',    // Rosa elegancia
  accentColor: '#59339d',

  defaultClinicInfo: {
    name: 'Wellness Zen',
    address: 'Paseo de la Calma 8, Valencia',
    phone: '+34 961 666 777',
    email: 'info@wellnesszen.com',
    schedule: 'Lunes-Domingo: 10:00-22:00'
  }
}
```

**Resultado:**

- Logo suave morado/rosa
- Interfaz relajante y elegante
- Colores que transmiten bienestar

---

## 🖼️ **Checklist de Personalización**

### **Para cada nuevo cliente:**

- [ ] **Logo**

  - [ ] Crear logo en PNG (400×100 px, fondo transparente)
  - [ ] Guardar en `frontend/src/assets/logo-{cliente}.png`
  - [ ] Actualizar `logoUrl` en `client.config.ts`

- [ ] **Favicon**

  - [ ] Generar favicon en https://favicon.io
  - [ ] Reemplazar `frontend/src/favicon.ico`
  - [ ] Actualizar `faviconUrl` en `client.config.ts`

- [ ] **Iconos PWA**

  - [ ] Crear icon-192.png y icon-512.png
  - [ ] Guardar en `frontend/src/assets/`
  - [ ] Actualizar `manifest.webmanifest`

- [ ] **Colores**

  - [ ] Elegir paleta en https://coolors.co
  - [ ] Actualizar `primaryColor`, `secondaryColor`, `accentColor`

- [ ] **Textos**

  - [ ] Actualizar `appName` en `client.config.ts`
  - [ ] Actualizar `<title>` en `index.html`
  - [ ] Actualizar `name` y `short_name` en `manifest.webmanifest`

- [ ] **Información clínica**

  - [ ] Actualizar `defaultClinicInfo` con datos reales

- [ ] **Probar**
  - [ ] `npm run dev` → verificar logo, colores, nombre
  - [ ] Abrir en móvil → verificar iconos PWA
  - [ ] Instalar como PWA → verificar icono en escritorio

---

## 🔧 **Herramientas Recomendadas**

| Herramienta           | URL                      | Uso                    |
| --------------------- | ------------------------ | ---------------------- |
| **Favicon Generator** | https://favicon.io       | Crear favicons         |
| **Color Palette**     | https://coolors.co       | Elegir colores         |
| **Logo Maker**        | https://www.canva.com    | Crear logos            |
| **Image Resizer**     | https://imageresizer.com | Redimensionar imágenes |
| **TinyPNG**           | https://tinypng.com      | Comprimir PNGs         |
| **Google Fonts**      | https://fonts.google.com | Fuentes web            |
| **Icon Finder**       | https://www.flaticon.com | Iconos gratis          |

---

## 🎨 **CSS Personalizado Avanzado**

Si quieres personalización más profunda:

📍 **Ubicación:** `frontend/src/styles.scss`

**Ejemplo:**

```scss
// Colores del cliente
$primary-color: #007bff;
$secondary-color: #6c757d;
$accent-color: #0056b3;

// Aplicar a botones
.btn-primary {
  background-color: $primary-color;
  border-color: $primary-color;

  &:hover {
    background-color: $accent-color;
    border-color: $accent-color;
  }
}

// Aplicar a links
a {
  color: $primary-color;

  &:hover {
    color: $accent-color;
  }
}

// Personalizar calendario
.calendar-day {
  &.today {
    background-color: $primary-color;
  }

  &:hover {
    background-color: lighten($primary-color, 10%);
  }
}
```

---

## 📝 **Plantilla de Solicitud de Datos al Cliente**

Envía esto por email antes de empezar:

---

**Asunto:** Datos necesarios para personalizar tu sistema

Hola [Cliente],

Para personalizar tu sistema, necesito la siguiente información:

**1. Nombre de la aplicación:**

- Nombre completo: **\*\***\_\_\_**\*\***
- Nombre corto (máx 10 caracteres): **\*\***\_\_\_**\*\***

**2. Logo:**

- ¿Tienes logo? Sí / No
- Si sí, envíamelo en PNG o JPG alta resolución
- Si no, ¿quieres que te diseñe uno? (+50€)

**3. Colores corporativos:**

- Color principal (si no sabes el código, descríbelo): **\*\***\_\_\_**\*\***
- ¿Algún color que NO quieras? **\*\***\_\_\_**\*\***

**4. Información de la clínica:**

- Nombre: **\*\***\_\_\_**\*\***
- Dirección completa: **\*\***\_\_\_**\*\***
- Teléfono: **\*\***\_\_\_**\*\***
- Email: **\*\***\_\_\_**\*\***
- Horario: **\*\***\_\_\_**\*\***

**5. URL deseada:**

- ¿Qué URL te gustaría? (ejemplo: `tusitio.vercel.app`)
- Opción 1: **\*\***\_\_\_**\*\***.vercel.app
- Opción 2: **\*\***\_\_\_**\*\***.vercel.app

**6. Precios:**

- Sesión 30 minutos: \_\_\_€
- Sesión 60 minutos: \_\_\_€
- ¿Ofreces bonos? ¿Cuáles y a qué precio?

Envíame esta información y en 1-2 días tendrás tu sistema listo.

Gracias,
[Tu nombre]

---

**¿Listo para personalizar tu primer cliente? 🎨**
