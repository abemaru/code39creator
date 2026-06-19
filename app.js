const VALID_PATTERN = /^[0-9A-Z \-.\$\/+%]+$/;
const DEFAULT_VALUE = "CODE39-123";

const form = document.querySelector("#barcode-form");
const input = document.querySelector("#barcode-input");
const svg = document.querySelector("#barcode-svg");
const statusMessage = document.querySelector("#status-message");
const downloadButton = document.querySelector("#download-button");
const currentValue = document.querySelector("#current-value");
const SVG_NS = "http://www.w3.org/2000/svg";
const BARCODE_MARGIN = 20;
const BARCODE_HEIGHT = 120;
const LABEL_FONT_SIZE = 20;
const LABEL_GAP = 26;

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
    displayValue: false,
    height: BARCODE_HEIGHT,
    margin: BARCODE_MARGIN,
    background: "transparent",
    lineColor: "#111111",
  });

  const viewBox = svg.viewBox.baseVal;
  const totalWidth = viewBox && viewBox.width ? viewBox.width : svg.getBBox().width;
  const totalHeight = viewBox && viewBox.height ? viewBox.height : svg.getBBox().height;
  const labelWidth = Math.max(totalWidth - (BARCODE_MARGIN * 2), 1);
  const labelText = `*${value}*`;
  const label = document.createElementNS(SVG_NS, "text");

  label.textContent = labelText;
  label.setAttribute("x", String(BARCODE_MARGIN));
  label.setAttribute("y", String(totalHeight + LABEL_GAP));
  label.setAttribute("fill", "#111111");
  label.setAttribute("font-family", "monospace");
  label.setAttribute("font-size", String(LABEL_FONT_SIZE));

  svg.append(label);

  if (labelText.length > 1) {
    const naturalWidth = label.getComputedTextLength();
    const gapCount = labelText.length - 1;
    const extraSpacing = (labelWidth - naturalWidth) / gapCount;

    if (Number.isFinite(extraSpacing) && extraSpacing > 0) {
      label.style.letterSpacing = `${extraSpacing}px`;
    }
  }

  svg.setAttribute("height", `${totalHeight + LABEL_GAP + LABEL_FONT_SIZE + BARCODE_MARGIN}px`);
  svg.setAttribute("viewBox", `0 0 ${totalWidth} ${totalHeight + LABEL_GAP + LABEL_FONT_SIZE + BARCODE_MARGIN}`);
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
  currentValue.textContent = `*${value}*`;
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
