'use client';

import { useState, useCallback } from 'react';
import { FileSpreadsheet, ClipboardList, AlertCircle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { ParsedRow, FieldMapping, ShipmentData } from '../types';
import { validateRow } from '../lib/validator';
import { parseExcel } from '../lib/excelParser';
import { autoMapColumns } from '../lib/templateMatcher';
import FileUploader from '../components/FileUploader';
import TemplateMapping from '../components/TemplateMapping';
import DataPreview from '../components/DataPreview';
import ProgressBar from '../components/ProgressBar';
import ShipmentList from '../components/ShipmentList';

type Step = 'upload' | 'mapping' | 'preview' | 'submitting' | 'success' | 'list';

interface SubmitProgress {
  current: number;
  total: number;
}

export default function Home() {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parseProgress, setParseProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const [submitProgress, setSubmitProgress] = useState<SubmitProgress>({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<{ success: number; failed: number; errors: { rowIndex: number; message: string }[] } | null>(null);

  const extractHeaders = useCallback(async (file: File): Promise<string[]> => {
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
          if (!jsonData || jsonData.length === 0) {
            reject(new Error('Excel文件内容为空'));
            return;
          }
          const firstRow = jsonData[0] as (string | number)[];
          const headerRow = firstRow.map(cell => String(cell).trim());
          resolve(headerRow);
        } catch (err) {
          reject(new Error('解析Excel文件失败'));
        }
      };
      reader.onerror = () => reject(new Error('读取文件失败'));
      reader.readAsArrayBuffer(file);
    });
  }, []);

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      setError('请选择有效的Excel文件（.xlsx 或 .xls）');
      return;
    }

    setError(null);
    setFile(selectedFile);

    try {
      const extractedHeaders = await extractHeaders(selectedFile);
      setHeaders(extractedHeaders);
      setMappings(autoMapColumns(extractedHeaders));
      setStep('mapping');
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理文件失败');
    }
  };

  const handleMappingConfirm = async (confirmedMappings: FieldMapping[]) => {
    if (!file) return;

    setMappings(confirmedMappings);
    setStep('preview');
    setParseProgress({ current: 0, total: 0, percentage: 0 });

    try {
      const parsedRows = await parseExcel(file, confirmedMappings, (progress) => {
        setParseProgress(progress);
      });
      setRows(parsedRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析Excel文件失败');
      setStep('upload');
    }
  };

  const handleMappingCancel = () => {
    setStep('upload');
    setFile(null);
    setHeaders([]);
    setMappings([]);
  };

  const handleUpdateRow = (index: number, field: keyof ShipmentData, value: string) => {
    const newRows = [...rows];
    newRows[index] = {
      ...newRows[index],
      [field]: value,
      _errors: validateRow({ ...newRows[index], [field]: value }, index),
    };

    const codeMap = new Map<string, { indices: number[]; rows: ParsedRow[] }>();
    newRows.forEach((row, i) => {
      if (row.externalCode) {
        const code = row.externalCode.trim();
        const existing = codeMap.get(code) || { indices: [], rows: [] };
        existing.indices.push(i);
        existing.rows.push(row);
        codeMap.set(code, existing);
      }
    });

    codeMap.forEach(({ indices, rows: codeRows }) => {
      if (indices.length > 1) {
        indices.forEach((idx) => {
          newRows[idx]._isDuplicate = true;
          const otherIdx = indices.find(i => i !== idx);
          if (otherIdx !== undefined) {
            newRows[idx]._duplicateWith = newRows[otherIdx]._rowIndex;
          }
        });
      } else if (indices.length === 1) {
        newRows[indices[0]]._isDuplicate = false;
        newRows[indices[0]]._duplicateWith = undefined;
      }
    });

    setRows(newRows);
  };

  const handleDeleteRow = (index: number) => {
    const newRows = rows.filter((_, i) => i !== index);
    setRows(newRows);
  };

  const handleAddRow = () => {
    const newRow: ParsedRow = {
      id: `row-${Date.now()}`,
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
      _rowIndex: rows.length + 2,
      _errors: [],
      _isDuplicate: false,
    };
    setRows([...rows, newRow]);
  };

  const handleSubmit = async () => {
    const validRows = rows.filter(row => row._errors.length === 0 && !row._isDuplicate);
    
    if (validRows.length === 0) {
      setError('没有可提交的有效数据');
      return;
    }

    setStep('submitting');
    setSubmitProgress({ current: 0, total: validRows.length });
    setSubmitResult(null);

    try {
      const response = await fetch('/api/shipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shipments: validRows }),
      });

      const result = await response.json();
      setSubmitResult(result);
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败');
      setStep('preview');
    }
  };

  const handleBackToUpload = () => {
    setStep('upload');
    setFile(null);
    setHeaders([]);
    setMappings([]);
    setRows([]);
    setError(null);
    setSubmitResult(null);
  };

  const handleViewList = () => {
    setStep('list');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Excel导入下单系统</h1>
              <p className="text-sm text-gray-500">多模板自动识别与批量下单</p>
            </div>
          </div>
          <button
            onClick={handleViewList}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ClipboardList className="w-5 h-5" />
            已导入运单
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {step === 'list' && <ShipmentList onBack={handleBackToUpload} />}

        {step === 'upload' && (
          <div className="max-w-2xl mx-auto">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-700">{error}</span>
              </div>
            )}
            
            <FileUploader onFileSelect={handleFileSelect} />
            
            <div className="mt-8 p-6 bg-white rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">功能说明</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2" />
                  支持拖拽上传和点击上传Excel文件
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2" />
                  自动识别多种模板格式，支持自定义字段映射
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2" />
                  记忆学习功能：手动调整映射后自动保存规则
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2" />
                  实时数据校验，批量错误展示
                </li>
              </ul>
            </div>
          </div>
        )}

        {step === 'mapping' && (
          <div className="max-w-3xl mx-auto">
            <div className="mb-4 flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                当前文件: {file?.name}
              </span>
            </div>
            <TemplateMapping
              headers={headers}
              onConfirm={handleMappingConfirm}
              onCancel={handleMappingCancel}
            />
          </div>
        )}

        {step === 'preview' && (
          <>
            {parseProgress.total > 0 && parseProgress.current < parseProgress.total && (
              <div className="mb-6">
                <ProgressBar
                  percentage={parseProgress.percentage}
                  current={parseProgress.current}
                  total={parseProgress.total}
                  label="解析进度"
                />
              </div>
            )}
            <DataPreview
              rows={rows}
              onUpdateRow={handleUpdateRow}
              onDeleteRow={handleDeleteRow}
              onAddRow={handleAddRow}
              onSubmit={handleSubmit}
            />
          </>
        )}

        {step === 'submitting' && (
          <div className="max-w-2xl mx-auto">
            <ProgressBar
              percentage={Math.round((submitProgress.current / submitProgress.total) * 100)}
              current={submitProgress.current}
              total={submitProgress.total}
              label="提交进度"
            />
            <div className="mt-6 text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">正在提交数据...</p>
            </div>
          </div>
        )}

        {step === 'success' && submitResult && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">提交成功</h2>
              <div className="flex items-center justify-center gap-8 mb-6">
                <div>
                  <p className="text-3xl font-bold text-green-600">{submitResult.success}</p>
                  <p className="text-gray-500">成功条数</p>
                </div>
                <div className="w-px h-12 bg-gray-200" />
                <div>
                  <p className="text-3xl font-bold text-red-600">{submitResult.failed}</p>
                  <p className="text-gray-500">失败条数</p>
                </div>
              </div>
              {submitResult.errors && submitResult.errors.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 rounded-lg text-left">
                  <h3 className="font-semibold text-red-700 mb-2">失败详情</h3>
                  <ul className="space-y-1 text-sm text-red-600">
                    {submitResult.errors.map((err, idx) => (
                      <li key={idx}>第 {err.rowIndex} 行: {err.message}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleBackToUpload}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  继续导入
                </button>
                <button
                  onClick={handleViewList}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  查看运单列表
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
