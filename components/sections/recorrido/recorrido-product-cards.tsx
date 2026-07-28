"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Newsreader } from "next/font/google";
import { ChevronDown, Images, ShoppingBag } from "lucide-react";
import { ShoppingBagCancel } from "griddy-icons";
import type { Product, RegionPresident } from "@/lib/types";
import { ImageGalleryModal } from "@/components/shared/image-album-modal";
import {
  addStoredProductOrder,
  parseStoredProductOrders,
  RECORRIDO_ORDERS_STORAGE_KEY,
  removeStoredProductOrder,
  type StoredProductOrder,
} from "@/lib/recorrido-orders";
import { sanityImageVariantUrl } from "@/sanity/lib/image";
import { RecorridoCancelOrderModal } from "./recorrido-cancel-order-modal";
import { PaymentReceiptButton, ShopModal } from "./recorrido-shop-modal";

const editorialFont = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

const priceFormatter = new Intl.NumberFormat("es-MX", {
  maximumFractionDigits: 0,
});

// TEMPORAL: cuando está activa, "HACER PEDIDO" muestra las imágenes de public/images/recorrido-venta/ en vez del modal de compra.
const CHANGE_BUTTON_ACTION_TO_SHOW_IMAGE: boolean = true;

const RECORRIDO_VENTA_IMAGES = [
  "/images/recorrido-venta/precios_venta_camisetas_recorrido.jpg",
];

const getProductGalleryImages = (product: Product) =>
  Array.from(new Set([
    ...product.photos,
    ...(product.variants ?? []).flatMap((variant) => variant.photos),
  ]));

interface RecorridoProductCardsProps {
  products: Product[];
  regionTreasurer: RegionPresident | null;
}

export function RecorridoProductCards({ products, regionTreasurer }: RecorridoProductCardsProps) {
  const [galleryProductId, setGalleryProductId] = useState<string | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isRecorridoVentaGalleryOpen, setIsRecorridoVentaGalleryOpen] = useState(false);
  const [recorridoVentaGalleryIndex, setRecorridoVentaGalleryIndex] = useState(0);
  const [shopProductId, setShopProductId] = useState<string | null>(null);
  const [storedOrders, setStoredOrders] = useState<StoredProductOrder[]>([]);
  const [orderToCancel, setOrderToCancel] = useState<StoredProductOrder | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [alreadyPaidNotice, setAlreadyPaidNotice] = useState(false);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [remainingStockByProductId, setRemainingStockByProductId] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      products
        .filter((product) => typeof product.remainingStock === "number")
        .map((product) => [product.id, product.remainingStock as number]),
    ),
  );
  const activeGalleryProduct = useMemo(
    () => products.find((product) => product.id === galleryProductId) ?? null,
    [galleryProductId, products],
  );
  const activeGalleryImages = useMemo(
    () => activeGalleryProduct ? getProductGalleryImages(activeGalleryProduct) : [],
    [activeGalleryProduct],
  );
  const shopProduct = useMemo(
    () => products.find((product) => product.id === shopProductId) ?? null,
    [products, shopProductId],
  );

  useEffect(() => {
    try {
      const orders = parseStoredProductOrders(window.localStorage.getItem(RECORRIDO_ORDERS_STORAGE_KEY));
      const migratedOrders = orders.map((order) => Number.isFinite(Date.parse(order.createdAt ?? ""))
        ? order
        : { ...order, createdAt: new Date(0).toISOString() });
      if (migratedOrders.some((order, index) => order !== orders[index])) {
        try {
          window.localStorage.setItem(RECORRIDO_ORDERS_STORAGE_KEY, JSON.stringify(migratedOrders));
        } catch {
          // The migrated orders remain available for this session if storage is unavailable.
        }
      }
      setStoredOrders(migratedOrders);
    } catch {
      setStoredOrders([]);
    }
  }, []);

  useEffect(() => {
    const orderIds = storedOrders.map((order) => order.id);
    const orderedProductIds = new Set(storedOrders.map((order) => order.productId));
    const productIds = products
      .filter((product) => typeof product.stock === "number" || orderedProductIds.has(product.id))
      .map((product) => product.id);
    if (productIds.length === 0) return;

    let isCurrent = true;
    const refreshCachedStock = () => {
      fetch("/api/product-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds, orderIds }),
      })
        .then(async (response) => {
          if (!response.ok) return null;
          return response.json() as Promise<{ products?: Array<{
            id: string;
            remainingStock: number | null;
            acceptedOrderIds?: string[];
            activeOrderIds?: string[];
            orderStatusSyncedAt?: string | null;
          }> }>;
        })
        .then((data) => {
          if (!isCurrent || !data?.products) return;
          const statusByProductId = new Map(data.products.map((product) => [product.id, product]));
          setStoredOrders((current) => {
            const next = current.filter((order) => {
              const product = statusByProductId.get(order.productId);
              if (!product) return true;
              if (product.acceptedOrderIds?.includes(order.id)) return false;
              if (product.activeOrderIds?.includes(order.id)) return true;
              const syncedAt = Date.parse(product.orderStatusSyncedAt ?? "");
              const createdAt = Date.parse(order.createdAt ?? "");
              return !Number.isFinite(syncedAt) || !Number.isFinite(createdAt) || syncedAt < createdAt;
            });
            if (next.length === current.length) return current;
            try {
              if (next.length > 0) {
                window.localStorage.setItem(RECORRIDO_ORDERS_STORAGE_KEY, JSON.stringify(next));
              } else {
                window.localStorage.removeItem(RECORRIDO_ORDERS_STORAGE_KEY);
              }
            } catch {
              // The synced orders stay hidden for this session if storage is unavailable.
            }
            return next;
          });
          setRemainingStockByProductId((current) => ({
            ...current,
            ...Object.fromEntries(
              data.products!
                .filter((product) => typeof product.remainingStock === "number")
                .map((product) => [product.id, product.remainingStock as number]),
            ),
          }));
        })
        .catch(() => undefined);
    };

    refreshCachedStock();
    const intervalId = window.setInterval(refreshCachedStock, 60_000);

    return () => {
      isCurrent = false;
      window.clearInterval(intervalId);
    };
  }, [products, storedOrders]);

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;
    setIsCancelling(true);
    setCancelError(null);
    try {
      const response = await fetch("/api/product-order", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: orderToCancel.productId, orderId: orderToCancel.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.code === "ORDER_ALREADY_PAID") {
          setStoredOrders((current) => {
            const next = removeStoredProductOrder(current, orderToCancel.id);
            try {
              if (next.length > 0) {
                window.localStorage.setItem(RECORRIDO_ORDERS_STORAGE_KEY, JSON.stringify(next));
              } else {
                window.localStorage.removeItem(RECORRIDO_ORDERS_STORAGE_KEY);
              }
            } catch {
              // The paid order stays hidden for this session if storage is unavailable.
            }
            return next;
          });
          setAlreadyPaidNotice(true);
          return;
        }
        throw new Error(data.error || "No se pudo cancelar el pedido.");
      }

      setStoredOrders((current) => {
        const next = removeStoredProductOrder(current, orderToCancel.id);
        try {
          if (next.length > 0) {
            window.localStorage.setItem(RECORRIDO_ORDERS_STORAGE_KEY, JSON.stringify(next));
          } else {
            window.localStorage.removeItem(RECORRIDO_ORDERS_STORAGE_KEY);
          }
        } catch {
          // The canceled order stays hidden for this session if storage is unavailable.
        }
        return next;
      });
      setOrderToCancel(null);
    } catch (error) {
      setCancelError(error instanceof Error ? error.message : "No se pudo cancelar el pedido.");
    } finally {
      setIsCancelling(false);
    }
  };

  if (products.length === 0) return null;

  return (
    <>
      <div className="grid gap-5 md:grid-cols-2">
        {products.map((product) => {
          const galleryImages = getProductGalleryImages(product);
          const primaryImage = product.photos[0] || "/placeholder.svg";
          const productImageUrl = sanityImageVariantUrl(primaryImage, {
            width: 960,
            quality: 82,
            format: "webp",
            fit: "max",
          });
          const canOpenGallery = galleryImages.length > 0;
          const hasMultiplePhotos = galleryImages.length > 1;
          const remainingStock = remainingStockByProductId[product.id] ?? product.remainingStock ?? product.stock;
          const isSoldOut = typeof remainingStock === "number" && remainingStock <= 0;
          const hasDeposit = typeof product.deposit === "number";
          const stockLabel = product.productType?.trim().toLocaleLowerCase("es-MX") || "existencias";
          const pendingOrders = storedOrders.filter(
            (order) => order.productId === product.id,
          );
          const isExpanded = expandedProductId === product.id;

          const openGallery = () => {
            if (!canOpenGallery) return;
            setGalleryProductId(product.id);
            setGalleryIndex(0);
          };

          return (
            <article key={product.id} className={`relative p-3 ${isSoldOut ? "bg-muted/35" : ""}`}>
              {isSoldOut && (
                <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                  <span className="border border-border bg-paper/95 px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground shadow-sm">
                    Agotado
                  </span>
                </div>
              )}
              <div className={isSoldOut ? "pointer-events-none opacity-45 grayscale" : ""}>
              <button
                type="button"
                onClick={openGallery}
                disabled={!canOpenGallery || isSoldOut}
                className="relative block h-64 w-full overflow-hidden text-left disabled:cursor-default hover:bg-brand/5"
                aria-label={canOpenGallery ? `Ver fotos de ${product.name}` : undefined}
              >
                <Image
                  src={productImageUrl}
                  alt={product.name}
                  fill
                  sizes="(max-width: 767px) calc(100vw - 4rem), 360px"
                  className="object-contain transition-opacity"
                  unoptimized
                />
                {hasMultiplePhotos && (
                  <span className="absolute right-3 bottom-3 inline-flex min-h-9 items-center gap-2 bg-paper-highlight px-3 text-xs font-semibold text-ink shadow-sm transition-colors">
                    <Images className="h-4 w-4" aria-hidden="true" />
                    {galleryImages.length} FOTOS
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
                  onClick={() => {
                    // TEMPORAL: ignora el producto y su configuración en Sanity para mostrar el álbum de public/images/recorrido-venta/.
                    if (CHANGE_BUTTON_ACTION_TO_SHOW_IMAGE) {
                      setRecorridoVentaGalleryIndex(0);
                      setIsRecorridoVentaGalleryOpen(true);
                      return;
                    }

                    setShopProductId(product.id);
                  }}
                  disabled={isSoldOut}
                  className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 bg-brand px-4 text-md font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-55"
                >
                  <ShoppingBag className="h-5 w-5 mr-1" aria-hidden="true" />
                  {isSoldOut
                    ? "AGOTADO"
                    : CHANGE_BUTTON_ACTION_TO_SHOW_IMAGE
                      ? "MÁS INFORMACIÓN"
                      : "HACER PEDIDO"}
                </button>
              </div>
              </div>
              {pendingOrders.length > 0 && (
                <div className="relative z-30 mt-7 flex flex-col">
                  <div className={`-mx-3 border-t border-border pt-2 ${isExpanded ? "mb-2" : ""}`}>
                    <button
                      type="button"
                      onClick={() => setExpandedProductId(isExpanded ? null : product.id)}
                      className="flex min-h-10 w-full items-center justify-between gap-2 px-3 py-3 text-sm font-medium leading-tight text-foreground transition-colors hover:text-foreground/70 hover:bg-brand/20"
                      aria-expanded={isExpanded}
                      aria-controls={`pending-orders-${product.id}`}
                    >
                      <span className="flex min-w-0 items-center gap-4 text-[0.88rem] font-bold uppercase tracking-[0.14em] text-ink/80">
                        <span className="relative flex h-3 w-3 items-center justify-center" aria-hidden="true">
                          <span className="recorrido-active-pulse absolute h-2 w-2 rounded-full bg-[#c96a16]/65" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#c96a16] shadow-[0_0_0_2px_rgba(201,106,22,0.2)]" />
                        </span>
                        {isExpanded ? "Ocultar" : "Ver pedidos pendientes"}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    </button>
                  </div>

                  <div
                    id={`pending-orders-${product.id}`}
                    inert={!isExpanded}
                    className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-200 ease-out ${
                      isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="-mx-3 space-y-9 border-t border-border px-3 pb-3 pt-7">
                        {pendingOrders.map((order) => {
                            const variant = product.variants?.find((item) => item.id === order.variantId);
                            const orderImage = sanityImageVariantUrl(
                              variant?.photos[0] || product.photos[0] || "/placeholder.svg",
                              { width: 240, quality: 75, format: "webp", fit: "max" },
                            );

                            return (
                              <div key={order.id}>
                                <div className="flex gap-3">
                                  <div className="relative  h-20 w-20 shrink-0 overflow-hidden bg-muted/30">
                                    <Image src={orderImage} alt={product.name} fill sizes="80px" unoptimized className="object-contain" />
                                  </div>
                                  <div className="min-w-0 flex-1 text-xs leading-relaxed text-muted-foreground">
                                    <p className="font-semibold text-foreground">{product.name}</p>
                                    {product.variantsEnabled && order.variantName && <p>Variante: {order.variantName}</p>}
                                    {product.allowSizeSelection && order.size && <p>Talla: {order.size}</p>}
                                    <p>{order.paymentType === "deposit" ? "Anticipo" : "Total"}: ${priceFormatter.format(order.paymentAmount)} MXN</p>
                                    {product.allowMultipleQuantity && <p>Cantidad: {order.quantity}</p>}
                                    {hasDeposit && <p>Modalidad: {order.paymentType === "deposit" ? "Anticipo" : "Pago completo"}</p>}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCancelError(null);
                                      setAlreadyPaidNotice(false);
                                      setOrderToCancel(order);
                                    }}
                                    className="flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-destructive hover:bg-brand/20"
                                    aria-label="Cancelar pedido"
                                    title="Cancelar pedido"
                                  >
                                    <ShoppingBagCancel size={20} aria-hidden="true" />
                                  </button>
                                </div>
                                {regionTreasurer?.phone ? (
                                  <PaymentReceiptButton
                                    phone={regionTreasurer.phone}
                                    customerName={order.customerName}
                                    productName={product.name}
                                    variantName={product.variantsEnabled ? order.variantName : undefined}
                                    size={product.allowSizeSelection ? order.size : undefined}
                                    quantity={product.allowMultipleQuantity ? order.quantity : undefined}
                                    compact
                                  />
                                ) : (
                                  <p className="mt-2 text-xs text-muted-foreground">Aún no hay un tesorero con teléfono configurado.</p>
                                )}
                              </div>
                            );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {activeGalleryProduct && (
        <ImageGalleryModal
          images={activeGalleryImages}
          currentIndex={galleryIndex}
          onClose={() => setGalleryProductId(null)}
          onNavigate={setGalleryIndex}
          alt={activeGalleryProduct.name}
        />
      )}
      {isRecorridoVentaGalleryOpen && (
        <ImageGalleryModal
          images={RECORRIDO_VENTA_IMAGES}
          currentIndex={recorridoVentaGalleryIndex}
          onClose={() => setIsRecorridoVentaGalleryOpen(false)}
          onNavigate={setRecorridoVentaGalleryIndex}
          alt="Precios de venta del recorrido"
        />
      )}
      {!CHANGE_BUTTON_ACTION_TO_SHOW_IMAGE && shopProduct && (
        <ShopModal
          product={shopProduct}
          isOpen
          onClose={() => setShopProductId(null)}
          regionTreasurer={regionTreasurer}
          onOrderSuccess={(order, remainingStock) => {
            setStoredOrders((current) => {
              const next = addStoredProductOrder(current, order);
              try {
                window.localStorage.setItem(RECORRIDO_ORDERS_STORAGE_KEY, JSON.stringify(next));
              } catch {
                // The order remains visible for this session if storage is unavailable.
              }
              return next;
            });
            if (remainingStock !== null) {
              setRemainingStockByProductId((current) => ({ ...current, [shopProduct.id]: remainingStock }));
            }
          }}
        />
      )}
      <RecorridoCancelOrderModal
        isOpen={Boolean(orderToCancel)}
        isCancelling={isCancelling}
        error={cancelError}
        alreadyPaidNotice={alreadyPaidNotice}
        onClose={() => {
          setOrderToCancel(null);
          setCancelError(null);
          setAlreadyPaidNotice(false);
        }}
        onConfirm={() => void handleCancelOrder()}
      />
    </>
  );
}
