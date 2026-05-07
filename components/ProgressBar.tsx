interface ProgressBarProps {
  percentage: number;
  current: number;
  total: number;
  label?: string;
}

export default function ProgressBar({ percentage, current, total, label }: ProgressBarProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-600 font-medium">{label || '处理进度'}</span>
        <span className="text-blue-600 font-semibold">
          {percentage}% ({current}/{total})
        </span>
      </div>
      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
