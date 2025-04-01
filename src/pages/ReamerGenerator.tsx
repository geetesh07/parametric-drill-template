
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { DrillViewer } from '@/components/DrillViewer';
import { Card, CardContent } from '@/components/ui/card';

const ReamerGenerator = () => {
  const [searchParams] = useSearchParams();
  const toolType = 'reamer';

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Reamer Designer</h1>
        <p className="text-muted-foreground">
          Design high-precision reamers with exact specifications
        </p>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <DrillViewer toolType={toolType} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ReamerGenerator;
