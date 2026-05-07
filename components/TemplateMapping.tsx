import { useState, useEffect } from 'react';
import { RotateCcw, Check, Save } from 'lucide-react';
import type { FieldMapping, ShipmentData } from '../types';
import { SYSTEM_FIELDS } from '../types';
import { autoMapColumns, findMatchingTemplate, saveTemplateRule, getTemplateRules, setTemplateRules } from '../lib/templateMatcher';

interface TemplateMappingProps {
  headers: string[];
  onConfirm: (mappings: FieldMapping[]) => void;
  onCancel: () => void;
}

export default function TemplateMapping({ headers, onConfirm, onCancel }: TemplateMappingProps) {
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [showAutoMatch, setShowAutoMatch] = useState(false);
  const [savedTemplate, setSavedTemplate] = useState(false);

  useEffect(() => {
    const rules = getTemplateRules();
    const matchedTemplate = findMatchingTemplate(headers, rules);
    
    if (matchedTemplate) {
      setMappings(matchedTemplate.mappings);
      setShowAutoMatch(true);
    } else {
      setMappings(autoMapColumns(headers));
    }
  }, [headers]);

  const handleMappingChange = (index: number, field: keyof ShipmentData) => {
    const newMappings = [...mappings];
    newMappings[index] = {
      ...newMappings[index],
      systemField: field,
    };
    setMappings(newMappings);
    setSavedTemplate(false);
  };

  const handleReset = () => {
    setMappings(autoMapColumns(headers));
    setSavedTemplate(false);
  };

  const handleSaveTemplate = () => {
    const rules = getTemplateRules();
    const newRule = saveTemplateRule(headers, mappings);
    rules.push(newRule);
    setTemplateRules(rules);
    setSavedTemplate(true);
  };

  const handleConfirm = () => {
    if (!savedTemplate) {
      handleSaveTemplate();
    }
    onConfirm(mappings);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">字段映射</h2>
        {showAutoMatch && (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1">
            <Check className="w-4 h-4" />
            已自动匹配模板
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b">Excel 列名</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b">系统字段</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b">必填</th>
            </tr>
          </thead>
          <tbody>
            {mappings.map((mapping, index) => {
              const fieldInfo = SYSTEM_FIELDS.find(f => f.key === mapping.systemField);
              return (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 border-b">
                    <span className="font-medium text-gray-800">{mapping.excelColumn}</span>
                  </td>
                  <td className="px-4 py-3 border-b">
                    <select
                      value={mapping.systemField}
                      onChange={(e) => handleMappingChange(index, e.target.value as keyof ShipmentData)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      {SYSTEM_FIELDS.map((field) => (
                        <option key={field.key} value={field.key}>
                          {field.label}
                        </option>
                      ))}
                      <option value="ignore">忽略此列</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 border-b">
                    {fieldInfo?.required ? (
                      <span className="text-red-500 text-sm">必填</span>
                    ) : (
                      <span className="text-gray-400 text-sm">选填</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          重置映射
        </button>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveTemplate}
            disabled={savedTemplate}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              savedTemplate
                ? 'bg-green-100 text-green-700 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Save className="w-4 h-4" />
            {savedTemplate ? '已保存模板' : '保存模板'}
          </button>
          
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            取消
          </button>
          
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            确认映射
          </button>
        </div>
      </div>
    </div>
  );
}
