import { describe, expect, it } from "vitest";
import {
  BARCODE_MARGIN,
  calculateLetterSpacing,
  formatLabel,
  normalizeValue,
  renderBarcode,
  validateValue,
} from "./barcode";

describe("barcode helpers", () => {
  it("normalizes input to uppercase", () => {
    expect(normalizeValue("ab-12")).toBe("AB-12");
  });

  it("validates empty values", () => {
    expect(validateValue("   ")).toBe("文字列を入力してください。");
  });

  it("validates unsupported characters", () => {
    expect(validateValue("ABC_123")).toBe("Code 39 で使えない文字が含まれています。");
  });

  it("accepts valid code39 characters", () => {
    expect(validateValue("ABC-123 /%+$")).toBe("");
  });

  it("formats labels with start and stop markers", () => {
    expect(formatLabel("CODE39")).toBe("*CODE39*");
  });

  it("calculates positive letter spacing when there is extra room", () => {
    expect(calculateLetterSpacing(120, 80, 5)).toBe(10);
  });

  it("returns zero letter spacing when the text already fills the width", () => {
    expect(calculateLetterSpacing(60, 80, 5)).toBe(0);
  });
});

describe("renderBarcode", () => {
  it("renders the barcode and a label with letter spacing", () => {
    document.body.innerHTML = '<svg id="barcode"></svg>';
    const svg = document.querySelector<SVGSVGElement>("#barcode");

    if (!svg) {
      throw new Error("Test SVG not found");
    }

    Object.defineProperty(svg, "viewBox", {
      value: { baseVal: { width: 424, height: 160 } },
      configurable: true,
    });

    let barcodeCallCount = 0;

    const barcodeLibrary = (element: SVGSVGElement) => {
      barcodeCallCount += 1;
      element.innerHTML = '<g><rect x="0" y="0" width="10" height="120"></rect></g>';
    };

    Object.defineProperty(window.SVGElement.prototype, "getBBox", {
      value: () => ({ width: 424, height: 160 }),
      configurable: true,
    });

    Object.defineProperty(window.SVGElement.prototype, "getComputedTextLength", {
      value: () => 120,
      configurable: true,
    });

    renderBarcode(svg, "CODE39-123", barcodeLibrary);

    const text = svg.querySelector("text");

    expect(barcodeCallCount).toBe(1);
    expect(text?.textContent).toBe("*CODE39-123*");
    expect(text?.getAttribute("x")).toBe(String(BARCODE_MARGIN));
    expect(text?.style.letterSpacing).not.toBe("");
    expect(svg.getAttribute("viewBox")).toBe("0 0 424 226");
  });
});
