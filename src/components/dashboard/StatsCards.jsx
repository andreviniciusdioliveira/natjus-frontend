import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function StatsCards({ title, value, icon: Icon, bgColor, isLoading }) {
  if (isLoading) {
    return (
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-12 w-12 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="relative overflow-hidden bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-200">
        <div className={`absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 bg-gradient-to-br ${bgColor} rounded-full opacity-10`} />
        <CardContent className="p-6 relative">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
              <p className="text-3xl font-bold text-slate-900">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
            </div>
            <div className={`p-3 rounded-xl bg-gradient-to-br ${bgColor} shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}