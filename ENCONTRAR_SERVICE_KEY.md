# 🔍 CÓMO ENCONTRAR LA SERVICE_ROLE KEY EN SUPABASE

## 📍 Ubicación exacta:

Estás en: `https://supabase.com/dashboard/project/skukyfkrwqsfnkbxedty/settings/api`

### Busca esta sección:

```
Project API keys
```

Deberías ver **DOS** keys:

### 1. **anon / public** key ❌ (Esta NO la necesitas)

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrdWt5Zmtyd3FzZm5rYnhlZHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NjExNjgsImV4cCI6MjA3MjAzNzE2OH0...
```

### 2. **service_role** key ✅ (Esta SÍ la necesitas)

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrdWt5Zmtyd3FzZm5rYnhlZHR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ2MTE2OCwiZXhwIjoyMDcyMDM3MTY4fQ...
```

---

## 🎨 Cómo se ve visualmente:

```
┌────────────────────────────────────────┐
│ Project API keys                       │
├────────────────────────────────────────┤
│                                        │
│ anon                                   │
│ public                                 │
│ [key muy larga...]  👁️  📋            │
│                                        │
│ service_role                           │
│ secret                                 │
│ [key muy larga...]  👁️  📋            │
│ ⚠️ Never expose this key in the       │
│    browser or client-side code        │
│                                        │
└────────────────────────────────────────┘
```

---

## 🔍 Otra forma de encontrarla:

Si no la ves ahí, prueba estos pasos:

### Opción 1: Menú lateral

1. En el dashboard de Supabase
2. Menú lateral → **"Settings"** (⚙️)
3. → **"API"**
4. Scroll hasta **"Project API keys"**
5. La segunda key es la **service_role**

### Opción 2: Generar nueva

Si por alguna razón no aparece:

1. Ve a **Settings** → **API**
2. Busca un botón **"Reset service_role key"** o **"Reveal"**
3. Puede tener un icono de 👁️ (ojo) para revelar la key

---

## 📋 Características de la SERVICE_ROLE key:

✅ Es MÁS LARGA que la anon key
✅ En el JWT decodificado dice `"role":"service_role"` (no `"role":"anon"`)
✅ Tiene una advertencia roja: "⚠️ Never expose this key..."
✅ Dice **"secret"** o **"private"** debajo del nombre

---

## 🎯 ¿Qué hago si encuentro ambas keys?

**Copia la que dice "service_role"** - debería tener esta advertencia:

```
⚠️ This key has the ability to bypass Row Level Security.
   Never share it publicly.
```

---

## 💡 ALTERNATIVA: Verificar con JWT Decoder

Si tienes dudas sobre cuál es cuál, puedes decodificar el JWT:

1. Ve a: https://jwt.io/
2. Pega la key en el cuadro **"Encoded"**
3. En el lado derecho, busca:

   ```json
   {
     "role": "service_role"  ← ✅ Esta es la correcta
   }
   ```

   O:

   ```json
   {
     "role": "anon"  ← ❌ Esta NO
   }
   ```

---

## 🆘 ¿Sigues sin encontrarla?

**Dime qué ves en la pantalla:**

- ¿Ves alguna key?
- ¿Cuántas keys hay?
- ¿Qué texto hay debajo de cada una?

Te ayudaré a identificar cuál es cuál.

---

**URL para verificar**: https://supabase.com/dashboard/project/skukyfkrwqsfnkbxedty/settings/api
