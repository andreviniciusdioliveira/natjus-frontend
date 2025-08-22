// src/pages/Configuracoes.jsx - Versão segura sem credenciais expostas
import React, { useState, useEffect } from "react";
import { Configuracao } from "@/api/entities";
import { User } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Image as ImageIcon, Loader2, Bot, Palette, Key, Cloud, HardDrive, Shield, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Configuracoes() {
  const navigate = useNavigate();
  const [config, setConfig] = useState({ 
    id: null, 
    logo_url: "", 
    cor_primaria: "#2563EB",
    llm_provider: "google", // Gemini como padrão
    openai_api_key: "",
    anthropic_api_key: "",
    google_api_key: "", // VAZIO - será configurado via variável de ambiente ou interface
    openai_model: "gpt-4",
    anthropic_model: "claude-3-sonnet-20240229",
    google_model: "gemini-1.5-pro",
    chat_greeting: "Olá! Sou a assistente de IA do NatJus (Gemini). Faça perguntas sobre as notas técnicas e eu buscarei as informações para você.",
    storage_provider: "google_drive", // Google Drive como padrão
    google_drive_folder_id: "", // VAZIO - será configurado via variável de ambiente ou interface
    google_drive_credentials: "", // VAZIO - será configurado via variável de ambiente
    aws_access_key_id: "",
    aws_secret_access_key: "",
    aws_region: "us-east-1",
    aws_bucket_name: ""
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [testResults, setTestResults] = useState({
    gemini: null,
    googleDrive: null
  });
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const currentUser = await User.me();
        if (currentUser.role !== 'admin') {
          navigate(createPageUrl("Dashboard"));
          return;
        }
        
        const configData = await Configuracao.list();
        if (configData.length > 0) {
          // Carrega configurações existentes do banco
          setConfig(prev => ({ ...prev, ...configData[0] }));
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        navigate(createPageUrl("Dashboard"));
      }
      setIsLoading(false);
    };
    loadData();
  }, [navigate]);

  const handleInputChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsSaving(true);
    try {
      const { file_url } = await UploadFile({ file });
      setConfig(prev => ({ ...prev, logo_url: file_url }));
    } catch (error) {
      console.error("Erro no upload da logo:", error);
    }
    setIsSaving(false);
  };

  // Testa a conexão com Gemini
  const testGeminiConnection = async () => {
    if (!config.google_api_key) {
      setTestResults(prev => ({ 
        ...prev, 
        gemini: 'error_no_key'
      }));
      return;
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${config.google_api_key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Teste de conexão. Responda apenas "OK"' }] }]
        })
      });

      if (response.ok) {
        setTestResults(prev => ({ ...prev, gemini: 'success' }));
      } else {
        setTestResults(prev => ({ ...prev, gemini: 'error' }));
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, gemini: 'error' }));
    }
  };

  // Testa a configuração do Google Drive
  const testGoogleDriveConnection = async () => {
    try {
      // Valida se as configurações estão presentes
      if (config.google_drive_credentials && config.google_drive_folder_id) {
        const credentials = JSON.parse(config.google_drive_credentials);
        if (credentials.client_email && credentials.private_key) {
          setTestResults(prev => ({ ...prev, googleDrive: 'success' }));
        } else {
          setTestResults(prev => ({ ...prev, googleDrive: 'error' }));
        }
      } else {
        setTestResults(prev => ({ ...prev, googleDrive: 'error_no_config' }));
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, googleDrive: 'error' }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMessage("");
    try {
      if (config.id) {
        await Configuracao.update(config.id, config);
      } else {
        const newConfig = await Configuracao.create(config);
        setConfig(newConfig);
      }
      setSuccessMessage("Configurações salvas com sucesso!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
    }
    setIsSaving(false);
  };
  
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin"/>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Configurações do Sistema</h1>
          <p className="text-slate-600">Personalize a aparência, IA e armazenamento do sistema</p>
        </div>

        {/* Alerta sobre configuração via variáveis de ambiente */}
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Para produção:</strong> Configure as credenciais via variáveis de ambiente no painel do Render.com para maior segurança.
            As configurações aqui são para desenvolvimento/teste.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="aparencia" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="aparencia" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Aparência
            </TabsTrigger>
            <TabsTrigger value="ia" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              IA
            </TabsTrigger>
            <TabsTrigger value="armazenamento" className="flex items-center gap-2">
              <Cloud className="w-4 h-4" />
              Armazenamento
            </TabsTrigger>
            <TabsTrigger value="avancado" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              Avançado
            </TabsTrigger>
          </TabsList>

          <TabsContent value="aparencia" className="mt-6">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Personalização Visual</CardTitle>
                <CardDescription>Configure a logomarca e cores da aplicação</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="logo">Logomarca</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 border rounded-lg flex items-center justify-center bg-slate-50">
                      {config.logo_url ? (
                        <img src={config.logo_url} alt="Logo preview" className="object-contain w-full h-full p-2" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange} 
                      className="hidden"
                      accept="image/*"
                    />
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isSaving}>
                      {isSaving ? "Enviando..." : "Trocar Logo"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cor_primaria">Cor Primária</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="cor_primaria"
                      type="color"
                      value={config.cor_primaria}
                      onChange={(e) => handleInputChange('cor_primaria', e.target.value)}
                      className="w-16 p-1"
                      disabled={isSaving}
                    />
                    <Input
                      value={config.cor_primaria}
                      onChange={(e) => handleInputChange('cor_primaria', e.target.value)}
                      className="w-32"
                      disabled={isSaving}
                      placeholder="#2563EB"
                    />
                    <div className="flex gap-2 ml-4">
                      {['#2563EB', '#7C3AED', '#DC2626', '#059669', '#D97706'].map(color => (
                        <button
                          key={color}
                          className="w-8 h-8 rounded border-2 border-white shadow-sm"
                          style={{ backgroundColor: color }}
                          onClick={() => handleInputChange('cor_primaria', color)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ia" className="mt-6">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Configurações de IA</CardTitle>
                <CardDescription>Configure qual provedor de IA será usado no chat e processamento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="llm_provider">Provedor Principal</Label>
                  <Select 
                    value={config.llm_provider} 
                    onValueChange={(value) => handleInputChange('llm_provider', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Google (Gemini) ⭐ Recomendado</SelectItem>
                      <SelectItem value="base44">Base44 (Padrão)</SelectItem>
                      <SelectItem value="openai">OpenAI (ChatGPT)</SelectItem>
                      <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chat_greeting">Mensagem de Saudação do Chat</Label>
                  <Textarea
                    id="chat_greeting"
                    value={config.chat_greeting}
                    onChange={(e) => handleInputChange('chat_greeting', e.target.value)}
                    placeholder="Digite a mensagem de saudação que aparecerá no início do chat..."
                    className="h-20"
                  />
                  <p className="text-xs text-slate-500">
                    Esta mensagem aparecerá quando o usuário abrir o chat pela primeira vez.
                  </p>
                </div>

                {config.llm_provider === 'google' && (
                  <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-blue-800">Configurações do Gemini</span>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="google_api_key">Chave API do Google Gemini</Label>
                      <Input
                        id="google_api_key"
                        type="password"
                        value={config.google_api_key}
                        onChange={(e) => handleInputChange('google_api_key', e.target.value)}
                        placeholder="AIza... (Configure via variável de ambiente em produção)"
                      />
                      <p className="text-xs text-slate-600">
                        Em produção, configure via variável de ambiente GOOGLE_API_KEY no Render.com
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="google_model">Modelo</Label>
                      <Select 
                        value={config.google_model} 
                        onValueChange={(value) => handleInputChange('google_model', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro ⭐</SelectItem>
                          <SelectItem value="gemini-1.0-pro">Gemini 1.0 Pro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button variant="outline" size="sm" onClick={testGeminiConnection}>
                      Testar Conexão Gemini
                    </Button>
                    
                    {testResults.gemini && (
                      <Alert className={testResults.gemini === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                        <AlertDescription className={testResults.gemini === 'success' ? 'text-green-700' : 'text-red-700'}>
                          {testResults.gemini === 'success' ? '✅ Gemini conectado com sucesso!' : 
                           testResults.gemini === 'error_no_key' ? '❌ Chave API não configurada' :
                           '❌ Erro na conexão com Gemini'}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                {config.llm_provider === 'openai' && (
                  <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
                    <div className="space-y-2">
                      <Label htmlFor="openai_api_key">Chave API do OpenAI</Label>
                      <Input
                        id="openai_api_key"
                        type="password"
                        value={config.openai_api_key}
                        onChange={(e) => handleInputChange('openai_api_key', e.target.value)}
                        placeholder="sk-..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="openai_model">Modelo</Label>
                      <Select 
                        value={config.openai_model} 
                        onValueChange={(value) => handleInputChange('openai_model', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4">GPT-4</SelectItem>
                          <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {config.llm_provider === 'anthropic' && (
                  <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
                    <div className="space-y-2">
                      <Label htmlFor="anthropic_api_key">Chave API do Anthropic</Label>
                      <Input
                        id="anthropic_api_key"
                        type="password"
                        value={config.anthropic_api_key}
                        onChange={(e) => handleInputChange('anthropic_api_key', e.target.value)}
                        placeholder="sk-ant-..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="anthropic_model">Modelo</Label>
                      <Select 
                        value={config.anthropic_model} 
                        onValueChange={(value) => handleInputChange('anthropic_model', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                          <SelectItem value="claude-3-sonnet-20240229">Claude 3 Sonnet</SelectItem>
                          <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <Alert>
                  <Bot className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Recomendação:</strong> O Gemini oferece excelente qualidade para análise de documentos jurídicos.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="armazenamento" className="mt-6">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Armazenamento de PDFs</CardTitle>
                <CardDescription>Configure onde os arquivos PDF serão armazenados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="storage_provider">Provedor de Armazenamento</Label>
                  <Select 
                    value={config.storage_provider} 
                    onValueChange={(value) => handleInputChange('storage_provider', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google_drive">Google Drive ⭐ Recomendado</SelectItem>
                      <SelectItem value="base44">Base44 (Padrão)</SelectItem>
                      <SelectItem value="aws_s3">Amazon S3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {config.storage_provider === 'google_drive' && (
                  <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                    <div className="flex items-center gap-2 mb-2">
                      <HardDrive className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-blue-800">Configurações do Google Drive</span>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="google_drive_folder_id">ID da Pasta do Google Drive</Label>
                      <Input
                        id="google_drive_folder_id"
                        value={config.google_drive_folder_id}
                        onChange={(e) => handleInputChange('google_drive_folder_id', e.target.value)}
                        placeholder="1A2B3C4D5E6F7G8H9I0J... (Configure via variável de ambiente em produção)"
                      />
                      <p className="text-xs text-slate-600">
                        Em produção, configure via variável de ambiente GOOGLE_DRIVE_FOLDER_ID no Render.com
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="google_drive_credentials">Credenciais da Service Account (JSON)</Label>
                      <Textarea
                        id="google_drive_credentials"
                        value={config.google_drive_credentials}
                        onChange={(e) => handleInputChange('google_drive_credentials', e.target.value)}
                        placeholder='{"type": "service_account", "project_id": "...", ...} (Configure via variável de ambiente em produção)'
                        rows={4}
                      />
                      <p className="text-xs text-slate-600">
                        Em produção, configure via variável de ambiente GOOGLE_DRIVE_CREDENTIALS no Render.com
                      </p>
                    </div>
                    
                    <Button variant="outline" size="sm" onClick={testGoogleDriveConnection}>
                      Testar Configuração Drive
                    </Button>
                    
                    {testResults.googleDrive && (
                      <Alert className={testResults.googleDrive === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                        <AlertDescription className={testResults.googleDrive === 'success' ? 'text-green-700' : 'text-red-700'}>
                          {testResults.googleDrive === 'success' ? '✅ Configuração válida!' : 
                           testResults.googleDrive === 'error_no_config' ? '❌ Credenciais não configuradas' :
                           '❌ Erro na configuração'}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                {config.storage_provider === 'aws_s3' && (
                  <div className="space-y-4 p-4 border rounded-lg bg-orange-50">
                    <div className="flex items-center gap-2 mb-2">
                      <Cloud className="w-5 h-5 text-orange-600" />
                      <span className="font-semibold text-orange-800">Configurações da AWS S3</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="aws_access_key_id">Access Key ID</Label>
                        <Input
                          id="aws_access_key_id"
                          type="password"
                          value={config.aws_access_key_id}
                          onChange={(e) => handleInputChange('aws_access_key_id', e.target.value)}
                          placeholder="AKIA..."
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="aws_secret_access_key">Secret Access Key</Label>
                        <Input
                          id="aws_secret_access_key"
                          type="password"
                          value={config.aws_secret_access_key}
                          onChange={(e) => handleInputChange('aws_secret_access_key', e.target.value)}
                          placeholder="..."
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="aws_region">Região</Label>
                        <Select 
                          value={config.aws_region} 
                          onValueChange={(value) => handleInputChange('aws_region', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                            <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                            <SelectItem value="eu-west-1">Europe (Ireland)</SelectItem>
                            <SelectItem value="sa-east-1">South America (São Paulo)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="aws_bucket_name">Nome do Bucket</Label>
                        <Input
                          id="aws_bucket_name"
                          value={config.aws_bucket_name}
                          onChange={(e) => handleInputChange('aws_bucket_name', e.target.value)}
                          placeholder="meu-bucket-natjus"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <Alert>
                  <Cloud className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Recomendação:</strong> O Google Drive oferece integração simples e confiável para armazenamento de documentos.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="avancado" className="mt-6">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Configurações Avançadas</CardTitle>
                <CardDescription>Configurações técnicas e segurança</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Segurança em Produção:</strong> Para maior segurança, configure todas as credenciais via variáveis de ambiente no painel do Render.com:
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <h4 className="font-semibold">Variáveis de Ambiente Recomendadas</h4>
                  <div className="bg-slate-100 p-4 rounded-lg text-sm font-mono space-y-2">
                    <div><strong>Backend:</strong></div>
                    <div>GOOGLE_API_KEY=sua_chave_gemini</div>
                    <div>GOOGLE_DRIVE_FOLDER_ID=seu_folder_id</div>
                    <div>GOOGLE_DRIVE_CREDENTIALS=seu_json_credentials</div>
                    <div className="mt-2"><strong>Frontend:</strong></div>
                    <div>VITE_API_URL=https://seu-backend.onrender.com</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Funcionalidades do Sistema</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Chat com IA (Gemini/OpenAI/Claude)
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Upload seguro para Google Drive
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Análise automática de PDFs
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Extração de dados estruturados
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Busca inteligente no conteúdo
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Interface responsiva e moderna
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {successMessage && (
          <Alert className="mt-6 bg-emerald-50 border-emerald-200 text-emerald-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between items-center pt-6">
          <div className="text-sm text-slate-500">
            Sistema seguro e pronto para produção
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="bg-[var(--primary)] hover:opacity-90 text-white">
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar Configurações
          </Button>
        </div>
      </div>
    </div>
  );
}