"use client"

import { useCallback, useEffect, useState } from "react"
import { ArrowRight, X } from "lucide-react"
import { useClient } from "sanity"

type SubmissionStatus = "pending" | "approved" | "rejected"

type ReviewListOptions = {
  status?: SubmissionStatus
  albumId?: string
}

type ReviewListProps = {
  options?: ReviewListOptions
}

type SubmissionItem = {
  _id: string
  submittedByName?: string
  uploadedAt?: string
  originalFilename?: string
  albumTitle?: string
  photoUrl?: string
}

const PHOTO_SUBMISSION_FIELDS = `{
  _id,
  submittedByName,
  uploadedAt,
  originalFilename,
  "albumTitle": album->title,
  "photoUrl": photo.asset->url
}`

function formatDate(value?: string) {
  if (!value) return "Sin fecha"

  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

export function AlbumPhotoSubmissionReviewList({ options }: ReviewListProps) {
  const client = useClient({ apiVersion: "2025-01-01" })
  const status = options?.status ?? "pending"
  const albumId = options?.albumId
  const [items, setItems] = useState<SubmissionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const loadItems = useCallback(async () => {
    setIsLoading(true)
    const albumFilter = albumId ? " && album._ref == $albumId" : ""
    const results = await client.fetch<SubmissionItem[]>(
      `*[_type == "albumPhotoSubmission" && status == $status${albumFilter}]
        | order(uploadedAt desc) ${PHOTO_SUBMISSION_FIELDS}`,
      { status, albumId },
    )
    setItems(results)
    setIsLoading(false)
  }, [albumId, client, status])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  const updateStatus = async (id: string, nextStatus: SubmissionStatus) => {
    setWorkingId(id)
    setMessage(null)

    try {
      await client.patch(id).set({ status: nextStatus }).commit()
      setItems((current) => current.filter((item) => item._id !== id))
      setMessage(nextStatus === "approved" ? "Foto aprobada." : "Foto rechazada.")
    } catch {
      setMessage("No se pudo actualizar la foto.")
    } finally {
      setWorkingId(null)
    }
  }

  if (isLoading) {
    return <div style={{ padding: 16 }}>Cargando fotos pendientes...</div>
  }

  return (
    <div style={{ padding: 16 }}>
      {message ? (
        <div
          style={{
            marginBottom: 12,
            border: "1px solid #d7dce4",
            background: "#fbf8f4",
            padding: "10px 12px",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {message}
        </div>
      ) : null}

      {items.length === 0 ? (
        <div
          style={{
            border: "1px dashed #c8d0da",
            background: "#fbf8f4",
            padding: 16,
            fontSize: 14,
          }}
        >
          No hay fotos pendientes.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {items.map((item) => (
            <article
              key={item._id}
              style={{
                display: "grid",
                gridTemplateColumns: "112px minmax(0, 1fr) auto",
                gap: 12,
                alignItems: "center",
                border: "1px solid #d7dce4",
                background: "#fbf8f4",
                padding: 12,
              }}
            >
              <div
                style={{
                  aspectRatio: "1 / 1",
                  overflow: "hidden",
                  background: "#eae6df",
                }}
              >
                {item.photoUrl ? (
                  <img
                    src={item.photoUrl}
                    alt={item.originalFilename || "Foto pendiente"}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : null}
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1c1917" }}>
                  {item.originalFilename || "Foto comunitaria"}
                </div>
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: "#991b1b",
                  }}
                >
                  {item.submittedByName || "Sin nombre"}
                </div>
                <div style={{ marginTop: 4, fontSize: 13, color: "#57534e" }}>
                  {item.albumTitle || "Sin album"} · {formatDate(item.uploadedAt)}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => updateStatus(item._id, "approved")}
                  disabled={workingId === item._id}
                  title="Aprobar foto"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 42,
                    height: 42,
                    border: "1px solid #86efac",
                    background: "#dcfce7",
                    color: "#15803d",
                    cursor: "pointer",
                  }}
                >
                  <ArrowRight size={22} />
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus(item._id, "rejected")}
                  disabled={workingId === item._id}
                  title="Rechazar foto"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 42,
                    height: 42,
                    border: "1px solid #fecaca",
                    background: "#fee2e2",
                    color: "#b91c1c",
                    cursor: "pointer",
                  }}
                >
                  <X size={22} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
