/* eslint-disable @typescript-eslint/no-explicit-any */

// Global cache for unpacked cascade function
let faceClassifier: any = null;

// Helper to convert RGBA to Grayscale
function rgbaToGrayscale(rgba: Uint8ClampedArray, nrows: number, ncols: number): Uint8Array {
  const gray = new Uint8Array(nrows * ncols);
  for (let i = 0; i < nrows * ncols; ++i) {
    // Standard luminosity formula: Y = 0.299R + 0.587G + 0.114B
    gray[i] = (299 * rgba[4 * i + 0] + 587 * rgba[4 * i + 1] + 114 * rgba[4 * i + 2]) / 1000;
  }
  return gray;
}

// Unpack binary cascade data into a classification function (pico.js algorithm)
function unpackCascade(bytes: Int8Array) {
  const dview = new DataView(new ArrayBuffer(4));
  let p = 8;

  dview.setUint8(0, bytes[p + 0]); dview.setUint8(1, bytes[p + 1]); dview.setUint8(2, bytes[p + 2]); dview.setUint8(3, bytes[p + 3]);
  const tdepth = dview.getInt32(0, true);
  p = p + 4;

  dview.setUint8(0, bytes[p + 0]); dview.setUint8(1, bytes[p + 1]); dview.setUint8(2, bytes[p + 2]); dview.setUint8(3, bytes[p + 3]);
  const ntrees = dview.getInt32(0, true);
  p = p + 4;

  const tcodes_ls: number[] = [];
  const tpreds_ls: number[] = [];
  const thresh_ls: number[] = [];

  for (let t = 0; t < ntrees; ++t) {
    tcodes_ls.push(0, 0, 0, 0);
    const slice = bytes.slice(p, p + 4 * Math.pow(2, tdepth) - 4);
    for (let i = 0; i < slice.length; i++) {
      tcodes_ls.push(slice[i]);
    }
    p = p + 4 * Math.pow(2, tdepth) - 4;

    for (let i = 0; i < Math.pow(2, tdepth); ++i) {
      dview.setUint8(0, bytes[p + 0]); dview.setUint8(1, bytes[p + 1]); dview.setUint8(2, bytes[p + 2]); dview.setUint8(3, bytes[p + 3]);
      tpreds_ls.push(dview.getFloat32(0, true));
      p = p + 4;
    }

    dview.setUint8(0, bytes[p + 0]); dview.setUint8(1, bytes[p + 1]); dview.setUint8(2, bytes[p + 2]); dview.setUint8(3, bytes[p + 3]);
    thresh_ls.push(dview.getFloat32(0, true));
    p = p + 4;
  }

  const tcodes = new Int8Array(tcodes_ls);
  const tpreds = new Float32Array(tpreds_ls);
  const thresh = new Float32Array(thresh_ls);

  return function (r: number, c: number, s: number, pixels: Uint8Array, ldim: number): number {
    r = 256 * r;
    c = 256 * c;
    let out = 0.0;
    let root = 0;
    const powDepth = Math.pow(2, tdepth) >> 0;
    for (let t = 0; t < ntrees; ++t) {
      let idx = 1;
      for (let j = 0; j < tdepth; ++j) {
        const root4idx = root + 4 * idx;
        const val1 = pixels[((r + tcodes[root4idx + 0] * s) >> 8) * ldim + ((c + tcodes[root4idx + 1] * s) >> 8)];
        const val2 = pixels[((r + tcodes[root4idx + 2] * s) >> 8) * ldim + ((c + tcodes[root4idx + 3] * s) >> 8)];
        idx = 2 * idx + (val1 <= val2 ? 1 : 0);
      }
      out = out + tpreds[powDepth * t + idx - powDepth];
      if (out <= thresh[t]) return -1.0;
      root += 4 * powDepth;
    }
    return out - thresh[ntrees - 1];
  };
}

// Find all face candidate positions at multiple scale levels
function runCascade(pixels: Uint8Array, nrows: number, ncols: number, ldim: number, classify_region: any, params: any) {
  const shiftfactor = params.shiftfactor;
  const minsize = params.minsize;
  const maxsize = params.maxsize;
  const scalefactor = params.scalefactor;

  let scale = minsize;
  const detections: [number, number, number, number][] = [];

  while (scale <= maxsize) {
    const step = Math.max(shiftfactor * scale, 1) >> 0;
    const offset = (scale / 2 + 1) >> 0;

    for (let r = offset; r <= nrows - offset; r += step) {
      for (let c = offset; c <= ncols - offset; c += step) {
        const q = classify_region(r, c, scale, pixels, ldim);
        if (q > 0.0) {
          detections.push([r, c, scale, q]);
        }
      }
    }
    scale = scale * scalefactor;
  }
  return detections;
}

// Group overlapping face candidate boxes (clustering)
function clusterDetections(dets: [number, number, number, number][], iothreshold: number) {
  dets = dets.sort((a, b) => b[3] - a[3]);

  function calculateIou(det1: [number, number, number, number], det2: [number, number, number, number]) {
    const r1 = det1[0], c1 = det1[1], s1 = det1[2];
    const r2 = det2[0], c2 = det2[1], s2 = det2[2];
    const overlap_r = Math.max(0.0, Math.min(r1 + s1 / 2, r2 + s2 / 2) - Math.max(r1 - s1 / 2, r2 - s2 / 2));
    const overlap_c = Math.max(0.0, Math.min(c1 + s1 / 2, c2 + s2 / 2) - Math.max(c1 - s1 / 2, c2 - s2 / 2));
    const overlap = overlap_r * overlap_c;
    const union = s1 * s1 + s2 * s2 - overlap;
    return overlap / union;
  }

  const assignments = new Array(dets.length).fill(0);
  const clusters: [number, number, number, number][] = [];
  for (let i = 0; i < dets.length; ++i) {
    if (assignments[i] !== 0) continue;
    const cluster = [dets[i]];
    assignments[i] = 1;
    for (let j = i + 1; j < dets.length; ++j) {
      if (assignments[j] !== 0) continue;
      if (calculateIou(dets[i], dets[j]) > iothreshold) {
        assignments[j] = 1;
        cluster.push(dets[j]);
      }
    }

    let r = 0.0, c = 0.0, s = 0.0, q = 0.0;
    for (let k = 0; k < cluster.length; ++k) {
      r += cluster[k][0];
      c += cluster[k][1];
      s += cluster[k][2];
      q += cluster[k][3];
    }
    clusters.push([r / cluster.length, c / cluster.length, s / cluster.length, q]);
  }
  return clusters;
}

// Download and initialize face finder cascade model
async function getFaceClassifier(): Promise<any> {
  if (faceClassifier) return faceClassifier;

  try {
    const res = await fetch("/facefinder");
    if (!res.ok) throw new Error("Gagal mengunduh cascade file deteksi wajah lokal");
    const buffer = await res.arrayBuffer();
    const bytes = new Int8Array(buffer);
    faceClassifier = unpackCascade(bytes);
    console.log("AI Face Detector initialized successfully from local cascade.");
    return faceClassifier;
  } catch (error) {
    console.error("Gagal inisialisasi detektor wajah:", error);
    return null;
  }
}

/**
 * Utility to crop an image to passport aspect ratio (3:4) with AI face detection and compress it to JPEG.
 * Returns a Promise that resolves to a compressed base64 string.
 */
export function compressAndCropToPassport(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Basic type validation
    if (!file.type.startsWith("image/")) {
      reject(new Error("File yang diunggah harus berupa gambar"));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        // Step 1: Detect face using Pico.js
        let cropBox = null;

        try {
          const classifier = await getFaceClassifier();
          if (classifier) {
            // Resize original image to around 400px width for fast detection scanning
            const tempWidth = 400;
            const tempHeight = Math.round(tempWidth * (img.height / img.width));

            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = tempWidth;
            tempCanvas.height = tempHeight;

            const tempCtx = tempCanvas.getContext("2d");
            if (tempCtx) {
              tempCtx.drawImage(img, 0, 0, tempWidth, tempHeight);
              const rgba = tempCtx.getImageData(0, 0, tempWidth, tempHeight).data;
              const gray = rgbaToGrayscale(rgba, tempHeight, tempWidth);

              const params = {
                shiftfactor: 0.1, // step size relative to detection window size
                minsize: 30,      // min face size in temp scale
                maxsize: 1000,    // max face size in temp scale
                scalefactor: 1.1  // zoom step size
              };

              let dets = runCascade(gray, tempHeight, tempWidth, tempWidth, classifier, params);
              dets = clusterDetections(dets, 0.2);

              // Filter confident detections (pico score > 50)
              const faceDetections = dets.filter(d => d[3] > 50.0);

              if (faceDetections.length > 0) {
                // Pick the detection with the highest confidence score
                const bestFace = faceDetections.sort((a, b) => b[3] - a[3])[0];
                const faceY = bestFace[0]; // center Y in temp scale
                const faceX = bestFace[1]; // center X in temp scale
                const faceSize = bestFace[2]; // bounding box size in temp scale
                const score = bestFace[3];

                console.log(`AI Face detected at X: ${faceX.toFixed(1)}, Y: ${faceY.toFixed(1)} (scale: 400px wide) with confidence score: ${score.toFixed(1)}`);

                // Project back to original scale
                const scaleX = img.width / tempWidth;
                const scaleY = img.height / tempHeight;

                const origFaceX = faceX * scaleX;
                const origFaceY = faceY * scaleY;
                const origFaceSize = faceSize * ((scaleX + scaleY) / 2);

                // Passport Standard Framing Calculation:
                // Height is ~2.2x face size (chin to forehead)
                let cropHeight = origFaceSize * 2.2;
                let cropWidth = cropHeight * 0.75; // 3:4 ratio

                // Handle case where crop size exceeds image dimensions
                if (cropHeight > img.height) {
                  cropHeight = img.height;
                  cropWidth = cropHeight * 0.75;
                }
                if (cropWidth > img.width) {
                  cropWidth = img.width;
                  cropHeight = cropWidth / 0.75;
                }

                // Eye level target is ~40% from top of crop (so we shift center upwards)
                let sx = origFaceX - cropWidth / 2;
                let sy = origFaceY - cropHeight * 0.40;

                // Clamp values to image bounds
                sx = Math.max(0, Math.min(img.width - cropWidth, sx));
                sy = Math.max(0, Math.min(img.height - cropHeight, sy));

                cropBox = { sx, sy, sWidth: cropWidth, sHeight: cropHeight };
              } else {
                console.log("AI Face Detector completed: No face detected with confidence > 50.0. Using default center-crop fallback.");
              }
            }
          } else {
            console.log("AI Face Detector not available. Using default center-crop fallback.");
          }
        } catch (err) {
          console.error("AI Face Detection error, falling back to center-crop:", err);
        }

        // Fallback: Default 3:4 Center Crop if no face was detected
        if (!cropBox) {
          const imgRatio = img.width / img.height;
          const targetRatio = 0.75; // 3:4

          let sx = 0;
          let sy = 0;
          let sWidth = img.width;
          let sHeight = img.height;

          if (imgRatio > targetRatio) {
            sWidth = img.height * targetRatio;
            sx = (img.width - sWidth) / 2;
          } else {
            sHeight = img.width / targetRatio;
            sy = (img.height - sHeight) / 2;
          }

          cropBox = { sx, sy, sWidth, sHeight };
        }

        // Draw cropped face onto target canvas
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Gagal membuat canvas context 2D"));
          return;
        }

        const targetWidth = 300;
        const targetHeight = 400;
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        ctx.drawImage(
          img,
          cropBox.sx,
          cropBox.sy,
          cropBox.sWidth,
          cropBox.sHeight,
          0,
          0,
          targetWidth,
          targetHeight
        );

        // Compress as JPEG base64 (70% quality)
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        resolve(compressedBase64);
      };
      img.onerror = () => reject(new Error("Gagal memuat gambar"));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.readAsDataURL(file);
  });
}
