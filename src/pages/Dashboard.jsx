
import React, { useState, useEffect } from "react";
import { NotaTecnica } from "@/api/entities";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Search, Upload, TrendingUp, Calendar, Hash, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

import StatsCards from "../components/dashboard/StatsCards";
import RecentNotas from "../components/dashboard/RecentNotas";
import TiposChart from "../components/dashboard/TiposChart";
import SearchQuick from "../components/dashboard/SearchQuick";

export default function Dashboard() {
  const [notas, setNotas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    processuais: 0,
    preProcessuais: 0,
    thisMonth: 0
  });

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (e) {
        setUser(null);
        console.error("Erro ao carregar usuário:", e);
      }
      
      try {
        const data = await NotaTecnica.list("-data_emissao", 100);
        setNotas(data);
        calculateStats(data);
      } catch (error) {
        console.error("Erro ao carregar notas:", error);
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  const calculateStats = (notasData) => {
    const total = notasData.length;
    const processuais = notasData.filter(nota => nota.tipo === "processual").length;
    const preProcessuais = notasData.filter(nota => nota.tipo === "pre-processual").length;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const thisMonth = notasData.filter(nota => {
      const notaDate = new Date(nota.data_emissao);
      return notaDate.getMonth() === currentMonth && notaDate.getFullYear() === currentYear;
    }).length;

    setStats({ total, processuais, preProcessuais, thisMonth });
  };

  return (
    <div className="p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
              Dashboard NatJus
            </h1>
            <p className="text-slate-600 text-lg">
              Sistema de Gestão de Notas Técnicas do Tocantins
            </p>
          </div>
          {user && (
            <div className="flex gap-3 w-full lg:w-auto">
              <Link to={createPageUrl("Upload")} className="flex-1 lg:flex-none">
                <Button className="w-full bg-[var(--primary)] hover:opacity-90 text-white shadow-lg">
                  <Upload className="w-4 h-4 mr-2" />
                  Nova Nota
                </Button>
              </Link>
              <Link to={createPageUrl("BuscarNotas")} className="flex-1 lg:flex-none">
                <Button variant="outline" className="w-full border-slate-300 hover:bg-slate-50">
                  <Search className="w-4 h-4 mr-2" />
                  Buscar
                </Button>
              </Link>
            </div>
          )}
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCards
            title="Total de Notas"
            value={stats.total}
            icon={FileText}
            bgColor="bg-[var(--primary)]"
            isLoading={isLoading}
          />
          <StatsCards
            title="Processuais"
            value={stats.processuais}
            icon={Hash}
            bgColor="from-emerald-500 to-emerald-600"
            isLoading={isLoading}
          />
          <StatsCards
            title="Pré-Processuais"
            value={stats.preProcessuais}
            icon={Filter}
            bgColor="from-amber-500 to-amber-600"
            isLoading={isLoading}
          />
          <StatsCards
            title="Este Mês"
            value={stats.thisMonth}
            icon={Calendar}
            bgColor="from-purple-500 to-purple-600"
            isLoading={isLoading}
          />
        </div>

        {/* Search Quick */}
        <SearchQuick />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Notes */}
          <div className="lg:col-span-2">
            <RecentNotas
              notas={notas}
              isLoading={isLoading}
            />
          </div>

          {/* Chart */}
          <div>
            <TiposChart
              processuais={stats.processuais}
              preProcessuais={stats.preProcessuais}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
