import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DashboardStats, IPC_CHANNELS } from '../types';
import { TrendingUp, FileText, Calendar, PieChart as PieChartIcon, RefreshCcw, BarChart3, Activity } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await window.electron.invoke(IPC_CHANNELS.GET_DASHBOARD_STATS);
      setStats(data);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  if (loading) return <div className="flex h-full items-center justify-center text-gray-400">加载数据中...</div>;
  if (!stats) return null;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 p-6 overflow-y-auto space-y-6">
      
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
           <TrendingUp className="w-6 h-6 text-blue-600" /> 数据仪表盘
        </h2>
        <button onClick={fetchStats} className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors" title="刷新数据">
            <RefreshCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-850 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
           <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
             <FileText className="w-8 h-8" />
           </div>
           <div>
             <div className="text-sm text-gray-500 dark:text-gray-400">文章总数</div>
             <div className="text-3xl font-bold text-gray-800 dark:text-white">{stats.totalCount}</div>
           </div>
        </div>

        <div className="bg-white dark:bg-gray-850 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
           <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
             <Calendar className="w-8 h-8" />
           </div>
           <div>
             <div className="text-sm text-gray-500 dark:text-gray-400">今日采集</div>
             <div className="text-3xl font-bold text-gray-800 dark:text-white">{stats.todayCount}</div>
           </div>
        </div>
        
        <div className="bg-white dark:bg-gray-850 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
           <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400">
             <PieChartIcon className="w-8 h-8" />
           </div>
           <div>
             <div className="text-sm text-gray-500 dark:text-gray-400">主要来源</div>
             <div className="text-lg font-bold text-gray-800 dark:text-white truncate max-w-[150px]">
                {stats.sources.length > 0 ? stats.sources[0].name : '暂无'}
             </div>
           </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
        
        {/* Bar Chart - Changed to Collection Stats */}
        <div className="bg-white dark:bg-gray-850 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-96">
           <div className="flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-purple-500" />
              <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200">近7日数据采集量</h3>
           </div>
           
           {stats.trends.length > 0 ? (
             <div className="w-full h-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={stats.trends}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                   <XAxis 
                      dataKey="date" 
                      tick={{fontSize: 12, fill: '#9ca3af'}} 
                      axisLine={false} 
                      tickLine={false} 
                      dy={10} 
                      tickFormatter={(val: any) => val && typeof val === 'string' ? val.substring(5) : val} 
                   />
                   <YAxis tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                   <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                   />
                   <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} name="入库数量" />
                 </BarChart>
               </ResponsiveContainer>
             </div>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <BarChart3 className="w-12 h-12 mb-2 opacity-20" />
                <span>暂无采集记录</span>
                <span className="text-xs mt-1 text-gray-300">数据将依据入库时间统计</span>
             </div>
           )}
        </div>

        {/* Pie Chart */}
        <div className="bg-white dark:bg-gray-850 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-96">
           <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-6">新闻来源分布 (Top 5)</h3>
           {stats.sources.length > 0 ? (
             <div className="w-full h-full flex flex-col">
               <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.sources}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.sources.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none'}} />
                  </PieChart>
                </ResponsiveContainer>
               </div>
               <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
                  {stats.sources.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                      <span>{entry.name} ({entry.value})</span>
                    </div>
                  ))}
               </div>
             </div>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <PieChartIcon className="w-12 h-12 mb-2 opacity-20" />
                <span>暂无来源数据</span>
             </div>
           )}
        </div>

      </div>
    </div>
  );
};