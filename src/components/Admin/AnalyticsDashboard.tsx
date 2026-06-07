import React, { useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import { Order, Product } from '../../types';

interface AnalyticsDashboardProps {
  orders: Order[];
  products: Product[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ orders, products }) => {
  // 1. Sales Trend Data (last 7 days or months)
  const salesTrendData = useMemo(() => {
    const dailyMap: Record<string, number> = {};
    const last30Days = [...Array(30)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString();
    }).reverse();

    last30Days.forEach(day => dailyMap[day] = 0);

    orders.forEach(order => {
      const day = new Date(order.createdAt).toLocaleDateString();
      if (dailyMap[day] !== undefined) {
        dailyMap[day] += order.finalTotal;
      }
    });

    return Object.entries(dailyMap).map(([name, total]) => ({ name, total }));
  }, [orders]);

  // 2. Category Performance
  const categoryData = useMemo(() => {
    const catMap: Record<string, number> = {};
    orders.forEach(order => {
      order.products.forEach(p => {
        const prod = products.find(pr => pr.id === p.id);
        const category = prod?.category || 'Unknown';
        catMap[category] = (catMap[category] || 0) + (p.price * p.quantity);
      });
    });
    return Object.entries(catMap).map(([name, value]) => ({ name, value }));
  }, [orders, products]);

  // 3. Top Selling Products
  const topProducts = useMemo(() => {
    const prodMap: Record<string, {name: string, sold: number}> = {};
    orders.forEach(order => {
      order.products.forEach(p => {
        if (!prodMap[p.id]) prodMap[p.id] = { name: p.name, sold: 0 };
        prodMap[p.id].sold += p.quantity;
      });
    });
    return Object.values(prodMap)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);
  }, [orders]);

  const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#64748b'];

  return (
    <div className="space-y-8 pb-10">
      {/* Sales Trend Chart */}
      <div className="p-8 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl shadow-sm">
        <div className="mb-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600">Revenue Performance</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Total Gross Revenue Trend (Last 30 Days)</p>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesTrendData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                tick={{fontSize: 9, fontWeight: 700}} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(val) => val.split('/')[0] + '/' + val.split('/')[1]} 
              />
              <YAxis 
                tick={{fontSize: 9, fontWeight: 700}} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(val) => `৳${val}`}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Category Share (Pie) */}
        <div className="p-8 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl shadow-sm">
           <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600 mb-6">Category Revenue Share</h3>
           <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
              </PieChart>
            </ResponsiveContainer>
           </div>
        </div>

        {/* Top Products (Bar) */}
        <div className="p-8 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl shadow-sm">
           <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600 mb-6">Top Selling Units</h3>
           <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{fontSize: 9, fontWeight: 700}} axisLine={false} tickLine={false} width={100} />
                <Tooltip />
                <Bar dataKey="sold" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};
