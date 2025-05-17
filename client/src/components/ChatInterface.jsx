import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQuery } from "@tanstack/react-query";
import { askQuestion, getChatHistory } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";

const ChatMessage = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex items-start ${isUser ? 'justify-end mb-5' : 'mb-5 gap-x-3'}`}>
      {!isUser && (
        <div className="flex-shrink-0">
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary-100 text-primary-600">
            <i className="ri-robot-line"></i>
          </div>
        </div>
      )}
      
      <div className={`${isUser 
        ? 'chat-bubble-user bg-primary-600 px-4 py-3 rounded-lg text-white max-w-3xl' 
        : 'chat-bubble-system bg-gray-100 px-4 py-3 rounded-lg max-w-3xl space-y-3'}`}
      >
        <p className={`text-sm ${isUser ? 'text-white' : 'text-gray-800'}`}>
          {message.content}
        </p>
        
        {!isUser && message.sql && (
          <div className="bg-gray-800 rounded-md p-3 text-xs text-gray-200 font-mono overflow-x-auto">
            <pre>{message.sql}</pre>
          </div>
        )}
        
        {!isUser && message.resultData && message.resultData.length > 0 && (
          <div className="overflow-x-auto bg-white rounded-md border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(message.resultData[0]).map((key, index) => (
                    <th 
                      key={index} 
                      scope="col" 
                      className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {message.resultData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {Object.keys(row).map((key, colIndex) => (
                      <td key={colIndex} className="px-3 py-2 whitespace-nowrap text-gray-600">
                        {String(row[key] !== null ? row[key] : '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const WelcomeMessage = () => (
  <div className="flex items-start mb-5 gap-x-3">
    <div className="flex-shrink-0">
      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary-100 text-primary-600">
        <i className="ri-robot-line"></i>
      </div>
    </div>
    <div className="chat-bubble-system bg-gray-100 px-4 py-3 rounded-lg max-w-3xl">
      <p className="text-sm text-gray-800">
        Welcome to DataChat! I can help you analyze your data. Upload a file to get started, then ask questions like:
      </p>
      <ul className="mt-2 space-y-1 text-sm text-gray-700 list-disc list-inside">
        <li>"How many sales were made in each category?"</li>
        <li>"What's the total revenue by product category?"</li>
        <li>"Which products have the highest discount rate?"</li>
      </ul>
    </div>
  </div>
);

const ChatInterface = ({ datasetId }) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  
  // Fetch chat history with auto-refresh
  const { 
    data: chatHistory = [], 
    isLoading: isLoadingHistory,
    refetch: refetchChatHistory
  } = useQuery({
    queryKey: [`/api/datasets/${datasetId}/chat`],
    enabled: !!datasetId,
    refetchInterval: 2000 // Poll for updates
  });
  
  // Auto scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);
  
  // Ask question mutation
  const askMutation = useMutation({
    mutationFn: async (questionText) => {
      const response = await askQuestion(datasetId, questionText);
      return response;
    },
    onSuccess: (data) => {
      // Force refetch chat history
      refetchChatHistory();
      setMessage('');
    },
    onError: (error) => {
      console.error("Error asking question:", error);
    }
  });
  
  const handleSendMessage = (e) => {
    e.preventDefault(); // Prevent form submission
    if (!message.trim() || !datasetId) return;
    
    try {
      // Clear input field immediately
      const currentMessage = message;
      setMessage('');
      
      // Send to server
      askMutation.mutate(currentMessage);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
  
  if (isLoadingHistory) {
    return (
      <Card className="shadow-sm border border-gray-200 overflow-hidden flex flex-col" style={{ height: '600px' }}>
        <div className="px-6 py-5 border-b border-gray-200">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
        <div className="border-t border-gray-200 px-4 py-3">
          <Skeleton className="h-10 w-full" />
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-sm border border-gray-200 overflow-hidden flex flex-col" style={{ height: '600px' }}>
      <div className="px-6 py-5 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Ask about your data</h2>
        <p className="text-sm text-gray-500 mt-1">Ask questions in natural language and get instant insights.</p>
      </div>
      
      {/* Message History */}
      <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar">
        {datasetId ? (
          <>
            {chatHistory.length === 0 && <WelcomeMessage />}
            
            {/* Render actual chat messages */}
            {chatHistory.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            
            {/* Loading indicator */}
            {askMutation.isPending && (
              <div className="flex items-start mb-5 gap-x-3">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary-100 text-primary-600 animate-pulse">
                    <i className="ri-robot-line"></i>
                  </div>
                </div>
                <div className="chat-bubble-system bg-gray-100 px-4 py-3 rounded-lg max-w-3xl">
                  <p className="text-sm text-gray-800">Thinking...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <WelcomeMessage />
        )}
      </div>
      
      {/* Input Area */}
      <div className="border-t border-gray-200 px-4 py-3">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Ask a question about your data..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={!datasetId || askMutation.isPending}
              className="pl-4 pr-10 py-2.5"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <i className="ri-message-3-line text-gray-400"></i>
            </div>
          </div>
          <Button 
            type="submit" 
            disabled={!message.trim() || !datasetId || askMutation.isPending}
            className="inline-flex items-center"
          >
            <i className="ri-send-plane-fill mr-1"></i>
            Send
          </Button>
        </form>
      </div>
    </Card>
  );
};

export default ChatInterface;