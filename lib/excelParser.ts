import * as XLSX from 'xlsx';
import type { ShipmentData, ParsedRow, FieldMapping, ParseProgress } from '../types';
import { validateRow } from './validator';

export async function parseExcel(
  file: File,
  mappings: FieldMapping[],
  onProgress?: (progress: ParseProgress) => void
): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        if (!workbook.SheetNames.length) {
          reject(new Error('Excel文件中没有工作表'));
          return;
        }
        
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        if (!jsonData || jsonData.length < 2) {
          reject(new Error('Excel文件内容为空或只有表头'));
          return;
        }

        const headers = jsonData[0] as string[];
        const dataRows = jsonData.slice(1) as (string | number)[][];
        
        const results: ParsedRow[] = [];
        const total = dataRows.length;

        dataRows.forEach((row: (string | number)[], index) => {
          const parsedRow: ParsedRow = {
            id: `row-${index}`,
            externalCode: '',
            senderName: '',
            senderPhone: '',
            senderAddress: '',
            receiverName: '',
            receiverPhone: '',
            receiverAddress: '',
            weight: '',
            quantity: '',
            temperature: '',
            remark: '',
            _rowIndex: index + 2,
            _errors: [],
            _isDuplicate: false,
          };

          mappings.forEach((mapping) => {
            const colIndex = headers.indexOf(mapping.excelColumn);
            if (colIndex >= 0 && row[colIndex] !== undefined && row[colIndex] !== null) {
              parsedRow[mapping.systemField] = String(row[colIndex]).trim();
            }
          });

          parsedRow._errors = validateRow(parsedRow, index);
          results.push(parsedRow);

          if (onProgress) {
            onProgress({
              current: index + 1,
              total,
              percentage: Math.round(((index + 1) / total) * 100),
            });
          }
        });

        checkDuplicatesInResults(results);
        resolve(results);
      } catch (error) {
        reject(new Error(`解析Excel文件失败: ${error instanceof Error ? error.message : '未知错误'}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('读取文件失败'));
    };

    reader.readAsArrayBuffer(file);
  });
}

function checkDuplicatesInResults(results: ParsedRow[]): void {
  const codeMap = new Map<string, ParsedRow[]>();

  results.forEach((row) => {
    if (row.externalCode) {
      const code = row.externalCode.trim();
      const rowsWithCode = codeMap.get(code) || [];
      rowsWithCode.push(row);
      codeMap.set(code, rowsWithCode);
    }
  });

  codeMap.forEach((rows) => {
    if (rows.length > 1) {
      rows.forEach((row, idx) => {
        row._isDuplicate = true;
        const otherRows = rows.filter((_, i) => i !== idx);
        if (otherRows.length > 0) {
          row._duplicateWith = otherRows[0]._rowIndex;
        }
      });
    }
  });
}

export function exportToExcel(data: ParsedRow[]): void {
  const headers = ['外部编码', '发件人姓名', '发件人电话', '发件人地址', '收件人姓名', '收件人电话', '收件人地址', '重量(kg)', '件数', '温层', '备注'];
  
  const rows = data.map((row) => [
    row.externalCode,
    row.senderName,
    row.senderPhone,
    row.senderAddress,
    row.receiverName,
    row.receiverPhone,
    row.receiverAddress,
    row.weight,
    row.quantity,
    row.temperature,
    row.remark,
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '运单数据');
  
  XLSX.writeFile(workbook, `运单数据_${new Date().toISOString().split('T')[0]}.xlsx`);
}
