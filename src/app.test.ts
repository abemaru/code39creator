import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBarcodeApp } from "./app";

function renderFixture(): void {
  document.body.innerHTML = `
    <main>
      <form id="barcode-form">
        <input id="barcode-input" value="CODE39-123" />
        <button id="download-button" type="button" disabled>PNG</button>
      </form>
      <p id="status-message"></p>
      <span id="current-value"></span>
      <svg id="barcode-svg"></svg>
    </main>
  `;
}

function createElements() {
  const form = document.querySelector<HTMLFormElement>("#barcode-form");
  const input = document.querySelector<HTMLInputElement>("#barcode-input");
  const svg = document.querySelector<SVGSVGElement>("#barcode-svg");
  const statusMessage = document.querySelector<HTMLElement>("#status-message");
  const downloadButton = document.querySelector<HTMLButtonElement>("#download-button");
  const currentValue = document.querySelector<HTMLElement>("#current-value");

  if (!form || !input || !svg || !statusMessage || !downloadButton || !currentValue) {
    throw new Error("Fixture not mounted");
  }

  return { form, input, svg, statusMessage, downloadButton, currentValue };
}

describe("createBarcodeApp", () => {
  beforeEach(() => {
    renderFixture();
  });

  it("updates UI on successful barcode generation", async () => {
    const elements = createElements();
    const renderBarcode = vi.fn();
    const createPngUrlFromSvg = vi.fn().mockResolvedValue("blob:generated");
    const revokeObjectUrl = vi.fn();
    const app = createBarcodeApp(elements, {
      renderBarcode,
      createPngUrlFromSvg,
      revokeObjectUrl,
    });

    await app.updateBarcode("abc-123");

    expect(elements.input.value).toBe("ABC-123");
    expect(renderBarcode).toHaveBeenCalledWith(elements.svg, "ABC-123");
    expect(createPngUrlFromSvg).toHaveBeenCalledWith(elements.svg);
    expect(elements.currentValue.textContent).toBe("*ABC-123*");
    expect(elements.downloadButton.disabled).toBe(false);
    expect(elements.statusMessage.dataset.state).toBe("success");
  });

  it("shows validation errors without rendering", async () => {
    const elements = createElements();
    const renderBarcode = vi.fn();
    const createPngUrlFromSvg = vi.fn();
    const app = createBarcodeApp(elements, {
      renderBarcode,
      createPngUrlFromSvg,
      revokeObjectUrl: vi.fn(),
    });

    await app.updateBarcode("abc_123");

    expect(renderBarcode).not.toHaveBeenCalled();
    expect(createPngUrlFromSvg).not.toHaveBeenCalled();
    expect(elements.downloadButton.disabled).toBe(true);
    expect(elements.statusMessage.textContent).toBe("Code 39 で使えない文字が含まれています。");
    expect(elements.statusMessage.dataset.state).toBe("error");
  });

  it("revokes the previous object URL before replacing it", async () => {
    const elements = createElements();
    const revokeObjectUrl = vi.fn();
    const createPngUrlFromSvg = vi
      .fn()
      .mockResolvedValueOnce("blob:first")
      .mockResolvedValueOnce("blob:second");
    const app = createBarcodeApp(elements, {
      renderBarcode: vi.fn(),
      createPngUrlFromSvg,
      revokeObjectUrl,
    });

    await app.updateBarcode("first");
    await app.updateBarcode("second");

    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:first");
  });
});
