import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, X, Play, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProcessingQueue({ 
  files, 
  onRemoveFile, 
  onProcessFile, 
  processing, 
  progress 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <FileText className="w-5 h-5 text-blue-600" />
            Fila de Processamento ({files.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <AnimatePresence>
            {files.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-between p-3 border border-slate-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-red-500" />
                  <div>
                    <p className="font-medium text-slate-900">{file.name}</p>
                    <p className="text-sm text-slate-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {index === 0 && processing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-32">
                        <Progress value={progress} className="h-2" />
                      </div>
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    </div>
                  ) : (
                    <>
                      {index === 0 && !processing && (
                        <Button
                          size="sm"
                          onClick={() => onProcessFile(file, index)}
                          className="bg-blue-600 hover:bg-blue-700 text-xs"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Processar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRemoveFile(index)}
                        disabled={processing && index === 0}
                        className="text-slate-400 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}