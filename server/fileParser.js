import csv from 'csv-parser';
import { Readable } from 'stream';
import path from 'path';

// Parse different file types
export async function parseFile(buffer, fileType, originalFilename) {
  switch (fileType) {
    case 'csv':
      return parseCSV(buffer);
    case 'json':
      return parseJSON(buffer);
    case 'sql':
      return parseSQL(buffer, originalFilename);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

// Parse CSV files
async function parseCSV(buffer) {
  return new Promise((resolve, reject) => {
    const results = [];
    const readable = Readable.from(buffer.toString());
    
    readable
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        if (results.length === 0) {
          return reject(new Error('CSV file is empty or has an invalid format'));
        }
        
        // Extract schema from the first row
        const firstRow = results[0];
        const schema = {};
        
        // Determine the type of each column
        Object.keys(firstRow).forEach(key => {
          const value = firstRow[key];
          
          // Detect if numeric
          if (!isNaN(value) && value !== '') {
            // Check if integer or float
            schema[key] = Number.isInteger(Number(value)) ? 'integer' : 'float';
          } else if (value === 'true' || value === 'false') {
            schema[key] = 'boolean';
          } else if (
            // Basic date detection
            /^\d{4}-\d{2}-\d{2}/.test(value) || 
            /^\d{2}\/\d{2}\/\d{4}/.test(value)
          ) {
            schema[key] = 'date';
          } else {
            schema[key] = 'text';
          }
        });
        
        // Use sanitized keys for column names
        const sanitizedKeys = Object.keys(firstRow).map(key => key.trim().replace(/\s+/g, '_'));
        
        // Generate a table name from the first column or default
        const tableName = sanitizedKeys[0] ? `table_${sanitizedKeys[0].toLowerCase()}` : 'uploaded_data';
        
        resolve({
          tableName,
          schema,
          data: results,
          rowCount: results.length,
          columnCount: Object.keys(schema).length
        });
      })
      .on('error', reject);
  });
}

// Parse JSON files
async function parseJSON(buffer) {
  try {
    // Parse the JSON data
    const jsonStr = buffer.toString();
    const jsonData = JSON.parse(jsonStr);
    
    // Handle array of objects
    if (Array.isArray(jsonData) && jsonData.length > 0 && typeof jsonData[0] === 'object') {
      const firstRow = jsonData[0];
      const schema = {};
      
      // Determine the type of each column
      Object.keys(firstRow).forEach(key => {
        const value = firstRow[key];
        const type = typeof value;
        
        if (type === 'number') {
          schema[key] = Number.isInteger(value) ? 'integer' : 'float';
        } else if (type === 'boolean') {
          schema[key] = 'boolean';
        } else if (type === 'string') {
          // Check if it might be a date
          if (
            /^\d{4}-\d{2}-\d{2}/.test(value) || 
            /^\d{2}\/\d{2}\/\d{4}/.test(value)
          ) {
            schema[key] = 'date';
          } else {
            schema[key] = 'text';
          }
        } else if (value === null) {
          schema[key] = 'null';
        } else if (type === 'object') {
          schema[key] = 'json';
        } else {
          schema[key] = type;
        }
      });
      
      // Generate a table name from the first property or default
      const firstKey = Object.keys(firstRow)[0];
      const tableName = firstKey ? `table_${firstKey.toLowerCase()}` : 'json_data';
      
      return {
        tableName,
        schema,
        data: jsonData,
        rowCount: jsonData.length,
        columnCount: Object.keys(schema).length
      };
    } 
    // Handle object with array property
    else if (typeof jsonData === 'object') {
      // Find the first array property
      const arrayProps = Object.entries(jsonData)
        .filter(([_, value]) => Array.isArray(value) && value.length > 0);
      
      if (arrayProps.length > 0) {
        const [propName, propValue] = arrayProps[0];
        
        if (typeof propValue[0] === 'object') {
          const firstRow = propValue[0];
          const schema = {};
          
          // Determine the type of each column
          Object.keys(firstRow).forEach(key => {
            const value = firstRow[key];
            const type = typeof value;
            
            if (type === 'number') {
              schema[key] = Number.isInteger(value) ? 'integer' : 'float';
            } else if (type === 'boolean') {
              schema[key] = 'boolean';
            } else if (type === 'string') {
              // Check if it might be a date
              if (
                /^\d{4}-\d{2}-\d{2}/.test(value) || 
                /^\d{2}\/\d{2}\/\d{4}/.test(value)
              ) {
                schema[key] = 'date';
              } else {
                schema[key] = 'text';
              }
            } else if (value === null) {
              schema[key] = 'null';
            } else if (type === 'object') {
              schema[key] = 'json';
            } else {
              schema[key] = type;
            }
          });
          
          return {
            tableName: `table_${propName.toLowerCase()}`,
            schema,
            data: propValue,
            rowCount: propValue.length,
            columnCount: Object.keys(schema).length
          };
        }
      }
    }
    
    throw new Error('JSON file must contain an array of objects or an object with an array property');
  } catch (error) {
    throw new Error(`Error parsing JSON file: ${error.message}`);
  }
}

// Parse SQL files
async function parseSQL(buffer, originalFilename) {
  try {
    const sqlContent = buffer.toString();
    
    // Try to extract CREATE TABLE statement
    const createTableMatch = sqlContent.match(/CREATE\s+TABLE\s+(?:"([^"]+)"|([^\s(]+))\s*\(([^;]+)/i);
    
    if (createTableMatch) {
      const tableName = createTableMatch[1] || createTableMatch[2];
      const columnsDefinition = createTableMatch[3];
      
      // Parse column definitions
      const columnMatches = columnsDefinition.matchAll(/\s*(?:"([^"]+)"|([^\s,]+))\s+([^\s,)(]+)/g);
      const schema = {};
      
      for (const match of columnMatches) {
        const columnName = match[1] || match[2];
        const columnType = match[3].toLowerCase();
        
        if (columnName && !columnName.includes('CONSTRAINT') && !columnName.includes('PRIMARY')) {
          // Map SQL types to our schema types
          if (columnType.includes('int')) {
            schema[columnName] = 'integer';
          } else if (columnType.includes('float') || columnType.includes('double') || columnType.includes('decimal')) {
            schema[columnName] = 'float';
          } else if (columnType.includes('bool')) {
            schema[columnName] = 'boolean';
          } else if (columnType.includes('date') || columnType.includes('time')) {
            schema[columnName] = 'date';
          } else {
            schema[columnName] = 'text';
          }
        }
      }
      
      // Extract INSERT statements to get the data
      const insertMatches = sqlContent.matchAll(/INSERT\s+INTO\s+(?:"([^"]+)"|([^\s(]+))\s*(?:\([^)]+\))?\s*VALUES\s*([^;]+)/gi);
      const data = [];
      
      for (const match of insertMatches) {
        const insertTableName = match[1] || match[2];
        const valuesStr = match[3];
        
        // Only process inserts for our table
        if (insertTableName.toLowerCase() === tableName.toLowerCase()) {
          // Extract value groups (each row)
          const valueGroups = valuesStr.matchAll(/\(([^)]+)\)/g);
          
          for (const valueGroup of valueGroups) {
            const values = valueGroup[1].split(',').map(v => v.trim());
            
            // Create a row object matching our schema
            const row = {};
            let i = 0;
            
            for (const columnName of Object.keys(schema)) {
              if (i < values.length) {
                let value = values[i];
                
                // Remove quotes if present
                if ((value.startsWith("'") && value.endsWith("'")) || 
                    (value.startsWith('"') && value.endsWith('"'))) {
                  value = value.substring(1, value.length - 1);
                }
                
                // Convert to appropriate type
                if (schema[columnName] === 'integer') {
                  row[columnName] = parseInt(value, 10);
                } else if (schema[columnName] === 'float') {
                  row[columnName] = parseFloat(value);
                } else if (schema[columnName] === 'boolean') {
                  row[columnName] = value.toLowerCase() === 'true' || value === '1';
                } else {
                  row[columnName] = value;
                }
              }
              
              i++;
            }
            
            data.push(row);
          }
        }
      }
      
      return {
        tableName: tableName.toLowerCase(),
        schema,
        data,
        rowCount: data.length,
        columnCount: Object.keys(schema).length
      };
    }
    
    // If no CREATE TABLE statement found, create a simple schema based on the filename
    const baseFilename = path.basename(originalFilename, '.sql');
    const sanitizedTableName = baseFilename.replace(/\W+/g, '_').toLowerCase();
    
    return {
      tableName: sanitizedTableName,
      schema: { id: 'integer', data: 'text' },
      data: [{ id: 1, data: 'SQL file imported without schema detection' }],
      rowCount: 1,
      columnCount: 2
    };
  } catch (error) {
    throw new Error(`Error parsing SQL file: ${error.message}`);
  }
}
