
export interface ImageProcessingOptions {
    targetSize?: { width: number; height: number };
    padding?: number;
    backgroundColor?: string;
}

export async function processImage(
    file: File,
    options: ImageProcessingOptions
): Promise<File> {
    if (!options.targetSize && !options.padding) {
        return file;
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            if (!ctx) {
                reject(new Error("Could not get canvas context"));
                return;
            }

            const padding = options.padding ?? 0;
            const targetWidth = options.targetSize?.width ?? img.width + padding * 2;
            const targetHeight = options.targetSize?.height ?? img.height + padding * 2;

            canvas.width = targetWidth;
            canvas.height = targetHeight;

            // Fill background (skip for transparent — canvas is transparent by default)
            if (options.backgroundColor !== "transparent") {
                ctx.fillStyle = options.backgroundColor ?? "white";
                ctx.fillRect(0, 0, targetWidth, targetHeight);
            }

            // Calculate scaling to fit within padding
            const availableWidth = targetWidth - padding * 2;
            const availableHeight = targetHeight - padding * 2;

            const scale = Math.min(
                availableWidth / img.width,
                availableHeight / img.height
            );

            const drawWidth = img.width * scale;
            const drawHeight = img.height * scale;

            const x = (targetWidth - drawWidth) / 2;
            const y = (targetHeight - drawHeight) / 2;

            ctx.drawImage(img, x, y, drawWidth, drawHeight);

            const isTransparent = options.backgroundColor === "transparent";
            const outputType = isTransparent ? "image/png" : file.type;
            const outputName = isTransparent
                ? file.name.replace(/\.[^.]+$/, ".png")
                : file.name;

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const processedFile = new File([blob], outputName, {
                            type: outputType,
                            lastModified: Date.now(),
                        });
                        resolve(processedFile);
                    } else {
                        reject(new Error("Canvas to Blob conversion failed"));
                    }
                },
                outputType,
                isTransparent ? undefined : 0.9
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Failed to load image"));
        };

        img.src = url;
    });
}
