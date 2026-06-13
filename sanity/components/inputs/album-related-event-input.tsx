import { useEffect, useRef, useState } from 'react'
import {
  PatchEvent,
  set,
  unset,
  useClient,
  type ObjectInputProps,
  type Reference,
} from 'sanity'

type EventQueryResult = {
  eventType?: string
  date?: string
  endDate?: string
  schedule?: Array<{
    date?: string
  }>
}

const API_VERSION = '2025-01-01'

type AlbumDocumentValue = Record<string, unknown> & {
  relatedEvent?: Reference
}

function getEventDateRange(event?: EventQueryResult) {
  const scheduleDates = Array.isArray(event?.schedule)
    ? Array.from(
        new Set(
          event.schedule
            .map((item) => item?.date)
            .filter((date): date is string => Boolean(date)),
        ),
      ).sort()
    : []

  const startDate = scheduleDates[0] || event?.date
  const endDate =
    scheduleDates.length > 1
      ? scheduleDates[scheduleDates.length - 1]
      : event?.endDate && event.endDate !== startDate
        ? event.endDate
        : undefined

  return { startDate, endDate }
}

export function AlbumRelatedEventInput(props: ObjectInputProps<AlbumDocumentValue>) {
  const client = useClient({ apiVersion: API_VERSION })
  const lastEventRef = useRef<string | null>(null)
  const [isResolving, setIsResolving] = useState(false)

  useEffect(() => {
    const eventRef = props.value?.relatedEvent?._ref

    if (!eventRef) {
      lastEventRef.current = null
      setIsResolving(false)
      return
    }

    if (eventRef === lastEventRef.current) return

    let cancelled = false

    const resolveEvent = async () => {
      setIsResolving(true)

      try {
        const event = await client.fetch<EventQueryResult>(
          `*[_id == $id][0]{
            eventType,
            date,
            endDate,
            schedule[]{date}
          }`,
          { id: eventRef },
        )

        if (cancelled) return

        const { startDate, endDate } = getEventDateRange(event)
        const patches = [
          ...(startDate ? [set(startDate, ['startDate'])] : []),
          endDate ? set(endDate, ['endDate']) : unset(['endDate']),
          ...(event?.eventType ? [set(event.eventType, ['category'])] : []),
        ]

        props.onChange(PatchEvent.from(patches))

        lastEventRef.current = eventRef
      } catch {
        // Si falla la consulta, dejamos los campos editables manualmente.
      } finally {
        if (!cancelled) {
          setIsResolving(false)
        }
      }
    }

    void resolveEvent()

    return () => {
      cancelled = true
    }
  }, [client, props, props.value?.relatedEvent?._ref])

  return (
    <div>
      {props.renderDefault(props)}
      {isResolving ? (
        <p style={{ color: '#6b7280', fontSize: 12, margin: '8px 0 0' }}>
          Tomando fechas y categoria del evento...
        </p>
      ) : null}
    </div>
  )
}

export default AlbumRelatedEventInput
