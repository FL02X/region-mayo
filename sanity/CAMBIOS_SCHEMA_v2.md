# Cambios en Schema de Sanity - v2.0 (7 Abril 2026)

## Resumen de Cambios

Se realizaron tres cambios críticos en los schemas para:
1. Eliminar redundancia de datos (teléfono del templo)
2. Clarificar relaciones 1:1 (un pastor por templo)
3. Simplificar datos asumiendo estados por defecto (coros siempre activos)

---

## 1. Eliminación de `phone` en TEMPLO (templo.ts)

### Cambio
- **Campo eliminado**: `phone` (Teléfono del Templo)
- **Ubicación**: grupo `contact` en templo.ts

### Justificación

**Problema Original:**
- Un templo tiene un número de teléfono "general"
- Pero en realidad, el contacto principal del templo es el **pastor**
- Tener dos números (templo + pastor) causa confusión y desincronización

**Solución:**
- El templo NO tiene teléfono propio
- El **pastor es el contacto principal** del templo
- Su teléfono se mostrará en la UI directamente del templo (heredado vía referencia)

**Ejemplo en UI:**
```
Iglesia el Redentor
📍 Dirección: Calle X, 123
👤 Pastor: Juan García
📱 Contacto: 6441234567  ← Del pastor, no del templo
```

**Beneficio:**
- Un único número de contacto (única fuente de verdad)
- Si el pastor cambia de teléfono, se actualiza automáticamente en todas partes
- Menos campos que mantener

---

## 2. Relación 1:1 PASTOR ↔ TEMPLO (pastor.ts)

### Cambio
- **Campo de descripción actualizado**: Field `templo` en pastor.ts
- **Nuevo texto**: "Templo al que pertenece este pastor (OBLIGATORIO). Un pastor está en UN SOLO templo."

### Cambio de Documentación
- **Actualizado**: Comentario de jerarquía en pastor.ts
- **Antes**: "DIFERENCIA CRÍTICA CON MIEMBRO: - Pastor: lidera el TEMPLO completo (1:1 o N:1)"
- **Después**: "RELACIÓN CLAVE: - UNO-A-UNO: un pastor = un templo (un pastor NO puede estar en múltiples templos)"

### Justificación

**Problema Original:**
- Solicitud decía que "un pastor PUEDE estar en uno o más templos"
- Pero el usuario aclaró: **"Un pastor no puede estar en uno o mas templos"**
- Esto crea ambigüedad y complejidad innecesaria

**Realidad Organizacional:**
- En una iglesia, cada templo tiene su pastor principal
- Si un pastor sirve múltiples templos, es excepcional y debe documentarse diferente
- Por defecto: **1 templo = 1 pastor**

**Cambio en Modelo:**
- Relación cambió de **N:1** (muchos pastores por templo) → **1:1** (un pastor por templo)
- Un pastor está en **EXACTAMENTE UN TEMPLO**
- Si un pastor es transferido, creas un nuevo documento o marcas como inactivo

**Impacto en UI:**
- En la página del templo, siempre hay UN pastor mostrado
- Su información (nombre, teléfono, foto) viene de la referencia
- Limpio y sin duplicados

---

## 3. Eliminación de `active` y `googleMapsUrl` en CORO (coro.ts)

### Cambios
- **Campo eliminado**: `active` (Coro Activo) 
- **Campo eliminado**: `googleMapsUrl` (URL de ubicación de ensayos)
- **Nota agregada**: "Los coros se asumen ACTIVOS. Si una congregación no tiene coro, simplemente no se crea documento."

### Justificación

#### 3a. ¿Por qué eliminar `active`?

**Problema Original:**
- Campo booleano para marcar si un coro está activo o no
- Pero surge la pregunta: ¿cuándo un coro deja de ser activo?

**Realidad Operacional:**
- En una congregación, **todos los coros listados están activos**
- Si un coro se disuelve, simplemente **no se crea el documento**
- Si historicamente fue importante, se guarda en documentos de evento/registro pero no como "coro inactivo"

**Lógica Simplificada:**
```
Coros en la BD = Coros ACTIVOS (siempre)
Si el coro ya no existe = No aparece en la BD
```

**Beneficio:**
- Menos campos que validar
- Datos más limpios (no hay "registros de coros muertos")
- Alineado con la filosofía: "si está documentado, está activo"

#### 3b. ¿Por qué eliminar `googleMapsUrl` de coros?

**Problema Original:**
- Campo para "ubicación de ensayos" del coro
- Pregunta: ¿cuál es el valor real de esto?

**Realidad:**
- Los coros ensayan en sus templos (99% de los casos)
- Si ensayan en un lugar diferente, es excepción rara
- Agregaba complejidad innecesaria para data que casi nadie usa

**Decisión:**
- Asumir que **los coros ensayan en su templo asociado**
- La ubicación del templo ya está en la BD con Google Maps
- Si un futuro admín necesita registrar ubicación alternativa, puede usarse campos de evento

**Beneficio:**
- Menos campos en UI
- Menos datos que pedir a estadística
- Más foco en lo importante: nombre coro, líder, teléfono

---

## Impacto en la Solicitud de Datos

### Lo que cambia para ESTADÍSTICA:

| Antes | Ahora | Razón |
|-------|-------|-------|
| Templo: nombre + dirección + **teléfono** | Templo: nombre + dirección | Teléfono viene del pastor |
| Coro: nombre + líder + teléfono + **ubicación ensayos** + **¿activo?** | Coro: nombre + líder + teléfono | Ubicación = templo. Assume activos. |
| Pastor: confirmación de "N pastores por templo" | Pastor: 1 pastor = 1 templo | Relación 1:1 clara |

### Lo que FACILITA para la UI:

```javascript
// Ejemplo: mostrar contacto de templo
<h2>Iglesia el Redentor</h2>
<p>Dirección: ...</p>

// Automáticamente saca del pastor relacionado:
<p>Pastor: {pastor.fullName}</p> 
<p>Teléfono: {pastor.phone}</p>
<a href="whatsapp://...">Contactar</a>
```

---

## Checklist de Cambios Documentados

✅ templo.ts - campo `phone` eliminado (teléfono viene del pastor)
✅ pastor.ts - descripción actualizada (relación 1:1)
✅ coro.ts - campos `active` y `googleMapsUrl` eliminados (siempre activos, ensayan en templo)
✅ Comentarios de código actualizados explicando la lógica

---

## Próximas Acciones

1. ✅ Actualizar solicitud de datos a ESTADÍSTICA (sin teléfono de templo, sin ubicación de coros)
2. ⬜ Validar en Sanity Studio que los cambios se aplicaron
3. ⬜ Entrenar a admins sobre la nueva lógica
4. ⬜ Cuando lleguen datos de estadística, usar el nuevo formato

