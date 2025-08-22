// frontend/src/config/api.js - Configuração de API para produção
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD 
    ? 'https://natjus-backend.onrender.com' 
    : 'http://localhost:3001');

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos
  endpoints: {
    health: '/api/health',
    uploadToDrive: '/api/upload-to-drive',
    analyzeWithGemini: '/api/analyze-with-gemini',
    chatWithGemini: '/api/chat-with-gemini',
    processComplete: '/api/process-complete',
    driveFiles: '/api/drive/files',
    testConnections: '/api/test-connections'
  }
};

// Axios instance configurado
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para logs em desenvolvimento
if (import.meta.env.DEV) {
  apiClient.interceptors.request.use(
    (config) => {
      console.log('🌐 API Request:', config.method?.toUpperCase(), config.url);
      return config;
    },
    (error) => {
      console.error('❌ API Request Error:', error);
      return Promise.reject(error);
    }
  );

  apiClient.interceptors.response.use(
    (response) => {
      console.log('✅ API Response:', response.status, response.config.url);
      return response;
    },
    (error) => {
      console.error('❌ API Response Error:', error.response?.status, error.config?.url);
      return Promise.reject(error);
    }
  );
}

// Serviço para backend personalizado
export class BackendService {
  static async uploadToDrive(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post(API_CONFIG.endpoints.uploadToDrive, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  }

  static async analyzeWithGemini(extractedText, analysisType = 'nota_tecnica') {
    const response = await apiClient.post(API_CONFIG.endpoints.analyzeWithGemini, {
      extractedText,
      analysisType
    });
    
    return response.data;
  }

  static async chatWithGemini(message, context = '') {
    const response = await apiClient.post(API_CONFIG.endpoints.chatWithGemini, {
      message,
      context
    });
    
    return response.data;
  }

  static async processComplete(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post(API_CONFIG.endpoints.processComplete, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  }

  static async listDriveFiles(pageSize = 50) {
    const response = await apiClient.get(`${API_CONFIG.endpoints.driveFiles}?pageSize=${pageSize}`);
    return response.data;
  }

  static async deleteDriveFile(fileId) {
    const response = await apiClient.delete(`${API_CONFIG.endpoints.driveFiles}/${fileId}`);
    return response.data;
  }

  static async testConnections() {
    const response = await apiClient.get(API_CONFIG.endpoints.testConnections);
    return response.data;
  }

  static async healthCheck() {
    const response = await apiClient.get(API_CONFIG.endpoints.health);
    return response.data;
  }
}