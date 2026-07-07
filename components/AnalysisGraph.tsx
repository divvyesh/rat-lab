import React from 'react';
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend
} from 'recharts';
import { Download } from 'lucide-react';
import { GraphSpec } from '../types';
import { parseGraphSpec, toRechartsFormat } from '../utils/graphSpecParser';

interface AnalysisGraphProps {
  spec: GraphSpec;
  onExport?: () => void;
}

const AnalysisGraph: React.FC<AnalysisGraphProps> = ({ spec, onExport }) => {
  const parsed = parseGraphSpec(spec);
  
  if (!parsed.isValid) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
        <p className="text-sm text-red-400 font-bold mb-2">Graph Error</p>
        <ul className="text-xs text-red-300 space-y-1">
          {parsed.errors?.map((error, idx) => (
            <li key={idx}>• {error}</li>
          ))}
        </ul>
      </div>
    );
  }
  
  const rechartsData = toRechartsFormat(parsed);
  const colors = parsed.config.colors || ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
  
  const renderChart = () => {
    switch (parsed.type) {
      case 'bar':
        return (
          <BarChart data={rechartsData.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" />
            <XAxis 
              dataKey="name" 
              stroke="#666" 
              tick={{ fill: '#999', fontSize: 12 }}
            />
            <YAxis 
              stroke="#666" 
              tick={{ fill: '#999', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                background: '#18181b', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '12px' 
              }}
            />
            {parsed.config.showLegend && <Legend />}
            <Bar dataKey="value" fill={colors[0]} radius={[8, 8, 0, 0]} />
          </BarChart>
        );
      
      case 'line':
        return (
          <LineChart data={rechartsData.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" />
            <XAxis 
              dataKey="name" 
              stroke="#666" 
              tick={{ fill: '#999', fontSize: 12 }}
            />
            <YAxis 
              stroke="#666" 
              tick={{ fill: '#999', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                background: '#18181b', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '12px' 
              }}
            />
            {parsed.config.showLegend && <Legend />}
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={colors[0]} 
              strokeWidth={2}
              dot={{ fill: colors[0], r: 4 }}
            />
          </LineChart>
        );
      
      case 'scatter':
        return (
          <ScatterChart data={rechartsData.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" />
            <XAxis 
              type="number"
              dataKey="x" 
              name={parsed.config.xAxis || 'X'}
              stroke="#666" 
              tick={{ fill: '#999', fontSize: 12 }}
            />
            <YAxis 
              type="number"
              dataKey="y" 
              name={parsed.config.yAxis || 'Y'}
              stroke="#666" 
              tick={{ fill: '#999', fontSize: 12 }}
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ 
                background: '#18181b', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '12px' 
              }}
            />
            <Scatter dataKey="y" fill={colors[0]} />
          </ScatterChart>
        );
      
      case 'pie':
        return (
          <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <Pie
              data={rechartsData.data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {rechartsData.data.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                background: '#18181b', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '12px' 
              }}
            />
            {parsed.config.showLegend && <Legend />}
          </PieChart>
        );
      
      case 'radar':
        return (
          <RadarChart data={rechartsData.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <PolarGrid stroke="#222" />
            <PolarAngleAxis 
              dataKey="name" 
              tick={{ fill: '#999', fontSize: 12 }}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]} 
              tick={{ fill: '#666', fontSize: 10 }}
            />
            <Radar
              name="Value"
              dataKey="value"
              stroke={colors[0]}
              fill={colors[0]}
              fillOpacity={0.4}
              strokeWidth={2}
            />
            <Tooltip 
              contentStyle={{ 
                background: '#18181b', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '12px' 
              }}
            />
            {parsed.config.showLegend && <Legend />}
          </RadarChart>
        );
      
      default:
        return (
          <div className="flex items-center justify-center h-64 text-zinc-500">
            <p>Unsupported chart type: {parsed.type}</p>
          </div>
        );
    }
  };
  
  return (
    <div className="bg-zinc-950/60 border border-white/5 rounded-xl p-6 hover:border-indigo-500/20 transition-all">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">{parsed.title}</h3>
        {onExport && (
          <button
            onClick={onExport}
            className="p-2 bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 rounded-lg transition-all"
            title="Export graph"
          >
            <Download size={16} className="text-zinc-400" />
          </button>
        )}
      </div>
      
      <div style={{ width: '100%', height: parsed.config.height || 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
      
      {(parsed.config.xAxis || parsed.config.yAxis) && (
        <div className="mt-4 pt-4 border-t border-white/5 flex gap-4 text-xs text-zinc-500">
          {parsed.config.xAxis && (
            <span>X-Axis: {parsed.config.xAxis}</span>
          )}
          {parsed.config.yAxis && (
            <span>Y-Axis: {parsed.config.yAxis}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalysisGraph;

