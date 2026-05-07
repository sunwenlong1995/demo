import type { FieldMapping, TemplateRule, ShipmentData } from '../types';
type DataField = Exclude<keyof ShipmentData, 'id'>;
const COLUMN_ALIASES: Record<DataField, string[]> = {
 externalCode: ['外部编码', '外部单号', '订单号', '运单号', '单号', 'ExternalCode', 'OrderNo', 'TrackingNo'],
 senderName: ['发件人', '寄件人', '发件人姓名', '寄件人姓名', '发方', 'Sender', 'SenderName', 'FromName'],
 senderPhone: ['发件人电话', '寄件人电话', '发件人手机', '寄件人手机', '发方电话', 'SenderPhone', 'FromPhone'],
 senderAddress: ['发件人地址', '寄件人地址', '发方地址', 'SenderAddress', 'FromAddress'],
 receiverName: ['收件人', '收货人', '收件人姓名', '收货人姓名', '收方', 'Receiver', 'ReceiverName', 'ToName'],
 receiverPhone: ['收件人电话', '收货人电话', '收件人手机', '收货人手机', '收方电话', 'ReceiverPhone', 'ToPhone'],
 receiverAddress: ['收件人地址', '收货人地址', '收方地址', 'ReceiverAddress', 'ToAddress'],
 weight: ['重量', '重量(kg)', '货物重量', 'Weight', 'weight'],
 quantity: ['件数', '包裹数量', '数量', 'Quantity', 'quantity'],
 temperature: ['温层', '温度', '温度类型', 'Temperature', 'temperature', '冷藏', '冷冻'],
 remark: ['备注', '说明', '备注信息', 'Remark', 'remark'],
};
export function generateFingerprint(headers: string[]): string {
 return headers.map(h => h.trim().toLowerCase()).sort().join('|');
}
export function matchColumnToField(columnName: string): (keyof ShipmentData) | null {
 const normalizedName = columnName.trim().toLowerCase();
 
 for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
 for (const alias of aliases) {
 const normalizedAlias = alias.toLowerCase();
 
 if (normalizedName === normalizedAlias) {
 return field as keyof ShipmentData;
 }
 
 if (normalizedName.indexOf(normalizedAlias) !== -1) {
 if (field === 'temperature' && !['温层', '温度', '冷藏', '冷冻'].some(t => normalizedName.includes(t.toLowerCase()))) {
 continue;
 }
 return field as keyof ShipmentData;
 }
 
 if (normalizedAlias.indexOf(normalizedName) !== -1) {
 if (field === 'temperature' && !['温层', '温度'].some(t => t.toLowerCase().includes(normalizedName))) {
 continue;
 }
 return field as keyof ShipmentData;
 }
 }
 }
 return null;
}
export function autoMapColumns(headers: string[]): FieldMapping[] {
 return headers.map((header, index) => {
 const field = matchColumnToField(header);
 return {
 excelColumn: header,
 systemField: field || 'remark'
 };
 });
}
export function findMatchingTemplate(headers: string[], rules: TemplateRule[]): TemplateRule | null {
 const fingerprint = generateFingerprint(headers);
 const threshold = 0.7;
 for (const rule of rules) {
 const ruleHeaders = rule.mappings.map(m => m.excelColumn);
 const ruleFingerprint = generateFingerprint(ruleHeaders);
 const similarity = calculateSimilarity(fingerprint, ruleFingerprint);
 if (similarity >= threshold) {
 return rule;
 }
 }
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
