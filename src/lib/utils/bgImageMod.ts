import type { ImageMetadata } from "astro";
import { getImage } from "astro:assets";

/**
 * bgImageMod
 * Migrado para priorizar imágenes en `src/assets/images` (optimización automática) con fallback temporal a `/public/images`.
 * Uso esperado: pasar ruta que comience con `/images/` (sin `/public`).
 */
const bgImageMod = async (
  src: string,
  format?: "auto" | "avif" | "jpeg" | "png" | "svg" | "webp",
) => {
  if (!src) return "";

  const normalize = (p: string) => {
    return p
      .replace(/^https?:\/\/[^/]+/, "")
      .replace(/^\/public/, "")
      .replace(/^\/*/, "/");
  };
  const rel = normalize(src);
  const clean = rel.startsWith("/images/") ? rel : `/images${rel}`;

  // 1. Try in assets (eager) - immediate metadata
  const assetImages = import.meta.glob<{
    default: ImageMetadata;
  }>("/src/assets/images/**/*.{jpeg,jpg,png,gif,webp,svg}", { eager: true });
  const assetEntry = Object.entries(assetImages).find(([full]) =>
    full.endsWith(clean),
  );
  if (assetEntry) {
    const meta = assetEntry[1].default;
    const optimized = await getImage({ src: meta, format });
    return optimized.src;
  }

  // 2. Fallback a public (lazy)
  const publicImages = import.meta.glob<{
    default: ImageMetadata;
  }>("/public/images/**/*.{jpeg,jpg,png,gif,webp,svg}");
  const publicKey = `/public${clean}`;
  const loader = publicImages[publicKey];
  if (loader) {
    console.warn(
      `\x1b[33m[bgImageMod] Usando imagen desde /public (no optimizada totalmente). Mueve ${clean} a src/assets/images/ para optimizar.\x1b[0m`,
    );
    try {
      const mod = (await loader()) as any;
      const optimized = await getImage({ src: mod.default, format });
      return optimized.src;
    } catch (e) {
      console.error(
        `\x1b[31m[bgImageMod] Error cargando imagen pública ${clean}: ${(e as Error).message}\x1b[0m`,
      );
      return "";
    }
  }

  console.error(
    `\x1b[31m[bgImageMod] Imagen no encontrada: ${src}. Colócala en src/assets/images o public/images.\x1b[0m`,
  );
  return "";
};

export default bgImageMod;
