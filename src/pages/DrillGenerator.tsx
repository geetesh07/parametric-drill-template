import React, { useState } from 'react';
import { DrillViewer } from '@/components/DrillViewer';
import { Card, CardContent } from '@/components/ui/card';
import { DrillParameters } from '@/types/drill';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ParameterInput from '@/components/ParameterInput';

const DrillGenerator = () => {
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [parameters, setParameters] = useState<DrillParameters>({
    diameter: 10,
    length: 100,
    shankDiameter: 10,
    shankLength: 30,
    fluteCount: 2,
    fluteLength: 60,
    nonCuttingLength: 10,
    tipAngle: 118,
    helixAngle: 30,
    material: 'hss',
    tolerance: 'h8',
    surfaceFinish: 'polished'
  });

  const handleParameterChange = (key: keyof DrillParameters, value: any) => {
    setParameters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleReset = () => {
    setParameters({
      diameter: 10,
      length: 100,
      shankDiameter: 10,
      shankLength: 30,
      fluteCount: 2,
      fluteLength: 60,
      nonCuttingLength: 10,
      tipAngle: 118,
      helixAngle: 30,
      material: 'hss',
      tolerance: 'h8',
      surfaceFinish: 'polished'
    });
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export clicked');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Drill Designer</h1>
        <p className="text-muted-foreground">
          Design custom drill bits with precise specifications
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-[400px_1fr] gap-6">
        <ParameterInput 
          parameters={parameters}
          onParameterChange={handleParameterChange}
          onReset={handleReset}
          onExport={handleExport}
        />

        <Card>
          <CardContent className="p-4">
            <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)} className="mb-4">
              <TabsList>
                <TabsTrigger value="3d">3D View</TabsTrigger>
                <TabsTrigger value="2d">2D View</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="aspect-video">
              <DrillViewer 
                parameters={parameters}
                viewMode={viewMode}
                wireframe={false}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DrillGenerator;
