import { useState } from "react";
import UploadPanel from "@/components/UploadPanel";
import DataPreviewTable from "@/components/DataPreviewTable";
import ChatInterface from "@/components/ChatInterface";
import VisualizationPanel from "@/components/VisualizationPanel";
import DataInsights from "@/components/DataInsights";
import Logo from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

const Home = () => {
  const [currentDataset, setCurrentDataset] = useState(null);
  const [dataPreview, setDataPreview] = useState(null);
  const { toast } = useToast();
  
  const handleDatasetLoaded = (dataset, preview) => {
    setCurrentDataset(dataset);
    setDataPreview(preview);
    
    toast({
      title: "Dataset loaded",
      description: `Successfully loaded ${dataset.name} with ${dataset.rowCount} rows.`,
    });
  };
  
  // Fetch latest chart data from the last system message
  const { data: chatHistory = [] } = useQuery({
    queryKey: currentDataset ? [`/api/datasets/${currentDataset.id}/chat`] : null,
    enabled: !!currentDataset,
  });
  
  // Find the latest system message with chart data
  const latestChartData = chatHistory
    .filter(msg => msg.role === 'system' && msg.chartData)
    .pop()?.chartData?.data;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center">
            <Logo size="md" />
            
            <div className="flex items-center space-x-3">
              <a 
                href="https://github.com/santhossiva2002/datachat" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <i className="ri-github-fill text-xl"></i>
              </a>
              <a 
                href="/api-docs" 
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <i className="ri-book-2-line text-xl"></i>
              </a>
              <button 
                className="text-gray-500 hover:text-gray-700 transition-colors"
                title="Dark mode coming soon"
              >
                <i className="ri-moon-line text-xl"></i>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* App Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Panel - Upload */}
            <UploadPanel onDatasetLoaded={handleDatasetLoaded} />
            
            {/* Right Content Section */}
            <div className="lg:col-span-8 space-y-6">
              <DataPreviewTable 
                data={dataPreview} 
                isLoading={false} 
              />
              
              {/* Data visualization and insights */}
              <div className="space-y-6">
                <VisualizationPanel 
                  data={latestChartData || dataPreview} 
                  chartType="bar" 
                />
                
                <DataInsights 
                  datasetId={currentDataset?.id} 
                  data={dataPreview} 
                />
              </div>
              
              <ChatInterface datasetId={currentDataset?.id} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} DataChat. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
