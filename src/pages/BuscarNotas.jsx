
import React, { useState, useEffect, useMemo } from "react";
import { NotaTecnica } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, Calendar, Hash, FileText, ExternalLink, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import SearchFilters from "../components/buscar/SearchFilters";
import SearchResults from "../components/buscar/SearchResults";

export default function BuscarNotas() {
  const [notas, setNotas] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTipo, setSelectedTipo] = useState("todos");
  const [selectedTags, setSelectedTags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [allTags, setAllTags] = useState([]);

  useEffect(() => {
    loadNotas();
  }, []);

  const loadNotas = async () => {
    setIsLoading(true);
    try {
      const data = await NotaTecnica.list("-data_emissao");
      setNotas(data);
      extractTags(data);
    } catch (error) {
      console.error("Erro ao carregar notas:", error);
    }
    setIsLoading(false);
  };

  const extractTags = (notasData) => {
    const tags = new Set();
    notasData.forEach(nota => {
      if (nota.tags) {
        nota.tags.forEach(tag => tags.add(tag));
      }
    });
    setAllTags(Array.from(tags).sort());
  };

  const filteredNotas = useMemo(() => {
    return notas.filter(nota => {
      // Filtro por termo de busca
      const searchMatch = !searchTerm || 
        nota.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nota.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nota.procedimento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nota.conteudo_extraido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nota.resumo?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por tipo
      const tipoMatch = selectedTipo === "todos" || nota.tipo === selectedTipo;

      // Filtro por tags
      const tagsMatch = selectedTags.length === 0 || 
        (nota.tags && selectedTags.some(tag => nota.tags.includes(tag)));

      return searchMatch && tipoMatch && tagsMatch;
    });
  }, [notas, searchTerm, selectedTipo, selectedTags]);

  const handleTagSelect = (tag) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleTagRemove = (tag) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedTipo("todos");
    setSelectedTags([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
            Buscar Notas Técnicas
          </h1>
          <p className="text-slate-600 text-lg">
            Pesquise por conteúdo, número, procedimento ou tags
          </p>
        </motion.div>

        {/* Search Bar */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Digite para buscar no conteúdo das notas técnicas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 text-lg border-slate-300 focus:border-blue-500 transition-colors"
              />
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <SearchFilters
          selectedTipo={selectedTipo}
          onTipoChange={setSelectedTipo}
          allTags={allTags}
          selectedTags={selectedTags}
          onTagSelect={handleTagSelect}
          onTagRemove={handleTagRemove}
          onClearFilters={clearFilters}
        />

        {/* Active Filters */}
        <AnimatePresence>
          {(selectedTags.length > 0 || selectedTipo !== "todos" || searchTerm) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2"
            >
              {searchTerm && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Search className="w-3 h-3 mr-1" />
                  "{searchTerm}"
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => setSearchTerm("")}
                  />
                </Badge>
              )}
              {selectedTipo !== "todos" && (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  <Filter className="w-3 h-3 mr-1" />
                  {selectedTipo}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => setSelectedTipo("todos")}
                  />
                </Badge>
              )}
              {selectedTags.map(tag => (
                <Badge 
                  key={tag} 
                  variant="outline" 
                  className="bg-purple-50 text-purple-700 border-purple-200"
                >
                  <Hash className="w-3 h-3 mr-1" />
                  {tag}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => handleTagRemove(tag)}
                  />
                </Badge>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <SearchResults
          notas={filteredNotas}
          isLoading={isLoading}
          searchTerm={searchTerm}
        />
      </div>
    </div>
  );
}
