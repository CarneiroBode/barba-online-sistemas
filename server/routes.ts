
import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

// Middleware para validar acesso baseado na URL
async function validateUrlAccess(req: Request, res: Response, next: NextFunction) {
  const { company_id, whatsapp, codigo } = req.query;

  // Se não tiver os parâmetros necessários, bloqueia o acesso
  if (!company_id || !whatsapp || !codigo) {
    return res.status(401).json({ 
      error: "Acesso negado. Parâmetros de autenticação obrigatórios: company_id, whatsapp, codigo" 
    });
  }

  try {
    const validation = await storage.validateUrlAccess(
      company_id as string, 
      whatsapp as string, 
      codigo as string
    );

    if (!validation) {
      return res.status(401).json({ 
        error: "Acesso negado. URL inválida ou expirada." 
      });
    }

    // Armazena os dados validados na requisição para uso posterior
    req.validatedAccess = {
      company_id: company_id as string,
      whatsapp: whatsapp as string,
      codigo: codigo as string,
      validation_id: validation.id
    };

    next();
  } catch (error) {
    return res.status(500).json({ 
      error: "Erro interno do servidor durante validação." 
    });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware global para validar todas as rotas da API
  app.use('/api', validateUrlAccess);

  // Rota para criar uma nova validação de URL (simulando o N8N)
  app.post('/generate-url', async (req: Request, res: Response) => {
    try {
      const { company_id, whatsapp, codigo, expires_hours = 24 } = req.body;

      if (!company_id || !whatsapp || !codigo) {
        return res.status(400).json({ 
          error: "Campos obrigatórios: company_id, whatsapp, codigo" 
        });
      }

      // Verifica se a empresa existe
      const company = await storage.getCompany(company_id);
      if (!company) {
        return res.status(404).json({ error: "Empresa não encontrada" });
      }

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expires_hours);

      const validation = await storage.createUrlValidation({
        company_id,
        whatsapp,
        codigo,
        expires_at: expiresAt
      });

      // Gera a URL de acesso
      const accessUrl = `${req.protocol}://${req.get('host')}?company_id=${company_id}&whatsapp=${encodeURIComponent(whatsapp)}&codigo=${codigo}`;

      res.json({
        success: true,
        validation_id: validation.id,
        access_url: accessUrl,
        expires_at: expiresAt
      });
    } catch (error) {
      res.status(500).json({ error: "Erro ao gerar URL de acesso" });
    }
  });

  // Rota protegida de exemplo
  app.get('/api/user-info', async (req: Request, res: Response) => {
    if (!req.validatedAccess) {
      return res.status(401).json({ error: "Acesso não validado" });
    }

    const { company_id, whatsapp, codigo } = req.validatedAccess;

    // Aqui você pode buscar informações específicas da empresa/usuário
    const company = await storage.getCompany(company_id);

    res.json({
      success: true,
      company: company?.name,
      whatsapp,
      message: "Acesso autorizado com sucesso!"
    });
  });

  // Rota para marcar URL como usada (opcional)
  app.post('/api/mark-used', async (req: Request, res: Response) => {
    try {
      if (!req.validatedAccess) {
        return res.status(401).json({ error: "Acesso não validado" });
      }

      const { validation_id } = req.validatedAccess;
      await storage.markUrlValidationAsUsed(validation_id);
      res.json({ success: true, message: "URL marcada como utilizada" });
    } catch (error) {
      res.status(500).json({ error: "Erro ao marcar URL como usada" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Extend Request interface to include validated access data
declare global {
  namespace Express {
    interface Request {
      validatedAccess?: {
        company_id: string;
        whatsapp: string;
        codigo: string;
        validation_id: number;
      };
    }
  }
}
