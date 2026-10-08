import { sortTitles, labels } from "./catalog";
import type { Title, Watched, Order } from "../types";
export function download(data: Blob, filename: string) {
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function createExcel(titles: Title[], watched: Watched) {
  const { default: ExcelJS } = await import("exceljs");
  const book = new ExcelJS.Workbook();
  book.creator = "Marvel Watchverse";
  book.created = new Date();
  for (const [order, name] of [
    ["release", "Ordine di uscita"],
    ["chronology", "Cronologia interna"],
    ["recommended", "Percorso consigliato"],
  ] as [Order, string][]) {
    const sheet = book.addWorksheet(name, {
      views: [{ state: "frozen", ySplit: 1 }],
      properties: { tabColor: { argb: "FFED1D24" } },
    });
    sheet.columns = [
      ["Numero", 10],
      ["Titolo", 52],
      ["Formato", 15],
      ["Anno", 10],
      ["Data uscita", 16],
      ["Universo", 28],
      ["Continuità", 40],
      ["Stato", 18],
      ["Note", 85],
      ["ID", 60],
      ["Visto il", 26],
    ].map(([header, width]) => ({
      header: String(header),
      width: Number(width),
    }));
    sortTitles(titles, order).forEach((t, i) =>
      sheet.addRow([
        i + 1,
        t.title,
        labels[t.type],
        t.year,
        t.releaseDate,
        t.universe,
        t.continuity,
        watched[t.id] ? "Visto" : "Da vedere",
        [t.status === "upcoming" ? "In arrivo" : "", t.chronologyNotes, t.notes]
          .filter(Boolean)
          .join(" · "),
        t.id,
        watched[t.id]?.watchedAt ?? "",
      ]),
    );
    sheet.autoFilter = { from: "A1", to: "K1" };
    sheet.getRow(1).height = 28;
    sheet.getRow(1).eachCell((c) => {
      c.font = { bold: true, color: { argb: "FFFFFFFF" } };
      c.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFED1D24" },
      };
      c.alignment = { vertical: "middle" };
    });
    sheet.eachRow((row, n) => {
      if (n > 1) {
        row.height = 25;
        row.eachCell((c) => {
          c.alignment = { vertical: "middle" };
          if (n % 2 === 0)
            c.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF0F2F7" },
            };
        });
      }
    });
  }
  return book;
}
export async function exportExcel(titles: Title[], watched: Watched) {
  const book = await createExcel(titles, watched);
  const buffer = await book.xlsx.writeBuffer();
  download(
    new Blob([buffer as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    "marvel-watchverse.xlsx",
  );
}
export async function importExcel(
  file: ArrayBuffer,
  known: Set<string>,
): Promise<Watched> {
  const { default: ExcelJS } = await import("exceljs");
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(file);
  const result: Watched = {};
  let valid = false;
  for (const sheet of book.worksheets) {
    const row = sheet.getRow(1);
    const headers = row.values as unknown[];
    const idCol = headers.indexOf("ID");
    const stateCol = headers.indexOf("Stato");
    const dateCol = headers.indexOf("Visto il");
    if (idCol < 1 || stateCol < 1) continue;
    valid = true;
    sheet.eachRow((r, n) => {
      if (n === 1) return;
      const id = String(r.getCell(idCol).value ?? "");
      const state = String(r.getCell(stateCol).value ?? "");
      if (known.has(id) && state === "Visto") {
        const raw = String(r.getCell(dateCol).value ?? "");
        result[id] = {
          watchedAt: Number.isFinite(Date.parse(raw))
            ? raw
            : new Date().toISOString(),
        };
      }
    });
    break;
  }
  if (!valid)
    throw Error(
      "Il foglio deve contenere le colonne ID e Stato del nostro export.",
    );
  return result;
}
