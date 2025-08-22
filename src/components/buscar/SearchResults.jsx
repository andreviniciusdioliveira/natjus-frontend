import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, ExternalLink, Calendar, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function SearchResults({ notas, isLoading, searchTerm }) {
  const typeColors = {
    "processual": "bg-emerald-100 text-emerald-800 border-emerald-200",
    "pre-processual": "bg-amber-100 text-amber-800 border-amber-200"
  };

  const highlightText = (text, term) => {
    if (!term || !text) return text;
    
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(5).fill(0).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (notas.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            Nenhuma nota encontrada
          </h3>
          <p className="text-slate-500">
            Tente ajustar os termos de busca ou filtros
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-slate-600">
          <span className="font-semibold">{notas.length}</span> notas encontradas
        </p>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {notas.map((nota, index) => (
            <motion.div
              key={nota.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-all duration-200 border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant="outline" className="text-xs font-mono">
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
                      
                      <h3 className="font-semibold text-lg text-slate-900 leading-tight">
                        {highlightText(nota.titulo, searchTerm)}
                      </h3>
                      
                      {nota.procedimento && (
                        <p className="text-sm text-slate-600">
                          <strong>Procedimento:</strong> {highlightText(nota.procedimento, searchTerm)}
                        </p>
                      )}
                      
                      {nota.resumo && (
                        <p className="text-sm text-slate-600 line-clamp-3">
                          {highlightText(nota.resumo, searchTerm)}
                        </p>
                      )}
                      
                      {nota.representante_comarca && (
                        <p className="text-xs text-slate-500">
                          <strong>Representante:</strong> {nota.representante_comarca}
                        </p>
                      )}
                      
                      {nota.tags && nota.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {nota.tags.slice(0, 5).map(tag => (
                            <Badge 
                              key={tag} 
                              variant="outline" 
                              className="text-xs bg-blue-50 text-blue-600 border-blue-200"
                            >
                              #{tag}
                            </Badge>
                          ))}
                          {nota.tags.length > 5 && (
                            <Badge 
                              variant="outline" 
                              className="text-xs bg-slate-100 text-slate-500"
                            >
                              +{nota.tags.length - 5} mais
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
                          className="hover:bg-blue-50 hover:border-blue-200"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Ver PDF
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}