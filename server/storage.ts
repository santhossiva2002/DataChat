import { datasets, chatMessages, type Dataset, type InsertDataset, type ChatMessage, type InsertChatMessage } from "@shared/schema";
import { users, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

// Interface with all CRUD methods needed for the application
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Dataset operations
  createDataset(dataset: InsertDataset): Promise<Dataset>;
  getDataset(id: number): Promise<Dataset | undefined>;
  getAllDatasets(): Promise<Dataset[]>;
  
  // Table data operations
  storeTableData(tableName: string, schema: any, data: any[]): Promise<void>;
  getTablePreview(tableName: string, limit?: number): Promise<any[]>;
  executeSQL(sql: string): Promise<any[]>;
  
  // Chat message operations
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatHistory(datasetId: number): Promise<ChatMessage[]>;
}

// Memory-based storage implementation
export class MemStorage implements IStorage {
  // User storage
  private users: Map<number, User> = new Map();
  private datasets: Map<number, Dataset> = new Map();
  private tableData: Map<string, any[]> = new Map();
  private chatMessages: Map<number, ChatMessage> = new Map();
  
  // Counters for auto-increment IDs
  private currentUserId: number = 1;
  private currentDatasetId: number = 1;
  private currentChatMessageId: number = 1;

  // User methods 
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Dataset methods
  async createDataset(insertDataset: InsertDataset): Promise<Dataset> {
    const id = this.currentDatasetId++;
    const now = new Date();
    
    const dataset: Dataset = {
      ...insertDataset,
      id,
      uploadedAt: now
    };
    
    this.datasets.set(id, dataset);
    console.log(`Created dataset with ID ${id}: ${insertDataset.name}`);
    
    return dataset;
  }
  
  async getDataset(id: number): Promise<Dataset | undefined> {
    return this.datasets.get(id);
  }
  
  async getAllDatasets(): Promise<Dataset[]> {
    return Array.from(this.datasets.values())
      .sort((a, b) => {
        const timeA = a.uploadedAt ? a.uploadedAt.getTime() : 0;
        const timeB = b.uploadedAt ? b.uploadedAt.getTime() : 0;
        return timeB - timeA;
      });
  }
  
  // Table data methods
  async storeTableData(tableName: string, schema: any, data: any[]): Promise<void> {
    try {
      // Store the data in memory
      this.tableData.set(tableName, data);
      console.log(`Stored ${data.length} rows for table ${tableName}`);
    } catch (error) {
      console.error('Error storing table data:', error);
      throw error;
    }
  }

  // Sample data cache
  private sampleDataCache: Map<string, any[]> = new Map();

  async getTablePreview(tableName: string, limit: number = 10): Promise<any[]> {
    // Return actual data if we have it
    if (this.tableData.has(tableName)) {
      const data = this.tableData.get(tableName) || [];
      return data.slice(0, limit);
    }
    
    // Otherwise return sample data
    return this.getSampleData(tableName).slice(0, limit);
  }
  
  async executeSQL(sql: string): Promise<any[]> {
    console.log(`Executing SQL: ${sql}`);
    
    try {
      // Extract table name from SQL
      const tableMatch = sql.match(/FROM\s+["']?([a-zA-Z0-9_]+)["']?/i);
      const tableName = tableMatch ? tableMatch[1] : "default_table";
      
      // Use actual data if we have it
      let data: any[] = [];
      if (this.tableData.has(tableName)) {
        data = this.tableData.get(tableName) || [];
      } else {
        // Otherwise use sample data
        data = this.getSampleData(tableName);
      }
      
      // Handle count queries
      if (sql.toLowerCase().includes("count(")) {
        return [{ count: data.length }];
      }
      
      // Handle limit clauses
      if (sql.toLowerCase().includes("limit")) {
        const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
        const limit = limitMatch ? parseInt(limitMatch[1]) : 10;
        return data.slice(0, limit);
      }
      
      return data;
    } catch (error) {
      console.error("SQL execution error:", error);
      return [];
    }
  }
  
  // Chat message methods
  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentChatMessageId++;
    const now = new Date();
    
    const message: ChatMessage = {
      id,
      datasetId: insertMessage.datasetId,
      role: insertMessage.role,
      content: insertMessage.content,
      timestamp: now,
      sql: insertMessage.sql || null,
      resultData: insertMessage.resultData || null,
      chartData: insertMessage.chartData || null
    };
    
    this.chatMessages.set(id, message);
    return message;
  }
  
  async getChatHistory(datasetId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.datasetId === datasetId)
      .sort((a, b) => {
        const timeA = a.timestamp ? a.timestamp.getTime() : 0;
        const timeB = b.timestamp ? b.timestamp.getTime() : 0;
        return timeA - timeB;
      });
  }
  
  // Helper method to generate sample data based on table name
  private getSampleData(tableName: string): any[] {
    // Check if we already have cached data for this table
    if (this.sampleDataCache.has(tableName)) {
      return this.sampleDataCache.get(tableName) || [];
    }
    
    // Generate some sample data based on the table name
    const sampleData = this.generateSampleData(tableName);
    
    // Cache it for future use
    this.sampleDataCache.set(tableName, sampleData);
    
    return sampleData;
  }
  
  // Generate sample data for demo purposes
  private generateSampleData(tableName: string): any[] {
    // Default sample data (can be enhanced based on table name)
    const sampleData = [];
    
    // Create different data based on table name hints
    if (tableName.includes("user")) {
      for (let i = 1; i <= 50; i++) {
        sampleData.push({
          id: i,
          name: `User ${i}`,
          email: `user${i}@example.com`,
          age: 20 + Math.floor(Math.random() * 40),
          signup_date: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
        });
      }
    } else if (tableName.includes("product")) {
      for (let i = 1; i <= 50; i++) {
        sampleData.push({
          id: i,
          name: `Product ${i}`,
          price: Math.floor(Math.random() * 100) + 0.99,
          category: ["Electronics", "Clothing", "Books", "Food"][Math.floor(Math.random() * 4)],
          in_stock: Math.random() > 0.2
        });
      }
    } else if (tableName.includes("order")) {
      for (let i = 1; i <= 50; i++) {
        sampleData.push({
          id: i,
          user_id: Math.floor(Math.random() * 50) + 1,
          total: Math.floor(Math.random() * 200) + 10.99,
          status: ["Pending", "Shipped", "Delivered", "Cancelled"][Math.floor(Math.random() * 4)],
          order_date: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
        });
      }
    } else {
      // Generic data for any other table
      for (let i = 1; i <= 50; i++) {
        sampleData.push({
          id: i,
          name: `Item ${i}`,
          value: Math.floor(Math.random() * 100),
          created_at: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
        });
      }
    }
    
    return sampleData;
  }
}

// Use memory storage for the demo
export const storage = new MemStorage();