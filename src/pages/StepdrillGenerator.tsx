
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { DrillViewer } from '@/components/DrillViewer';
import { Card, CardContent } from '@/components/ui/card';

const StepdrillGenerator = () => {
  const [searchParams] = useSearchParams();
  const toolType = 'stepdrill';

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Step Drill Designer</h1>
        <p className="text-muted-foreground">
          Create multi-diameter step drills for efficient hole making
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

export default StepdrillGenerator;
