import * as THREE from 'three';
import Drawing from 'dxf-writer';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { generateDrillGeometry } from './drillGenerator';
import { DrillParameters } from '@/types/drill';
import { toast } from "sonner";

export const enhancedThreeJsToDXF = (
  threeJsModel: THREE.Object3D,
  filename: string,
  options = { includeTopView: true, includeFrontView: true, includeSideView: true }
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      console.log('Creating DXF drawing...');
      const drawing = new Drawing();
      
      drawing.addLayer('Top', Drawing.ACI.GREEN, 'CONTINUOUS');
      drawing.addLayer('Front', Drawing.ACI.BLUE, 'CONTINUOUS');
      drawing.addLayer('Side', Drawing.ACI.RED, 'CONTINUOUS');
      drawing.addLayer('Dimensions', Drawing.ACI.WHITE, 'CONTINUOUS');
      drawing.addLayer('Text', Drawing.ACI.MAGENTA, 'CONTINUOUS');
      
      const bbox = new THREE.Box3().setFromObject(threeJsModel);
      const size = new THREE.Vector3();
      bbox.getSize(size);
      
      const margin = Math.max(size.x, size.y, size.z) * 0.5;
      const offsetY = size.y + margin * 2;
      
      drawing.drawText(10, 10, 5, 0, `${filename} - Technical Drawing`);
      drawing.setActiveLayer('Text');
      drawing.drawText(10, 20, 3, 0, `Date: ${new Date().toLocaleDateString()}`);
      
      const orthoCamera = new THREE.OrthographicCamera(
        -size.x/2, size.x/2, 
        size.y/2, -size.y/2, 
        0.1, 1000
      );
      
      if (options.includeTopView) {
        console.log('Adding top view...');
        addTopView(drawing, threeJsModel, orthoCamera, {
          x: margin,
          y: offsetY * 2,
          scale: 1.0
        });
      }
      
      if (options.includeFrontView) {
        console.log('Adding front view...');
        addFrontView(drawing, threeJsModel, orthoCamera, {
          x: margin,
          y: offsetY,
          scale: 1.0
        });
      }
      
      if (options.includeSideView) {
        console.log('Adding side view...');
        addSideView(drawing, threeJsModel, orthoCamera, {
          x: margin + size.x + margin,
          y: offsetY,
          scale: 1.0
        });
      }
      
      console.log('Adding dimensions...');
      drawDimensions(drawing, size, margin, offsetY);
      
      console.log('Generating DXF content...');
      const dxfString = drawing.toDxfString();
      
      console.log('Creating download...');
      const blob = new Blob([dxfString], { type: 'application/dxf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.dxf`;
      document.body.appendChild(link);
      
      setTimeout(() => {
        console.log('Triggering download...');
        link.click();
        
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          console.log('Successfully exported enhanced DXF file');
          resolve();
        }, 100);
      }, 100);
      
    } catch (error) {
      console.error('Export error:', error);
      reject(new Error(`DXF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
};

function addTopView(drawing: any, object: THREE.Object3D, camera: THREE.OrthographicCamera, { x, y, scale }: { x: number, y: number, scale: number }) {
  drawing.setActiveLayer('Top');
  
  const clone = object.clone();
  
  camera.position.set(0, 0, 1000);
  camera.lookAt(0, 0, 0);
  camera.up.set(0, 1, 0);
  
  const edges = extractEdgesFromObject(clone);
  
  for (const edge of edges) {
    const start = edge.start;
    const end = edge.end;
    
    const startProjected = projectPointToPlane(start, camera);
    const endProjected = projectPointToPlane(end, camera);
    
    drawing.drawLine(
      x + startProjected.x * scale,
      y + startProjected.y * scale,
      x + endProjected.x * scale, 
      y + endProjected.y * scale
    );
  }
  
  drawing.setActiveLayer('Text');
  drawing.drawText(x, y - 10, 3.5, 0, 'TOP VIEW');
}

function addFrontView(drawing: any, object: THREE.Object3D, camera: THREE.OrthographicCamera, { x, y, scale }: { x: number, y: number, scale: number }) {
  drawing.setActiveLayer('Front');
  
  const clone = object.clone();
  
  camera.position.set(0, 1000, 0);
  camera.lookAt(0, 0, 0);
  camera.up.set(0, 0, -1);
  
  const edges = extractEdgesFromObject(clone);
  
  for (const edge of edges) {
    const start = edge.start;
    const end = edge.end;
    
    const startProjected = projectPointToPlane(start, camera);
    const endProjected = projectPointToPlane(end, camera);
    
    drawing.drawLine(
      x + startProjected.x * scale,
      y + startProjected.z * scale,
      x + endProjected.x * scale, 
      y + endProjected.z * scale
    );
  }
  
  drawing.setActiveLayer('Text');
  drawing.drawText(x, y - 10, 3.5, 0, 'FRONT VIEW');
}

function addSideView(drawing: any, object: THREE.Object3D, camera: THREE.OrthographicCamera, { x, y, scale }: { x: number, y: number, scale: number }) {
  drawing.setActiveLayer('Side');
  
  const clone = object.clone();
  
  camera.position.set(1000, 0, 0);
  camera.lookAt(0, 0, 0);
  camera.up.set(0, 1, 0);
  
  const edges = extractEdgesFromObject(clone);
  
  const sortedEdges = edges.sort((a, b) => {
    const aX = (a.start.x + a.end.x) / 2;
    const bX = (b.start.x + b.end.x) / 2;
    return bX - aX;
  });
  
  const drawnRegions = new Set<string>();
  
  for (const edge of sortedEdges) {
    const start = edge.start;
    const end = edge.end;
    
    const startProjected = projectPointToPlane(start, camera);
    const endProjected = projectPointToPlane(end, camera);
    
    const key = `${startProjected.y.toFixed(2)},${startProjected.z.toFixed(2)}-${endProjected.y.toFixed(2)},${endProjected.z.toFixed(2)}`;
    const reverseKey = `${endProjected.y.toFixed(2)},${endProjected.z.toFixed(2)}-${startProjected.y.toFixed(2)},${startProjected.z.toFixed(2)}`;
    
    if (!drawnRegions.has(key) && !drawnRegions.has(reverseKey)) {
      drawing.drawLine(
        x + startProjected.y * scale,
        y + startProjected.z * scale,
        x + endProjected.y * scale, 
        y + endProjected.z * scale
      );
      
      drawnRegions.add(key);
    }
  }
  
  drawing.setActiveLayer('Text');
  drawing.drawText(x, y - 10, 3.5, 0, 'SIDE VIEW');
}

function projectPointToPlane(point: THREE.Vector3, camera: THREE.OrthographicCamera): THREE.Vector3 {
  const vector = point.clone().sub(camera.position);
  const normal = camera.position.clone().normalize();
  const distance = vector.dot(normal);
  return point.clone().sub(normal.multiplyScalar(distance));
}

function extractEdgesFromObject(object: THREE.Object3D): { start: THREE.Vector3, end: THREE.Vector3 }[] {
  const edges: { start: THREE.Vector3, end: THREE.Vector3 }[] = [];
  const silhouetteEdges: { start: THREE.Vector3, end: THREE.Vector3 }[] = [];
  const helixLines: { start: THREE.Vector3, end: THREE.Vector3 }[] = [];
  
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const geometry = child.geometry;
      
      if (geometry instanceof THREE.BufferGeometry) {
        const edgesGeometry = new THREE.EdgesGeometry(geometry, 30);
        const positions = edgesGeometry.getAttribute('position').array;
        
        for (let i = 0; i < positions.length; i += 6) {
          const start = new THREE.Vector3(
            positions[i],
            positions[i + 1],
            positions[i + 2]
          );
          
          const end = new THREE.Vector3(
            positions[i + 3],
            positions[i + 4],
            positions[i + 5]
          );
          
          start.applyMatrix4(child.matrixWorld);
          end.applyMatrix4(child.matrixWorld);
          
          const edgeLength = start.distanceTo(end);
          const edgeDirection = new THREE.Vector3().subVectors(end, start).normalize();
          
          const isSignificant = edgeLength > 0.1;
          const isVertical = Math.abs(end.z - start.z) > Math.abs(end.x - start.x);
          const isHorizontal = Math.abs(end.x - start.x) > Math.abs(end.z - start.z);
          const isOutline = Math.abs(end.x - start.x) < 0.01 || Math.abs(end.z - start.z) < 0.01;
          const isCircular = Math.abs(edgeDirection.y) < 0.1;
          
          if (isSignificant && (isVertical || isHorizontal || isOutline || isCircular)) {
            silhouetteEdges.push({ start, end });
          }
        }
        
        if (geometry instanceof THREE.CylinderGeometry || geometry instanceof THREE.ConeGeometry) {
          const radius = geometry.parameters.radiusTop || geometry.parameters.radiusBottom;
          const height = geometry.parameters.height;
          const segments = geometry.parameters.radialSegments || 32;
          
          for (let i = 0; i < segments; i++) {
            const angle1 = (i / segments) * Math.PI * 2;
            const angle2 = ((i + 1) / segments) * Math.PI * 2;
            
            const topStart = new THREE.Vector3(
              radius * Math.cos(angle1),
              height / 2,
              radius * Math.sin(angle1)
            );
            const topEnd = new THREE.Vector3(
              radius * Math.cos(angle2),
              height / 2,
              radius * Math.sin(angle2)
            );
            
            const bottomStart = new THREE.Vector3(
              radius * Math.cos(angle1),
              -height / 2,
              radius * Math.sin(angle1)
            );
            const bottomEnd = new THREE.Vector3(
              radius * Math.cos(angle2),
              -height / 2,
              radius * Math.sin(angle2)
            );
            
            topStart.applyMatrix4(child.matrixWorld);
            topEnd.applyMatrix4(child.matrixWorld);
            bottomStart.applyMatrix4(child.matrixWorld);
            bottomEnd.applyMatrix4(child.matrixWorld);
            
            silhouetteEdges.push({ start: topStart, end: topEnd });
            silhouetteEdges.push({ start: bottomStart, end: bottomEnd });
          }
        }
      }
    } else if (child instanceof THREE.Line) {
      const geometry = child.geometry;
      if (geometry instanceof THREE.BufferGeometry) {
        const positions = geometry.getAttribute('position').array;
        
        const keyPoints = [];
        for (let i = 0; i < positions.length; i += 3) {
          const point = new THREE.Vector3(
            positions[i],
            positions[i + 1],
            positions[i + 2]
          );
          point.applyMatrix4(child.matrixWorld);
          keyPoints.push(point);
        }
        
        if (keyPoints.length >= 3) {
          helixLines.push({ start: keyPoints[0], end: keyPoints[1] });
          
          if (keyPoints.length > 4) {
            const midIndex = Math.floor(keyPoints.length / 2);
            helixLines.push({ start: keyPoints[midIndex], end: keyPoints[midIndex + 1] });
          }
          
          helixLines.push({ start: keyPoints[keyPoints.length - 2], end: keyPoints[keyPoints.length - 1] });
        }
      }
    }
  });
  
  return [...silhouetteEdges, ...helixLines];
}

function drawDimensions(drawing: any, size: THREE.Vector3, margin: number, offsetY: number) {
  drawing.setActiveLayer('Dimensions');
  
  const topX = margin;
  const topY = offsetY * 2;
  
  const dimOffset = 20;
  drawing.drawLine(topX, topY + dimOffset, topX + size.x, topY + dimOffset);
  drawing.drawLine(topX, topY + dimOffset - 5, topX, topY + dimOffset + 5);
  drawing.drawLine(topX + size.x, topY + dimOffset - 5, topX + size.x, topY + dimOffset + 5);
  drawing.drawText(topX + size.x/2, topY + dimOffset + 10, 3, 0, `${size.x.toFixed(2)}`);
  
  drawing.drawLine(topX + size.x + dimOffset, topY, topX + size.x + dimOffset, topY + size.y);
  drawing.drawLine(topX + size.x + dimOffset - 5, topY, topX + size.x + dimOffset + 5, topY);
  drawing.drawLine(topX + size.x + dimOffset - 5, topY + size.y, topX + size.x + dimOffset + 5, topY + size.y);
  drawing.drawText(topX + size.x + dimOffset + 10, topY + size.y/2, 3, 90, `${size.y.toFixed(2)}`);
  
  const frontX = margin;
  const frontY = offsetY;
  
  drawing.drawLine(frontX, frontY + dimOffset, frontX + size.x, frontY + dimOffset);
  drawing.drawLine(frontX, frontY + dimOffset - 5, frontX, frontY + dimOffset + 5);
  drawing.drawLine(frontX + size.x, frontY + dimOffset - 5, frontX + size.x, frontY + dimOffset + 5);
  drawing.drawText(frontX + size.x/2, frontY + dimOffset + 10, 3, 0, `${size.x.toFixed(2)}`);
  
  drawing.drawLine(frontX + size.x + dimOffset, frontY, frontX + size.x + dimOffset, frontY + size.z);
  drawing.drawLine(frontX + size.x + dimOffset - 5, frontY, frontX + size.x + dimOffset + 5, frontY);
  drawing.drawLine(frontX + size.x + dimOffset - 5, frontY + size.z, frontX + size.x + dimOffset + 5, frontY + size.z);
  drawing.drawText(frontX + size.x + dimOffset + 10, frontY + size.z/2, 3, 90, `${size.z.toFixed(2)}`);
}

export const exportDrillToDXF = async (
  parameters: DrillParameters,
  filename: string
): Promise<void> => {
  try {
    console.log('Starting DXF export process...');
    
    const drillGeometry = generateDrillGeometry(parameters);
    const mesh = new THREE.Mesh(drillGeometry);
    const group = new THREE.Group();
    group.add(mesh);
    
    if (parameters.fluteCount > 0) {
      console.log('Adding helix lines for flutes...');
      const { 
        diameter, 
        length, 
        shankLength,
        fluteCount,
        helixAngle,
        fluteLength
      } = parameters;
      
      const helixSegments = 32;
      const helixRadius = diameter / 2;
      const helixHeight = fluteLength;
      const helixAngleRad = (helixAngle * Math.PI) / 180;
      
      for (let i = 0; i < fluteCount; i++) {
        const startAngle = (i / fluteCount) * Math.PI * 2;
        const points = [];
        
        for (let j = 0; j <= helixSegments; j++) {
          const t = j / helixSegments;
          const angle = startAngle + t * Math.PI * 2 * helixAngle / 360;
          const y = -length / 2 + shankLength + t * helixHeight;
          const x = helixRadius * Math.cos(angle);
          const z = helixRadius * Math.sin(angle);
          points.push(new THREE.Vector3(x, y, z));
        }
        
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        group.add(line);
      }
    }
    
    console.log('Converting to DXF format...');
    await enhancedThreeJsToDXF(group, filename);
    
    console.log('DXF export completed successfully');
  } catch (error) {
    console.error('Failed to export DXF:', error);
    throw new Error(`DXF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const exportDrillToSTL = async (
  parameters: DrillParameters,
  filename: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const geometry = generateDrillGeometry(parameters);
      const scene = new THREE.Scene();
      const mesh = new THREE.Mesh(geometry);
      scene.add(mesh);
      
      const exporter = new STLExporter();
      const stlContent = exporter.parse(scene, { binary: true });
      
      const blob = new Blob([stlContent], { type: 'model/stl' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.stl`;
      document.body.appendChild(link);
      
      setTimeout(() => {
        link.click();
        
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          console.log('Successfully exported STL file');
          resolve();
        }, 100);
      }, 100);
    } catch (error) {
      console.error('Error generating STL:', error);
      reject(error);
    }
  });
};

export const exportDrillToSTEP = async (
  parameters: DrillParameters,
  filename: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      console.log('Starting STEP export process...');
      
      const timestamp = new Date().toISOString();
      const stepHeader = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('Drill bit model', 'Generated by Drill Designer Pro'), '2;1');
FILE_NAME(
  '${filename}.step',
  '${timestamp}',
  ('Drill Designer Pro'),
  ('CNC Drill Design Software'),
  'Drill Designer Pro v1.0',
  'Drill Designer Pro STEP converter',
  ''
);
FILE_SCHEMA(('AUTOMOTIVE_DESIGN { 1 0 10303 214 1 1 1 1 }'));
ENDSEC;
DATA;

/* ================ Drill Parameters ================ */
/* Diameter: ${parameters.diameter} mm */
/* Length: ${parameters.length} mm */
/* Shank Diameter: ${parameters.shankDiameter} mm */
/* Shank Length: ${parameters.shankLength} mm */
/* Flute Count: ${parameters.fluteCount} */
/* Flute Length: ${parameters.fluteLength} mm */
/* Non-Cutting Length: ${parameters.nonCuttingLength} mm */
/* Tip Angle: ${parameters.tipAngle}° */
/* Helix Angle: ${parameters.helixAngle}° */
/* Material: ${parameters.material} */
/* Tolerance: ${parameters.tolerance} */
/* Surface Finish: ${parameters.surfaceFinish} */

/* ================ STEP 3D Model Data ================ */
/* This is a simplified representation of what would be generated by a real STEP exporter */
/* The actual STEP file would contain full 3D geometry data */

#1 = APPLICATION_CONTEXT('automotive design');
#2 = APPLICATION_PROTOCOL_DEFINITION('draft international standard','automotive_design',1998,#1);
#3 = MECHANICAL_CONTEXT('none',#1,'mechanical');
#4 = PRODUCT('${filename}','Drill bit','',(#3));
#5 = PRODUCT_RELATED_PRODUCT_CATEGORY('part','',(#4));
#6 = PRODUCT_DEFINITION_FORMATION_WITH_SPECIFIED_SOURCE('','',#4,.NOT_KNOWN.);
#7 = PRODUCT_DEFINITION_CONTEXT('part definition',#1,'design');
#8 = PRODUCT_DEFINITION('',' ',#6,#7);

/* Coordinate system */
#10 = CARTESIAN_POINT('',(0.,0.,0.));
#11 = DIRECTION('',(0.,0.,1.));
#12 = DIRECTION('',(1.,0.,0.));
#13 = AXIS2_PLACEMENT_3D('',#10,#11,#12);

/* Shank cylinder */
#20 = CYLINDRICAL_SURFACE('',#13,${parameters.shankDiameter/2});
#21 = ORIENTED_EDGE('',*,*,#22,.F.);
#22 = EDGE_CURVE('',#23,#24,#25,.T.);
#23 = VERTEX_POINT('',#24);
#24 = CARTESIAN_POINT('',(${parameters.shankDiameter/2},0.,0.));
#25 = CIRCLE('',#13,${parameters.shankDiameter/2});

/* Fluted cylinder */
#30 = CYLINDRICAL_SURFACE('',#13,${parameters.diameter/2});
#31 = ORIENTED_EDGE('',*,*,#32,.F.);
#32 = EDGE_CURVE('',#33,#34,#35,.T.);
#33 = VERTEX_POINT('',#34);
#34 = CARTESIAN_POINT('',(${parameters.diameter/2},0.,${-parameters.shankLength}));
#35 = CIRCLE('',#36,${parameters.diameter/2});
#36 = AXIS2_PLACEMENT_3D('',#37,#11,#12);
#37 = CARTESIAN_POINT('',(0.,0.,${-parameters.shankLength}));

/* Cone tip */
#40 = CONICAL_SURFACE('',#41,${parameters.diameter/2},${90 - parameters.tipAngle/2});
#41 = AXIS2_PLACEMENT_3D('',#42,#11,#12);
#42 = CARTESIAN_POINT('',(0.,0.,${-parameters.length + parameters.tipAngle/(2*Math.tan(parameters.tipAngle*Math.PI/360))}));

/* Helix curves for flutes */
${generateFlutesStepData(parameters)}

/* Assembly Information */
#100 = SHAPE_DEFINITION_REPRESENTATION(#101,#102);
#101 = PRODUCT_DEFINITION_SHAPE('','',#8);
#102 = ADVANCED_BREP_SHAPE_REPRESENTATION('',(#13,#20,#30,#40),#103);
#103 = ( GEOMETRIC_REPRESENTATION_CONTEXT(3) 
GLOBAL_UNCERTAINTY_ASSIGNED_CONTEXT((#104)) GLOBAL_UNIT_ASSIGNED_CONTEXT
((#105,#106,#107)) REPRESENTATION_CONTEXT('Context #1',
  '3D Context with UNIT and UNCERTAINTY') );
#104 = UNCERTAINTY_MEASURE_WITH_UNIT(LENGTH_MEASURE(1.E-07),#105,
  'distance_accuracy_value','confusion accuracy');
#105 = ( LENGTH_UNIT() NAMED_UNIT(*) SI_UNIT(.MILLI.,.METRE.) );
#106 = ( NAMED_UNIT(*) PLANE_ANGLE_UNIT() SI_UNIT($,.RADIAN.) );
#107 = ( NAMED_UNIT(*) SI_UNIT($,.STERADIAN.) SOLID_ANGLE_UNIT() );

ENDSEC;
END-ISO-10303-21;`;
      
      const blob = new Blob([stepHeader], { type: 'application/step' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.step`;
      document.body.appendChild(link);
      
      setTimeout(() => {
        link.click();
        
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          console.log('Successfully exported STEP file');
          resolve();
        }, 100);
      }, 100);
    } catch (error) {
      console.error('Error generating STEP file:', error);
      reject(error);
    }
  });
};

function generateFlutesStepData(parameters: DrillParameters): string {
  let fluteData = '';
  
  if (parameters.fluteCount > 0) {
    const radius = parameters.diameter / 2;
    const helixPitch = Math.PI * parameters.diameter / Math.tan((parameters.helixAngle * Math.PI) / 180);
    
    for (let i = 0; i < parameters.fluteCount; i++) {
      const baseAngle = (2 * Math.PI * i) / parameters.fluteCount;
      const startIndex = 200 + i * 10;
      
      fluteData += `/* Flute ${i+1} */
#${startIndex} = HELIX('Flute ${i+1}',#${startIndex+1},${radius},${helixPitch},${baseAngle});
#${startIndex+1} = AXIS2_PLACEMENT_3D('',#${startIndex+2},#11,#12);
#${startIndex+2} = CARTESIAN_POINT('',(0.,0.,${-parameters.shankLength}));
`;
    }
  }
  
  return fluteData;
}

export const exportDrillModel = async (
  parameters: DrillParameters,
  format: string,
  filename: string,
  showToasts: boolean = true
): Promise<void> => {
  let loadingToast: string | number | undefined;
  
  try {
    const sanitizedFilename = filename || `Drill_${parameters.diameter}mm_${parameters.length}mm`;
    
    if (showToasts) {
      loadingToast = toast.loading(`Generating ${format.toUpperCase()} file...`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log(`Starting export for format: ${format}`);
    
    switch (format.toLowerCase()) {
      case 'stl':
        console.log('Exporting STL format...');
        await exportDrillToSTL(parameters, sanitizedFilename);
        break;
        
      case 'dxf':
        console.log('Exporting DXF format...');
        await exportDrillToDXF(parameters, sanitizedFilename);
        break;
      
      case 'step':
        console.log('Exporting STEP format...');
        await exportDrillToSTEP(parameters, sanitizedFilename);
        break;
              
      default:
        console.log(`Format ${format} not directly supported, falling back to template...`);
        await exportGenericFormat(format, parameters, sanitizedFilename);
        break;
    }
    
    if (showToasts) {
      toast.success(`Exported ${sanitizedFilename}.${format.toLowerCase()} successfully`);
    }
  } catch (error) {
    console.error(`Error exporting ${format}:`, error);
    if (showToasts) {
      toast.error(`Failed to export ${format.toUpperCase()}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } finally {
    if (loadingToast && showToasts) {
      toast.dismiss(loadingToast);
    }
  }
};

async function exportGenericFormat(format: string, parameters: DrillParameters, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      let content = '';
      let mimeType = 'text/plain';
      
      if (format === 'json') {
        content = JSON.stringify(parameters, null, 2);
        mimeType = 'application/json';
      } else if (format === 'csv') {
        const headers = Object.keys(parameters).join(',');
        const values = Object.values(parameters).join(',');
        content = `${headers}\n${values}`;
        mimeType = 'text/csv';
      } else if (format === 'pdf') {
        const content = `PDF DOCUMENT TEMPLATE
        
Drill Specifications
-------------------
Diameter: ${parameters.diameter} mm
Length: ${parameters.length} mm
Shank Diameter: ${parameters.shankDiameter} mm
Shank Length: ${parameters.shankLength} mm
Flute Count: ${parameters.fluteCount}
Flute Length: ${parameters.fluteLength} mm
Tip Angle: ${parameters.tipAngle}°
Helix Angle: ${parameters.helixAngle}°
Material: ${parameters.material.toUpperCase()}
Tolerance: ${parameters.tolerance}
Surface Finish: ${parameters.surfaceFinish}

Note: This is a template - in production, a real PDF with technical drawings would be generated.`;
        mimeType = 'application/pdf';
      }
      
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.${format}`;
      document.body.appendChild(link);
      
      setTimeout(() => {
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          resolve();
        }, 100);
      }, 100);
      
    } catch (error) {
      console.error(`Error exporting ${format}:`, error);
      reject(error);
    }
  });
}
