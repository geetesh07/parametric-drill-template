import React, { useState, useCallback } from 'react';
import { DrillViewer } from '@/components/DrillViewer';
import { Card, CardContent } from '@/components/ui/card';
import { DrillParameters } from '@/types/drill';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ParameterInput from '@/components/ParameterInput';
import { toast } from 'sonner';
import { exportDrillModel } from '@/lib/exportUtils';
import { useSettings } from '@/context/SettingsContext';
import { Switch } from '@/components/ui/switch';
import { Bell, BellOff } from 'lucide-react';
import LoadingBar from '@/components/LoadingBar';
import ExportLoadingIndicator from '@/components/ExportLoadingIndicator';

const DrillGenerator = () => {
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const { showToasts, setShowToasts } = useSettings();
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
  const [isModelGenerated, setIsModelGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'stl' | 'dxf'>('stl');

  const handleParameterChange = useCallback((key: keyof DrillParameters, value: any) => {
    setParameters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const handleReset = useCallback(() => {
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
    setIsModelGenerated(false);
  }, []);

  const handleGenerateModel = useCallback(() => {
    setIsGenerating(true);
    
    // Simulate the generation process with a longer timeout
    setTimeout(() => {
      try {
        setIsModelGenerated(true);
        if (showToasts) {
          toast('Drill model generated successfully', {
            description: 'You can now view the 3D model and export it if needed.',
          });
        }
      } catch (error) {
        console.error('Model generation error:', error);
        if (showToasts) {
          toast.error('Failed to generate model', {
            description: error instanceof Error ? error.message : 'Unknown error occurred',
          });
        }
      } finally {
        setIsGenerating(false);
      }
    }, 30000); // Increased to 30 seconds to match LoadingBar duration
  }, [showToasts]);

  const handleExport = useCallback(async (format: 'stl' | 'dxf') => {
    try {
      setIsExporting(true);
      setExportFormat(format);
      
      // Simulate export process with a timeout
      setTimeout(async () => {
        await exportDrillModel(parameters, format, `Drill_${parameters.diameter}mm_${parameters.length}mm`, showToasts);
        setIsExporting(false);
        
        if (showToasts) {
          toast('Drill model exported successfully', {
            description: `The model has been exported in ${format.toUpperCase()} format.`,
          });
        }
      }, 5000); // 5 seconds for export
    } catch (error) {
      console.error('Export error:', error);
      setIsExporting(false);
      
      if (showToasts) {
        toast.error('Failed to export model', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }, [parameters, showToasts]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold dark:text-white">Drill Designer</h1>
          <div className="flex items-center gap-2">
            {showToasts ? <Bell size={18} className="dark:text-white" /> : <BellOff size={18} className="dark:text-white" />}
            <Switch 
              checked={showToasts} 
              onCheckedChange={setShowToasts} 
              id="toast-notifications"
              aria-label="Toggle notifications"
            />
            <label htmlFor="toast-notifications" className="text-sm dark:text-white">
              {showToasts ? "Notifications On" : "Notifications Off"}
            </label>
          </div>
        </div>
        <p className="text-muted-foreground dark:text-gray-400">
          Design custom drill bits with precise specifications
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-[400px_1fr] gap-6">
        <ParameterInput 
          parameters={parameters}
          onParameterChange={handleParameterChange}
          onReset={handleReset}
          onExport={handleExport}
          onGenerateModel={handleGenerateModel}
          isGenerating={isGenerating}
        />

        <Card className="dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="aspect-video">
              {isModelGenerated ? (
                <DrillViewer 
                  parameters={parameters}
                  viewMode={viewMode}
                  wireframe={false}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted dark:bg-gray-700 rounded-lg">
                  <p className="text-muted-foreground dark:text-gray-400">
                    Complete the parameter setup to generate the drill model
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <LoadingBar 
        isLoading={isGenerating} 
        duration={30000} 
        onComplete={() => setIsGenerating(false)}
      />
      
      <ExportLoadingIndicator 
        isExporting={isExporting}
        format={exportFormat}
        onComplete={() => setIsExporting(false)}
      />
    </div>
  );
};

export default DrillGenerator;
