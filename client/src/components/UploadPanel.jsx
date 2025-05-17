import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { uploadFile } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import DataSchemaViewer from "./DataSchemaViewer";
import DataInfo from "./DataInfo";
import SampleDataLoader from "./SampleDataLoader";

const UploadPanel = ({ onDatasetLoaded }) => {
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const { toast } = useToast();
  
  const uploadMutation = useMutation({
    mutationFn: (file) => uploadFile(file),
    onSuccess: (data) => {
      toast({
        title: "File uploaded successfully",
        description: `${file.name} has been uploaded and processed.`,
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/datasets'] });
      
      // Pass the dataset info to parent component
      if (onDatasetLoaded) {
        onDatasetLoaded(data.dataset, data.preview);
      }
      
      // Reset file state
      setFile(null);
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message || "An error occurred while uploading the file.",
        variant: "destructive",
      });
    }
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const fileExt = selectedFile.name.split('.').pop().toLowerCase();
      if (!['csv', 'json', 'sql'].includes(fileExt)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV, JSON, or SQL file.",
          variant: "destructive",
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      
      // Validate file type
      const fileExt = droppedFile.name.split('.').pop().toLowerCase();
      if (!['csv', 'json', 'sql'].includes(fileExt)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV, JSON, or SQL file.",
          variant: "destructive",
        });
        return;
      }
      
      setFile(droppedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleUpload = () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    uploadMutation.mutate(formData);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="lg:col-span-4 space-y-6">
      <Card className="shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Upload Data</h2>
          <p className="text-sm text-gray-500 mt-1">Upload your CSV, JSON, or SQL files to begin analysis.</p>
        </div>
        <CardContent className="p-6">
          <div 
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer group ${
              file ? 'border-primary bg-primary-50' : 'border-gray-300 hover:border-primary'
            }`}
            onClick={openFileDialog}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className="space-y-3">
              <i className={`ri-upload-cloud-2-line text-3xl ${file ? 'text-primary' : 'text-gray-400 group-hover:text-primary'}`}></i>
              <div>
                {file ? (
                  <p className="text-sm font-medium text-gray-700">{file.name}</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-700">Drag and drop your file here</p>
                    <p className="text-xs text-gray-500 mt-1">or click to browse files</p>
                  </>
                )}
              </div>
              <div className="flex justify-center space-x-2">
                <span className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">CSV</span>
                <span className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">JSON</span>
                <span className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">SQL</span>
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              accept=".csv,.json,.sql"
              onChange={handleFileChange}
            />
          </div>
          <div className="mt-4">
            <Button 
              className="w-full"
              onClick={handleUpload}
              disabled={!file || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? (
                <>
                  <span className="mr-2 animate-spin">●</span>
                  Uploading...
                </>
              ) : "Upload File"}
            </Button>
          </div>
          
          {/* Divider with text */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-2 text-xs text-gray-500">OR</span>
            </div>
          </div>
          
          {/* Sample Data Loader */}
          <SampleDataLoader onDatasetLoaded={onDatasetLoaded} />
        </CardContent>
      </Card>
      
      {uploadMutation.data && (
        <>
          <DataSchemaViewer schema={uploadMutation.data.dataset.schema} isLoading={false} />
          <DataInfo dataset={uploadMutation.data.dataset} />
        </>
      )}
    </div>
  );
};

export default UploadPanel;
