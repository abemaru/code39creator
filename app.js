const VALID_PATTERN = /^[0-9A-Z \-.\$\/+%]+$/;
const DEFAULT_VALUE = "CODE39-123";

const form = document.querySelector("#barcode-form");
const input = document.querySelector("#barcode-input");
const svg = document.querySelector("#barcode-svg");
const statusMessage = document.querySelector("#status-message");
const downloadButton = document.querySelector("#download-button");
const currentValue = document.querySelector("#current-value");

let latestPngUrl = "";

function setStatus(message, state) {
  statusMessage.textContent = message;
  statusMessage.dataset.state = state;
}

function revokeLatestPngUrl() {
  if (latestPngUrl) {
    URL.revokeObjectURL(latestPngUrl);
    latestPngUrl = "";
  }
}

function normalizeValue(rawValue) {
  return rawValue.toUpperCase();
}

function validateValue(value) {
  if (!value.trim()) {
    return "文字列を入力してください。";
  }

  if (!VALID_PATTERN.test(value)) {
    return "Code 39 で使えない文字が含まれています。";
  }

  return "";
}

function renderBarcode(value) {
  JsBarcode(svg, value, {
    format: "CODE39",
    displayValue: true,
    font: "monospace",
    fontSize: 20,
    height: 120,
    margin: 20,
    background: "#ffffff",
    lineColor: "#111111",
  });
}

async function createPngUrlFromSvg() {
  const serializer = new XMLSerializer();
  const svgMarkup = serializer.serializeToString(svg);
  const svgBlob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("PNG 変換に失敗しました。"));
      img.src = svgUrl;
    });

    const viewBox = svg.viewBox.baseVal;
    const width = viewBox && viewBox.width ? viewBox.width : image.width;
    const height = viewBox && viewBox.height ? viewBox.height : image.height;
    const scale = 2;
    const canvas = document.createElement("canvas");

    canvas.width = width * scale;
    canvas.height = height * scale;

    const context = canvas.getContext("2d");
    context.scale(scale, scale);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    return await new Promise((resolve, reject) => {
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

async function updateBarcode(rawValue) {
  const value = normalizeValue(rawValue);
  const validationMessage = validateValue(value);

  input.value = value;

  if (validationMessage) {
    revokeLatestPngUrl();
    downloadButton.disabled = true;
    setStatus(validationMessage, "error");
    return;
  }

  renderBarcode(value);
  currentValue.textContent = value;
  revokeLatestPngUrl();
  latestPngUrl = await createPngUrlFromSvg();
  downloadButton.disabled = false;
  setStatus("バーコードを生成しました。PNG を保存できます。", "success");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await updateBarcode(input.value);
  } catch (error) {
    revokeLatestPngUrl();
    downloadButton.disabled = true;
    setStatus(error.message || "生成に失敗しました。", "error");
  }
});

downloadButton.addEventListener("click", () => {
  if (!latestPngUrl) {
    return;
  }

  const filenameBase = normalizeValue(input.value || DEFAULT_VALUE).replace(/\s+/g, "_");
  const anchor = document.createElement("a");
  anchor.href = latestPngUrl;
  anchor.download = `${filenameBase || "code39-barcode"}.png`;
  anchor.click();
});

updateBarcode(DEFAULT_VALUE).catch((error) => {
  setStatus(error.message || "初期バーコードの生成に失敗しました。", "error");
});
