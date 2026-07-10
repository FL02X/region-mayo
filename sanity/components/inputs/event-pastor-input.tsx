import { useEffect, useRef, useState } from 'react'
import {
  type ObjectInputProps,
  type Reference,
  type ReferenceSchemaType,
  PatchEvent,
  set,
  useClient,
  useFormValue,
} from 'sanity'

type TempleValue = {
  _ref?: string
}

type PastorsQueryResult = {
  pastores?: Array<{
    _id: string
    fullName?: string
  }>
}

const API_VERSION = '2025-01-01'

export function EventPastorInput(
  props: ObjectInputProps<Reference, ReferenceSchemaType>,
) {
  const templo = useFormValue([
    ...props.path.slice(0, -1),
    'templo',
  ]) as TempleValue | undefined
  const client = useClient({ apiVersion: API_VERSION })
  const lastAutoPastorRef = useRef<string | null>(null)
  const [isResolving, setIsResolving] = useState(false)

  useEffect(() => {
    const temploRef = templo?._ref
    const currentPastorRef = props.value?._ref ?? null

    if (!temploRef) {
      lastAutoPastorRef.current = null
      setIsResolving(false)
      return
    }

    const shouldRespectManualValue =
      Boolean(currentPastorRef) &&
      currentPastorRef !== lastAutoPastorRef.current

    if (shouldRespectManualValue) {
      setIsResolving(false)
      return
    }

    let cancelled = false

    const resolvePastor = async () => {
      setIsResolving(true)

      try {
        const result = await client.fetch<PastorsQueryResult>(
          `*[_id == $id][0] {
            "pastores": *[
              _type == "pastor" &&
              templo._ref == ^._id &&
              !defined(deletedAt)
            ]{_id, fullName}
          }`,
          { id: temploRef },
        )

        if (cancelled) return

        const pastorId = result?.pastores?.[0]?._id
        if (!pastorId) {
          setIsResolving(false)
          return
        }

        if (currentPastorRef !== pastorId) {
          props.onChange(
            PatchEvent.from(
              set({
                _type: 'reference',
                _ref: pastorId,
              }),
            ),
          )
        }

        lastAutoPastorRef.current = pastorId
      } catch {
        // Si falla la consulta, dejamos el input normal editable.
      } finally {
        if (!cancelled) {
          setIsResolving(false)
        }
      }
    }

    void resolvePastor()

    return () => {
      cancelled = true
    }
  }, [client, props, templo?._ref])

  return (
    <div>
      {props.renderDefault(props)}
      <p className="mt-2 text-xs text-muted-foreground">
        {isResolving
          ? 'Buscando el pastor del templo...'
          : 'Si eliges un templo, aquí se sugiere automáticamente su pastor a cargo y luego puedes cambiarlo si hace falta.'}
      </p>
    </div>
  )
}

export default EventPastorInput
