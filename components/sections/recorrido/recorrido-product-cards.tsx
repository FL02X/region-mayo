"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Newsreader } from "next/font/google";
import { Images, ShoppingBag } from "lucide-react";
import type { Product, RegionPresident } from "@/lib/types";
import { ImageGalleryModal } from "@/components/shared/image-album-modal";
import { sanityImageVariantUrl } from "@/lib/sanity/image";
import { ShopModal } from "./recorrido-shop-modal";

const editorialFont = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

const priceFormatter = new Intl.NumberFormat("es-MX", {
  maximumFractionDigits: 0,
});

interface RecorridoProductCardsProps {
  products: Product[];
  regionTreasurer: RegionPresident | null;
}

export function RecorridoProductCards({ products, regionTreasurer }: RecorridoProductCardsProps) {
  const [galleryProductId, setGalleryProductId] = useState<string | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [shopProductId, setShopProductId] = useState<string | null>(null);
  const [remainingStockByProductId, setRemainingStockByProductId] = useState<Record<string, number>>({});
  const activeGalleryProduct = useMemo(
    () => products.find((product) => product.id === galleryProductId) ?? null,
    [galleryProductId, products],
  );
  const shopProduct = useMemo(
    () => products.find((product) => product.id === shopProductId) ?? null,
    [products, shopProductId],
  );

  useEffect(() => {
    const productIds = products
      .filter((product) => typeof product.stock === "number")
      .map((product) => product.id);
    if (productIds.length === 0) return;

    let isCurrent = true;
    fetch("/api/product-stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds }),
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json() as Promise<{ products?: Array<{ id: string; remainingStock: number | null }> }>;
      })
      .then((data) => {
        if (!isCurrent || !data?.products) return;
        const availability = data.products;
        setRemainingStockByProductId((current) => ({
          ...current,
          ...Object.fromEntries(
            availability
              .filter((product) => typeof product.remainingStock === "number")
              .map((product) => [product.id, product.remainingStock as number]),
          ),
        }));
      })
      .catch(() => undefined);

    return () => {
      isCurrent = false;
    };
  }, [products]);

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
          const remainingStock = remainingStockByProductId[product.id] ?? product.stock;
          const isSoldOut = typeof remainingStock === "number" && remainingStock <= 0;
          const hasDeposit = typeof product.deposit === "number";
          const stockLabel = product.productType?.trim().toLocaleLowerCase("es-MX") || "existencias";

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
                disabled={!canOpenGallery || isSoldOut}
                className="relative block h-64 w-full overflow-hidden text-left disabled:cursor-default"
                aria-label={canOpenGallery ? `Ver fotos de ${product.name}` : undefined}
              >
                <Image
                  src={productImageUrl}
                  alt={product.name}
                  fill
                  sizes="(max-width: 767px) calc(100vw - 4rem), 360px"
                  className={`object-contain transition-opacity ${isSoldOut ? "opacity-35 grayscale" : ""}`}
                  unoptimized
                />
                {isSoldOut && (
                  <span className={`absolute inset-x-3 top-3 border border-border bg-muted/90 px-3 py-2 text-center text-xl font-semibold text-muted-foreground ${editorialFont.className}`}>
                    Agotado
                  </span>
                )}
                {hasMultiplePhotos && (
                  <span className="absolute right-3 bottom-3 inline-flex min-h-9 items-center gap-2 bg-paper px-3 text-xs font-semibold text-ink shadow-sm transition-colors hover:bg-paper-dark">
                    <Images className="h-4 w-4" aria-hidden="true" />
                    {product.photos.length} FOTOS
                  </span>
                )}
              </button>
              <div className="pt-4">
                {typeof remainingStock === "number" && (
                  <p className="mb-4.5 mt-[-14px] text-xs font-medium text-muted-foreground">Quedan {remainingStock} {stockLabel}.</p>
                )}
                {hasDeposit && (
                  <div className="mb-4 border border-[#c9a96e]/50 bg-[#f5eddc] px-3 py-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#9c7b36]">Anticipo</p>
                    <p className={`mt-0.5 text-2xl font-semibold tracking-tight text-[#7b5e27] ${editorialFont.className}`}>
                      <span className="mr-0.5 align-super font-sans text-[0.52em] font-semibold leading-none">$</span>
                      {priceFormatter.format(product.deposit!)} MXN
                    </p>
                  </div>
                )}
                <p className="text-sm font-semibold text-ink">{product.name}</p>
                <p className={`mt-1 text-3xl font-semibold tracking-tight text-ink ${editorialFont.className}`}>
                  <span className="mr-0.5 align-super font-sans text-[0.52em] font-semibold leading-none">$</span>
                  {priceFormatter.format(product.price)} MXN
                </p>
                <button
                  type="button"
                  onClick={() => setShopProductId(product.id)}
                  disabled={isSoldOut}
                  className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-55"
                >
                  <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                  {isSoldOut ? "AGOTADO" : "HACER PEDIDO"}
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
      {shopProduct && (
        <ShopModal
          product={shopProduct}
          isOpen
          onClose={() => setShopProductId(null)}
          regionTreasurer={regionTreasurer}
          onOrderSuccess={(remainingStock) => {
            if (remainingStock === null) return;
            setRemainingStockByProductId((current) => ({ ...current, [shopProduct.id]: remainingStock }));
          }}
        />
      )}
    </>
  );
}
