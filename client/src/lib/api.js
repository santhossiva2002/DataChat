import { apiRequest } from "./queryClient";

// File upload function
export async function uploadFile(formData) {
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
    credentials: 'include'
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error uploading file');
  }
  
  return response.json();
}

// Get all datasets
export async function getDatasets() {
  const response = await apiRequest('GET', '/api/datasets');
  return response.json();
}

// Get dataset by ID
export async function getDataset(id) {
  const response = await apiRequest('GET', `/api/datasets/${id}`);
  return response.json();
}

// Get data preview for a dataset
export async function getDataPreview(id) {
  const response = await apiRequest('GET', `/api/datasets/${id}/preview`);
  return response.json();
}

// Ask a question about a dataset
export async function askQuestion(datasetId, question) {
  try {
    // Make sure question is properly formatted as a string
    const questionText = typeof question === 'string' ? question : question.question;
    
    // Send the request with properly formatted data
    const response = await apiRequest('POST', `/api/datasets/${datasetId}/ask`, { 
      question: questionText 
    });
    
    return response.json();
  } catch (error) {
    console.error('Error in askQuestion:', error);
    throw error;
  }
}

// Get chat history for a dataset
export async function getChatHistory(datasetId) {
  const response = await apiRequest('GET', `/api/datasets/${datasetId}/chat`);
  return response.json();
}
