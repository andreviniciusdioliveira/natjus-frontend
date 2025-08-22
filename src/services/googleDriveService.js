// src/services/googleDriveService.js
// Serviço para integração real com Google Drive API

export class GoogleDriveService {
  constructor(serviceAccountCredentials, folderId) {
    this.credentials = typeof serviceAccountCredentials === 'string' 
      ? JSON.parse(serviceAccountCredentials) 
      : serviceAccountCredentials;
    this.folderId = folderId;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  // Autentica usando Service Account
  async authenticate() {
    try {
      // Cria JWT token para autenticação
      const header = {
        alg: 'RS256',
        typ: 'JWT'
      };

      const now = Math.floor(Date.now() / 1000);
      const payload = {
        iss: this.credentials.client_email,
        scope: 'https://www.googleapis.com/auth/drive.file',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now
      };

      // Para simplificar, vamos usar uma abordagem direta com fetch
      // Em produção, recomenda-se usar uma biblioteca como jsonwebtoken
      const tokenResponse = await this.getAccessTokenDirect();
      
      this.accessToken = tokenResponse.access_token;
      this.tokenExpiry = Date.now() + (tokenResponse.expires_in * 1000);
      
      console.log('✅ Autenticado no Google Drive com sucesso');
      return this.accessToken;

    } catch (error) {
      console.error('❌ Erro na autenticação do Google Drive:', error);
      throw new Error(`Falha na autenticação: ${error.message}`);
    }
  }

  // Método direto para obter token usando Service Account
  async getAccessTokenDirect() {
    const assertion = await this.createJWTAssertion();
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: assertion
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token request failed: ${error.error_description || error.error}`);
    }

    return await response.json();
  }

  // Cria JWT assertion para Service Account (versão simplificada)
  async createJWTAssertion() {
    // Esta é uma implementação simplificada
    // Em produção, use uma biblioteca apropriada para JWT
    const header = btoa(JSON.stringify({
      alg: 'RS256',
      typ: 'JWT'
    })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    const now = Math.floor(Date.now() / 1000);
    const payload = btoa(JSON.stringify({
      iss: this.credentials.client_email,
      scope: 'https://www.googleapis.com/auth/drive.file',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    const message = `${header}.${payload}`;
    
    // Para uma implementação completa, você precisaria assinar com a private_key
    // Por ora, vamos usar uma abordagem alternativa com fetch direto
    return await this.signJWT(message);
  }

  // Método alternativo usando fetch direto com service account
  async signJWT(message) {
    // Como não podemos fazer a assinatura RSA no frontend facilmente,
    // vamos usar uma abordagem alternativa mais simples
    throw new Error('Implementação JWT completa necessária no backend');
  }

  // Verifica se o token ainda é válido
  isTokenValid() {
    return this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry;
  }

  // Garante que temos um token válido
  async ensureAuthenticated() {
    if (!this.isTokenValid()) {
      await this.authenticate();
    }
  }

  // Upload de arquivo para Google Drive
  async uploadFile(file, fileName = null) {
    try {
      await this.ensureAuthenticated();

      const actualFileName = fileName || file.name;
      console.log(`📤 Iniciando upload para Google Drive: ${actualFileName}`);

      // Primeira chamada: criar metadados do arquivo
      const metadata = {
        name: actualFileName,
        parents: [this.folderId]
      };

      // Upload usando multipart
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
      form.append('file', file);

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: form
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(`Upload failed (${response.status}): ${error.error?.message || 'Unknown error'}`);
      }

      const result = await response.json();
      
      // Tornar o arquivo público para leitura
      await this.makeFilePublic(result.id);
      
      // Retorna URL pública
      const publicUrl = `https://drive.google.com/file/d/${result.id}/view`;
      
      console.log(`✅ Arquivo enviado com sucesso para Google Drive: ${result.id}`);
      
      return {
        fileId: result.id,
        fileName: actualFileName,
        file_url: publicUrl,
        driveUrl: publicUrl
      };

    } catch (error) {
      console.error('❌ Erro no upload para Google Drive:', error);
      throw new Error(`Falha no upload: ${error.message}`);
    }
  }

  // Torna o arquivo público para leitura
  async makeFilePublic(fileId) {
    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone'
        })
      });

      if (!response.ok) {
        console.warn('⚠️ Não foi possível tornar o arquivo público, mas o upload foi bem-sucedido');
      }
    } catch (error) {
      console.warn('⚠️ Erro ao tornar arquivo público:', error.message);
    }
  }

  // Lista arquivos na pasta
  async listFiles(pageSize = 10) {
    try {
      await this.ensureAuthenticated();

      const query = `'${this.folderId}' in parents and trashed=false`;
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&pageSize=${pageSize}&fields=files(id,name,createdTime,size,webViewLink)`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to list files: ${response.status}`);
      }

      const result = await response.json();
      return result.files || [];

    } catch (error) {
      console.error('❌ Erro ao listar arquivos:', error);
      throw new Error(`Falha ao listar arquivos: ${error.message}`);
    }
  }

  // Deleta um arquivo
  async deleteFile(fileId) {
    try {
      await this.ensureAuthenticated();

      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.status}`);
      }

      console.log(`🗑️ Arquivo deletado do Google Drive: ${fileId}`);
      return true;

    } catch (error) {
      console.error('❌ Erro ao deletar arquivo:', error);
      throw new Error(`Falha ao deletar arquivo: ${error.message}`);
    }
  }
}

// Versão simplificada para usar no frontend (sem JWT completo)
export class GoogleDriveServiceSimplified {
  constructor(folderId) {
    this.folderId = folderId;
  }

  // Para uso real, implementaríamos isso no backend
  async uploadFile(file, fileName = null) {
    console.log('📤 Upload para Google Drive (simulado):', {
      fileName: fileName || file.name,
      size: file.size,
      folderId: this.folderId
    });

    // Simula o upload para desenvolvimento
    // Na implementação real, isso seria feito no backend
    return {
      fileId: 'simulated_' + Date.now(),
      fileName: fileName || file.name,
      file_url: `https://drive.google.com/file/d/simulated_${Date.now()}/view`,
      driveUrl: `https://drive.google.com/file/d/simulated_${Date.now()}/view`
    };
  }
}