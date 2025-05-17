import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import { parseFile } from "./fileParser";
import { generateSQL } from "./gemini";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.csv' && ext !== '.json' && ext !== '.sql') {
      return cb(new Error('Only CSV, JSON, and SQL files are allowed'));
    }
    cb(null, true);
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes
  const apiRouter = app.route('/api');

  // Upload file endpoint
  app.post('/api/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const file = req.file;
      const fileType = path.extname(file.originalname).toLowerCase().substring(1); // Remove the dot
      
      // Parse the file based on its type
      const { tableName, schema, data, rowCount, columnCount } = await parseFile(file.buffer, fileType, file.originalname);
      
      // Store dataset info
      const dataset = await storage.createDataset({
        name: path.basename(file.originalname, path.extname(file.originalname)),
        originalFilename: file.originalname,
        fileType,
        tableName,
        schema,
        rowCount,
        columnCount
      });

      // Store the actual data
      await storage.storeTableData(tableName, schema, data);
      
      // Return dataset info and a preview of the data
      return res.json({
        dataset,
        preview: data.slice(0, 10) // First 10 rows as preview
      });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      return res.status(500).json({ message: error.message || 'Error processing file' });
    }
  });

  // Get dataset by ID
  app.get('/api/datasets/:id', async (req: Request, res: Response) => {
    try {
      const dataset = await storage.getDataset(parseInt(req.params.id));
      if (!dataset) {
        return res.status(404).json({ message: 'Dataset not found' });
      }
      return res.json(dataset);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  // Get all datasets
  app.get('/api/datasets', async (req: Request, res: Response) => {
    try {
      const datasets = await storage.getAllDatasets();
      return res.json(datasets);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  // Get table data preview
  app.get('/api/datasets/:id/preview', async (req: Request, res: Response) => {
    try {
      const dataset = await storage.getDataset(parseInt(req.params.id));
      if (!dataset) {
        return res.status(404).json({ message: 'Dataset not found' });
      }
      
      const preview = await storage.getTablePreview(dataset.tableName);
      return res.json(preview);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  // Ask a question about the dataset
  app.post('/api/datasets/:id/ask', async (req: Request, res: Response) => {
    try {
      const datasetId = parseInt(req.params.id);
      const question = req.body.question;
      
      if (!question) {
        return res.status(400).json({ message: 'Question is required' });
      }
      
      const dataset = await storage.getDataset(datasetId);
      if (!dataset) {
        return res.status(404).json({ message: 'Dataset not found' });
      }

      // Store user message
      await storage.createChatMessage({
        datasetId,
        role: 'user',
        content: question,
      });

      // Get the schema and some sample rows for context
      const tableSchema = dataset.schema;
      const sampleRows = await storage.getTablePreview(dataset.tableName);
      
      // Generate SQL with Gemini
      const { sql, explanation } = await generateSQL(question, tableSchema, sampleRows, dataset.tableName);
      
      // Execute the generated SQL
      const resultData = await storage.executeSQL(sql);
      
      // Generate chart data if appropriate
      let chartData = null;
      if (resultData.length > 0 && resultData.length <= 50) {
        // Simple heuristic: generate chart data for reasonable result sizes
        chartData = {
          type: 'bar', // Default chart type
          data: resultData
        };
      }
      
      // Store system response
      const systemMessage = await storage.createChatMessage({
        datasetId,
        role: 'system',
        content: explanation,
        sql,
        resultData,
        chartData
      });
      
      return res.json(systemMessage);
    } catch (error: any) {
      console.error('Error processing question:', error);
      return res.status(500).json({ message: error.message || 'Error processing question' });
    }
  });

  // Get chat history for a dataset
  app.get('/api/datasets/:id/chat', async (req: Request, res: Response) => {
    try {
      const datasetId = parseInt(req.params.id);
      const chatHistory = await storage.getChatHistory(datasetId);
      return res.json(chatHistory);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
