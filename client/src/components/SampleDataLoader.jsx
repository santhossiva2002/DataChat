import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { uploadFile } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import sampleData from "@/data/sampleData.json";

const SampleDataLoader = ({ onDatasetLoaded }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLoadSampleData = async () => {
    setIsLoading(true);
    
    try {
      // Convert sample data to a Blob representing a JSON file
      const jsonString = JSON.stringify(sampleData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // Create a File object from the Blob
      const file = new File([blob], 'sample_sales_data.json', { type: 'application/json' });
      
      // Create FormData to upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload the file using the existing API
      const response = await uploadFile(formData);
      
      // Handle successful upload
      if (response && response.dataset) {
        toast({
          title: "Sample data loaded",
          description: `Successfully loaded sample sales data with ${response.dataset.rowCount} rows.`,
          variant: "success",
        });
        
        // Invalidate datasets query to refresh the list
        queryClient.invalidateQueries({ queryKey: ['/api/datasets'] });
        
        // Pass the dataset info to parent component
        if (onDatasetLoaded) {
          onDatasetLoaded(response.dataset, response.preview);
        }
      }
    } catch (error) {
      console.error("Error loading sample data:", error);
      toast({
        title: "Error loading sample data",
        description: error.message || "An error occurred while loading the sample data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-sm border border-gray-200 overflow-hidden mb-4">
      <CardContent className="p-6">
        <div className="flex flex-col space-y-3">
          <div className="text-center">
            <h3 className="text-base font-medium text-gray-800 mb-2">Don't have your own data?</h3>
            <p className="text-sm text-gray-500 mb-4">Try our sample sales dataset to explore the features</p>
            <Button 
              onClick={handleLoadSampleData}
              disabled={isLoading}
              variant="outline"
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">●</span>
                  Loading...
                </>
              ) : (
                <>
                  <i className="ri-database-2-line"></i>
                  Load Sample Dataset
                </>
              )}
            </Button>
          </div>
          
          <div className="mt-3 text-xs text-gray-500">
            <p className="mb-1">Sample dataset contains:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Sales transactions across different regions</li>
              <li>Customer demographic information</li>
              <li>Product categories with pricing details</li>
              <li>Discount and revenue data</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SampleDataLoader;