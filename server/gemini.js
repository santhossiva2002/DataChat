// Google Gemini API implementation
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API with the API key from environment variables
export async function generateSQL(question, tableSchema, sampleRows, tableName) {
  try {
    // Get API key from environment variable
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set in environment variables");
      throw new Error("Missing API key for Gemini");
    }
    
    // Initialize the API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });
    
    // Convert schema to a readable format
    const schemaDescription = Object.entries(tableSchema)
      .map(([column, type]) => `${column} (${type})`)
      .join('\n');
    
    // Convert sample rows to a readable format
    const sampleRowsStr = JSON.stringify(sampleRows, null, 2);
    
    // Create the prompt for Gemini
    const prompt = `
You are an SQL expert working with a database. Here's the structure for a table named "${tableName}":

Table Schema:
${schemaDescription}

Here are a few sample rows from the table to help you understand the data types:
${sampleRowsStr}

The user wants to know: "${question}"

Please generate an SQL query to answer this question and provide a brief explanation of what the query does.
Return a valid JSON with the following format:
{
  "sql": "YOUR SQL QUERY HERE",
  "explanation": "A clear explanation of what the query does and why it answers the user's question"
}
    `;
    
    // Call the Gemini API
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Parse the JSON response
    // The response might have markdown code blocks, so we need to extract the JSON
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                      text.match(/```\n([\s\S]*?)\n```/) || 
                      text.match(/{[\s\S]*?}/);
    
    let parsedResponse;
    
    if (jsonMatch) {
      try {
        parsedResponse = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch (e) {
        console.error("Error parsing JSON response from Gemini:", e);
        // Fall back to a simple extraction of SQL and explanation
        const sqlMatch = text.match(/sql["']:\s*["'](.+?)["']/);
        const explanationMatch = text.match(/explanation["']:\s*["'](.+?)["']/);
        
        parsedResponse = {
          sql: sqlMatch ? sqlMatch[1] : "SELECT * FROM " + tableName + " LIMIT 10",
          explanation: explanationMatch 
            ? explanationMatch[1] 
            : "I couldn't generate a good SQL query for your question. Here's a basic query to show the data."
        };
      }
    } else {
      // If we can't extract JSON, try to extract SQL directly
      const sqlMatch = text.match(/```sql\n([\s\S]*?)\n```/) || text.match(/SELECT[\s\S]*?;/i);
      
      parsedResponse = {
        sql: sqlMatch ? sqlMatch[1] || sqlMatch[0] : "SELECT * FROM " + tableName + " LIMIT 10",
        explanation: "Here's the data from your table. " + 
          "I tried to answer your question but couldn't generate a structured response."
      };
    }
    
    return {
      sql: parsedResponse.sql,
      explanation: parsedResponse.explanation
    };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return {
      sql: `SELECT * FROM ${tableName} LIMIT 10`,
      explanation: "I encountered an error while trying to generate SQL for your question. " +
        "Here's a simple query to show a preview of your data instead."
    };
  }
}
