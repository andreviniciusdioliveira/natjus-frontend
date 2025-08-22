import React, { useState, useEffect } from "react";
import { NotaTecnica } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Library, Search, Filter, Calendar, Download, ExternalLink, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Biblioteca() {
  const [notas, setNotas] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("data_emissao");
  const [filterTipo, setFilterTipo] = useState("todos");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotas();
  }, [sortBy]);

  const loadNotas = async () => {
    setIsLoading(true);
    try {
      const orderField = sortBy === "data_emissao" ? "-data_emissao" : sortBy;
      const data = await NotaTecnica.list(orderField);
      setNotas(data);
    } catch (error) {
      console.error("Erro ao carregar notas:", error);
    }
    setIsLoading(false);
  };

  const filteredNotas = notas.filter(nota => {
    const searchMatch = !searchTerm ||
      nota.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nota.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nota.procedimento?.toLowerCase().includes(searchTerm.toLowerCase());

    const tipoMatch = filterTipo === "todos" || nota.tipo === filterTipo;

    return searchMatch && tipoMatch;
  });

  const typeColors = {
    "processual": "bg-emerald-100 text-emerald-800 border-emerald-200",
    "pre-processual": "bg-amber-100 text-amber-800 border-amber-200"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Library className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Biblioteca</h1>
              <p className="text-slate-600">Todas as notas técnicas organizadas</p>
            </div>
          </div>
          <div className="text-sm text-slate-500 bg-white px-3 py-2 rounded-lg">
            {filteredNotas.length} notas encontradas
          </div>
        </motion.div>

        {/* Filters */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar notas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="processual">Processual</SelectItem>
                  <SelectItem value="pre-processual">Pré-Processual</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="data_emissao">Data (mais recente)</SelectItem>
                  <SelectItem value="numero">Número</SelectItem>
                  <SelectItem value="titulo">Título</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notes Grid */}
        <div className="grid gap-4">
          <AnimatePresence>
            {isLoading ? (
              Array(6).fill(0).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                        <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                      </div>
                      <div className="h-6 w-20 bg-slate-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              filteredNotas.map((nota, index) => (
                <motion.div
                  key={nota.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-200 border-0 bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-xs">
                              {nota.numero}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${typeColors[nota.tipo]}`}
                            >
                              {nota.tipo === "processual" ? "Processual" : "Pré-Processual"}
                            </Badge>
                            {nota.data_emissao && (
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(nota.data_emissao), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            )}
                          </div>
                          
                          <h3 className="font-semibold text-slate-900 leading-tight">
                            {nota.titulo}
                          </h3>
                          
                          {nota.procedimento && (
                            <p className="text-sm text-slate-600">
                              <strong>Procedimento:</strong> {nota.procedimento}
                            </p>
                          )}
                          
                          {nota.resumo && (
                            <p className="text-sm text-slate-600 line-clamp-2">
                              {nota.resumo}
                            </p>
                          )}
                          
                          {nota.tags && nota.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {nota.tags.slice(0, 3).map(tag => (
                                <Badge 
                                  key={tag} 
                                  variant="outline" 
                                  className="text-xs bg-blue-50 text-blue-600 border-blue-200"
                                >
                                  {tag}
                                </Badge>
                              ))}
                              {nota.tags.length > 3 && (
                                <Badge 
                                  variant="outline" 
                                  className="text-xs bg-slate-100 text-slate-500"
                                >
                                  +{nota.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          {nota.arquivo_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(nota.arquivo_url, '_blank')}
                              className="text-xs"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Ver PDF
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {!isLoading && filteredNotas.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                Nenhuma nota encontrada
              </h3>
              <p className="text-slate-500">
                Tente ajustar os filtros ou termos de busca
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}