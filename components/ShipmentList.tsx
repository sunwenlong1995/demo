import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Package, Phone, MapPin, Calendar } from 'lucide-react';

interface Shipment {
  id: string;
  externalCode: string | null;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  weight: number;
  quantity: number;
  temperature: string;
  remark: string | null;
  createdAt: string;
}

interface ShipmentListProps {
  onBack: () => void;
}

export default function ShipmentList({ onBack }: ShipmentListProps) {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);

  const fetchShipments = async (currentPage: number, searchQuery: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/shipments?page=${currentPage}&limit=${limit}&search=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      setShipments(data.shipments);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch shipments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments(page, search);
  }, [page, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold text-gray-800">已导入运单</h2>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
            共 {total} 条
          </span>
        </div>
      </div>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索外部编码或收件人姓名..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            搜索
          </button>
        </div>
      </form>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : shipments.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无运单记录</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[1000px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 w-24">外部编码</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">收件人</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">收件人电话</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">收件地址</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">重量(kg)</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">件数</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">温层</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">创建时间</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((shipment) => (
                  <tr key={shipment.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">
                      {shipment.externalCode || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">
                      {shipment.receiverName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {shipment.receiverPhone}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={shipment.receiverAddress}>
                      <MapPin className="w-4 h-4 inline mr-1" />
                      {shipment.receiverAddress}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">
                      {shipment.weight}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">
                      {shipment.quantity}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        shipment.temperature === '常温' ? 'bg-green-100 text-green-700' :
                        shipment.temperature === '冷藏' ? 'bg-blue-100 text-blue-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {shipment.temperature}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(shipment.createdAt).toLocaleString('zh-CN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <p className="text-gray-500 text-sm">
              显示第 {((page - 1) * limit) + 1} - {Math.min(page * limit, total)} 条
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`p-2 rounded-lg transition-colors ${
                  page === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="px-4 py-2 text-gray-600 font-medium">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`p-2 rounded-lg transition-colors ${
                  page === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
