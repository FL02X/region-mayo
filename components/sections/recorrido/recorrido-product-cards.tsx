"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Newsreader } from "next/font/google";
import { Images, ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/types";
import { ImageGalleryModal } from "@/components/shared/image-album-modal";
import { sanityImageVariantUrl } from "@/lib/sanity/image";

const editorialFont = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

const priceFormatter = new Intl.NumberFormat("es-MX", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

interface RecorridoProductCardsProps {
  products: Product[];
}

export function RecorridoProductCards({ products }: RecorridoProductCardsProps) {
  const [galleryProductId, setGalleryProductId] = useState<string | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const activeGalleryProduct = useMemo(
    () => products.find((product) => product.id === galleryProductId) ?? null,
    [galleryProductId, products],
  );

  if (products.length === 0) return null;

  return (
    <>
      <div className="grid gap-5 md:grid-cols-2">
        {products.map((product) => {
          const primaryImage = product.photos[0] || "/placeholder.svg";
          const productImageUrl = sanityImageVariantUrl(primaryImage, {
            width: 960,
            quality: 82,
            format: "webp",
            fit: "max",
          });
          const canOpenGallery = product.photos.length > 0;
          const hasMultiplePhotos = product.photos.length > 1;

          const openGallery = () => {
            if (!canOpenGallery) return;
            setGalleryProductId(product.id);
            setGalleryIndex(0);
          };

          return (
            <article key={product.id} className="p-3">
              <button
                type="button"
                onClick={openGallery}
                disabled={!canOpenGallery}
                className="relative block h-64 w-full overflow-hidden text-left disabled:cursor-default"
                aria-label={canOpenGallery ? `Ver fotos de ${product.name}` : undefined}
              >
                <Image
                  src={productImageUrl}
                  alt={product.name}
                  fill
                  sizes="(max-width: 767px) calc(100vw - 4rem), 360px"
                  className="object-contain"
                  unoptimized
                />
                {hasMultiplePhotos && (
                  <span className="absolute right-3 bottom-3 inline-flex min-h-9 items-center gap-2 bg-paper px-3 text-xs font-semibold text-ink shadow-sm transition-colors hover:bg-paper-dark">
                    <Images className="h-4 w-4" aria-hidden="true" />
                    {product.photos.length} FOTOS
                  </span>
                )}
              </button>
              <div className="pt-4">
                <p className="text-sm font-semibold text-ink">{product.name}</p>
                <p className={`mt-1 text-3xl font-semibold tracking-tight text-ink ${editorialFont.className}`}>
                  <span className="mr-0.5 align-super font-sans text-[0.52em] font-semibold leading-none">$</span>
                  {priceFormatter.format(product.price)} MXM
                </p>
                <button
                  type="button"
                  className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 bg-brand px-4 text-sm font-semibold text-white"
                >
                  <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                  HACER PEDIDO
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {activeGalleryProduct && (
        <ImageGalleryModal
          images={activeGalleryProduct.photos}
          currentIndex={galleryIndex}
          onClose={() => setGalleryProductId(null)}
          onNavigate={setGalleryIndex}
          alt={activeGalleryProduct.name}
        />
      )}
    </>
  );
}
