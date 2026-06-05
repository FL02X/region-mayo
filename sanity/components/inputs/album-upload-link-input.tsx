import { useMemo, useState } from 'react'
import {
  PatchEvent,
  set,
  unset,
  useFormValue,
  type StringInputProps,
} from 'sanity'

type SlugValue = {
  current?: string
}

const TOKEN_BYTES = 18

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return toHex(new Uint8Array(digest))
}

function createUploadToken(): string {
  const bytes = new Uint8Array(TOKEN_BYTES)
  crypto.getRandomValues(bytes)
  return toBase64Url(bytes)
}

function getSiteOrigin(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (configuredUrl) return configuredUrl.replace(/\/+$/, '')

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return ''
}

export function AlbumUploadLinkInput(props: StringInputProps) {
  const slug = useFormValue(['slug']) as SlugValue | undefined
  const [generatedUrl, setGeneratedUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const albumSlug = slug?.current
  const hasTokenHash = typeof props.value === 'string' && props.value.length > 0

  const uploadPath = useMemo(() => {
    if (!albumSlug) return ''
    return `/subir/${albumSlug}`
  }, [albumSlug])

  const generateLink = async () => {
    setError('')
    setCopied(false)

    if (!albumSlug) {
      setError('Primero genera y guarda el slug del album.')
      return
    }

    try {
      const token = createUploadToken()
      const tokenHash = await sha256Hex(token)
      const url = `${getSiteOrigin()}${uploadPath}/${token}`

      props.onChange(PatchEvent.from(set(tokenHash)))
      setGeneratedUrl(url)

      try {
        await navigator.clipboard.writeText(url)
        setCopied(true)
      } catch {
        setCopied(false)
      }
    } catch {
      setError('No se pudo generar el enlace. Intenta de nuevo.')
    }
  }

  const revokeLink = () => {
    setGeneratedUrl('')
    setCopied(false)
    setError('')
    props.onChange(PatchEvent.from(unset()))
  }

  return (
    <div>
      <div style={{ display: 'none' }}>{props.renderDefault(props)}</div>

      <div
        style={{
          border: '1px solid #d6dbe1',
          padding: '14px',
          background: '#f8fafc',
        }}
      >
        <p style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.5 }}>
          Genera un enlace privado para convertirlo en QR. El token real solo se muestra una vez;
          Sanity guarda un hash para poder validarlo sin exponerlo.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button
            type="button"
            onClick={generateLink}
            style={{
              border: 0,
              background: '#005998',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 700,
              padding: '9px 12px',
            }}
          >
            {hasTokenHash ? 'Regenerar enlace' : 'Generar enlace'}
          </button>
          {hasTokenHash ? (
            <button
              type="button"
              onClick={revokeLink}
              style={{
                border: '1px solid #d6dbe1',
                background: 'white',
                color: '#111827',
                cursor: 'pointer',
                fontWeight: 600,
                padding: '8px 12px',
              }}
            >
              Revocar enlace
            </button>
          ) : null}
        </div>

        {generatedUrl ? (
          <div style={{ marginTop: 12 }}>
            <label
              htmlFor="album-upload-link"
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              Enlace de subida
            </label>
            <input
              id="album-upload-link"
              readOnly
              value={generatedUrl}
              onFocus={(event) => event.currentTarget.select()}
              style={{
                border: '1px solid #d6dbe1',
                boxSizing: 'border-box',
                fontSize: 13,
                padding: '8px',
                width: '100%',
              }}
            />
            <p style={{ color: copied ? '#047857' : '#4b5563', fontSize: 12, margin: '6px 0 0' }}>
              {copied
                ? 'Enlace copiado. Puedes pegarlo en una herramienta externa para generar el QR.'
                : 'Copia este enlace ahora. Si cierras esta pantalla, tendras que regenerarlo.'}
            </p>
          </div>
        ) : hasTokenHash ? (
          <p style={{ color: '#4b5563', fontSize: 12, margin: '10px 0 0' }}>
            Este album ya tiene un enlace activo. Si no lo tienes guardado, regenera uno nuevo.
          </p>
        ) : null}

        {uploadPath ? (
          <p style={{ color: '#6b7280', fontSize: 12, margin: '10px 0 0' }}>
            Ruta preparada: {uploadPath}/[token]
          </p>
        ) : null}

        {error ? (
          <p style={{ color: '#b91c1c', fontSize: 12, margin: '10px 0 0' }}>{error}</p>
        ) : null}
      </div>
    </div>
  )
}

export default AlbumUploadLinkInput
