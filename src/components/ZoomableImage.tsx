import { useRef, useState, useCallback } from "react";

interface Props {
  src: string;
  alt: string;
  /** Zoom factor for the lens magnification */
  zoom?: number;
  /** Lens diameter in pixels */
  lensSize?: number;
  className?: string;
}

/**
 * Premium e-commerce magnifier: a circular lens follows the cursor
 * showing the image region beneath it at higher resolution.
 * Disabled on touch / coarse pointer devices.
 */
export function ZoomableImage({
  src,
  alt,
  zoom = 2.5,
  lensSize = 180,
  className = "",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [bgPos, setBgPos] = useState({ x: 0, y: 0 });

  const isFinePointer = () =>
    typeof window !== "undefined" &&
    window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isFinePointer()) return;
      const container = containerRef.current;
      const img = imgRef.current;
      if (!container || !img) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        setActive(false);
        return;
      }
      setActive(true);
      setPos({ x, y });

      // Compute the rendered (object-contain) image box inside the container
      const natW = img.naturalWidth || rect.width;
      const natH = img.naturalHeight || rect.height;
      const scale = Math.min(rect.width / natW, rect.height / natH);
      const renderedW = natW * scale;
      const renderedH = natH * scale;
      const offsetX = (rect.width - renderedW) / 2;
      const offsetY = (rect.height - renderedH) / 2;

      // Position within the rendered image (clamped)
      const relX = Math.min(Math.max(x - offsetX, 0), renderedW);
      const relY = Math.min(Math.max(y - offsetY, 0), renderedH);
      const pctX = relX / renderedW;
      const pctY = relY / renderedH;

      const zoomedW = renderedW * zoom;
      const zoomedH = renderedH * zoom;

      // background-position so the cursor point sits at the lens center
      setBgPos({
        x: lensSize / 2 - pctX * zoomedW,
        y: lensSize / 2 - pctY * zoomedH,
      });
    },
    [zoom, lensSize]
  );

  const handleEnter = () => {
    if (isFinePointer()) setActive(true);
  };
  const handleLeave = () => setActive(false);

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleEnter}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`relative w-full h-full ${className}`}
      style={{ cursor: active ? "crosshair" : "default" }}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        draggable={false}
        className="w-full h-full object-contain select-none"
      />
      {active && (
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-full border-2 border-white shadow-2xl ring-1 ring-black/10 transition-opacity duration-150"
          style={{
            width: lensSize,
            height: lensSize,
            left: pos.x - lensSize / 2,
            top: pos.y - lensSize / 2,
            backgroundImage: `url(${src})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: (() => {
              const c = containerRef.current;
              const img = imgRef.current;
              if (!c || !img) return "auto";
              const rect = c.getBoundingClientRect();
              const natW = img.naturalWidth || rect.width;
              const natH = img.naturalHeight || rect.height;
              const scale = Math.min(rect.width / natW, rect.height / natH);
              return `${natW * scale * zoom}px ${natH * scale * zoom}px`;
            })(),
            backgroundPosition: `${bgPos.x}px ${bgPos.y}px`,
            backgroundColor: "#f5f5f5",
            opacity: active ? 1 : 0,
          }}
        />
      )}
    </div>
  );
}
