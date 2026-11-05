import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import getDb from '@/lib/db';
import { getSessionFromRequest, requireRole } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!session || !requireRole(session, ['ADMIN', 'STAFF'])) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const bill = db.prepare(`SELECT * FROM bills WHERE id=?`).get(params.id) as any;
  if (!bill) return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
  const items = db.prepare(`SELECT * FROM bill_items WHERE bill_id=? ORDER BY row_order`).all(params.id) as any[];

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Bagla Metal Traders';
  const ws = wb.addWorksheet('Invoice');

  const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1e293b' } };
  const headerFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  const boldFont: Partial<ExcelJS.Font> = { bold: true, size: 11 };
  const centerAlign: Partial<ExcelJS.Alignment> = { horizontal: 'center', vertical: 'middle' };
  const rightAlign: Partial<ExcelJS.Alignment> = { horizontal: 'right', vertical: 'middle' };

  ws.columns = [
    { key: 'sno', width: 6 }, { key: 'item', width: 25 }, { key: 'cat', width: 15 },
    { key: 'size', width: 10 }, { key: 'grade', width: 8 }, { key: 'brand', width: 12 },
    { key: 'qty', width: 8 }, { key: 'unit', width: 8 }, { key: 'rate', width: 10 },
    { key: 'labour', width: 10 }, { key: 'amount', width: 12 },
  ];

  ws.mergeCells('A1:K1');
  ws.getCell('A1').value = 'BAGLA METAL TRADERS';
  ws.getCell('A1').font = { bold: true, size: 18, color: { argb: 'FF0f172a' } };
  ws.getCell('A1').alignment = centerAlign;

  ws.mergeCells('A2:K2');
  ws.getCell('A2').value = 'Circular Road, Hathras';
  ws.getCell('A2').alignment = centerAlign;

  ws.addRow([]);
  const infoRow1 = ws.addRow([]);
  ws.mergeCells(`A${infoRow1.number}:F${infoRow1.number}`);
  ws.getCell(`A${infoRow1.number}`).value = `Customer: ${bill.customer_name}`;
  ws.getCell(`A${infoRow1.number}`).font = boldFont;
  ws.mergeCells(`G${infoRow1.number}:K${infoRow1.number}`);
  ws.getCell(`G${infoRow1.number}`).value = `Bill No: ${bill.bill_number}`;
  ws.getCell(`G${infoRow1.number}`).font = boldFont;
  ws.getCell(`G${infoRow1.number}`).alignment = rightAlign;

  const infoRow2 = ws.addRow([]);
  if (bill.customer_phone) {
    ws.mergeCells(`A${infoRow2.number}:F${infoRow2.number}`);
    ws.getCell(`A${infoRow2.number}`).value = `Phone: ${bill.customer_phone}`;
  }
  ws.mergeCells(`G${infoRow2.number}:K${infoRow2.number}`);
  ws.getCell(`G${infoRow2.number}`).value = `Date: ${bill.bill_date}`;
  ws.getCell(`G${infoRow2.number}`).alignment = rightAlign;

  ws.addRow([]);
  const headerRow = ws.addRow(['S.No', 'Item Name', 'Category', 'Size', 'Grade', 'Brand', 'Qty', 'Unit', 'Rate', 'Labour', 'Amount']);
  headerRow.eachCell(cell => {
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = centerAlign;
  });

  items.forEach((item, idx) => {
    const row = ws.addRow([
      idx + 1, item.item_name, item.category || '', item.size || '', item.grade || '',
      item.brand || '', item.qty, item.unit, item.rate, item.labour || 0, item.amount,
    ]);
    row.getCell(9).numFmt = '₹#,##0.00';
    row.getCell(10).numFmt = '₹#,##0.00';
    row.getCell(11).numFmt = '₹#,##0.00';
  });

  ws.addRow([]);
  const totalRow = ws.addRow(['', '', '', '', '', '', '', '', '', 'TOTAL:', bill.total]);
  ws.mergeCells(`A${totalRow.number}:I${totalRow.number}`);
  totalRow.getCell(10).fill = headerFill;
  totalRow.getCell(10).font = headerFont;
  totalRow.getCell(11).fill = headerFill;
  totalRow.getCell(11).font = headerFont;
  totalRow.getCell(11).numFmt = '₹#,##0.00';

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Bill_${bill.bill_number.replace(/\//g, '-')}.xlsx"`,
    },
  });
}
