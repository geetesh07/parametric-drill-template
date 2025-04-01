import React, { useCallback, useMemo, useRef } from 'react';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Download, RefreshCw, Save } from 'lucide-react';
import { toast } from "sonner";
import { DrillParameters, ToleranceType, MaterialType, SurfaceFinishType } from '../types/drill';

interface ParameterInputProps {
  parameters: DrillParameters;
  onParameterChange: (key: keyof DrillParameters, value: number | string) => void;
  onExport: () => void;
  onReset: () => void;
}

const ParameterInput: React.FC<ParameterInputProps> = ({
  parameters,
  onParameterChange,
  onExport,
  onReset
}) => {
  // Debounce timer ref
  const debounceTimer = useRef<NodeJS.Timeout>();
  
  // Memoize calculateMinLength
  const calculateMinLength = useCallback((params: DrillParameters) => {
    return params.shankLength + params.fluteLength + 
      (Math.abs(params.diameter - params.shankDiameter) / 2);
  }, []);

  // Debounced parameter change handler
  const debouncedParameterChange = useCallback((key: keyof DrillParameters, value: number | string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      onParameterChange(key, value);
    }, 100);
  }, [onParameterChange]);

  const handleParameterChange = useCallback((key: keyof DrillParameters, value: number | string) => {
    // Handle string inputs immediately for better responsiveness
    if (typeof value === 'string' && value !== '') {
      debouncedParameterChange(key, value);
      return;
    }

    // Convert to number for validation
    const numValue = typeof value === 'number' ? value : parseFloat(value as string);
    
    // Prevent negative values
    if (numValue < 0) {
      debouncedParameterChange(key, 0);
      return;
    }

    // Special handling for length-related parameters
    if (key === 'shankLength' || key === 'fluteLength' || key === 'diameter' || key === 'shankDiameter') {
      const updatedParams = { ...parameters, [key]: numValue };
      const minLength = calculateMinLength(updatedParams);
      
      // Batch updates
      const updates: { key: keyof DrillParameters; value: number }[] = [];
      
      if (updatedParams.length < minLength) {
        updates.push(
          { key: 'length', value: minLength },
          { key: 'nonCuttingLength', value: 0 },
          { key, value: numValue }
        );
        
        toast.warning(`Adjusted overall length to minimum: ${minLength.toFixed(2)}mm`, {
          description: 'Length was automatically adjusted to accommodate the minimum required length.',
          duration: 3000,
          position: 'top-center',
        });
      } else {
        const newNonCuttingLength = updatedParams.length - minLength;
        updates.push(
          { key: 'nonCuttingLength', value: newNonCuttingLength },
          { key, value: numValue }
        );
      }
      
      // Apply updates with debouncing
      updates.forEach(update => debouncedParameterChange(update.key, update.value));
      
    } else if (key === 'length') {
      // For overall length, allow any value during typing
      debouncedParameterChange(key, numValue);
      
      // Only validate and adjust when the input is complete
      if (typeof value === 'number' || (typeof value === 'string' && value !== '' && !(value as string).endsWith('.'))) {
        const minLength = calculateMinLength(parameters);
        
        if (numValue < minLength) {
          debouncedParameterChange('length', minLength);
          debouncedParameterChange('nonCuttingLength', 0);
          
          toast.error(`Length cannot be less than ${minLength.toFixed(2)}mm`, {
            description: `Minimum required length:\n` +
              `• Shank Length: ${parameters.shankLength}mm\n` +
              `• Flute Length: ${parameters.fluteLength}mm\n` +
              (Math.abs(parameters.diameter - parameters.shankDiameter) > 0 
                ? `• Chamfer Height: ${(Math.abs(parameters.diameter - parameters.shankDiameter) / 2).toFixed(2)}mm\n`
                : '') +
              `\nTotal Minimum: ${minLength.toFixed(2)}mm`,
            duration: 4000,
            position: 'top-center',
          });
        } else {
          const newNonCuttingLength = numValue - minLength;
          debouncedParameterChange('nonCuttingLength', newNonCuttingLength);
        }
      }
    } else {
      // For all other parameters, just update normally
      debouncedParameterChange(key, numValue);
    }
  }, [parameters, calculateMinLength, debouncedParameterChange]);

  // Memoize all calculations
  const minLength = useMemo(() => calculateMinLength(parameters), [
    parameters.shankLength,
    parameters.fluteLength,
    parameters.diameter,
    parameters.shankDiameter,
    calculateMinLength
  ]);

  const chamferHeight = useMemo(() => 
    Math.abs(parameters.diameter - parameters.shankDiameter) / 2,
    [parameters.diameter, parameters.shankDiameter]
  );

  const nonCuttingLength = useMemo(() => 
    parameters.length - minLength,
    [parameters.length, minLength]
  );

  // Memoize handlers for sliders and inputs
  const handleSliderChange = useCallback((key: keyof DrillParameters) => (value: number[]) => {
    handleParameterChange(key, value[0]);
  }, [handleParameterChange]);

  const handleInputChange = useCallback((key: keyof DrillParameters) => (e: React.ChangeEvent<HTMLInputElement>) => {
    handleParameterChange(key, e.target.value);
  }, [handleParameterChange]);

  // Cleanup debounce timer on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <Card className="w-full max-w-md glass animate-slide-up">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-light tracking-tight">Drill Parameters</CardTitle>
        <CardDescription>
          Configure the dimensions and properties of your drill
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="dimensions" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="dimensions" className="flex-1">Dimensions</TabsTrigger>
            <TabsTrigger value="features" className="flex-1">Features</TabsTrigger>
            <TabsTrigger value="materials" className="flex-1">Materials</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dimensions" className="space-y-4 animate-fade-in">
            {/* Diameter parameters first */}
            <div className="p-3 bg-primary/5 rounded-md mb-2">
              <h3 className="text-sm font-medium mb-2">Diameter Parameters</h3>
              
              {/* Drill Diameter */}
              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center">
                  <Label htmlFor="diameter" className="text-sm font-medium">
                    Drill Diameter (mm)
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {parameters.diameter} mm
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <Slider
                    id="diameter"
                    min={0}
                    max={50}
                    step={0.1}
                    value={[parameters.diameter]}
                    onValueChange={handleSliderChange('diameter')}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min="0"
                    value={parameters.diameter}
                    onChange={handleInputChange('diameter')}
                    className="w-16 text-right parameter-input"
                  />
                </div>
              </div>

              {/* Shank Diameter */}
              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center">
                  <Label htmlFor="shankDiameter" className="text-sm font-medium">
                    Shank Diameter (mm)
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {parameters.shankDiameter} mm
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <Slider
                    id="shankDiameter"
                    min={0}
                    max={50}
                    step={0.1}
                    value={[parameters.shankDiameter]}
                    onValueChange={handleSliderChange('shankDiameter')}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min="0"
                    value={parameters.shankDiameter}
                    onChange={handleInputChange('shankDiameter')}
                    className="w-16 text-right parameter-input"
                  />
                </div>
                {/* Chamfer Height Display */}
                {Math.abs(parameters.diameter - parameters.shankDiameter) > 0 && (
                  <div className="mt-2 p-2 bg-muted rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium">Chamfer Height:</span>
                      <span className="text-xs text-muted-foreground">
                        {(Math.abs(parameters.diameter - parameters.shankDiameter) / 2).toFixed(2)} mm
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Tolerance */}
              <div className="space-y-2">
                <Label htmlFor="tolerance" className="text-sm font-medium">
                  Diameter Tolerance
                </Label>
                <Select
                  value={parameters.tolerance}
                  onValueChange={(value: ToleranceType) => handleParameterChange('tolerance', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tolerance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="h7">h7 (0 to -0.025 mm)</SelectItem>
                    <SelectItem value="h8">h8 (0 to -0.039 mm)</SelectItem>
                    <SelectItem value="h9">h9 (0 to -0.062 mm)</SelectItem>
                    <SelectItem value="h10">h10 (0 to -0.100 mm)</SelectItem>
                    <SelectItem value="H7">H7 (+0.025 to 0 mm)</SelectItem>
                    <SelectItem value="H8">H8 (+0.039 to 0 mm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tip Angle */}
              <div className="space-y-2 mt-3">
                <div className="flex justify-between items-center">
                  <Label htmlFor="tipAngle" className="text-sm font-medium">
                    Tip Angle (degrees)
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {parameters.tipAngle}°
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <Slider
                    id="tipAngle"
                    min={60}
                    max={180}
                    step={1}
                    value={[parameters.tipAngle]}
                    onValueChange={handleSliderChange('tipAngle')}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min={60}
                    max={180}
                    value={parameters.tipAngle}
                    onChange={handleInputChange('tipAngle')}
                    className="w-16 text-right parameter-input"
                  />
                </div>
              </div>
            </div>

            {/* Length parameters */}
            <div className="p-3 bg-primary/5 rounded-md mb-2">
              <h3 className="text-sm font-medium mb-2">Length Parameters</h3>
              
              {/* Shank Length - moved to the top */}
              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center">
                  <Label htmlFor="shankLength" className="text-sm font-medium">
                    Shank Length (mm)
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {parameters.shankLength} mm
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <Slider
                    id="shankLength"
                    min={0}
                    max={100}
                    step={1}
                    value={[parameters.shankLength]}
                    onValueChange={handleSliderChange('shankLength')}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min="0"
                    value={parameters.shankLength}
                    onChange={handleInputChange('shankLength')}
                    className="w-16 text-right parameter-input"
                  />
                </div>
              </div>

              {/* Flute Length - moved to dimensions section */}
              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center">
                  <Label htmlFor="fluteLength" className="text-sm font-medium">
                    Flute Length (mm)
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {parameters.fluteLength} mm
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <Slider
                    id="fluteLength"
                    min={0}
                    max={100}
                    step={1}
                    value={[parameters.fluteLength]}
                    onValueChange={handleSliderChange('fluteLength')}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min="0"
                    value={parameters.fluteLength}
                    onChange={handleInputChange('fluteLength')}
                    className="w-16 text-right parameter-input"
                  />
                </div>
              </div>
              
              {/* Overall Length Input */}
              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center">
                  <Label htmlFor="overallLength" className="text-sm font-medium">
                    Overall Length (mm)
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {parameters.length} mm
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <Slider
                    id="length"
                    min={0}
                    max={200}
                    step={0.1}
                    value={[parameters.length]}
                    onValueChange={handleSliderChange('length')}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min="0"
                    value={parameters.length}
                    onChange={handleInputChange('length')}
                    onBlur={handleInputChange('length')}
                    className="w-16 text-right parameter-input"
                  />
                </div>
                
                {/* Minimum Length Information */}
                <div className="mt-2 p-2 bg-muted rounded-md">
                  <div className="text-xs space-y-1">
                    <div className="font-medium">Minimum Required Length:</div>
                    <div className="flex justify-between">
                      <span>• Shank Length:</span>
                      <span>{parameters.shankLength} mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Flute Length:</span>
                      <span>{parameters.fluteLength} mm</span>
                    </div>
                    {Math.abs(parameters.diameter - parameters.shankDiameter) > 0 && (
                      <div className="flex justify-between">
                        <span>• Chamfer Height:</span>
                        <span>{(Math.abs(parameters.diameter - parameters.shankDiameter) / 2).toFixed(2)} mm</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium border-t border-border/40 mt-1 pt-1">
                      <span>Total Minimum:</span>
                      <span>
                        {(parameters.shankLength + parameters.fluteLength + 
                          (Math.abs(parameters.diameter - parameters.shankDiameter) / 2)).toFixed(2)} mm
                      </span>
                    </div>
                    {parameters.length > (parameters.shankLength + parameters.fluteLength + 
                      (Math.abs(parameters.diameter - parameters.shankDiameter) / 2)) && (
                      <div className="flex justify-between text-muted-foreground border-t border-border/40 mt-1 pt-1">
                        <span>Additional Non-cutting Length:</span>
                        <span>
                          {(parameters.length - (parameters.shankLength + parameters.fluteLength + 
                            (Math.abs(parameters.diameter - parameters.shankDiameter) / 2))).toFixed(2)} mm
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Non-Cutting Length (Now calculated automatically) */}
              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center">
                  <Label htmlFor="nonCuttingLength" className="text-sm font-medium">
                    Non-Cutting Length (mm)
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {parameters.nonCuttingLength.toFixed(2)} mm
                  </span>
                </div>
                <Input
                  type="number"
                  value={parameters.nonCuttingLength.toFixed(2)}
                  readOnly
                  className="w-full bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Automatically adjusted based on overall length
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="features" className="space-y-4 animate-fade-in">
            <div className="space-y-2">
              <Label htmlFor="fluteCount" className="text-sm font-medium">
                Number of Flutes
              </Label>
              <Select
                value={parameters.fluteCount.toString()}
                onValueChange={(value) => handleParameterChange('fluteCount', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select flute count" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Flute (Reamer)</SelectItem>
                  <SelectItem value="2">2 Flutes (Standard)</SelectItem>
                  <SelectItem value="3">3 Flutes (Medium-Hard Materials)</SelectItem>
                  <SelectItem value="4">4 Flutes (Finishing)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="helix" className="text-sm font-medium">
                  Helix Angle (degrees)
                </Label>
                <span className="text-xs text-muted-foreground">
                  {parameters.helixAngle}°
                </span>
              </div>
              <div className="flex gap-2 items-center">
                <Slider
                  id="helix"
                  min={10}
                  max={45}
                  step={1}
                  value={[parameters.helixAngle]}
                  onValueChange={handleSliderChange('helixAngle')}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={parameters.helixAngle}
                  onChange={handleInputChange('helixAngle')}
                  className="w-16 text-right parameter-input"
                />
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-muted/50 rounded-md">
              <h4 className="text-sm font-medium mb-2">Technical Notes</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• <span className="font-medium">Single Flute:</span> For reaming, simple drilling of soft materials</li>
                <li>• <span className="font-medium">Two Flutes:</span> Standard, general purpose drilling</li>
                <li>• <span className="font-medium">Three Flutes:</span> Better finish, for harder materials</li>
                <li>• <span className="font-medium">Four Flutes:</span> Finishing operations, very precise holes</li>
                <li>• Larger helix angles provide better chip evacuation</li>
                <li>• Standard tip angle is 118° for general purpose drilling</li>
              </ul>
            </div>
          </TabsContent>
          
          <TabsContent value="materials" className="space-y-4 animate-fade-in">
            <div className="space-y-2">
              <Label htmlFor="material" className="text-sm font-medium">
                Material
              </Label>
              <Select
                value={parameters.material}
                onValueChange={(value: MaterialType) => handleParameterChange('material', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hss">HSS (High Speed Steel)</SelectItem>
                  <SelectItem value="carbide">Carbide</SelectItem>
                  <SelectItem value="cobalt">Cobalt</SelectItem>
                  <SelectItem value="titanium">Titanium Coated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="surface" className="text-sm font-medium">
                Surface Finish
              </Label>
              <Select
                value={parameters.surfaceFinish}
                onValueChange={(value: SurfaceFinishType) => handleParameterChange('surfaceFinish', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select surface finish" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="polished">Polished</SelectItem>
                  <SelectItem value="black-oxide">Black Oxide</SelectItem>
                  <SelectItem value="tin">TiN Coated</SelectItem>
                  <SelectItem value="aln">AlN Coated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="mt-4 p-3 bg-muted/50 rounded-md">
              <h4 className="text-sm font-medium mb-2">Material Properties</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• <span className="font-medium">HSS:</span> General purpose, good balance of hardness and toughness</li>
                <li>• <span className="font-medium">Carbide:</span> Higher hardness, better wear resistance, higher speeds</li>
                <li>• <span className="font-medium">Cobalt:</span> Better heat resistance, for harder materials</li>
                <li>• <span className="font-medium">Titanium:</span> Improved lubricity, heat resistance, and tool life</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <Separator />
      <CardFooter className="flex justify-between pt-4">
        <Button variant="outline" size="sm" onClick={onReset} className="gap-1">
          <RefreshCw size={14} />
          Reset
        </Button>
        <Button onClick={onExport} className="gap-1 btn-primary">
          <Download size={14} />
          Export Model
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ParameterInput;
