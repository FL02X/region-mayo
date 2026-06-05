# Región Mayo

Aplicación web construida con [Next.js](https://nextjs.org) para consultar eventos, coros, templos y directorio de la Región Mayo.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Subida comunitaria de fotos

Para activar fotos comunitarias en un álbum de imágenes:

1. En Sanity Studio abre el álbum y activa **Permitir subida comunitaria**.
2. Genera el enlace de subida, cópialo y conviértelo en QR con una herramienta externa.
3. Comparte el QR con la congregación. Las fotos llegan como **Pendiente**.
4. En Studio revisa **Fotos pendientes** y cambia el estado a **Aprobada** o **Rechazada**.

Variables requeridas para producción: `SANITY_WRITE_TOKEN`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` y `NEXT_PUBLIC_SITE_URL`.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
