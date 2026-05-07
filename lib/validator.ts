import type { ShipmentData, RowError } from '../types';
import { TEMPERATURE_OPTIONS } from '../types';

export function validateRow(row: Partial<ShipmentData>, rowIndex: number): RowError[] {
  const errors: RowError[] = [];

  if (!row.senderName?.trim()) {
    errors.push({ field: 'senderName', message: '发件人姓名不能为空' });
  }

  if (!row.senderPhone?.trim()) {
    errors.push({ field: 'senderPhone', message: '发件人电话不能为空' });
  } else if (!/^1[3-9]\d{9}$/.test(row.senderPhone.trim().replace(/\s/g, ''))) {
    errors.push({ field: 'senderPhone', message: '发件人电话格式错误' });
  }

  if (!row.senderAddress?.trim()) {
    errors.push({ field: 'senderAddress', message: '发件人地址不能为空' });
  }

  if (!row.receiverName?.trim()) {
    errors.push({ field: 'receiverName', message: '收件人姓名不能为空' });
  }

  if (!row.receiverPhone?.trim()) {
    errors.push({ field: 'receiverPhone', message: '收件人电话不能为空' });
  } else if (!/^1[3-9]\d{9}$/.test(row.receiverPhone.trim().replace(/\s/g, ''))) {
    errors.push({ field: 'receiverPhone', message: '收件人电话格式错误' });
  }

  if (!row.receiverAddress?.trim()) {
    errors.push({ field: 'receiverAddress', message: '收件人地址不能为空' });
  }

  if (!row.weight?.trim()) {
    errors.push({ field: 'weight', message: '重量不能为空' });
  } else {
    const weight = parseFloat(row.weight.trim());
    if (isNaN(weight) || weight <= 0) {
      errors.push({ field: 'weight', message: '重量必须为正数' });
    }
  }

  if (!row.quantity?.trim()) {
    errors.push({ field: 'quantity', message: '件数不能为空' });
  } else {
    const quantity = parseInt(row.quantity.trim(), 10);
    if (isNaN(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
      errors.push({ field: 'quantity', message: '件数必须为正整数' });
    }
  }

  if (!row.temperature?.trim()) {
    errors.push({ field: 'temperature', message: '温层不能为空' });
  } else if (!TEMPERATURE_OPTIONS.includes(row.temperature.trim() as typeof TEMPERATURE_OPTIONS[0])) {
    errors.push({ field: 'temperature', message: `温层必须为 ${TEMPERATURE_OPTIONS.join(' / ')} 之一` });
  }

  return errors;
}

export function validateAllRows(rows: ShipmentData[]): { rowIndex: number; errors: RowError[] }[] {
  const allErrors: { rowIndex: number; errors: RowError[] }[] = [];
  
  rows.forEach((row, index) => {
    const errors = validateRow(row, index);
    if (errors.length > 0) {
      allErrors.push({ rowIndex: index + 2, errors });
    }
  });

  return allErrors;
}

export function checkDuplicates(rows: ShipmentData[]): Map<string, number[]> {
  const codeMap = new Map<string, number[]>();
  
  rows.forEach((row, index) => {
    if (row.externalCode?.trim()) {
      const code = row.externalCode.trim();
      const indices = codeMap.get(code) || [];
      indices.push(index + 2);
      codeMap.set(code, indices);
    }
  });

  const duplicates = new Map<string, number[]>();
  codeMap.forEach((indices, code) => {
    if (indices.length > 1) {
      duplicates.set(code, indices);
    }
  });

  return duplicates;
}
