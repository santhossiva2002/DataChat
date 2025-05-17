import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

const DataInfo = ({ dataset }) => {
  if (!dataset) return null;
  
  return (
    <Card className="shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Data Information</h2>
      </div>
      <CardContent className="p-6 space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Table Name:</span>
          <span className="text-gray-900 font-medium">{dataset.tableName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Row Count:</span>
          <span className="text-gray-900 font-medium">{dataset.rowCount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Column Count:</span>
          <span className="text-gray-900 font-medium">{dataset.columnCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Uploaded:</span>
          <span className="text-gray-900 font-medium">{formatDate(dataset.uploadedAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataInfo;
