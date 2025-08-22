// src/services/geminiService.js
// Serviço para integração real com Gemini API

export class GeminiService {
  constructor(apiKey, model = 'gemini-1.5-pro') {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }

  async generateContent(prompt, options = {}) {
    try {
      const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;
      
      const requestBody = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: options.temperature || 0.7,
          topK: options.topK || 40,
          topP: options.topP || 0.95,
          maxOutputTokens: options.maxOutputTokens || 8192,
        }
      };

      // Se precisar de resposta em JSON estruturado
      if (options.responseSchema) {
        requestBody.generationConfig.responseMimeType = "application/json";
        requestBody.generationConfig.responseSchema = options.responseSchema;
      }

      console.log('🤖 Chamando Gemini API:', { model: this.model, prompt: prompt.substring(0, 100) + '...' });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API Error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('Nenhuma resposta gerada pelo Gemini');
      }

      const content = data.candidates[0].content.parts[0].text;
      
      // Se esperamos JSON, tenta fazer parse
      if (options.responseSchema) {
        try {
          return JSON.parse(content);
        } catch (e) {
          console.warn('Resposta não é um JSON válido, retornando como texto:', content);
          return content;
        }
      }

      return content;

    } catch (error) {
      console.error('❌ Erro na chamada do Gemini:', error);
      throw new Error(`Erro ao processar com Gemini: ${error.message}`);
    }
  }

  // Método específico para análise de notas técnicas
  async analyzeNotaTecnica(extractedText) {
    const prompt = `Analise esta nota técnica do NatJus e extraia as seguintes informações:

Texto do PDF: ${JSON.stringify(extractedText)}

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

Retorne APENAS um JSON válido com estas informações.`;

    const schema = {
      type: "object",
      properties: {
        numero: { type: "string", description: "Número da nota técnica" },
        tipo: { type: "string", enum: ["processual", "pre-processual"] },
        titulo: { type: "string", description: "Título principal da nota" },
        data_emissao: { type: "string", description: "Data no formato YYYY-MM-DD" },
        demanda: { type: "string", description: "Origem da demanda" },
        procedimento: { type: "string", description: "Procedimento tratado" },
        representante_comarca: { type: "string", description: "Representante ou comarca" },
        resumo: { type: "string", description: "Resumo em 2-3 frases" },
        tags: { 
          type: "array", 
          items: { type: "string" },
          maxItems: 5,
          description: "Tags relevantes"
        }
      },
      required: ["numero", "tipo", "titulo", "resumo"]
    };

    return await this.generateContent(prompt, {
      responseSchema: schema,
      temperature: 0.3 // Mais determinístico para extração de dados
    });
  }

  // Método para chat conversacional
  async chatResponse(userMessage, context = "") {
    const prompt = `Você é um assistente especialista em notas técnicas do NatJus. Responda à pergunta do usuário com base no contexto das notas técnicas fornecidas abaixo.

INSTRUÇÕES IMPORTANTES:
1. Seja conciso e direto
2. Se a informação não estiver no contexto, diga que não encontrou a informação nas notas disponíveis
3. Quando o usuário pedir o PDF, arquivo, documento ou link de uma nota específica, SEMPRE forneça a URL_DO_PDF correspondente
4. Quando mencionar uma nota técnica específica, inclua seu número e título
5. Se houver URL_DO_PDF disponível para a nota mencionada, sempre inclua no final da resposta: "🔗 [Baixar PDF](URL_DO_PDF)"

Contexto das Notas Técnicas:
---
${context}
---

Pergunta do usuário: "${userMessage}"`;

    return await this.generateContent(prompt, {
      temperature: 0.7,
      maxOutputTokens: 2048
    });
  }
}