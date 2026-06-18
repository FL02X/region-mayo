"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Check, X } from "lucide-react"
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
  albumTitle?: string
  photoUrl?: string
}

const PHOTO_SUBMISSION_FIELDS = `{
  _id,
  submittedByName,
  "albumTitle": album->title,
  "photoUrl": photo.asset->url
}`

type ReviewToast = {
  text: string
  tone: "success" | "error"
  isExiting: boolean
}

export function AlbumPhotoSubmissionReviewList({ options }: ReviewListProps) {
  const client = useClient({ apiVersion: "2025-01-01" })
  const status = options?.status ?? "pending"
  const albumId = options?.albumId
  const [items, setItems] = useState<SubmissionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [toast, setToast] = useState<ReviewToast | null>(null)
  const toastTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearToastTimers = useCallback(() => {
    toastTimersRef.current.forEach((timer) => clearTimeout(timer))
    toastTimersRef.current = []
  }, [])

  const showToast = useCallback(
    (text: string, tone: ReviewToast["tone"]) => {
      clearToastTimers()
      setToast({ text, tone, isExiting: false })

      toastTimersRef.current = [
        setTimeout(() => {
          setToast((current) => (current ? { ...current, isExiting: true } : current))
        }, 2200),
        setTimeout(() => {
          setToast(null)
        }, 2600),
      ]
    },
    [clearToastTimers],
  )

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

  useEffect(() => clearToastTimers, [clearToastTimers])

  const updateStatus = async (id: string, nextStatus: SubmissionStatus) => {
    setWorkingId(id)
    clearToastTimers()
    setToast(null)

    try {
      await client.patch(id).set({ status: nextStatus }).commit()
      setItems((current) => current.filter((item) => item._id !== id))
      showToast(
        nextStatus === "approved" ? "Foto aprobada." : "Foto rechazada.",
        nextStatus === "approved" ? "success" : "error",
      )
    } catch {
      showToast("No se pudo actualizar la foto.", "error")
    } finally {
      setWorkingId(null)
    }
  }

  if (isLoading) {
    return <div style={{ padding: 16 }}>Cargando fotos pendientes...</div>
  }

  return (
    <div style={{ padding: 16 }}>
      <style>
        {`
          @keyframes albumReviewToastIn {
            from {
              opacity: 0;
              transform: translate(-50%, 16px) scale(0.96);
            }
            to {
              opacity: 1;
              transform: translate(-50%, 0) scale(1);
            }
          }

          @keyframes albumReviewToastOut {
            from {
              opacity: 1;
              transform: translate(-50%, 0) scale(1);
            }
            to {
              opacity: 0;
              transform: translate(-50%, 16px) scale(0.96);
            }
          }
        `}
      </style>

      {toast ? (
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: 20,
            zIndex: 1000,
            width: "calc(100% - 32px)",
            maxWidth: 320,
            border: toast.tone === "success" ? "1px solid #16a34a" : "1px solid #dc2626",
            background: toast.tone === "success" ? "#86efac" : "#fca5a5",
            color: "#111827",
            padding: "12px 16px",
            textAlign: "center",
            fontSize: 14,
            fontWeight: 800,
            boxShadow: "0 14px 34px rgba(0, 0, 0, 0.3)",
            animation: toast.isExiting
              ? "albumReviewToastOut 220ms ease-in forwards"
              : "albumReviewToastIn 220ms ease-out forwards",
          }}
          role="status"
          aria-live="polite"
        >
          {toast.text}
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
                    alt="Foto pendiente"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : null}
              </div>

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
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
                  {item.albumTitle || "Sin album"}
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
                  <Check size={22} />
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
