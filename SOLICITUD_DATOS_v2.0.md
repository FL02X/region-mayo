# Solicitud de Datos para Base de Datos - Región Mayo
## Versión 2.0 (Actualizada 7 de Abril 2026)

---

Estimado equipo de estadística,

Basado en los cambios realizados a la base de datos, aquí está la **solicitud FINAL y SIMPLIFICADA** de información estructurada que necesitamos. Los cambios anteriores eliminaron datos redundantes y aclararon relaciones 1:1.

---

## 1. TEMPLOS / IGLESIAS

Para **CADA congregación activa**, proporciona:

| Campo | Ejemplo | Notas |
|-------|---------|-------|
| **Nombre del templo** | "1ra Iglesia de Navojoa" o "Iglesia el Redentor" | **El número va acá** si hay múltiples en la misma ciudad |
| **Región** | "Región Mayo" | Confirmación (todos debieran ser Mayo) |
| **Dirección completa** | "Jito 411, Mocuzarit, 85850 Navojoa, Son." | Calle, número, ciudad, estado, CP |
| **URL de Google Maps** | https://maps.app.goo.gl/... | Copia directa de maps.google.com |
| **Horarios de cultos** | "Dom 10:00 AM y 7:00 PM. Miércoles 7:00 PM" | Para descripción de la iglesia |
| **Foto del templo** | [Archivo] | Preferiblemente frontal o principal |
| **¿Activo?** | Sí / No | ¿Sigue operando? |

**⚠️ IMPORTANTE:** NO envíes teléfono del templo. El contacto principal es el pastor.

**Para las 4 congregaciones SIN templo físico** (Bacobampo, Lopez Mateos, Sirebampo, Quiriego):
- ¿Dónde se reúnen actualmente? (dirección provisional o "casa de X")
- ¿Aún están activas como congregación? (Sí/No)
- Si respondieron No: no incluir en la base de datos

---

## 2. PASTORES ⭐ (CRÍTICO)

Para **CADA pastor activo**, proporciona:

| Campo | Ejemplo | Notas |
|-------|---------|-------|
| **Nombre completo del pastor** | "Juan Carlos García López" | Nombre oficial completo |
| **¿A qué templo pertenece?** | "1ra Iglesia de Navojoa" | **UN SOLO TEMPLO** (relación 1:1) |
| **Teléfono de contacto** | 6441234567 | 10 dígitos (sin +52) - **OBLIGATORIO** |
| **Foto del pastor** | [Archivo] | Foto de perfil o frontal |
| **¿Activo?** | Sí / No | ¿Sigue siendo pastor de esa iglesia? |

**NOTA CRÍTICA:** 
- Un pastor = un templo exacto
- Este teléfono será el **contacto principal del templo** mostrado en la UI
- Si el pastor cambia, se actualiza automáticamente en toda la plataforma

---

## 3. COROS LOCALES

Para **CADA coro**, proporciona:

| Campo | Ejemplo | Notas |
|-------|---------|-------|
| **Nombre exacto del coro** | "Coro Huestes de Jehová" | Nombre oficial del coro/grupo |
| **Templo donde cantan** | "1ra Iglesia de Navojoa" | ¿A cuál iglesia pertenecen? |
| **Nombre del presidente/líder** | "Pablo Figueroa" | Nombre completo |
| **Teléfono del líder** | 6449876543 | 10 dígitos (sin +52) - **OBLIGATORIO** |
| **Foto del coro** | [Archivo] | Foto de grupo o reunión - **RECOMENDADO** |

**⚠️ CAMBIOS RESPECTO A LA SOLICITUD ANTERIOR:**
- ❌ NO envíes "¿Está activo?" - **Todos los coros en la BD se asumen ACTIVOS**
  - Si un coro ya no existe, simplemente no lo incluyas
- ❌ NO envíes "Ubicación de ensayos" - **Se asume que ensayan en su templo**
  - Los coros cantan/ensayan en su iglesia asociada

**Ignora completamente:**
- Listas de directiva completa del coro
- Personas con rol indefinido ("no tiene")
- Información de miembros secundarios

---

## 4. DIRECTIVA LOCAL (Presidentes de Templos)

Para **CADA iglesia**, proporciona:

| Campo | Ejemplo | Notas |
|-------|---------|-------|
| **Nombre del presidente local** | "Carlos Morales García" | Presidente/líder de ESA iglesia |
| **Teléfono** | 6449876543 | 10 dígitos (sin +52) - **OBLIGATORIO** |
| **¿A cuál iglesia pertenece?** | "1ra Iglesia de Navojoa" | Templo exacto donde es presidente |
| **Foto** | [Archivo] | OPCIONAL |

**Ignora:**
- Tesoreros, secretarios, vice presidentes (solo presidente local)
- Información de directiva regional

---

## 5. PRESIDENTES DE JÓVENES (Opcional por ahora)

Para **iglesias que lo tengan**, proporciona:

| Campo | Ejemplo | Notas |
|-------|---------|-------|
| **Nombre del presidente de jóvenes** | "Emanuel Rabago" | Líder de jóvenes DE ESA iglesia |
| **¿A cuál iglesia pertenece?** | "1ra Iglesia de Navojoa" | Templo exacto |
| **Teléfono** | 6449876543 | 10 dígitos - RECOMENDADO |

---

## FORMATO RECOMENDADO (Excel o Google Sheets)

### **Hoja 1 - Templos**

| Nombre Templo | Región | Dirección | Google Maps | Horarios | Activo | Foto |
|---|---|---|---|---|---|---|
| 1ra Iglesia de Navojoa | Región Mayo | Jito 411... | [link] | Dom 10 AM, 7 PM | Sí | Archivo.jpg |
| 2da Iglesia Gentil de Cristo Navojoa | Región Mayo | Cjon 5to 1302... | [link] | Dom 10 AM | Sí | |

### **Hoja 2 - Pastores**

| Nombre Pastor | Templo | Teléfono | Foto | Activo |
|---|---|---|---|---|
| Juan García López | 1ra Iglesia de Navojoa | 6441234567 | Archivo.jpg | Sí |
| Carlos Morales | 2da Iglesia Gentil de Cristo | 6449876543 | | Sí |

### **Hoja 3 - Coros**

| Nombre Coro | Templo | Presidente Coro | Teléfono | Foto |
|---|---|---|---|---|
| Coro Huestes de Jehová | 1ra Iglesia de Navojoa | Pablo Figueroa | 6449876543 | Archivo.jpg |
| Coro Perfume a sus pies | 2da Iglesia Gentil de Cristo | Joel David Escalante | 6449876543 | |

### **Hoja 4 - Presidentes Locales**

| Nombre Presidente | Templo | Teléfono | Foto |
|---|---|---|---|
| [Presidente 1ra Navojoa] | 1ra Iglesia de Navojoa | 6449876543 | |
| [Presidente 2da Navojoa] | 2da Iglesia Gentil de Cristo | 6449876543 | |

### **Hoja 5 - Presidentes de Jóvenes (Opcional)**

| Nombre Presidente Jóvenes | Templo | Teléfono |
|---|---|---|
| Emmanuel Rabago | 1ra Iglesia de Navojoa | 6449876543 |

---

## Cambios en Esta Versión (respecto a solicitud anterior)

### ✅ ELIMINADO - Ya no necesito:
- ❌ Teléfono del templo (viene del pastor)
- ❌ Campo "¿Activo?" para coros (siempre activos)
- ❌ Ubicación de ensayos de coros (se asume templo)
- ❌ Identificador de iglesia por número (va en el nombre: "1ra Iglesia")

### ✅ ACLARADO:
- ✅ Un pastor = un templo (relación 1:1)
- ✅ Pastor = contacto principal del templo
- ✅ Todos los coros listados están operativos

### ✅ SIMPLIFICADO:
- ✅ Menos campos = menos errores
- ✅ Menos redundancia de datos
- ✅ Único punto de verdad para contactos

---

## ¿Por qué estos cambios específicamente?

| Cambio | Justificación | Beneficio |
|--------|---|---|
| **Sin teléfono de templo** | El contacto real es el pastor, no el edificio | Un teléfono único, siempre actualizado |
| **Pastor 1:1 con templo** | Cada iglesia tiene un pastor principal | Relación clara en BD, fácil de modelar |
| **Coros siempre activos** | Si no existe, no lo documentas | Datos limpios, sin registros "muertos" |
| **Sin ubicación alternativa de coros** | Ensayan en su templo (99% casos) | Menos campos, data más simple |

---

## Validación de Datos

Antes de enviar, **por favor valida:**

1. ✅ **Teléfonos**: todos con 10 dígitos, sin +52, sin espacios
   - ✅ Correcto: `6441234567`
   - ❌ Incorrecto: `+52 644 123 4567` o `644-123-4567`

2. ✅ **Templos**: cada uno tiene al menos UN pastor activo
   - Si un templo NO tiene pastor, investigar

3. ✅ **Coros**: cada uno asociado a UN templo existente
   - Verificar que el templo listado existe

4. ✅ **Nombres**: completos y consistentes
   - "Juan García" vs "Juan Carlos García" → elegir uno

5. ✅ **Google Maps**: links válidos y que abran correctamente

---

## Próximos Pasos

1. **Prepara las Excel** usando las hojas sugeridas
2. **Valida teléfonos** (10 dígitos)
3. **Valida relaciones** (pastores ↔ templos, coros ↔ templos)
4. **Reúne fotos** en carpeta separada
5. **Envía** todo junto con fecha límite confirmada

---

**Versión:** 2.0 (Actualizada 7 Abril 2026)
**Cambios principales:** Eliminación de teléfono de templo, simplificación de coros, clarificación de relación pastor 1:1

