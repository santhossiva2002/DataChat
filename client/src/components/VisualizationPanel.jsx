import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Chart from 'chart.js/auto';

// Predefined color palettes
const COLOR_PALETTES = {
  default: {
    backgroundColor: 'rgba(79, 70, 229, 0.6)',
    borderColor: 'rgba(79, 70, 229, 1)',
  },
  blue: {
    backgroundColor: 'rgba(59, 130, 246, 0.6)',
    borderColor: 'rgba(59, 130, 246, 1)',
  },
  green: {
    backgroundColor: 'rgba(16, 185, 129, 0.6)',
    borderColor: 'rgba(16, 185, 129, 1)',
  },
  red: {
    backgroundColor: 'rgba(239, 68, 68, 0.6)',
    borderColor: 'rgba(239, 68, 68, 1)',
  },
  orange: {
    backgroundColor: 'rgba(249, 115, 22, 0.6)',
    borderColor: 'rgba(249, 115, 22, 1)',
  },
  purple: {
    backgroundColor: 'rgba(139, 92, 246, 0.6)',
    borderColor: 'rgba(139, 92, 246, 1)',
  },
  gradient: {
    backgroundColor: 'linear-gradient(45deg, rgba(79, 70, 229, 0.6), rgba(59, 130, 246, 0.6))',
    borderColor: 'rgba(79, 70, 229, 1)',
  }
};

const VisualizationPanel = ({ data, chartType: initialChartType = 'bar' }) => {
  const [chartType, setChartType] = useState(initialChartType);
  const [selectedPalette, setSelectedPalette] = useState('default');
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  
  // Extract insights from the data
  const generateInsights = (data) => {
    if (!data || data.length === 0) return [];
    
    let insights = [];
    
    // Simple insights based on data type
    const numericKeys = Object.keys(data[0]).filter(key => 
      !isNaN(data[0][key]) && typeof data[0][key] !== 'boolean'
    );
    
    if (numericKeys.length > 0) {
      const key = numericKeys[0];
      const values = data.map(item => Number(item[key]));
      
      // Find max and min
      const maxValue = Math.max(...values);
      const maxItem = data.find(item => Number(item[key]) === maxValue);
      
      const minValue = Math.min(...values);
      const minItem = data.find(item => Number(item[key]) === minValue);
      
      // Calculate average
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      
      insights = [
        `The highest ${key} is ${maxValue}.`,
        `The lowest ${key} is ${minValue}.`,
        `The average ${key} is ${avg.toFixed(2)}.`
      ];
    }
    
    return insights;
  };
  
  const insights = generateInsights(data);
  
  useEffect(() => {
    if (!data || data.length === 0 || !chartRef.current) return;
    
    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    // Determine if we can create a chart from this data
    const labels = Object.keys(data[0]);
    const numericKeys = labels.filter(key => 
      !isNaN(data[0][key]) && typeof data[0][key] !== 'boolean'
    );
    
    if (numericKeys.length === 0) return;
    
    // For simplicity, use the first numeric column for the y-axis
    // and the first non-numeric column (if any) for the x-axis
    const yKey = numericKeys[0];
    const nonNumericKeys = labels.filter(key => isNaN(data[0][key]) || typeof data[0][key] === 'boolean');
    const xKey = nonNumericKeys.length > 0 ? nonNumericKeys[0] : labels[0];
    
    // Extract data
    const chartLabels = data.map(item => item[xKey]?.toString());
    const chartData = data.map(item => Number(item[yKey]));
    
    // Get selected color palette
    const colorPalette = COLOR_PALETTES[selectedPalette] || COLOR_PALETTES.default;
    
    // Prepare colors for multiple datasets if needed (like for pie charts)
    const generateColors = (count) => {
      const colors = [];
      const baseColors = [
        'rgba(79, 70, 229, 0.6)', // indigo
        'rgba(59, 130, 246, 0.6)', // blue
        'rgba(16, 185, 129, 0.6)', // green
        'rgba(239, 68, 68, 0.6)',  // red
        'rgba(249, 115, 22, 0.6)', // orange
        'rgba(139, 92, 246, 0.6)'  // purple
      ];
      
      // If we're using a specific palette, adjust all colors to be shades of that palette
      if (selectedPalette !== 'default' && selectedPalette !== 'gradient') {
        const mainColor = colorPalette.backgroundColor;
        for (let i = 0; i < count; i++) {
          // Create variations of the main color with different opacity
          const opacity = 0.3 + (i * 0.1);
          colors.push(mainColor.replace(/[\d\.]+\)$/, `${opacity})`));
        }
      } else {
        // Use the range of colors
        for (let i = 0; i < count; i++) {
          colors.push(baseColors[i % baseColors.length]);
        }
      }
      
      return colors;
    };
    
    // Create background colors array depending on chart type
    let backgroundColor;
    if (chartType === 'pie' || chartType === 'doughnut') {
      backgroundColor = generateColors(chartLabels.length);
    } else {
      backgroundColor = colorPalette.backgroundColor;
    }
    
    // Create chart
    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new Chart(ctx, {
      type: chartType,
      data: {
        labels: chartLabels,
        datasets: [{
          label: yKey,
          data: chartData,
          backgroundColor: backgroundColor,
          borderColor: colorPalette.borderColor,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false,
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: yKey
            },
            display: chartType !== 'pie' && chartType !== 'doughnut',
          },
          x: {
            title: {
              display: true,
              text: xKey
            },
            display: chartType !== 'pie' && chartType !== 'doughnut',
          }
        }
      }
    });
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, chartType, selectedPalette]);
  
  const handleChartTypeChange = (value) => {
    setChartType(value);
  };
  
  const handlePaletteChange = (value) => {
    setSelectedPalette(value);
  };
  
  const downloadChart = (format = 'png') => {
    if (!chartRef.current) return;
    
    let url, fileName, mimeType;
    
    if (format === 'png') {
      url = chartRef.current.toDataURL('image/png');
      fileName = 'datachat_chart.png';
      mimeType = 'image/png';
    } else if (format === 'jpg') {
      url = chartRef.current.toDataURL('image/jpeg', 0.8);
      fileName = 'datachat_chart.jpg';
      mimeType = 'image/jpeg';
    } else if (format === 'pdf') {
      // For simplicity, we're using PNG for PDF too
      // In a real app, you'd want to use a PDF library
      url = chartRef.current.toDataURL('image/png');
      fileName = 'datachat_chart.pdf';
      mimeType = 'application/pdf';
    }
    
    const link = document.createElement('a');
    link.download = fileName;
    link.href = url;
    link.click();
    
    setIsExportOpen(false);
  };
  
  const exportData = () => {
    if (!data || data.length === 0) return;
    
    // Convert data to CSV
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => 
          typeof row[header] === 'string' ? `"${row[header]}"` : row[header]
        ).join(',')
      )
    ].join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'chart_data.csv');
    link.click();
    
    setIsExportOpen(false);
  };
  
  if (!data || data.length === 0) {
    return null;
  }
  
  return (
    <Card className="shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex flex-col md:flex-row justify-between md:items-center space-y-3 md:space-y-0">
          <h2 className="text-lg font-semibold text-gray-800">Data Visualization</h2>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Chart Type Selector */}
            <Select value={chartType} onValueChange={handleChartTypeChange}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Chart Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="pie">Pie Chart</SelectItem>
                <SelectItem value="doughnut">Doughnut Chart</SelectItem>
                <SelectItem value="scatter">Scatter Plot</SelectItem>
                <SelectItem value="radar">Radar Chart</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Color Palette Selector */}
            <Select value={selectedPalette} onValueChange={handlePaletteChange}>
              <SelectTrigger className="w-[110px]">
                <SelectValue placeholder="Colors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="blue">Blue</SelectItem>
                <SelectItem value="green">Green</SelectItem>
                <SelectItem value="red">Red</SelectItem>
                <SelectItem value="orange">Orange</SelectItem>
                <SelectItem value="purple">Purple</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Export Buttons - Visible on all screen sizes */}
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1 px-2 md:px-3" 
                onClick={() => downloadChart('png')}
              >
                <i className="ri-image-line mr-1"></i>
                <span>PNG</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1 px-2 md:px-3"
                onClick={() => downloadChart('jpg')}
              >
                <i className="ri-image-line mr-1"></i>
                <span>JPG</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1 px-2 md:px-3"
                onClick={exportData}
              >
                <i className="ri-file-excel-line mr-1"></i>
                <span>CSV</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="md:col-span-3 h-80">
            <canvas ref={chartRef} width="400" height="300" className="w-full h-full"></canvas>
          </div>
          <div className="md:col-span-2">
            <Tabs defaultValue="insights" className="h-full">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="insights">Chart Insights</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="insights" className="h-[calc(100%-48px)]">
                <div className="bg-gray-50 rounded-lg p-4 h-full">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Data Insights</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {insights.map((insight, index) => (
                      <li key={index} className="flex items-start">
                        <i className="ri-information-line text-primary-500 mt-0.5 mr-2 flex-shrink-0"></i>
                        <span>{insight}</span>
                      </li>
                    ))}
                    
                    <li className="flex items-start mt-4">
                      <i className="ri-lightbulb-line text-amber-500 mt-0.5 mr-2 flex-shrink-0"></i>
                      <span className="text-gray-700 font-medium">
                        Try asking: "What's the trend of this data over time?"
                      </span>
                    </li>
                  </ul>
                </div>
              </TabsContent>
              
              <TabsContent value="settings" className="h-[calc(100%-48px)]">
                <div className="bg-gray-50 rounded-lg p-4 h-full">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Chart Type</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {['bar', 'line', 'pie', 'doughnut', 'scatter', 'radar'].map(type => (
                          <Button 
                            key={type} 
                            variant={chartType === type ? "default" : "outline"} 
                            size="sm"
                            onClick={() => setChartType(type)}
                            className="capitalize"
                          >
                            {type}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Color Theme</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.keys(COLOR_PALETTES).map(palette => (
                          <Button 
                            key={palette} 
                            variant={selectedPalette === palette ? "default" : "outline"} 
                            size="sm"
                            onClick={() => setSelectedPalette(palette)}
                            className="capitalize"
                          >
                            {palette}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VisualizationPanel;
