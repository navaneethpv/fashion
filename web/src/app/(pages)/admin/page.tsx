"use client"
import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, MoreHorizontal, DollarSign, ShoppingBag, Users, Package, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [productCount, setProductCount] = useState(0);
  const base =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000";
  const baseUrl = base.replace(/\/$/, "");
  useEffect(() => {
    fetch(`${baseUrl}/api/admin/stats`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));

    fetch(`${baseUrl}/api/products?limit=1`)
      .then(res => res.json())
      .then(data => setProductCount(data.meta?.total || 0))
      .catch(err => console.error(err));
  }, []);

  if (!stats) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  // Mock data for the chart (In real app, fetch 7-day history)
  const chartData = [
    { name: 'Mon', revenue: 4000 },
    { name: 'Tue', revenue: 3000 },
    { name: 'Wed', revenue: 2000 },
    { name: 'Thu', revenue: 2780 },
    { name: 'Fri', revenue: 1890 },
    { name: 'Sat', revenue: 2390 },
    { name: 'Sun', revenue: 3490 },
  ];

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Stats Grid */}
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Revenue"
          value={`₹${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((stats.revenue || 0) / 100)}`}
          trend="+12.5%"
          isPositive={true}
          icon={DollarSign}
        />
        <StatsCard
          title="Total Orders"
          value={stats.orders}
          trend="+5.2%"
          isPositive={true}
          icon={ShoppingBag}
        />
        <StatsCard
          title="Total Products"
          value={productCount}
          trend="+2.4%"
          isPositive={true}
          icon={Package}
        />
        <StatsCard
          title="Total Users"
          value={stats.users}
          trend="-1.1%"
          isPositive={false}
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-lg text-gray-900">Revenue Analytics</h3>
            <button><MoreHorizontal className="text-gray-400" /></button>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />

                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(value) => `₹${value}`} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Countries / Categories */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg text-gray-900 mb-6">Top Categories</h3>
          <div className="space-y-6">
            {[
              { name: 'T-Shirts', sales: 450, color: 'bg-blue-500' },
              { name: 'Jeans', sales: 320, color: 'bg-purple-500' },
              { name: 'Dresses', sales: 210, color: 'bg-pink-500' },
              { name: 'Accessories', sales: 150, color: 'bg-orange-500' }
            ].map((cat) => (
              <div key={cat.name}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700">{cat.name}</span>
                  <span className="text-gray-500">{cat.sales} Sales</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${cat.color}`} style={{ width: `${(cat.sales / 500) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-lg">Recent Orders</h3>
          <button className="text-sm font-bold text-blue-600 hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-medium uppercase text-xs sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 rounded-tl-lg">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4 rounded-tr-lg">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.recentOrders.map((order: any) => (
                <tr key={order._id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-mono text-xs">#{order._id.slice(-6).toUpperCase()}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {order.shippingAddress?.firstName || "Guest"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${order.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold">₹{(order.total_cents / 100).toFixed(2)}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const StatsCard = ({ title, value, trend, isPositive, icon: Icon }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition">
    <div>
      <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-gray-900 mb-2">{value}</h3>
      <div className={`flex items-center text-xs font-bold ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
        {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
        <span>{trend}</span>
        <span className="text-gray-400 font-normal ml-1">since last week</span>
      </div>
    </div>
    <div className="p-3 bg-blue-50 rounded-xl">
      <Icon className="w-6 h-6 text-blue-600" />
    </div>
  </div>
);