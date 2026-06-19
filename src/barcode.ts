import JsBarcode from "jsbarcode";

export const VALID_PATTERN = /^[0-9A-Z \-.$/+%]+$/;
export const DEFAULT_VALUE = "CODE39-123";
export const SVG_NS = "http://www.w3.org/2000/svg";
export const BARCODE_MARGIN = 20;
export const BARCODE_HEIGHT = 120;
export const LABEL_FONT_SIZE = 20;
export const LABEL_GAP = 26;

export type BarcodeLibrary = (
  element: SVGSVGElement,
  value: string,
  options: Record<string, string | number | boolean>,
) => void;

export function normalizeValue(rawValue: string): string {
  return rawValue.toUpperCase();
}

export function validateValue(value: string): string {
  if (!value.trim()) {
    return "文字列を入力してください。";
  }

  if (!VALID_PATTERN.test(value)) {
    return "Code 39 で使えない文字が含まれています。";
  }

  return "";
}

export function formatLabel(value: string): string {
  return `*${value}*`;
}

export function calculateLetterSpacing(
  labelWidth: number,
  naturalWidth: number,
  characterCount: number,
): number {
  if (characterCount <= 1) {
    return 0;
  }

  const extraSpacing = (labelWidth - naturalWidth) / (characterCount - 1);
  return Number.isFinite(extraSpacing) && extraSpacing > 0 ? extraSpacing : 0;
}

export function renderBarcode(
  svg: SVGSVGElement,
  value: string,
  barcodeLibrary: BarcodeLibrary = JsBarcode as BarcodeLibrary,
): void {
  barcodeLibrary(svg, value, {
    format: "CODE39",
    displayValue: false,
    height: BARCODE_HEIGHT,
    margin: BARCODE_MARGIN,
    background: "transparent",
    lineColor: "#111111",
  });

  const viewBox = svg.viewBox.baseVal;
  const totalWidth = viewBox?.width || svg.getBBox().width;
  const totalHeight = viewBox?.height || svg.getBBox().height;
  const labelWidth = Math.max(totalWidth - BARCODE_MARGIN * 2, 1);
  const labelText = formatLabel(value);
  const label = document.createElementNS(SVG_NS, "text");

  label.textContent = labelText;
  label.setAttribute("x", String(BARCODE_MARGIN));
  label.setAttribute("y", String(totalHeight + LABEL_GAP));
  label.setAttribute("fill", "#111111");
  label.setAttribute("font-family", "monospace");
  label.setAttribute("font-size", String(LABEL_FONT_SIZE));

  svg.append(label);

  const naturalWidth = label.getComputedTextLength();
  const letterSpacing = calculateLetterSpacing(labelWidth, naturalWidth, labelText.length);

  if (letterSpacing > 0) {
    label.style.letterSpacing = `${letterSpacing}px`;
  }

  const finalHeight = totalHeight + LABEL_GAP + LABEL_FONT_SIZE + BARCODE_MARGIN;
  svg.setAttribute("height", `${finalHeight}px`);
  svg.setAttribute("viewBox", `0 0 ${totalWidth} ${finalHeight}`);
}
