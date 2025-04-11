import React, { useRef, useEffect, useState } from "react";
import frame1 from "../src/mockups/mockup5_background.png";
import frame2 from "../src/mockups/mockup6_background.png";
import frame3 from "../src/mockups/mockup7_background.png";

interface ThumbnailCanvasRefs {
  [key: string]: React.RefObject<HTMLCanvasElement | null>;
}

const mockups = [
  {
    name: "mockup5",
    displayName: "Style 5",
    image: frame1,
    canvasSize: { width: 5824, height: 3264 },
    frame: {
      x: 1980,
      y: 443.5,
      width: 1863,
      height: 2377,
      rotation: 0,
    },
  },
  {
    name: "mockup6",
    displayName: "Style 6",
    image: frame2,
    canvasSize: { width: 5734, height: 3823 },
    frame: {
      x: 575,
      y: 683.86 - 100, //tweak
      width: 2251.88,
      height: 2870.36,
      rotation: -6, //tweak
    },
  },
  {
    name: "mockup7",
    displayName: "Style 7",
    image: frame3,
    canvasSize: { width: 7008, height: 4627 },
    frame: {
      x: 2641.78,
      y: 612,
      width: 2485.49,
      height: 3168.12 + 130,
      rotation: 6,
    },
  },
];

const App = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [selectedMockup, setSelectedMockup] = useState(mockups[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [quality, setQuality] = useState<number>(0.9);
  const [scaleFactor, setScaleFactor] = useState<number>(1.3);
  const [thumbnailCanvasRefs, setThumbnailCanvasRefs] =
    useState<ThumbnailCanvasRefs>({});

  // Increase canvas size for better quality
  const canvasWidth = 800;
  const thumbnailWidth = 120; // Width for thumbnail previews

  // Initialize thumbnail canvas refs
  useEffect(() => {
    const refs: ThumbnailCanvasRefs = {};
    mockups.forEach((mockup) => {
      refs[mockup.name] = React.createRef<HTMLCanvasElement>();
    });
    setThumbnailCanvasRefs(refs);
  }, []);

  // Helper function to load an image with a promise
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  // Draw the main canvas with or without user image
  const drawCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedMockup) return;

    setIsLoading(true);

    const ctx = canvas.getContext("2d", {
      alpha: false,
      willReadFrequently: false,
    });
    if (!ctx) return;

    // Apply high-quality rendering settings
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Calculate scale to fit mockup in canvas width
    const scale = canvasWidth / selectedMockup.canvasSize.width;
    const scaledHeight = selectedMockup.canvasSize.height * scale;

    // Set canvas height proportionally with pixel ratio adjustment for high DPI displays
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * pixelRatio;
    canvas.height = scaledHeight * pixelRatio;

    // Adjust canvas CSS size
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${scaledHeight}px`;

    // Scale all drawing operations
    ctx.scale(pixelRatio, pixelRatio);

    // Clear canvas with white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasWidth, scaledHeight);

    try {
      // Always load the mockup image
      const mockupImg = await loadImage(selectedMockup.image);

      // Get frame details
      const { x, y, width, height, rotation } = selectedMockup.frame;
      const scaledX = x * scale;
      const scaledY = y * scale;
      const scaledW = width * scale;
      const scaledH = height * scale;

      // If we have a user image, load and draw it
      if (userImage) {
        const userImg = await loadImage(userImage);

        // Calculate aspect ratios
        const frameAspect = scaledW / scaledH;
        const userAspect = userImg.width / userImg.height;

        // Calculate rotation impact on required space
        // The higher the rotation, the more space we need
        const rotationRadians = Math.abs((rotation * Math.PI) / 180);
        const rotationImpact =
          Math.cos(rotationRadians) + Math.sin(rotationRadians);

        // Apply user-controlled scale factor
        const adjustedScaleFactor = scaleFactor * rotationImpact;

        // Calculate dimensions with rotation padding
        let drawWidth, drawHeight;
        // const rotationPadding = Math.abs(rotation) > 0 ? 1.4 : 1.0;

        if (userAspect > frameAspect) {
          // Width-constrained fitting
          drawWidth = scaledW * adjustedScaleFactor;
          drawHeight = drawWidth / userAspect;
        } else {
          // Height-constrained fitting
          drawHeight = scaledH * adjustedScaleFactor;
          drawWidth = drawHeight * userAspect;
        }

        // Apply rotation and draw user image
        ctx.save();
        ctx.translate(scaledX + scaledW / 2, scaledY + scaledH / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(
          userImg,
          -drawWidth / 2,
          -drawHeight / 2,
          drawWidth,
          drawHeight
        );
        ctx.restore();
      }

      // Draw the mockup frame on top
      ctx.drawImage(mockupImg, 0, 0, canvasWidth, scaledHeight);

      // After drawing the main canvas, update all thumbnail canvases
      updateThumbnailCanvases();
    } catch (err) {
      console.error("Error drawing canvas:", err);
    }

    setIsLoading(false);
  };

  // Update all thumbnail canvases
  const updateThumbnailCanvases = async () => {
    for (const mockup of mockups) {
      const canvas = thumbnailCanvasRefs[mockup.name]?.current;
      if (!canvas) continue;

      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) continue;

      // Set thumbnail dimensions
      const aspectRatio = mockup.canvasSize.height / mockup.canvasSize.width;
      const thumbnailHeight = thumbnailWidth * aspectRatio;

      canvas.width = thumbnailWidth;
      canvas.height = thumbnailHeight;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "medium";

      // Clear thumbnail canvas
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, thumbnailWidth, thumbnailHeight);

      try {
        // Load mockup image
        const mockupImg = await loadImage(mockup.image);

        // Calculate scale for thumbnail
        const thumbnailScale = thumbnailWidth / mockup.canvasSize.width;

        // Get frame details
        const { x, y, width, height, rotation } = mockup.frame;
        const scaledX = x * thumbnailScale;
        const scaledY = y * thumbnailScale;
        const scaledW = width * thumbnailScale;
        const scaledH = height * thumbnailScale;

        // If we have a user image, draw it in the thumbnail frame
        if (userImage) {
          const userImg = await loadImage(userImage);

          // Calculate aspect ratios
          const frameAspect = scaledW / scaledH;
          const userAspect = userImg.width / userImg.height;

          // Calculate dimensions with rotation padding
          let drawWidth, drawHeight;
          const rotationPadding = Math.abs(rotation) > 0 ? 1.4 : 1.0;

          if (userAspect > frameAspect) {
            drawHeight = scaledH * rotationPadding;
            drawWidth = drawHeight * userAspect;
          } else {
            drawWidth = scaledW * rotationPadding;
            drawHeight = drawWidth / userAspect;
          }

          // Apply rotation and draw user image in thumbnail
          ctx.save();
          ctx.translate(scaledX + scaledW / 2, scaledY + scaledH / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.drawImage(
            userImg,
            -drawWidth / 2,
            -drawHeight / 2,
            drawWidth,
            drawHeight
          );
          ctx.restore();
        }

        // Draw the mockup frame on top
        ctx.drawImage(mockupImg, 0, 0, thumbnailWidth, thumbnailHeight);
      } catch (err) {
        console.error(`Error drawing thumbnail for ${mockup.name}:`, err);
      }
    }
  };

  // Initial canvas drawing and when mockup/scale changes
  useEffect(() => {
    drawCanvas();
    // Add scaleFactor to the dependency array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMockup, userImage, quality, scaleFactor]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    // Process file to maintain quality
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setUserImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        processFile(file);
      }
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use higher quality when generating download
    const dataURL = canvas.toDataURL("image/png", quality);

    const link = document.createElement("a");
    link.href = dataURL;
    link.download = `${selectedMockup.name}-mockup.png`;
    link.click();
  };

  const handleRemoveImage = () => {
    setUserImage(null);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Device Mockup Generator
      </h1>

      {/* Main Preview */}
      <div className="mb-6 bg-gray-100 p-4 rounded-lg">
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="shadow-lg mx-auto rounded"
            style={{ maxWidth: "100%" }}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded">
              <div className="bg-white p-2 rounded shadow">
                <p className="font-medium">Loading...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left column */}
        <div>
          {/* Upload area */}
          <div className="mb-6">
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              {userImage ? (
                <>
                  <p className="text-green-600 mb-2">✓ Image uploaded</p>
                  <div className="flex justify-center gap-2">
                    <label className="bg-blue-500 text-white px-3 py-2 rounded cursor-pointer">
                      Change Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={handleRemoveImage}
                      className="bg-red-500 text-white px-3 py-2 rounded"
                    >
                      Remove
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="mb-2">Drop your screenshot here, or</p>
                  <label className="bg-blue-500 text-white px-3 py-2 rounded cursor-pointer">
                    Select File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUpload}
                      className="hidden"
                    />
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Quality slider */}
          <div className="mb-6">
            <label className="block font-medium mb-2">
              Export Quality: {Math.round(quality * 100)}%
            </label>
            <input
              type="range"
              min="0.7"
              max="1"
              step="0.05"
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Image Scale slider */}
          <div className="mb-6">
            <label className="block font-medium mb-2">
              Image Scale: {Math.round(scaleFactor * 100)}%
            </label>
            <input
              type="range"
              min="0.8"
              max="1.5"
              step="0.05"
              value={scaleFactor}
              onChange={(e) => setScaleFactor(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Download button */}
          <button
            onClick={handleDownload}
            disabled={!userImage}
            className={`w-full py-3 px-4 rounded text-white font-medium ${
              userImage
                ? "bg-blue-500 hover:bg-blue-600"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            Download Mockup
          </button>
        </div>

        {/* Right column */}
        <div>
          <label className="block font-medium mb-2">Select mockup style</label>
          <div className="grid grid-cols-3 gap-3">
            {mockups.map((mockup, i) => (
              <div
                key={i}
                className={`cursor-pointer border rounded p-2 ${
                  selectedMockup.name === mockup.name
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedMockup(mockup)}
              >
                <div className="bg-white rounded shadow-sm mb-1">
                  <canvas
                    ref={thumbnailCanvasRefs[mockup.name]}
                    width={thumbnailWidth}
                    height={
                      thumbnailWidth *
                      (mockup.canvasSize.height / mockup.canvasSize.width)
                    }
                    className="rounded w-full"
                  />
                </div>
                <p className="text-sm text-center">{mockup.displayName}</p>
              </div>
            ))}
          </div>

          {/* Tips box
          {!userImage && (
            <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="font-medium mb-1">Tips:</p>
              <ul className="list-disc pl-4 text-sm">
                <li>Use high-resolution screenshots</li>
                <li>PNG format works best</li>
                <li>Try different mockup styles</li>
              </ul>
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
};

export default App;
