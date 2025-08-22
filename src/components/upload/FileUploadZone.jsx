import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function FileUploadZone({ onFileSelect, processing }) {
  const handleFileInput = (e) => {
    onFileSelect(e.target.files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    onFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-2 border-dashed border-slate-300 hover:border-blue-400 transition-colors bg-white/50 backdrop-blur-sm">
        <CardContent className="p-12">
          <div
            className="text-center space-y-4"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              {processing ? (
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              ) : (
                <Upload className="w-8 h-8 text-blue-600" />
              )}
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {processing ? "Processando..." : "Upload de Notas Técnicas"}
              </h3>
              <p className="text-slate-600 mb-4">
                Arraste arquivos PDF aqui ou clique para selecionar
              </p>
            </div>
            
            <div>
              <input
                type="file"
                multiple
                accept=".pdf"
                onChange={handleFileInput}
                className="hidden"
                id="file-input"
                disabled={processing}
              />
              <Button
                onClick={() => document.getElementById('file-input')?.click()}
                disabled={processing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <FileText className="w-4 h-4 mr-2" />
                Selecionar Arquivos PDF
              </Button>
            </div>
            
            <p className="text-sm text-slate-500">
              Apenas arquivos PDF são aceitos
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}