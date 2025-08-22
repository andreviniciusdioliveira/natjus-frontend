import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Filter, Tag, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

export default function SearchFilters({ 
  selectedTipo, 
  onTipoChange, 
  allTags, 
  selectedTags, 
  onTagSelect, 
  onTagRemove, 
  onClearFilters 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <Select value={selectedTipo} onValueChange={onTipoChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="processual">Processual</SelectItem>
                  <SelectItem value="pre-processual">Pré-Processual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-slate-500" />
              <Select onValueChange={onTagSelect}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tags" />
                </SelectTrigger>
                <SelectContent>
                  {allTags.map(tag => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(selectedTags.length > 0 || selectedTipo !== "todos") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-slate-500 hover:text-slate-700"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>

          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedTags.map(tag => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200 cursor-pointer hover:bg-blue-100"
                  onClick={() => onTagRemove(tag)}
                >
                  {tag} ×
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}