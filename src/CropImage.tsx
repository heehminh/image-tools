import { useCallback, useRef, useState } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface Props {
  src: string;
  onCropped: (dataUrl: string) => void;
  onCancel: () => void;
}

export default function CropImage({ src, onCropped, onCancel }: Props) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: "px",
    x: 0,
    y: 0,
    width: 200,
    height: 200,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      imgRef.current = img;

      const w = img.width;
      const h = img.height;
      const size = Math.floor(Math.min(w, h) * 0.7);
      const initX = Math.floor((w - size) / 2);
      const initY = Math.floor((h - size) / 2);

      setCrop({
        unit: "px",
        x: initX,
        y: initY,
        width: size,
        height: size,
      });
      setCompletedCrop({
        unit: "px",
        x: initX,
        y: initY,
        width: size,
        height: size,
      });
    },
    []
  );

  // ✅ 크롭 + 리사이즈 (출력은 400×400)
  const handleApply = async () => {
    if (!imgRef.current || !completedCrop) return;

    const img = imgRef.current;
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    const sx = Math.max(0, completedCrop.x) * scaleX;
    const sy = Math.max(0, completedCrop.y) * scaleY;
    const sw = Math.max(1, completedCrop.width) * scaleX;
    const sh = Math.max(1, completedCrop.height) * scaleY;

    // ✅ 출력 크기 고정 (예: 400x400)
    const OUTPUT_SIZE = 400;
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;

    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    // 이미지 비율에 맞게 채우기
    const aspect = sw / sh;
    let dx = 0,
      dy = 0,
      dw = OUTPUT_SIZE,
      dh = OUTPUT_SIZE;

    if (aspect > 1) {
      // 가로가 더 긴 경우 → 세로 맞추기
      dw = OUTPUT_SIZE;
      dh = OUTPUT_SIZE / aspect;
      dy = (OUTPUT_SIZE - dh) / 2;
    } else if (aspect < 1) {
      // 세로가 더 긴 경우 → 가로 맞추기
      dh = OUTPUT_SIZE;
      dw = OUTPUT_SIZE * aspect;
      dx = (OUTPUT_SIZE - dw) / 2;
    }

    // ✅ 원본 → 리사이즈 캔버스로 복사
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);

    const dataUrl = canvas.toDataURL("image/png", 0.92);
    onCropped(dataUrl);
  };

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <ReactCrop
        crop={crop}
        onChange={(c) => {
          const size = Math.max(1, Math.min(c.width ?? 1, c.height ?? 1));
          setCrop({
            ...c,
            unit: "px",
            width: size,
            height: size,
          });
        }}
        onComplete={(c) => {
          const size = Math.max(1, Math.min(c.width ?? 1, c.height ?? 1));
          setCompletedCrop({
            x: Math.round(c.x ?? 0),
            y: Math.round(c.y ?? 0),
            width: Math.round(size),
            height: Math.round(size),
            unit: "px",
          });
        }}
        keepSelection
      >
        <img
          src={src}
          alt="crop-target"
          onLoad={onImageLoad}
          style={{ maxWidth: "100%", maxHeight: 380, objectFit: "contain" }}
        />
      </ReactCrop>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleApply}>크롭 적용</button>
        <button onClick={onCancel}>취소</button>
      </div>
    </div>
  );
}
