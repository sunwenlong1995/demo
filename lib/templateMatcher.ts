import type { FieldMapping, TemplateRule, ShipmentData } from '../types';

type DataField = Exclude<keyof ShipmentData, 'id'>;

const FIELD_PATTERNS: Array<{ field: DataField; patterns: string[] }> = [
  { field: 'senderPhone', patterns: ['发件人电话', '寄件人电话', '发件人手机', '寄件人手机', '发方电话', 'SenderPhone', 'FromPhone'] },
  { field: 'senderAddress', patterns: ['发件人地址', '寄件人地址', '发方地址', 'SenderAddress', 'FromAddress'] },
  { field: 'senderName', patterns: ['发件人姓名', '寄件人姓名', '发件人', '寄件人', '发方', 'Sender', 'SenderName', 'FromName'] },
  { field: 'receiverPhone', patterns: ['收件人电话', '收货人电话', '收件人手机', '收货人手机', '收方电话', 'ReceiverPhone', 'ToPhone'] },
  { field: 'receiverAddress', patterns: ['收件人地址', '收货人地址', '收方地址', 'ReceiverAddress', 'ToAddress'] },
  { field: 'receiverName', patterns: ['收件人姓名', '收货人姓名', '收件人', '收货人', '收方', 'Receiver', 'ReceiverName', 'ToName'] },
  { field: 'externalCode', patterns: ['外部编码', '外部单号', '订单号', '运单号', '单号', 'ExternalCode', 'OrderNo', 'TrackingNo'] },
  { field: 'weight', patterns: ['重量', '重量(kg)', '货物重量', 'Weight', 'weight'] },
  { field: 'quantity', patterns: ['件数', '包裹数量', '数量', 'Quantity', 'quantity'] },
  { field: 'temperature', patterns: ['温层', '温度', '温度类型', 'Temperature', 'temperature'] },
  { field: 'remark', patterns: ['备注', '说明', '备注信息', 'Remark', 'remark'] },
];

export function generateFingerprint(headers: string[]): string {
  return headers.map(h => h.trim().toLowerCase()).sort().join('|');
}

export function matchColumnToField(columnName: string): (keyof ShipmentData) | null {
  const trimmed = columnName.trim();
  const normalizedName = trimmed.toLowerCase();
  
  console.log(`匹配列名: "${columnName}" -> "${trimmed}" -> "${normalizedName}"`);
  
  for (const { field, patterns } of FIELD_PATTERNS) {
    for (const pattern of patterns) {
      const patternLower = pattern.toLowerCase();
      if (patternLower === normalizedName) {
        console.log(`匹配成功: "${normalizedName}" -> ${field}`);
        return field;
      }
    }
  }
  
  console.log(`未匹配到字段: "${normalizedName}"`);
  return null;
}

export function autoMapColumns(headers: string[]): FieldMapping[] {
  console.log('autoMapColumns 输入 headers:', headers);
  const results = headers.map((header) => {
    const field = matchColumnToField(header);
    console.log(`列名: "${header}" -> 映射字段: ${field || 'remark'}`);
    return {
      excelColumn: header,
      systemField: field || 'remark'
    };
  });
  console.log('autoMapColumns 输出:', results);
  return results;
}

export function findMatchingTemplate(headers: string[], rules: TemplateRule[]): TemplateRule | null {
  console.log('findMatchingTemplate - 输入 headers:', headers);
  console.log('findMatchingTemplate - 已有规则数量:', rules.length);
  
  const fingerprint = generateFingerprint(headers);
  const threshold = 0.7;
  
  for (const rule of rules) {
    const ruleHeaders = rule.mappings.map(m => m.excelColumn);
    const ruleFingerprint = generateFingerprint(ruleHeaders);
    const similarity = calculateSimilarity(fingerprint, ruleFingerprint);
    console.log(`模板 "${rule.name}" 相似度: ${similarity}`);
    
    if (similarity >= threshold) {
      console.log('找到匹配模板:', rule);
      return rule;
    }
  }
  
  console.log('未找到匹配模板');
  return null;
}

function calculateSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.split('|'));
  const wordsB = new Set(b.split('|'));
  const intersection = Array.from(wordsA).filter(w => wordsB.has(w)).length;
  const union = wordsA.size + wordsB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function saveTemplateRule(headers: string[], mappings: FieldMapping[]): TemplateRule {
  return {
    id: Date.now().toString(),
    name: `模板 ${new Date().toLocaleString()}`,
    fingerprint: generateFingerprint(headers),
    mappings,
    createdAt: Date.now()
  };
}

export function getTemplateRules(): TemplateRule[] {
  const stored = localStorage.getItem('templateRules');
  return stored ? JSON.parse(stored) : [];
}

export function setTemplateRules(rules: TemplateRule[]): void {
  localStorage.setItem('templateRules', JSON.stringify(rules));
}
