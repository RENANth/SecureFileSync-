import { 
  InsertFile, 
  EncryptedFile, 
  ShareToken, 
  InsertShareToken, 
  User, 
  InsertUser,
  Log,
  InsertLog,
  files,
  users,
  shareTokens,
  logs
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // File operations
  createFile(file: InsertFile): Promise<EncryptedFile>;
  getFile(id: number): Promise<EncryptedFile | undefined>;
  getAllFiles(): Promise<EncryptedFile[]>;
  getSharedFiles(): Promise<EncryptedFile[]>;
  updateFileShared(id: number, shared: boolean): Promise<void>;
  deleteFile(id: number): Promise<void>;
  
  // Share token operations
  createShare(share: InsertShareToken): Promise<ShareToken>;
  getShare(id: number): Promise<ShareToken | undefined>;
  getShareByToken(token: string): Promise<ShareToken | undefined>;
  deleteShare(id: number): Promise<void>;
  
  // Log operations
  createLog(log: InsertLog): Promise<Log>;
  getLogs(): Promise<Log[]>;
  getLogsByFileId(fileId: number): Promise<Log[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // File methods
  async createFile(insertFile: InsertFile): Promise<EncryptedFile> {
    const [file] = await db.insert(files).values({
      ...insertFile,
      shared: false
    }).returning();
    return file;
  }

  async getFile(id: number): Promise<EncryptedFile | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file;
  }

  async getAllFiles(): Promise<EncryptedFile[]> {
    return await db.select().from(files);
  }

  async getSharedFiles(): Promise<EncryptedFile[]> {
    return await db.select().from(files).where(eq(files.shared, true));
  }

  async updateFileShared(id: number, shared: boolean): Promise<void> {
    await db.update(files)
      .set({ shared })
      .where(eq(files.id, id));
  }

  async deleteFile(id: number): Promise<void> {
    try {
      // Start a transaction to ensure all operations succeed or fail together
      await db.transaction(async (tx) => {
        // 1. Delete associated share tokens
        await tx.delete(shareTokens).where(eq(shareTokens.fileId, id));
        
        // 2. Delete related logs (keeping them would reference a non-existent file)
        await tx.delete(logs).where(eq(logs.fileId, id));
        
        // 3. Finally delete the file itself
        const result = await tx.delete(files).where(eq(files.id, id)).returning({ id: files.id });
        
        if (result.length === 0) {
          throw new Error(`Arquivo com ID ${id} não foi encontrado`);
        }
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      throw error;
    }
  }

  // Share token methods
  async createShare(insertShare: InsertShareToken): Promise<ShareToken> {
    const [share] = await db.insert(shareTokens).values(insertShare).returning();
    return share;
  }

  async getShare(id: number): Promise<ShareToken | undefined> {
    const [share] = await db.select().from(shareTokens).where(eq(shareTokens.id, id));
    return share;
  }

  async getShareByToken(token: string): Promise<ShareToken | undefined> {
    const [share] = await db.select().from(shareTokens).where(eq(shareTokens.shareToken, token));
    return share;
  }

  async deleteShare(id: number): Promise<void> {
    await db.delete(shareTokens).where(eq(shareTokens.id, id));
  }

  // Log methods
  async createLog(insertLog: InsertLog): Promise<Log> {
    const [log] = await db.insert(logs).values(insertLog).returning();
    return log;
  }

  async getLogs(): Promise<Log[]> {
    return await db.select().from(logs).orderBy(desc(logs.timestamp));
  }

  async getLogsByFileId(fileId: number): Promise<Log[]> {
    return await db.select()
      .from(logs)
      .where(eq(logs.fileId, fileId))
      .orderBy(desc(logs.timestamp));
  }
}

export const storage = new DatabaseStorage();
