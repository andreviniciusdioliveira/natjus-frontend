import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { BarChart3 } from "lucide-react";

export default function TiposChart({ processuais, preProcessuais, isLoading }) {
  const data = [
    { name: 'Processuais', value: processuais, color: '#10b981' },
    { name: 'Pré-Processuais', value: preProcessuais, color: '#f59e0b' }
  ];

  const total = processuais + preProcessuais;

  if (isLoading) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Distribuição por Tipo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <Skeleton className="h-64 w-64 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (total === 0) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Distribuição por Tipo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum dado disponível</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          Distribuição por Tipo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 space-y-2">
          {data.map(item => (
            <div key={item.name} className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-slate-600">{item.name}</span>
              </div>
              <span className="font-semibold text-slate-900">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}