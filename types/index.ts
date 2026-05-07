export interface ShipmentData {
  id: string;
  externalCode: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  weight: string;
  quantity: string;
  temperature: string;
  remark: string;
}

export interface ParsedRow extends ShipmentData {
  _rowIndex: number;
  _errors: RowError[];
  _isDuplicate: boolean;
  _duplicateWith?: number;
}

export interface RowError {
  field: keyof ShipmentData;
  message: string;
}

export interface FieldMapping {
  excelColumn: string;
  systemField: keyof ShipmentData;
}

export interface TemplateRule {
  id: string;
  name: string;
  fingerprint: string;
  mappings: FieldMapping[];
  createdAt: number;
}

export interface ParseProgress {
  current: number;
  total: number;
  percentage: number;
}

export type TemperatureType = '常温' | '冷藏' | '冷冻';

export const TEMPERATURE_OPTIONS: TemperatureType[] = ['常温', '冷藏', '冷冻'];

export const SYSTEM_FIELDS: { key: keyof ShipmentData; label: string; required: boolean }[] = [
  { key: 'externalCode', label: '外部编码', required: false },
  { key: 'senderName', label: '发件人姓名', required: true },
  { key: 'senderPhone', label: '发件人电话', required: true },
  { key: 'senderAddress', label: '发件人地址', required: true },
  { key: 'receiverName', label: '收件人姓名', required: true },
  { key: 'receiverPhone', label: '收件人电话', required: true },
  { key: 'receiverAddress', label: '收件人地址', required: true },
  { key: 'weight', label: '重量 (kg)', required: true },
  { key: 'quantity', label: '件数', required: true },
  { key: 'temperature', label: '温层', required: true },
  { key: 'remark', label: '备注', required: false },
];
