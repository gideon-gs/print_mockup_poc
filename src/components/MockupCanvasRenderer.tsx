import React, { useEffect, useRef } from "react";

interface PlacementArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Mockup {
  backgroundSrc: string;
  shadowSrc: string;
  placementArea: PlacementArea;
}

interface Props {
  selectedMockup: Mockup;
  userImage: string;
}

const MockupCanvasRenderer: React.FC<Props> = ({
  selectedMockup,
  userImage,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!selectedMockup || !userImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // Set desired canvas size (match mockup image size or scale it)
    const CANVAS_WIDTH = 1080;
    const CANVAS_HEIGHT = 1080;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const bgImg = new Image();
    const userImg = new Image();
    const shadowImg = new Image();

    bgImg.crossOrigin = "anonymous";
    userImg.crossOrigin = "anonymous";
    shadowImg.crossOrigin = "anonymous";

    bgImg.src = selectedMockup.backgroundSrc;
    userImg.src = userImage;
    shadowImg.src = selectedMockup.shadowSrc;

    bgImg.onload = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.drawImage(bgImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      userImg.onload = () => {
        const { x, y, width, height } = selectedMockup.placementArea;
        ctx.drawImage(userImg, x, y, width, height);

        shadowImg.onload = () => {
          ctx.drawImage(shadowImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        };
      };
    };
  }, [selectedMockup, userImage]);

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "mockup.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} className="rounded shadow-lg" />
      <button
        onClick={downloadImage}
        className="px-4 py-2 bg-black text-white rounded"
      >
        Download
      </button>
    </div>
  );
};

export default MockupCanvasRenderer;
