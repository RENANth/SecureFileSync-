import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import crypto from "crypto";
import { UAParser } from "ua-parser-js";
import {
  insertFileSchema,
  insertShareTokenSchema,
  insertLogSchema,
} from "@shared/schema";
import sodium from "libsodium-wrappers";

// Configure multer for in-memory file storage
const memStorage = multer.memoryStorage();
const upload = multer({
  storage: memStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize sodium
  await sodium.ready;

  // Create a new file
  app.post("/api/files/upload", upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No arquivo fornecido" });
      }

      const { name, key, expiration, originalSize, password } = req.body;

      // Validate file data
      const fileData = {
        name,
        encryptionKey: key,
        size: parseInt(originalSize, 10),
        expiresAt: getExpirationDate(expiration),
        password: password ? await hashPassword(password) : null,
        // Converter dados do arquivo para base64 para evitar problemas de codificação
        data: req.file.buffer.toString('base64')
      };

      // Create file record in storage
      const file = await storage.createFile(fileData);

      // Log the upload action
      await logFileAction(req, file.id, file.name, "upload", "Arquivo enviado");

      res.status(201).json({
        id: file.id,
        name: file.name,
        size: file.size,
        createdAt: file.createdAt,
        expiresAt: file.expiresAt,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Falha ao enviar o arquivo" });
    }
  });

  // Get all files
  app.get("/api/files", async (req: Request, res: Response) => {
    try {
      const files = await storage.getAllFiles();
      
      // Don't send file data in the response, just metadata
      const filesWithoutData = files.map(file => ({
        id: file.id,
        name: file.name,
        size: file.size,
        createdAt: file.createdAt,
        expiresAt: file.expiresAt,
        shared: file.shared,
      }));
      
      res.json(filesWithoutData);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: "Falha ao buscar arquivos" });
    }
  });

  // Get shared files
  app.get("/api/files/shared", async (req: Request, res: Response) => {
    try {
      const files = await storage.getSharedFiles();
      
      // Don't send file data in the response, just metadata
      const filesWithoutData = files.map(file => ({
        id: file.id,
        name: file.name,
        size: file.size,
        createdAt: file.createdAt,
        expiresAt: file.expiresAt,
        shared: file.shared,
      }));
      
      res.json(filesWithoutData);
    } catch (error) {
      console.error("Error fetching shared files:", error);
      res.status(500).json({ message: "Falha ao buscar arquivos compartilhados" });
    }
  });

  // Download a file
  app.get("/api/files/:id/download", async (req: Request, res: Response) => {
    try {
      const fileId = parseInt(req.params.id, 10);
      const file = await storage.getFile(fileId);
      
      if (!file) {
        return res.status(404).json({ message: "Arquivo não encontrado" });
      }

      // Log the download action
      await logFileAction(req, fileId, file.name, "download", "Arquivo baixado");

      // Set appropriate headers
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(file.name)}"`);
      res.setHeader("Content-Type", "application/octet-stream");
      
      // Decodificar dados do base64 antes de enviar
      const fileBuffer = Buffer.from(file.data, 'base64');
      res.send(fileBuffer);
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ message: "Falha ao baixar o arquivo" });
    }
  });

  // Share a file
  app.post("/api/files/share", async (req: Request, res: Response) => {
    try {
      const { fileId, expiration, password, email } = req.body;
      
      // Check if file exists
      const file = await storage.getFile(fileId);
      if (!file) {
        return res.status(404).json({ message: "Arquivo não encontrado" });
      }

      // Generate a secure token for the share link
      const shareToken = crypto.randomBytes(16).toString("hex");
      
      // Create a share record
      const share = await storage.createShare({
        fileId,
        shareToken,
        expiresAt: getExpirationDate(expiration),
        password: password ? await hashPassword(password) : null,
        email: email || null,
      });

      // Update the file's shared status
      await storage.updateFileShared(fileId, true);

      // Log the share action
      const details = email ? `Compartilhado com: ${email}` : "Compartilhado com link";
      await logFileAction(req, fileId, file.name, "share", details);

      res.status(201).json({
        id: share.id,
        shareToken: share.shareToken,
        expiresAt: share.expiresAt,
      });
    } catch (error) {
      console.error("Share error:", error);
      res.status(500).json({ message: "Falha ao compartilhar o arquivo" });
    }
  });

  // Access shared file
  app.get("/api/share/:token", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const { password } = req.query;
      
      // Find the share by token
      const share = await storage.getShareByToken(token);
      if (!share) {
        return res.status(404).json({ message: "Link de compartilhamento não encontrado ou expirado" });
      }
      
      // Check if the share has expired
      if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
        return res.status(403).json({ message: "Link de compartilhamento expirado" });
      }
      
      // Check if password is required and correct
      if (share.password) {
        if (!password) {
          return res.status(401).json({ passwordRequired: true, message: "Senha necessária" });
        }
        
        const passwordValid = await verifyPassword(share.password, password as string);
        if (!passwordValid) {
          return res.status(401).json({ message: "Senha inválida" });
        }
      }
      
      // Get the file
      const file = await storage.getFile(share.fileId);
      if (!file) {
        return res.status(404).json({ message: "Arquivo não encontrado" });
      }
      
      // Log the access
      await logFileAction(req, file.id, file.name, "access", `Acessado via link de compartilhamento: ${token}`);
      
      // Return the file metadata
      res.json({
        id: file.id,
        name: file.name,
        size: file.size,
        createdAt: file.createdAt,
        encryptionKey: file.encryptionKey,
      });
    } catch (error) {
      console.error("Share access error:", error);
      res.status(500).json({ message: "Falha ao acessar o arquivo compartilhado" });
    }
  });

  // Download shared file
  app.get("/api/share/:token/download", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const { password } = req.query;
      
      // Find the share by token
      const share = await storage.getShareByToken(token);
      if (!share) {
        return res.status(404).json({ message: "Link de compartilhamento não encontrado ou expirado" });
      }
      
      // Check if the share has expired
      if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
        return res.status(403).json({ message: "Link de compartilhamento expirado" });
      }
      
      // Check if password is required and correct
      if (share.password) {
        if (!password) {
          return res.status(401).json({ passwordRequired: true, message: "Senha necessária" });
        }
        
        const passwordValid = await verifyPassword(share.password, password as string);
        if (!passwordValid) {
          return res.status(401).json({ message: "Senha inválida" });
        }
      }
      
      // Get the file
      const file = await storage.getFile(share.fileId);
      if (!file) {
        return res.status(404).json({ message: "Arquivo não encontrado" });
      }
      
      // Log the download
      await logFileAction(req, file.id, file.name, "download", `Baixado via link de compartilhamento: ${token}`);
      
      // Set appropriate headers
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(file.name)}"`);
      res.setHeader("Content-Type", "application/octet-stream");
      
      // Decodificar dados do base64 antes de enviar
      const fileBuffer = Buffer.from(file.data, 'base64');
      res.send(fileBuffer);
    } catch (error) {
      console.error("Share download error:", error);
      res.status(500).json({ message: "Falha ao baixar o arquivo compartilhado" });
    }
  });

  // Delete a file
  app.delete("/api/files/:id", async (req: Request, res: Response) => {
    try {
      const fileId = parseInt(req.params.id, 10);
      
      // Check if file exists
      const file = await storage.getFile(fileId);
      if (!file) {
        return res.status(404).json({ message: "Arquivo não encontrado" });
      }
      
      // Log the delete action before actually deleting
      await logFileAction(req, fileId, file.name, "delete", "Arquivo excluído");
      
      // Delete the file
      await storage.deleteFile(fileId);
      
      res.status(200).json({ message: "Arquivo excluído com sucesso" });
    } catch (error) {
      console.error("Delete error:", error);
      res.status(500).json({ message: "Falha ao excluir o arquivo" });
    }
  });

  // Get activity logs
  app.get("/api/logs", async (req: Request, res: Response) => {
    try {
      const logs = await storage.getLogs();
      
      // Sort logs by timestamp descending (newest first)
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      res.json(logs);
    } catch (error) {
      console.error("Error fetching logs:", error);
      res.status(500).json({ message: "Falha ao buscar logs de atividade" });
    }
  });

  // Helper function to calculate expiration date from expiration period
  function getExpirationDate(expiration: string): Date | null {
    if (!expiration || expiration === 'never') {
      return null;
    }
    
    const now = new Date();
    
    switch (expiration) {
      case '1day':
        now.setDate(now.getDate() + 1);
        break;
      case '3days':
        now.setDate(now.getDate() + 3);
        break;
      case '7days':
        now.setDate(now.getDate() + 7);
        break;
      case '14days':
        now.setDate(now.getDate() + 14);
        break;
      case '30days':
        now.setDate(now.getDate() + 30);
        break;
      default:
        return null;
    }
    
    return now;
  }

  // Helper function to log file actions
  async function logFileAction(req: Request, fileId: number, fileName: string, action: string, details?: string): Promise<void> {
    const parser = new UAParser(req.headers['user-agent']);
    const browserName = parser.getBrowser().name || 'Desconhecido';
    const osName = parser.getOS().name || 'Desconhecido';
    const userAgent = `${browserName} no ${osName}`;
    
    await storage.createLog({
      fileId,
      fileName,
      action,
      ipAddress: req.ip || req.socket.remoteAddress || 'Desconhecido',
      userAgent,
      details,
      timestamp: new Date(),
    });
  }

  // Helper function to hash passwords
  async function hashPassword(password: string): Promise<string> {    
    // Use a more straightforward hashing approach with crypto
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .pbkdf2Sync(password, salt, 10000, 64, 'sha512')
      .toString('hex');
    
    return `${salt}:${hash}`;
  }

  // Helper function to verify passwords
  async function verifyPassword(storedHash: string, password: string): Promise<boolean> {    
    // Split the stored hash to get the salt and hash
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;
    
    // Generate new hash with the same salt and compare
    const newHash = crypto
      .pbkdf2Sync(password, salt, 10000, 64, 'sha512')
      .toString('hex');
    
    return hash === newHash;
  }

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Global error:', err);
    res.status(500).json({ message: 'Erro interno do servidor' });
  });

  const httpServer = createServer(app);
  return httpServer;
}