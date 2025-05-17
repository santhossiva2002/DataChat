import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { askQuestion } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";

const DataInsights = ({ datasetId, data }) => {
  const [insights, setInsights] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generate insights using the AI when component mounts or when dataset changes
  useEffect(() => {
    if (!datasetId || !data || data.length === 0) return;
    
    generateInsights();
  }, [datasetId, data]);

  // Ask Gemini AI for insights about the data
  const insightsMutation = useMutation({
    mutationFn: (question) => askQuestion(datasetId, question),
    onSuccess: (response) => {
      // Extract insights from the response
      if (response && response.content) {
        try {
          // Parse AI response to get insights
          const insightText = response.content;
          const insightsList = parseInsightsFromText(insightText);
          setInsights(insightsList);
        } catch (err) {
          console.error("Error parsing insights:", err);
          setError("Unable to parse insights from AI response");
        }
      }
      setIsLoading(false);
    },
    onError: (err) => {
      console.error("Error generating insights:", err);
      setError("Failed to generate insights. Please try again.");
      setIsLoading(false);
    }
  });

  // Function to extract insights from AI response text
  const parseInsightsFromText = (text) => {
    // Basic parsing - split by lines or bullet points
    const lines = text.split(/\n+/);
    const filteredLines = lines
      .filter(line => line.trim() !== '')
      .map(line => line.replace(/^[•\-*]\s*/, '').trim()) // Remove bullet point markers
      .filter(line => line.length > 10); // Filter out very short lines
    
    return filteredLines;
  };

  // Generate insights about the data
  const generateInsights = () => {
    setIsLoading(true);
    setError(null);
    
    // Craft a specific question to get data insights
    const question = "Analyze this data and provide 5 key insights about trends, patterns, anomalies, or relationships. Format as bullet points.";
    
    insightsMutation.mutate(question);
  };

  if (!datasetId || !data || data.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">AI-Powered Data Insights</h2>
            <p className="text-sm text-gray-500 mt-1">Gemini AI analysis of your dataset patterns and trends</p>
          </div>
          <Badge variant="outline" className="bg-primary-50 text-primary-700 border-primary-200">
            <i className="ri-ai-generate mr-1"></i> AI Generated
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-[85%]" />
            <Skeleton className="h-4 w-[70%]" />
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <div className="text-red-500 mb-3">{error}</div>
            <Button onClick={generateInsights} variant="outline" size="sm">
              <i className="ri-refresh-line mr-1"></i> Try Again
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.length > 0 ? (
              <ul className="space-y-3">
                {insights.map((insight, index) => (
                  <li key={index} className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary-100 text-primary-700 mr-3 font-medium text-sm">
                      {index + 1}
                    </div>
                    <div className="text-gray-700 text-sm flex-1">{insight}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="text-4xl mb-2">✨</div>
                <p className="text-gray-500 mb-4">Generate AI insights about your data to discover patterns and trends.</p>
                <Button onClick={generateInsights} className="gap-1">
                  <i className="ri-magic-line"></i> Generate Insights
                </Button>
              </div>
            )}
            
            {insights.length > 0 && (
              <div className="pt-3 flex justify-end">
                <Button onClick={generateInsights} variant="outline" size="sm" className="gap-1">
                  <i className="ri-refresh-line"></i> Refresh Insights
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataInsights;