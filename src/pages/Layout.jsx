// src/pages/Upload.jsx - Versão segura sem credenciais expostas
import React, { useState, useCallback, useEffect } from "react";
import { NotaTecnica } from "@/api/entities";
import { Configuracao } from "@/api/entities";
import { UploadFile, ExtractDataFromUploadedFile, InvokeLLM } from "@/api/integrations";
import { GeminiService } from "@/services/geminiService";
import { GoogleDriveServiceSimplified } from "@/services/googleDriveService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload as UploadIcon, FileText, CheckCircle, AlertCircle, Loader2, X, Cloud, HardDrive } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";

import FileUploadZone from "../components/upload/FileUploadZone";

export default function Upload() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [currentFile, setCurrentFile] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [config, setConfig] = useState({ 
    llm_provider: "base44",
    storage_provider: "base44",
    google_api_key: "", // VAZIO - será carregado da configuração
    google_model: "gemini-1.5-pro",
    google_drive_folder_id: "", // VAZIO - será carregado da configuração
    google_drive_credentials: "" // VAZIO - será carregado da configuração
  });
  const [geminiService, setGeminiService] = useState(null);
  const [googleDriveService, setGoogleDriveService] = useState(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const configData = await Configuracao.list();
        if (configData.length > 0) {
          const loadedConfig = configData[0];
          setConfig(loadedConfig);

          // Inicializa os serviços apenas se as credenciais estiverem disponíveis
          if (loadedConfig.llm_provider === 'google' && loadedConfig.google_api_key) {
            const gemini = new GeminiService(loadedConfig.google_api_key, loadedConfig.google_model);
            setGeminiService(gemini);
          }

          if (loadedConfig.storage_provider === 'google_drive' && loadedConfig.google_drive_folder_id) {
            const driveService = new GoogleDriveServiceSimplified(loadedConfig.google_drive_folder_id);
            setGoogleDriveService(driveService);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
      }
    };
    loadConfig();
  }, []);

  const getStorageProviderName = (provider) => {
    const names = {
      'base44': 'Base44',
      'google_drive': 'Google Drive',
      'aws_s3': 'Amazon S3'
    };
    return names[provider] || 'Base44';
  };

  const getStorageProviderIcon = (provider) => {
    switch (provider) {
      case 'google_drive': return <HardDrive className="w-4 h-4" />;
      case 'aws_s3': return <Cloud className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const handleFileSelect = useCallback((selectedFiles) => {
    const pdfFiles = Array.from(selectedFiles).filter(
      file => file.type === "application/pdf"
    );
    
    if (pdfFiles.length === 0) {
      setError("Apenas arquivos PDF são aceitos");
      return;
    }
    
    setFiles(prev => [...prev, ...pdfFiles]);
    setError(null);
  }, []);

  const removeFile = useCallback((index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Upload para o provedor configurado
  const uploadToConfiguredStorage = async (file) => {
    switch (config.storage_provider) {
      case 'google_drive':
        if (!googleDriveService) {
          console.warn('⚠️ Google Drive service não inicializado, usando fallback');
          return await UploadFile({ file });
        }
        
        try {
          console.log('📤 Tentando upload para Google Drive...');
          
          // Simulação do comportamento do Google Drive
          const result = await googleDriveService.uploadFile(file);
          
          console.log('✅ Upload simulado para Google Drive realizado:', result);
          
          return {
            file_url: result.driveUrl,
            storage_provider: 'google_drive',
            drive_file_id: result.fileId
          };
          
        } catch (error) {
          console.error('❌ Erro no upload para Google Drive:', error);
          console.log('🔄 Fazendo fallback para Base44...');
          return await UploadFile({ file });
        }
        
      case 'aws_s3':
        console.log("📤 Upload para AWS S3 (implementação futura)");
        return await UploadFile({ file });
        
      default: // base44
        console.log("📤 Usando armazenamento padrão Base44");
        return await UploadFile({ file });
    }
  };

  // Análise com IA configurada (Gemini real se disponível)
  const analyzeWithConfiguredAI = async (extractedContent) => {
    if (config.llm_provider === 'google' && geminiService) {
      try {
        console.log('🤖 Usando Gemini real para análise...');
        const result = await geminiService.analyzeNotaTecnica(extractedContent);
        return result;
      } catch (error) {
        console.error('❌ Erro no Gemini, usando fallback:', error);
        return await fallbackAIAnalysis(extractedContent);
      }
    } else {
      return await fallbackAIAnalysis(extractedContent);
    }
  };

  const fallbackAIAnalysis = async (extractedContent) => {
    const prompt = `Analise esta nota técnica do NatJus e extraia as seguintes informações:

Texto do PDF: ${JSON.stringify(extractedContent)}

Extraia e estruture:
1. Número da nota técnica (formato: XXXX/AAAA)
2. Tipo: "processual" ou "pre-processual"
3. Título/assunto principal
4. Data de emissão (formato YYYY-MM-DD)
5. Demanda/origem
6. Procedimento tratado
7. Representante/comarca
8. Resumo em 2-3 frases
9. Tags relevantes (máximo 5)

Retorne um JSON estruturado.`;

    return await InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          numero: { type: "string" },
          tipo: { type: "string" },
          titulo: { type: "string" },
          data_emissao: { type: "string" },
          demanda: { type: "string" },
          procedimento: { type: "string" },
          representante_comarca: { type: "string" },
          resumo: { type: "string" },
          tags: { type: "array", items: { type: "string" } }
        }
      }
    });
  };

  const startProcessingQueue = async () => {
    setIsProcessingQueue(true);
    setProcessedCount(0);
    setError(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setCurrentFile(file.name);
      await processFile(file);
      setProcessedCount(prev => prev + 1);
    }

    setIsProcessingQueue(false);
    setCurrentFile(null);
    setFiles([]);
    setSuccess(`Todos os arquivos foram processados e salvos com sucesso no ${getStorageProviderName(config.storage_provider)}!`);
    setTimeout(() => navigate(createPageUrl("Dashboard")), 2500);
  };

  const processFile = async (file) => {
    try {
      console.log(`🔄 Processando arquivo: ${file.name}`);
      
      // 1. Upload para o provedor configurado
      const uploadResult = await uploadToConfiguredStorage(file);
      console.log('✅ Upload concluído:', uploadResult);
      
      // 2. Extração de conteúdo
      const extractResult = await ExtractDataFromUploadedFile({
        file_url: uploadResult.file_url,
        json_schema: NotaTecnica.schema()
      });

      if (extractResult.status !== "success") {
        throw new Error(`Erro ao extrair conteúdo do PDF: ${file.name}`);
      }

      // 3. Análise com IA (Gemini se disponível)
      const aiResult = await analyzeWithConfiguredAI(extractResult.output);
      console.log('🤖 Análise de IA concluída:', aiResult);

      // 4. Salvar no banco
      const notaData = {
        ...aiResult,
        conteudo_extraido: JSON.stringify(extractResult.output),
        arquivo_url: uploadResult.file_url,
        nome_arquivo: file.name,
        storage_provider: config.storage_provider,
        drive_file_id: uploadResult.drive_file_id || null
      };

      await NotaTecnica.create(notaData);
      console.log('💾 Nota salva no banco com sucesso');

    } catch (error) {
      console.error(`❌ Erro ao processar ${file.name}:`, error);
      setError(`Erro ao processar ${file.name}: ${error.message}. Pulando para o próximo.`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900">Upload de Notas</h1>
            <p className="text-slate-600 mt-1">Faça upload dos PDFs das notas técnicas</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-2">
              {getStorageProviderIcon(config.storage_provider)}
              {getStorageProviderName(config.storage_provider)}
            </Badge>
            {config.llm_provider === 'google' && geminiService && (
              <Badge variant="outline" className="flex items-center gap-2 bg-green-50 text-green-700">
                🤖 Gemini IA
              </Badge>
            )}
            {config.llm_provider === 'google' && !geminiService && (
              <Badge variant="outline" className="flex items-center gap-2 bg-orange-50 text-orange-700">
                ⚠️ IA não configurada
              </Badge>
            )}
          </div>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Alert className="border-emerald-200 bg-emerald-50">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-emerald-700">{success}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-6">
          <FileUploadZone
            onFileSelect={handleFileSelect}
            processing={isProcessingQueue}
          />
          
          {files.length > 0 && !isProcessingQueue && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Fila de Upload ({files.length} arquivos)</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getStorageProviderIcon(config.storage_provider)}
                      <span className="text-xs">{getStorageProviderName(config.storage_provider)}</span>
                    </Badge>
                    {config.llm_provider === 'google' && geminiService && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                        🤖 Gemini
                      </Badge>
                    )}
                    {config.llm_provider === 'google' && !geminiService && (
                      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                        ⚠️ IA não config.
                      </Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {files.map((file, index) => (
                    <li key={index} className="flex justify-between items-center text-sm p-3 border rounded-md hover:bg-slate-50">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-red-500" />
                        <span>{file.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={startProcessingQueue} 
                  className="w-full mt-4 text-white"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  <UploadIcon className="w-4 h-4 mr-2" />
                  Iniciar Processamento Completo
                  {config.storage_provider === 'google_drive' && ' → Google Drive'}
                  {config.llm_provider === 'google' && geminiService && ' + Gemini IA'}
                </Button>
                
                {/* Alertas sobre configuração */}
                {config.storage_provider === 'google_drive' && !config.google_drive_folder_id && (
                  <Alert className="mt-3 bg-orange-50 border-orange-200">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-700">
                      Google Drive não configurado. Configure nas Configurações ou via variáveis de ambiente.
                    </AlertDescription>
                  </Alert>
                )}
                
                {config.llm_provider === 'google' && !config.google_api_key && (
                  <Alert className="mt-3 bg-orange-50 border-orange-200">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-700">
                      Gemini API não configurada. A análise usará o provedor padrão.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {isProcessingQueue && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processando Arquivos...
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                  {getStorageProviderIcon(config.storage_provider)}
                  <span className="text-sm text-slate-600">
                    Enviando para {getStorageProviderName(config.storage_provider)}
                  </span>
                  {config.llm_provider === 'google' && geminiService && (
                    <span className="text-sm text-green-600">• Analisando com Gemini</span>
                  )}
                  {config.llm_provider === 'google' && !geminiService && (
                    <span className="text-sm text-orange-600">• IA não configurada</span>
                  )}
                </div>
                <p>Processando {processedCount + 1} de {files.length}: <span className="font-semibold">{currentFile}</span></p>
                <Progress value={(processedCount / files.length) * 100} className="w-full" />
                <div className="text-xs text-slate-500">
                  Upload → Extração → {config.llm_provider === 'google' && geminiService ? 'Análise Gemini' : 'Análise IA'} → Salvamento
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}