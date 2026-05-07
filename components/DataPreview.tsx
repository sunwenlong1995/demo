import { useState, useMemo } from 'react';
import { Trash2, Plus, Download, AlertCircle } from 'lucide-react';
import type { ParsedRow, ShipmentData } from '../types';
import { validateRow } from '../lib/validator';
import { exportToExcel } from '../lib/excelParser';
import { SYSTEM_FIELDS, TEMPERATURE_OPTIONS } from '../types';

interface DataPreviewProps {
  rows: ParsedRow[];
  onUpdateRow: (index: number, field: keyof ShipmentData, value: string) => void;
  onDeleteRow: (index: number) => void;
  onAddRow: () => void;
  onSubmit: () => void;
}

export default function DataPreview({
  rows,
  onUpdateRow,
  onDeleteRow,
  onAddRow,
  onSubmit,
}: DataPreviewProps) {
  const [editingCell, setEditingCell] = useState<{ row: number; field: keyof ShipmentData } | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  const allErrors = useMemo(() => {
    const errors: { rowIndex: number; field: keyof ShipmentData; message: string }[] = [];
    rows.forEach((row, index) => {
      row._errors.forEach((error) => {
        errors.push({ rowIndex: row._rowIndex, field: error.field, message: error.message });
      });
    });
    return errors;
  }, [rows]);

  const hasErrors = allErrors.length > 0 || rows.some(row => row._isDuplicate);
  const allValid = !hasErrors;

  const handleCellClick = (rowIndex: number, field: keyof ShipmentData) => {
    setEditingCell({ row: rowIndex, field });
  };

  const handleCellBlur = (rowIndex: number, field: keyof ShipmentData, value: string) => {
    setEditingCell(null);
    onUpdateRow(rowIndex, field, value);
  };

  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, field: keyof ShipmentData, value: string) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      setEditingCell(null);
      onUpdateRow(rowIndex, field, value);
      
      const fieldOrder: (keyof ShipmentData)[] = [
        'externalCode', 'senderName', 'senderPhone', 'senderAddress',
        'receiverName', 'receiverPhone', 'receiverAddress',
        'weight', 'quantity', 'temperature', 'remark'
      ];
      const currentIndex = fieldOrder.indexOf(field);
      const nextField = fieldOrder[currentIndex + 1];
      const nextRow = nextField ? rowIndex : rowIndex + 1;
      
      if (nextField && nextRow < rows.length) {
        setEditingCell({ row: nextRow, field: nextField });
      } else if (!nextField && nextRow < rows.length) {
        setEditingCell({ row: nextRow, field: 'externalCode' });
      }
    }
  };

  const handleExport = () => {
    exportToExcel(rows);
  };

  const getFieldError = (row: ParsedRow, field: keyof ShipmentData) => {
    return row._errors.find(e => e.field === field);
  };

  const isErrorField = (row: ParsedRow, field: keyof ShipmentData) => {
    return getFieldError(row, field) !== undefined;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-800">数据预览</h2>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
            {rows.length} 条记录
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowErrors(!showErrors)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showErrors
                ? 'bg-red-500 text-white'
                : hasErrors
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'bg-gray-100 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!hasErrors}
          >
            <AlertCircle className="w-4 h-4" />
            {showErrors ? '隐藏错误' : `显示错误 (${allErrors.length})`}
          </button>
          
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            导出 Excel
          </button>
          
          <button
            onClick={onAddRow}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加行
          </button>
          
          <button
            onClick={onSubmit}
            disabled={!allValid}
            className={`px-6 py-2 rounded-lg transition-colors ${
              allValid
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {allValid ? '提交下单' : '请先修正错误'}
          </button>
        </div>
      </div>

      {showErrors && allErrors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-semibold text-red-700 mb-2">数据校验错误</h3>
          <ul className="space-y-1 text-sm text-red-600 max-h-40 overflow-y-auto">
            {allErrors.map((error, index) => (
              <li key={index}>
                <span className="font-medium">第 {error.rowIndex} 行</span>
                <span className="mx-2">·</span>
                <span>{SYSTEM_FIELDS.find(f => f.key === error.field)?.label}</span>
                <span className="mx-2">·</span>
                <span>{error.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="w-full border-collapse min-w-[1200px]">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b-2 border-gray-200">
              <th className="px-3 py-2 text-left text-sm font-semibold text-gray-600 bg-gray-50 w-12">行号</th>
              {SYSTEM_FIELDS.map((field) => (
                <th
                  key={field.key}
                  className={`px-3 py-2 text-left text-sm font-semibold text-gray-600 bg-gray-50 ${
                    field.required ? 'relative' : ''
                  }`}
                >
                  {field.label}
                  {field.required && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                  )}
                </th>
              ))}
              <th className="px-3 py-2 text-center text-sm font-semibold text-gray-600 bg-gray-50 w-16">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={row.id}
                className={`border-b transition-colors ${
                  row._isDuplicate ? 'bg-yellow-50' : row._errors.length > 0 ? 'bg-red-50' : ''
                }`}
              >
                <td className={`px-3 py-2 text-sm font-medium ${
                  row._isDuplicate ? 'text-yellow-700' : 'text-gray-600'
                }`}>
                  {row._rowIndex}
                  {row._isDuplicate && (
                    <span className="ml-1 text-yellow-500 text-xs">
                      (与第{row._duplicateWith}行重复)
                    </span>
                  )}
                </td>
                
                {SYSTEM_FIELDS.map((field) => {
                  const error = getFieldError(row, field.key);
                  const isEditing = editingCell?.row === rowIndex && editingCell?.field === field.key;
                  
                  return (
                    <td
                      key={field.key}
                      className={`px-3 py-1.5 ${
                        isErrorField(row, field.key) ? 'bg-red-100' : ''
                      }`}
                      onClick={() => handleCellClick(rowIndex, field.key)}
                    >
                      {isEditing ? (
                        field.key === 'temperature' ? (
                          <select
                            value={row[field.key]}
                            onChange={(e) => handleCellBlur(rowIndex, field.key, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, rowIndex, field.key, row[field.key])}
                            className="w-full px-2 py-1 border border-blue-400 rounded focus:outline-none"
                            autoFocus
                          >
                            <option value="">请选择</option>
                            {TEMPERATURE_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={row[field.key]}
                            onChange={(e) => handleCellBlur(rowIndex, field.key, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, rowIndex, field.key, (e.target as HTMLInputElement).value)}
                            className="w-full px-2 py-1 border border-blue-400 rounded focus:outline-none"
                            autoFocus
                          />
                        )
                      ) : (
                        <div className="relative">
                          <span className={`text-sm ${
                            error ? 'text-red-700 font-medium' : 'text-gray-800'
                          }`}>
                            {row[field.key] || '-'}
                          </span>
                          {error && (
                            <div className="absolute top-full left-0 mt-1 px-2 py-1 bg-red-600 text-white text-xs rounded whitespace-nowrap z-10">
                              {error.message}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
                
                <td className="px-3 py-2 text-center">
                  <button
                    onClick={() => onDeleteRow(rowIndex)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
