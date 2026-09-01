export type Cell = string | number;

export interface Sheet {
  name: string;
  rows: Cell[][];
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cellXml(value: Cell, styleId: string | null): string {
  const style = styleId ? ` ss:StyleID="${styleId}"` : "";
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<Cell${style}><Data ss:Type="Number">${value}</Data></Cell>`;
  }
  return `<Cell${style}><Data ss:Type="String">${escapeXml(String(value))}</Data></Cell>`;
}

/**
 * Builds a SpreadsheetML 2003 workbook. Excel, LibreOffice and Google Sheets open
 * this directly, and it needs no third-party dependency.
 */
export function buildWorkbook(sheets: Sheet[]): string {
  const body = sheets
    .map((sheet) => {
      const rows = sheet.rows
        .map((row, index) =>
          `<Row>${row.map((cell) => cellXml(cell, index === 0 ? "header" : null)).join("")}</Row>`
        )
        .join("");
      return `<Worksheet ss:Name="${escapeXml(sheet.name.slice(0, 31))}"><Table>${rows}</Table></Worksheet>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="header">
   <Font ss:Bold="1"/>
   <Interior ss:Color="#DDDDDD" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 ${body}
</Workbook>`;
}

export function downloadWorkbook(sheets: Sheet[], filename: string): void {
  const blob = new Blob([buildWorkbook(sheets)], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
