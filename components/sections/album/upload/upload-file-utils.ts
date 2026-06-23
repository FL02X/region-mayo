// Donde: no renderiza UI directo. Viewports: afecta formulario de subida. Funcion: valida y comprime fotos antes de enviarlas.
import {
  ALBUM_SUBMISSION_ALLOWED_TYPES,
  ALBUM_SUBMISSION_MAX_FILE_SIZE,
  ALBUM_SUBMISSION_MAX_FILES,
} from "@/lib/album-submission-constants";

const MAX_CANVAS_DIMENSION = 1800;
const COMPRESS_QUALITIES = [0.82, 0.74, 0.66, 0.58];

export function createSessionId(): string {
  if (crypto.randomUUID) return crypto.randomUUID();

  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateFiles(files: File[]): string | null {
  if (files.length === 0) return "Selecciona al menos una foto.";
  if (files.length > ALBUM_SUBMISSION_MAX_FILES) {
    return "Puedes subir maximo 10 fotos por envio.";
  }

  for (const file of files) {
    if (file.size <= 0) return "Selecciona al menos una foto.";
    if (file.size > ALBUM_SUBMISSION_MAX_FILE_SIZE) {
      return "Una de las fotos supera el limite de 5 MB.";
    }
    if (!ALBUM_SUBMISSION_ALLOWED_TYPES.has(file.type)) {
      return "Solo se permiten imagenes JPG, PNG o WEBP.";
    }
  }

  return null;
}

export function isUploadRuleError(message: string | null): message is string {
  if (!message) return false;
  return (
    message.includes("maximo 10 fotos") ||
    message.includes("supera el limite") ||
    message.includes("Solo se permiten")
  );
}

function getCompressedFilename(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "").trim() || "foto";
  return `${withoutExtension}.webp`;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen."));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/webp", quality);
  });
}

export async function compressImage(file: File): Promise<File> {
  const image = await loadImage(file);
  const largestSide = Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height);
  const scale = largestSide > MAX_CANVAS_DIMENSION ? MAX_CANVAS_DIMENSION / largestSide : 1;
  const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
  const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) throw new Error("No se pudo optimizar la foto.");

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  for (const quality of COMPRESS_QUALITIES) {
    const blob = await canvasToBlob(canvas, quality);
    if (blob && blob.size > 0 && blob.size <= ALBUM_SUBMISSION_MAX_FILE_SIZE) {
      return new File([blob], getCompressedFilename(file.name), {
        type: "image/webp",
        lastModified: file.lastModified,
      });
    }
  }

  if (file.size <= ALBUM_SUBMISSION_MAX_FILE_SIZE) return file;

  throw new Error("Una de las fotos no pudo optimizarse bajo el limite de 5 MB.");
}
