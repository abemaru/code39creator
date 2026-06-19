import { createBarcodeApp } from "./app";
import { DEFAULT_VALUE } from "./barcode";
import "./styles.css";

function getRequiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Required element not found: ${selector}`);
  }

  return element;
}

const app = createBarcodeApp({
  form: getRequiredElement<HTMLFormElement>("#barcode-form"),
  input: getRequiredElement<HTMLInputElement>("#barcode-input"),
  svg: getRequiredElement<SVGSVGElement>("#barcode-svg"),
  statusMessage: getRequiredElement<HTMLElement>("#status-message"),
  downloadButton: getRequiredElement<HTMLButtonElement>("#download-button"),
  currentValue: getRequiredElement<HTMLElement>("#current-value"),
});

app.updateBarcode(DEFAULT_VALUE).catch((error) => {
  const statusMessage = getRequiredElement<HTMLElement>("#status-message");
  const message = error instanceof Error ? error.message : "初期バーコードの生成に失敗しました。";

  statusMessage.textContent = message;
  statusMessage.dataset.state = "error";
});
