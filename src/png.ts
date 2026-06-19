export async function createPngUrlFromSvg(svg: SVGSVGElement): Promise<string> {
  const serializer = new XMLSerializer();
  const svgMarkup = serializer.serializeToString(svg);
  const svgBlob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("PNG 変換に失敗しました。"));
      img.src = svgUrl;
    });

    const viewBox = svg.viewBox.baseVal;
    const width = viewBox?.width || image.width;
    const height = viewBox?.height || image.height;
    const scale = 2;
    const canvas = document.createElement("canvas");

    canvas.width = width * scale;
    canvas.height = height * scale;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas コンテキストを取得できませんでした。");
    }

    context.scale(scale, scale);
    context.drawImage(image, 0, 0, width, height);

    return await new Promise<string>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("PNG データを作れませんでした。"));
          return;
        }

        resolve(URL.createObjectURL(blob));
      }, "image/png");
    });
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
