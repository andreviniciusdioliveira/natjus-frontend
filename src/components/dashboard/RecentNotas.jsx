import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, ExternalLink, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function RecentNotas({ notas, isLoading }) {
  const typeColors = {
    "processual": "bg-emerald-100 text-emerald-800 border-emerald-200",
    "pre-processual": "bg-amber-100 text-amber-800 border-amber-200"
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Notas Recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="p-4 border rounded-lg">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <FileText className="w-5 h-5 text-blue-600" />
          Notas Recentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {notas.slice(0, 5).map((nota, index) => (
          <motion.div
            key={nota.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-all duration-200"
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
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
                
                <h4 className="font-semibold text-slate-900 line-clamp-2">
                  {nota.titulo}
                </h4>
                
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
                  </div>
                )}
              </div>
              
              {nota.arquivo_url && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(nota.arquivo_url, '_blank')}
                  className="text-xs hover:bg-blue-50 hover:border-blue-200"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Ver
                </Button>
              )}
            </div>
          </motion.div>
        ))}
        
        {notas.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma nota técnica encontrada</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}