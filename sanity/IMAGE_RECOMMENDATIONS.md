# Recomendaciones de Imágenes para Sanity Studio

## Aspectos Generales

- **Objetivo:** Mostrar la imagen completa o casi completa sin recortes excesivos
- **Altura mínima en UI:** h-60 (240px en Tailwind CSS)
- **Formato recomendado:** 3:2 o 4:3 (similar a fotos digitales)

## Especificaciones por Entidad

### Templos
- **Aspecto:** Fachada de la iglesia
- **Tamaño ideal:** 800px × 533px (3:2) o 960px × 640px
- **Altura mínima:** 240px en pantalla
- **Consideración:** Si la imagen es muy vertical o muy horizontal, Sanity recortará automáticamente
- **Instrucción para admins:** "Sube una foto de la fachada del templo. Si es muy vertical u horizontal, verás en preview cómo se recorta."

### Pastores
- **Aspecto:** Fotografía del pastor (de cintura para arriba idealmente)
- **Tamaño ideal:** 600px × 800px (3:4) o 700px × 933px (3:4)
- **Altura mínima:** 240px en pantalla
- **Consideración:** Fotos verticales funcionan mejor pero se recortarán en secciones anchas
- **Instrucción para admins:** "Sube una foto del pastor en pose profesional. Se mostrará cropped en h-60."

### Coros
- **Aspecto:** Foto del grupo de coros (preferiblemente grupo completo o símbolo representativo)
- **Tamaño ideal:** 800px × 533px (3:2) o 960px × 640px
- **Altura mínima:** 240px en pantalla
- **Consideración:** Fotos de grupo funcionan mejor que individuales
- **Instrucción para admins:** "Sube una foto del coro en grupo si es posible, o un logo representativo."

### Directiva
- **Aspecto:** Fotografía formal del miembro directivo
- **Tamaño ideal:** 600px × 800px (3:4) o 700px × 933px (3:4)
- **Altura mínima:** 240px en pantalla
- **Consideración:** Similar a Pastores
- **Instrucción para admins:** "Sube una foto formal del miembro de la directiva."

## Validación en Sanity Studio

Para añadir validación de tamaño en los esquemas de Sanity, usar:

```typescript
image: {
  type: 'image',
  options: {
    hotspot: true,
  },
  validation: Rule => Rule.required()
    .custom(async (image) => {
      if (!image) return true;
      // La validación exacta depende de la API de Sanity
      // Por ahora, se recomienda revisar manualmente en el preview
      return true;
    })
},
```

## Notas Técnicas

- **Object-fit:** All images in UI use `object-cover`, esto recortará la imagen para cubrir el área
- **Responsive:** El layout responsive se maneja en CSS, no en las imágenes
- **Fallbacks:** Si no hay imagen, se muestra un icono genérico (Church, User, Music, etc.)
- **Foto tipo:** Las imágenes se mostrarán desde h-60 (240px) en mobile hasta potencialmente h-96 en layouts amplios

## Próximos Pasos

1. Informar a admins sobre las especificaciones usando este documento
2. Considerar agregar validación de tamaño en Sanity Studio si es necesario
3. Revisar periódicamente que las imágenes subidas mantienen la calidad visual

