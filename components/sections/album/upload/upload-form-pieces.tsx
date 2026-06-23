// Donde: ruta /subir/[albumSlug]/[uploadToken]. Viewports: desktop y mobile. Funcion: piezas visuales del formulario de subida; editar textos aqui cambia lo que ve el usuario.
import type { ChangeEvent, RefObject } from "react";
import NextImage from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBytes } from "@/components/sections/album/upload/upload-file-utils";

export type ProgressState = {
  current: number;
  total: number;
  label: string;
};

export type FilePreview = {
  key: string;
  name: string;
  size: number;
  url: string;
};

export type RemovalNotice = {
  id: number;
  message: string;
};

export function UploadSuccessMessage({ albumPath }: { albumPath: string }) {
  return (
    <div className="min-h-screen space-y-5 px-8 pb-8 pt-12 text-center md:px-16 md:pb-12">
      <div className="mx-auto flex items-center justify-center text-emerald-700">
        <CheckCircle2 className="h-16 w-16" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-foreground">Gracias por compartir tus fotos.</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Las recibimos correctamente y apareceran en el album cuando un encargado las apruebe.
        </p>
      </div>
      <Button asChild className="h-12 w-full rounded-none">
        <Link href={albumPath}>Volver al album</Link>
      </Button>
    </div>
  );
}

export function UploadAlbumHeader({
  coverImageUrl,
  albumTitle,
  titleClassName,
}: {
  coverImageUrl: string;
  albumTitle: string;
  titleClassName: string;
}) {
  return (
    <section className="min-w-0 max-w-full border-t border-border px-4 py-4 pt-6 md:px-8 md:py-6">
      <p className="mb-5 text-[13px] font-bold uppercase text-primary sm:text-sm">Compartir fotos</p>
      <div className="grid min-w-0 max-w-full grid-cols-[96px_minmax(0,1fr)] items-end gap-x-3 gap-y-3 sm:grid-cols-[128px_minmax(0,1fr)] md:items-start md:gap-x-5">
        <div className="relative h-24 w-24 overflow-hidden border border-border bg-muted sm:h-32 sm:w-32">
          <NextImage
            src={coverImageUrl}
            alt={albumTitle}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 96px, 128px"
            priority
          />
        </div>
        <div className="min-w-0 md:px-4 md:py-3">
          <h1 className={`${titleClassName} text-[clamp(1.55rem,7vw,2rem)] font-semibold leading-[1.05] text-foreground md:text-[2rem]`}>
            {albumTitle}
          </h1>
        </div>
      </div>
    </section>
  );
}

export function PhotoSelector({
  fileInputRef,
  filePreviews,
  selectedSummary,
  isSubmitting,
  onSelectFiles,
  onOpenFileDialog,
  onRemoveAllSelectedFiles,
  onRemoveSelectedFile,
}: {
  fileInputRef: RefObject<HTMLInputElement | null>;
  filePreviews: FilePreview[];
  selectedSummary: string;
  isSubmitting: boolean;
  onSelectFiles: (event: ChangeEvent<HTMLInputElement>) => void;
  onOpenFileDialog: () => void;
  onRemoveAllSelectedFiles: () => void;
  onRemoveSelectedFile: (fileKey: string) => void;
}) {
  return (
    <div className="min-w-0 max-w-full font-semibold text-ink px-4 py-4 md:border-b-0 md:border-r md:px-8 md:py-6">
      <Label htmlFor="album-upload-files" className="text-sm text-ink font-semibold uppercase md:text-base">Seleccionar fotos</Label>
      <input
        ref={fileInputRef}
        id="album-upload-files"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        onChange={onSelectFiles}
        disabled={isSubmitting}
      />
      <button
        type="button"
        className="mt-6 mb-2 flex min-h-[140px] w-full max-w-full flex-col items-center justify-center gap-2 border border-dashed border-[#9aa8b6] bg-paper-highlight p-10 text-center transition-colors touch-manipulation hover:border-primary/70 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60 md:min-h-[190px]"
        onClick={onOpenFileDialog}
        disabled={isSubmitting}
      >
        <span className="flex h-12 w-12 items-center justify-center text-primary md:h-14 md:w-14">
          <ImagePlus className="h-9 w-9 md:h-10 md:w-10" aria-hidden="true" />
        </span>
        <span className="text-base font-semibold leading-tight text-foreground md:text-lg">Agregar fotos</span>
        <span className="max-w-sm text-[15px] leading-6 text-muted-foreground md:max-w-md">
          Selecciona hasta 10 imagenes desde este dispositivo.
        </span>
        <span className="mt-2 inline-flex h-11 items-center justify-center gap-2 bg-primary px-5 text-sm uppercase font-semibold text-white shadow-sm md:hidden">
          <UploadCloud className="h-5 w-5" aria-hidden="true" />
          Subir fotos
        </span>
      </button>
      {filePreviews.length > 0 ? (
        <div className="mt-8 min-w-0 max-w-full">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <p className="min-w-0 text-sm font-semibold uppercase text-ink">{selectedSummary}</p>
            <button
              type="button"
              className="shrink-0 text-xs font-semibold uppercase text-red-700 underline-offset-2 transition-colors hover:text-red-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              onClick={onRemoveAllSelectedFiles}
              disabled={isSubmitting}
            >
              Eliminar todas
            </button>
          </div>
          <div className="mt-3 flex min-w-0 max-w-full flex-col gap-3">
            {filePreviews.map((preview) => (
              <div
                key={preview.key}
                className="grid min-w-0 max-w-full grid-cols-[56px_minmax(0,1fr)_40px] items-center gap-3 overflow-hidden border border-[#d7dce4] bg-paper-highlight p-4"
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden bg-muted">
                  <img
                    src={preview.url}
                    alt={preview.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="min-w-0 overflow-hidden">
                  <p className="break-all text-[14px] font-medium leading-snug text-foreground">{preview.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(preview.size)}</p>
                </div>
                <button
                  type="button"
                  className="flex h-10 w-10 shrink-0 items-center justify-center border border-red-200 bg-red-50 text-red-700 transition-colors hover:border-red-300 hover:bg-red-100 hover:text-red-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50"
                  onClick={() => onRemoveSelectedFile(preview.key)}
                  disabled={isSubmitting}
                  aria-label={`Quitar ${preview.name}`}
                >
                  <Trash2 className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function UploadRulesCard({
  uploadRulesError,
  uploadInstructions,
}: {
  uploadRulesError: string;
  uploadInstructions?: string;
}) {
  return (
    <div className="border border-red-200 bg-red-50 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-800">
        <CheckCircle2 className="h-4 w-4 text-red-700" aria-hidden="true" />
        Reglas de subida
      </div>
      <p className="mb-2 text-sm font-medium leading-6 text-red-700">{uploadRulesError}</p>
      <ul className="space-y-1 text-sm leading-6 text-red-700">
        <li>Maximo 10 fotos por envio.</li>
        <li>Maximo 5 MB por foto.</li>
        <li>Formatos permitidos: JPG, PNG o WEBP.</li>
      </ul>
      {uploadInstructions ? (
        <p className="mt-3 border-t border-red-200 pt-3 text-sm leading-6 text-red-800">
          {uploadInstructions}
        </p>
      ) : null}
    </div>
  );
}

export function UploadDetailsPanel({
  uploadRulesError,
  uploadInstructions,
  submittedByName,
  isSubmitting,
  allowDevBypass,
  turnstileSiteKey,
  turnstileContainerRef,
  progress,
  error,
  selectedFilesCount,
  turnstileToken,
  onSubmittedByNameChange,
}: {
  uploadRulesError: string | null;
  uploadInstructions?: string;
  submittedByName: string;
  isSubmitting: boolean;
  allowDevBypass: boolean;
  turnstileSiteKey: string;
  turnstileContainerRef: RefObject<HTMLDivElement | null>;
  progress: ProgressState | null;
  error: string | null;
  selectedFilesCount: number;
  turnstileToken: string;
  onSubmittedByNameChange: (value: string) => void;
}) {
  return (
    <div className="space-y-4 px-4 pb-8 md:px-6 md:py-6">
      {uploadRulesError ? (
        <UploadRulesCard
          uploadRulesError={uploadRulesError}
          uploadInstructions={uploadInstructions}
        />
      ) : null}

      <div className="space-y-4 mb-8 mt-4">
        <Label htmlFor="submittedByName" className="ml-1 uppercase font-semibold text-ink">A nombre de:</Label>
        <Input
          id="submittedByName"
          value={submittedByName}
          onChange={(event) => onSubmittedByNameChange(event.target.value.slice(0, 80))}
          placeholder="Tu nombre"
          required
          disabled={isSubmitting}
          className="h-12 rounded-none border-border !bg-[var(--bg-paper-highlight)]"
        />
      </div>

      {allowDevBypass ? (
        <div className="border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
          Turnstile no esta configurado. En desarrollo se permite un bypass controlado.
        </div>
      ) : turnstileSiteKey ? (
        <div className="min-h-[72px] overflow-x-auto mb-6">
          <div ref={turnstileContainerRef} />
        </div>
      ) : (
        <div className="border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">
          Falta configurar Turnstile para recibir fotos.
        </div>
      )}

      {progress ? (
        <div className="border border-[#dbe7f1] bg-[#f6f9fc] p-3" aria-live="polite">
          <div className="mb-2 flex items-center justify-between text-sm font-medium text-foreground">
            <span>{progress.label}</span>
            <span>
              {progress.current}/{progress.total}
            </span>
          </div>
          <div className="h-2 overflow-hidden bg-white">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      ) : null}

      {error && error !== uploadRulesError ? (
        <div className="border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700" role="alert">
          {error}
        </div>
      ) : null}

      <Button
        type="submit"
        className="h-14 w-full uppercase rounded-none text-base font-semibold"
        disabled={
          isSubmitting ||
          selectedFilesCount === 0 ||
          !submittedByName.trim() ||
          (!allowDevBypass && !turnstileToken)
        }
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            Enviando fotos
          </>
        ) : (
          <>
            Enviar fotos
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </>
        )}
      </Button>
    </div>
  );
}

export function RemovalNoticeToast({
  removalNotice,
  isRemovalNoticeExiting,
}: {
  removalNotice: RemovalNotice | null;
  isRemovalNoticeExiting: boolean;
}) {
  if (!removalNotice) return null;

  return (
    <div
      key={removalNotice.id}
      className={`fixed bottom-5 left-1/2 z-50 flex w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 justify-center px-2 transition-all duration-300 ease-out ${
        isRemovalNoticeExiting
          ? "translate-y-3 scale-95 opacity-0"
          : "animate-in fade-in slide-in-from-bottom-3 zoom-in-95 translate-y-0 scale-100 opacity-100"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="inline-flex max-w-full items-center border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold leading-5 text-red-700 shadow-lg">
        <span className="min-w-0 break-words text-center">{removalNotice.message}</span>
      </div>
    </div>
  );
}
