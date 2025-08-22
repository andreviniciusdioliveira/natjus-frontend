// src/pages/Chat.jsx - Versão segura sem credenciais expostas
import React, { useState, useEffect, useRef } from "react";
import { InvokeLLM } from "@/api/integrations";
import { NotaTecnica } from "@/api/entities";
import { Configuracao } from "@/api/entities";
import { GeminiService } from "@/services/geminiService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, User, Send, Loader2, FileText, ExternalLink, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [notasContext, setNotasContext] = useState("");
  const [config, setConfig] = useState({ 
    llm_provider: "base44",
    google_api_key: "", // VAZIO - será carregado da configuração ou variável de ambiente
    google_model: "gemini-1.5-pro",
    chat_greeting: "Olá! Sou a assistente de IA do NatJus. Faça perguntas sobre as notas técnicas e eu buscarei as informações para você."
  });
  const [geminiService, setGeminiService] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Carrega configurações do banco
        const configData = await Configuracao.list();
        if (configData.length > 0) {
          const loadedConfig = configData[0];
          setConfig(loadedConfig);

          // Inicializa o serviço Gemini se for o provedor selecionado e tiver chave
          if (loadedConfig.llm_provider === 'google' && loadedConfig.google_api_key) {
            const gemini = new GeminiService(loadedConfig.google_api_key, loadedConfig.google_model);
            setGeminiService(gemini);
          }
        }

        // Carrega notas com informações completas, incluindo URLs
        const notas = await NotaTecnica.list("-data_emissao", 100);
        const context = notas.map(n => `
          Nota Número: ${n.numero}
          Título: ${n.titulo}
          Tipo: ${n.tipo}
          Data: ${n.data_emissao}
          Demanda: ${n.demanda || 'N/A'}
          Procedimento: ${n.procedimento || 'N/A'}
          Representante: ${n.representante_comarca || 'N/A'}
          Resumo: ${n.resumo || 'N/A'}
          Tags: ${n.tags ? n.tags.join(', ') : 'N/A'}
          URL_DO_PDF: ${n.arquivo_url}
          Nome_do_Arquivo: ${n.nome_arquivo}
        `).join("\n---\n");
        setNotasContext(context);
        
        setMessages([{
          sender: 'ai',
          text: config.chat_greeting || `Olá! Sou a assistente de IA do NatJus (${getProviderName(config.llm_provider || 'base44')}). Faça perguntas sobre as notas técnicas e eu buscarei as informações para você.`
        }]);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        setError("Erro ao carregar configurações. Verifique sua conexão.");
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getProviderName = (provider) => {
    const names = {
      'base44': 'Base44',
      'openai': 'ChatGPT',
      'anthropic': 'Claude',
      'google': 'Gemini'
    };
    return names[provider] || 'Base44';
  };

  // Chama a API real do Gemini
  const callGeminiAPI = async (prompt) => {
    if (!geminiService) {
      throw new Error('Serviço Gemini não inicializado. Verifique se a chave API está configurada.');
    }

    try {
      console.log('🤖 Usando Gemini API real...');
      const response = await geminiService.chatResponse(input, notasContext);
      return response;
    } catch (error) {
      console.error('❌ Erro na API do Gemini:', error);
      // Fallback para Base44 em caso de erro
      console.log('🔄 Fazendo fallback para Base44...');
      return await InvokeLLM({ prompt });
    }
  };

  const callCustomLLM = async (prompt, provider, apiKey, model) => {
    switch (provider) {
      case 'google':
        return await callGeminiAPI(prompt);
        
      case 'openai':
        // Implementação futura para OpenAI
        return await InvokeLLM({
          prompt: `[Usando ${model}] ${prompt}`,
        });
        
      case 'anthropic':
        // Implementação futura para Anthropic
        return await InvokeLLM({
          prompt: `[Usando ${model}] ${prompt}`,
        });
        
      default:
        return await InvokeLLM({ prompt });
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const prompt = `Você é um assistente especialista em notas técnicas do NatJus. Responda à pergunta do usuário com base no contexto das notas técnicas fornecidas abaixo. 

INSTRUÇÕES IMPORTANTES:
1. Seja conciso e direto
2. Se a informação não estiver no contexto, diga que não encontrou a informação nas notas disponíveis
3. Quando o usuário pedir o PDF, arquivo, documento ou link de uma nota específica, SEMPRE forneça a URL_DO_PDF correspondente
4. Quando mencionar uma nota técnica específica, inclua seu número e título
5. Se houver URL_DO_PDF disponível para a nota mencionada, sempre inclua no final da resposta: "🔗 [Baixar PDF](URL_DO_PDF)"

Contexto das Notas Técnicas:
---
${notasContext}
---

Pergunta do usuário: "${currentInput}"`;

      let response;
      
      if (config.llm_provider === 'google' && config.google_api_key) {
        // Usa Gemini real
        response = await callGeminiAPI(prompt);
      } else if (config.llm_provider !== 'base44') {
        // Outros provedores
        const apiKeyField = `${config.llm_provider}_api_key`;
        const modelField = `${config.llm_provider}_model`;
        
        if (!config[apiKeyField]) {
          response = `Erro: Chave API do ${getProviderName(config.llm_provider)} não configurada. Verifique as configurações.`;
        } else {
          response = await callCustomLLM(prompt, config.llm_provider, config[apiKeyField], config[modelField]);
        }
      } else {
        // Base44
        response = await InvokeLLM({ prompt });
      }
      
      const aiMessage = { sender: 'ai', text: response };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      const errorMessage = { 
        sender: 'ai', 
        text: `Desculpe, ocorreu um erro ao processar sua pergunta usando ${getProviderName(config.llm_provider)}. Tente novamente ou verifique as configurações.` 
      };
      setMessages(prev => [...prev, errorMessage]);
      console.error("Erro no chat:", error);
      setError(`Erro: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="flex-1 flex flex-col items-center">
        <Card className="w-full max-w-3xl h-full flex flex-col shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center justify-between text-slate-900">
              <div className="flex items-center gap-3">
                <Bot className="w-6 h-6 text-[var(--primary)]" />
                <span>Chat com IA</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {getProviderName(config.llm_provider)}
                </Badge>
                {config.llm_provider === 'google' && geminiService && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                    ✅ Gemini Ativo
                  </Badge>
                )}
                {config.llm_provider === 'google' && !geminiService && (
                  <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                    ⚠️ API não configurada
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>

          {error && (
            <Alert variant="destructive" className="m-4 mb-0">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
            <AnimatePresence>
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}
                >
                  {msg.sender === 'ai' && (
                    <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex-shrink-0 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div className={`p-4 rounded-xl max-w-lg ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-bl-none'}`}>
                    <ReactMarkdown className="prose prose-sm max-w-none prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline">
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                  {msg.sender === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-slate-500 flex-shrink-0 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex-shrink-0 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="p-4 rounded-xl bg-slate-100 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                  <span className="text-slate-500 text-sm">
                    {config.llm_provider === 'google' && geminiService 
                      ? 'Processando com Gemini...' 
                      : `Pensando com ${getProviderName(config.llm_provider)}...`
                    }
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>
          <div className="p-4 border-t">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  config.llm_provider === 'google' && geminiService
                    ? "Pergunte algo sobre as notas técnicas... (Powered by Gemini)"
                    : "Pergunte algo sobre as notas técnicas... (ex: 'me dê uma nota sobre epilepsia' ou 'quero o pdf da nota 2.809/2024')"
                }
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={isLoading} 
                style={{ backgroundColor: 'var(--primary)', color: 'white' }}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}