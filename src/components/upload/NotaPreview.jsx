import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Plus, X } from "lucide-react";
import { motion } from "framer-motion";

export default function NotaPreview({ notaData, onSave, onCancel }) {
  const [editedData, setEditedData] = useState(notaData);
  const [newTag, setNewTag] = useState("");

  const handleInputChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !editedData.tags?.includes(newTag.trim())) {
      setEditedData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove) => {
    setEditedData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-slate-900">
            <span>Revisão da Nota Técnica</span>
            <Badge variant="outline" className="text-sm">
              {editedData.tipo === "processual" ? "Processual" : "Pré-Processual"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="numero">Número</Label>
              <Input
                id="numero"
                value={editedData.numero || ''}
                onChange={(e) => handleInputChange('numero', e.target.value)}
                placeholder="Ex: 01000/2020"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select
                value={editedData.tipo || ''}
                onValueChange={(value) => handleInputChange('tipo', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="processual">Processual</SelectItem>
                  <SelectItem value="pre-processual">Pré-Processual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              value={editedData.titulo || ''}
              onChange={(e) => handleInputChange('titulo', e.target.value)}
              placeholder="Título da nota técnica"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="data_emissao">Data de Emissão</Label>
              <Input
                id="data_emissao"
                type="date"
                value={editedData.data_emissao || ''}
                onChange={(e) => handleInputChange('data_emissao', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="demanda">Demanda</Label>
              <Input
                id="demanda"
                value={editedData.demanda || ''}
                onChange={(e) => handleInputChange('demanda', e.target.value)}
                placeholder="Ex: Ofício nº 06/2020"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="procedimento">Procedimento</Label>
            <Input
              id="procedimento"
              value={editedData.procedimento || ''}
              onChange={(e) => handleInputChange('procedimento', e.target.value)}
              placeholder="Procedimento ou assunto tratado"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="representante_comarca">Representante/Comarca</Label>
            <Input
              id="representante_comarca"
              value={editedData.representante_comarca || ''}
              onChange={(e) => handleInputChange('representante_comarca', e.target.value)}
              placeholder="Ex: Ministério Público Estadual de Palmas"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resumo">Resumo</Label>
            <Textarea
              id="resumo"
              value={editedData.resumo || ''}
              onChange={(e) => handleInputChange('resumo', e.target.value)}
              placeholder="Resumo do conteúdo da nota técnica"
              className="h-24"
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Digite uma tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1"
              />
              <Button onClick={addTag} size="sm" type="button">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {editedData.tags?.map(tag => (
                <Badge key={tag} variant="outline" className="bg-blue-50 text-blue-700">
                  {tag}
                  <X
                    className="w-3 h-3 ml-1 cursor-pointer"
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Cancelar
            </Button>
            <Button
              onClick={() => onSave(editedData)}
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Salvar Nota
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}