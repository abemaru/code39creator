import {
  DEFAULT_VALUE,
  formatLabel,
  normalizeValue,
  renderBarcode,
  validateValue,
} from "./barcode";
import { createPngUrlFromSvg } from "./png";

export interface BarcodeAppElements {
  form: HTMLFormElement;
  input: HTMLInputElement;
  svg: SVGSVGElement;
  statusMessage: HTMLElement;
  downloadButton: HTMLButtonElement;
  currentValue: HTMLElement;
}

export interface BarcodeAppDeps {
  createPngUrlFromSvg: (svg: SVGSVGElement) => Promise<string>;
  renderBarcode: (svg: SVGSVGElement, value: string) => void;
  revokeObjectUrl: (url: string) => void;
}

export interface BarcodeApp {
  updateBarcode: (rawValue: string) => Promise<void>;
}

const defaultDeps: BarcodeAppDeps = {
  createPngUrlFromSvg,
  renderBarcode,
  revokeObjectUrl: (url: string) => URL.revokeObjectURL(url),
};

export function createBarcodeApp(
  elements: BarcodeAppElements,
  deps: BarcodeAppDeps = defaultDeps,
): BarcodeApp {
  let latestPngUrl = "";

  function setStatus(message: string, state: "success" | "error"): void {
    elements.statusMessage.textContent = message;
    elements.statusMessage.dataset.state = state;
  }

  function revokeLatestPngUrl(): void {
    if (latestPngUrl) {
      deps.revokeObjectUrl(latestPngUrl);
      latestPngUrl = "";
    }
  }

  async function updateBarcode(rawValue: string): Promise<void> {
    const value = normalizeValue(rawValue);
    const validationMessage = validateValue(value);

    elements.input.value = value;

    if (validationMessage) {
      revokeLatestPngUrl();
      elements.downloadButton.disabled = true;
      setStatus(validationMessage, "error");
      return;
    }

    deps.renderBarcode(elements.svg, value);
    elements.currentValue.textContent = formatLabel(value);
    revokeLatestPngUrl();
    latestPngUrl = await deps.createPngUrlFromSvg(elements.svg);
    elements.downloadButton.disabled = false;
    setStatus("バーコードを生成しました。PNG を保存できます。", "success");
  }

  elements.form.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      await updateBarcode(elements.input.value);
    } catch (error) {
      revokeLatestPngUrl();
      elements.downloadButton.disabled = true;
      setStatus(error instanceof Error ? error.message : "生成に失敗しました。", "error");
    }
  });

  elements.downloadButton.addEventListener("click", () => {
    if (!latestPngUrl) {
      return;
    }

    const filenameBase = normalizeValue(elements.input.value || DEFAULT_VALUE).replace(/\s+/g, "_");
    const anchor = document.createElement("a");
    anchor.href = latestPngUrl;
    anchor.download = `${filenameBase || "code39-barcode"}.png`;
    anchor.click();
  });

  return { updateBarcode };
}
