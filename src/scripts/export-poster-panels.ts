import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium, type Page } from "playwright";

type PrintFormat = "11x17" | "36";

interface ExportOptions {
  baseUrl: string;
  format: PrintFormat;
  fromPanel: number;
  hideDates: boolean;
  outputDirectory: string;
  toPanel?: number;
}

function getArgument(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

function getOptions(): ExportOptions {
  const requestedFormat = getArgument("format") ?? "11x17";
  if (requestedFormat !== "11x17" && requestedFormat !== "36") {
    throw new Error('Expected --format="11x17" or --format="36".');
  }

  const hideDates = process.argv.includes("--hide-dates");
  const baseUrl = (getArgument("base-url") ?? "http://localhost:3000").replace(/\/$/, "");
  const outputDirectory = path.resolve(
    getArgument("output-dir") ??
      `poster-pdfs/${requestedFormat}${hideDates ? "-no-dates" : ""}`
  );
  const fromPanel = Number.parseInt(getArgument("from") ?? "1", 10);
  const requestedToPanel = getArgument("to");
  const toPanel = requestedToPanel === undefined
    ? undefined
    : Number.parseInt(requestedToPanel, 10);
  if (!Number.isInteger(fromPanel) || fromPanel < 1) {
    throw new Error("--from must be a positive integer.");
  }
  if (toPanel !== undefined && (!Number.isInteger(toPanel) || toPanel < fromPanel)) {
    throw new Error("--to must be an integer greater than or equal to --from.");
  }

  return {
    baseUrl,
    format: requestedFormat,
    fromPanel,
    hideDates,
    outputDirectory,
    toPanel,
  };
}

function getPanelUrl(
  baseUrl: string,
  format: PrintFormat,
  panelNumber: number,
  hideDates: boolean
) {
  const url = new URL(baseUrl);
  url.pathname = "/";
  url.search = "";
  url.searchParams.set("poster", "1");
  url.searchParams.set("format", format);
  url.searchParams.set("panel", String(panelNumber));
  if (hideDates) {
    url.searchParams.set("dates", "0");
  }
  return url.toString();
}

async function waitForPanel(page: Page, panelNumber: number) {
  await page.waitForFunction(
    (expectedPanelNumber) => {
      const panel = document.querySelector<HTMLElement>('[data-print-panel="true"]');
      return (
        panel?.dataset.posterReady === "true" &&
        panel.dataset.panelNumber === String(expectedPanelNumber)
      );
    },
    panelNumber,
    { timeout: 120_000 }
  );

  await page.evaluate(async () => {
    await document.fonts.ready;
  });

  await page.waitForFunction(
    () => {
      const panel = document.querySelector<HTMLElement>('[data-print-panel="true"]');
      if (!panel) return false;

      const panelBounds = panel.getBoundingClientRect();
      return Array.from(panel.querySelectorAll<HTMLImageElement>("img"))
        .filter((image) => {
          const bounds = image.getBoundingClientRect();
          return (
            bounds.right > panelBounds.left &&
            bounds.left < panelBounds.right &&
            bounds.bottom > panelBounds.top &&
            bounds.top < panelBounds.bottom
          );
        })
        .every((image) => image.complete);
    },
    undefined,
    { timeout: 120_000 }
  );
}

async function main() {
  const options = getOptions();
  await mkdir(options.outputDirectory, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.setDefaultTimeout(120_000);

  try {
    await page.goto(getPanelUrl(options.baseUrl, options.format, 1, options.hideDates), {
      waitUntil: "domcontentloaded",
      timeout: 120_000,
    });
    await waitForPanel(page, 1);

    const panelCount = Number(
      await page.locator('[data-print-panel="true"]').getAttribute("data-panel-count")
    );
    if (!Number.isInteger(panelCount) || panelCount < 1) {
      throw new Error(`Invalid panel count: ${panelCount}`);
    }
    if (options.fromPanel > panelCount) {
      throw new Error(`--from=${options.fromPanel} exceeds the panel count (${panelCount}).`);
    }

    const filenameDigits = Math.max(3, String(panelCount).length);
    const lastPanel = Math.min(options.toPanel ?? panelCount, panelCount);
    for (
      let panelNumber = options.fromPanel;
      panelNumber <= lastPanel;
      panelNumber += 1
    ) {
      if (panelNumber !== 1) {
        await page.goto(
          getPanelUrl(options.baseUrl, options.format, panelNumber, options.hideDates),
          {
            waitUntil: "domcontentloaded",
            timeout: 120_000,
          }
        );
        await waitForPanel(page, panelNumber);
      }

      const filename = `panel-${String(panelNumber).padStart(filenameDigits, "0")}.pdf`;
      const outputPath = path.join(options.outputDirectory, filename);
      await page.pdf({
        path: outputPath,
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: false,
      });
      process.stdout.write(`Exported ${panelNumber}/${panelCount}: ${outputPath}\n`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
