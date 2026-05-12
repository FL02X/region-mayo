/**
 * DENORMALIZATION HOOKS - Auto-llenado de Campos Denormalizados
 * 
 * Estos hooks se ejecutan automáticamente para llenar campos denormalizados
 * como region y temploName en el documento coro, basándose en sus referencias.
 * 
 * Beneficios:
 * - Las queries no necesitan joins
 * - Los datos están siempre sincronizados
 * - Mejor rendimiento de búsquedas
 * 
 * INSTALACIÓN: Ver sanity.config.ts para registerBeforeCommit
 */

type DenormalizationDocument = {
  _type?: string
  templo?: {
    _ref?: string
  }
  region?: {
    _type: 'reference'
    _ref: string
  } | null
  temploName?: string
  regionName?: string
  [key: string]: any
}

type DenormalizationContext = {
  getClient: (options: { apiVersion: string }) => {
    fetch: <T>(query: string, params: Record<string, unknown>) => Promise<T>
  }
}

/**
 * Hook para auto-llenar campos denormalizados en CORO
 * Llena: region (desde templo.region), temploName, regionName
 */
export const coroBeforeCommit = async (
  documentBeforeCommit: DenormalizationDocument,
  context: DenormalizationContext
): Promise<DenormalizationDocument> => {
  // Solo procesar documentos de tipo 'coro'
  if (documentBeforeCommit._type !== 'coro') {
    return documentBeforeCommit
  }

  // Si no hay templo asignado, no hacer nada
  if (!documentBeforeCommit.templo?._ref) {
    return documentBeforeCommit
  }

  try {
    const client = context.getClient({ apiVersion: '2024-01-01' })

    // Fetch el templo para obtener su región, name, y regionName
    const templo = await client.fetch(
      `*[_id == $id][0] { region->{_id, name}, temploName }`,
      { id: documentBeforeCommit.templo._ref }
    )

    if (!templo) {
      return documentBeforeCommit
    }

    // Auto-llenar los campos denormalizados
    return {
      ...documentBeforeCommit,
      region: templo.region ? { _type: 'reference', _ref: templo.region._id } : null,
      temploName: templo.temploName,
      regionName: templo.region?.name,
    }
  } catch (error) {
    // En caso de error, retornar el documento sin cambios
    console.error('Error en coroBeforeCommit:', error)
    return documentBeforeCommit
  }
}
