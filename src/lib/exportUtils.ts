import * as THREE from 'three';
import Drawing from 'dxf-writer';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { generateDrillGeometry } from './drillGenerator';
import { DrillParameters } from '@/types/drill';
import { toast } from "sonner";

// Enhanced DXF export using multiple orthographic projections
export const enhancedThreeJsToDXF = (
  threeJsModel: THREE.Object3D,
  filename: string,
  options = { includeTopView: true, includeFrontView: true, includeSideView: true }
): void => {
  try {
    // Create a new DXF drawing
    const drawing = new Drawing();
    
    // Set up initial layers
    drawing.addLayer('Top', Drawing.ACI.GREEN, 'CONTINUOUS');
    drawing.addLayer('Front', Drawing.ACI.BLUE, 'CONTINUOUS');
    drawing.addLayer('Side', Drawing.ACI.RED, 'CONTINUOUS');
    drawing.addLayer('Dimensions', Drawing.ACI.WHITE, 'CONTINUOUS');
    drawing.addLayer('Text', Drawing.ACI.MAGENTA, 'CONTINUOUS');
    
    // Get the bounding box of the object to scale and position views
    const bbox = new THREE.Box3().setFromObject(threeJsModel);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    
    // Calculate view positions (paper space)
    const margin = Math.max(size.x, size.y, size.z) * 0.5;
    const offsetY = size.y + margin * 2;
    
    // Add title block
    drawing.drawText(10, 10, 5, 0, `${filename} - Technical Drawing`);
    drawing.setActiveLayer('Text');
    drawing.drawText(10, 20, 3, 0, `Date: ${new Date().toLocaleDateString()}`);
    
    // Process and add views
    if (options.includeTopView) {
      addTopView(drawing, threeJsModel, {
        x: margin,
        y: offsetY * 2,
        scale: 1.0
      });
    }
    
    if (options.includeFrontView) {
      addFrontView(drawing, threeJsModel, {
        x: margin,
        y: offsetY,
        scale: 1.0
      });
    }
    
    if (options.includeSideView) {
      addSideView(drawing, threeJsModel, {
        x: margin + size.x + margin,
        y: offsetY,
        scale: 1.0
      });
    }
    
    // Add dimensions
    drawDimensions(drawing, size, margin, offsetY);
    
    // Generate the DXF content
    const dxfString = drawing.toDxfString();
    
    // Create a blob and trigger download
    const blob = new Blob([dxfString], { type: 'application/dxf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.dxf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    
    console.log('Successfully exported enhanced DXF file');
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
};

// Add a top view (XY plane) to the drawing
function addTopView(drawing: any, object: THREE.Object3D, { x, y, scale }: { x: number, y: number, scale: number }) {
  drawing.setActiveLayer('Top');
  
  // Clone the object for manipulation
  const clone = object.clone();
  
  // Extract all edges from the object (from geometry)
  const edges = extractEdgesFromObject(clone);
  
  // Project all edges to XY plane (top view)
  for (const edge of edges) {
    const start = edge.start;
    const end = edge.end;
    
    drawing.drawLine(
      x + start.x * scale,
      y + start.y * scale,
      x + end.x * scale, 
      y + end.y * scale
    );
  }
  
  // Add label for the view
  drawing.setActiveLayer('Text');
  drawing.drawText(x, y - 10, 3.5, 0, 'TOP VIEW');
}

// Add a front view (XZ plane) to the drawing
function addFrontView(drawing: any, object: THREE.Object3D, { x, y, scale }: { x: number, y: number, scale: number }) {
  drawing.setActiveLayer('Front');
  
  // Clone the object for manipulation
  const clone = object.clone();
  
  // Extract all edges from the object
  const edges = extractEdgesFromObject(clone);
  
  // Project all edges to XZ plane (front view)
  for (const edge of edges) {
    const start = edge.start;
    const end = edge.end;
    
    drawing.drawLine(
      x + start.x * scale,
      y + start.z * scale,
      x + end.x * scale, 
      y + end.z * scale
    );
  }
  
  // Add label for the view
  drawing.setActiveLayer('Text');
  drawing.drawText(x, y - 10, 3.5, 0, 'FRONT VIEW');
}

// Add a side view (YZ plane) to the drawing
function addSideView(drawing: any, object: THREE.Object3D, { x, y, scale }: { x: number, y: number, scale: number }) {
  drawing.setActiveLayer('Side');
  
  // Clone the object for manipulation
  const clone = object.clone();
  
  // Extract all edges from the object
  const edges = extractEdgesFromObject(clone);
  
  // Sort edges by Y coordinate (depth from side view) to handle hidden lines
  const sortedEdges = edges.sort((a, b) => {
    // Calculate average X coordinate (which represents depth in side view)
    const aX = (a.start.x + a.end.x) / 2;
    const bX = (b.start.x + b.end.x) / 2;
    return bX - aX; // Sort from front to back
  });
  
  // Keep track of drawn regions to handle hidden lines
  const drawnRegions = new Set<string>();
  
  // Project visible edges to YZ plane (side view)
  for (const edge of sortedEdges) {
    const start = edge.start;
    const end = edge.end;
    
    // Create a key for this line segment in YZ space
    const key = `${start.y.toFixed(2)},${start.z.toFixed(2)}-${end.y.toFixed(2)},${end.z.toFixed(2)}`;
    const reverseKey = `${end.y.toFixed(2)},${end.z.toFixed(2)}-${start.y.toFixed(2)},${start.z.toFixed(2)}`;
    
    // Only draw if we haven't drawn this region before (visible edge)
    if (!drawnRegions.has(key) && !drawnRegions.has(reverseKey)) {
      drawing.drawLine(
        x + start.y * scale,
        y + start.z * scale,
        x + end.y * scale, 
        y + end.z * scale
      );
      
      // Mark this region as drawn
      drawnRegions.add(key);
    }
  }
  
  // Add label for the view
  drawing.setActiveLayer('Text');
  drawing.drawText(x, y - 10, 3.5, 0, 'SIDE VIEW');
}

// Helper to extract edges from a Three.js object (including meshes and lines)
function extractEdgesFromObject(object: THREE.Object3D): { start: THREE.Vector3, end: THREE.Vector3 }[] {
  const edges: { start: THREE.Vector3, end: THREE.Vector3 }[] = [];
  const silhouetteEdges: { start: THREE.Vector3, end: THREE.Vector3 }[] = [];
  const helixLines: { start: THREE.Vector3, end: THREE.Vector3 }[] = [];
  
  // Process the object and all its children
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const geometry = child.geometry;
      
      if (geometry instanceof THREE.BufferGeometry) {
        // Create an EdgesGeometry with a high threshold to get only sharp edges
        const edgesGeometry = new THREE.EdgesGeometry(geometry, 30); // 30-degree threshold
        const positions = edgesGeometry.getAttribute('position').array;
        
        // Extract potential silhouette edges
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
          
          // Apply the object's world matrix
          start.applyMatrix4(child.matrixWorld);
          end.applyMatrix4(child.matrixWorld);
          
          // Only add edges that are likely part of the silhouette
          // This checks if the edge is roughly vertical in side view
          const isVertical = Math.abs(end.z - start.z) > Math.abs(end.x - start.x);
          const isOutline = Math.abs(end.x - start.x) < 0.01; // Small threshold for outline
          
          if (isVertical || isOutline) {
            silhouetteEdges.push({ start, end });
          }
        }
      }
    } else if (child instanceof THREE.Line) {
      // Extract points from line geometry (assumed to be helix lines)
      const geometry = child.geometry;
      if (geometry instanceof THREE.BufferGeometry) {
        const positions = geometry.getAttribute('position').array;
        
        // Extract helix line segments
        for (let i = 0; i < positions.length - 3; i += 3) {
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
          
          // Apply the object's world matrix
          start.applyMatrix4(child.matrixWorld);
          end.applyMatrix4(child.matrixWorld);
          
          // Only add helix lines that are visible from side view
          const isVisible = end.x >= 0; // Simple check for visibility
          if (isVisible) {
            helixLines.push({ start, end });
          }
        }
      }
    }
  });
  
  // Combine silhouette edges and visible helix lines
  return [...silhouetteEdges, ...helixLines];
}

// Add dimensions to the drawing
function drawDimensions(drawing: any, size: THREE.Vector3, margin: number, offsetY: number) {
  drawing.setActiveLayer('Dimensions');
  
  // Add dimensions for top view
  const topX = margin;
  const topY = offsetY * 2;
  
  // Width dimension
  const dimOffset = 20;
  drawing.drawLine(topX, topY + dimOffset, topX + size.x, topY + dimOffset);
  drawing.drawLine(topX, topY + dimOffset - 5, topX, topY + dimOffset + 5);
  drawing.drawLine(topX + size.x, topY + dimOffset - 5, topX + size.x, topY + dimOffset + 5);
  drawing.drawText(topX + size.x/2, topY + dimOffset + 10, 3, 0, `${size.x.toFixed(2)}`);
  
  // Height dimension
  drawing.drawLine(topX + size.x + dimOffset, topY, topX + size.x + dimOffset, topY + size.y);
  drawing.drawLine(topX + size.x + dimOffset - 5, topY, topX + size.x + dimOffset + 5, topY);
  drawing.drawLine(topX + size.x + dimOffset - 5, topY + size.y, topX + size.x + dimOffset + 5, topY + size.y);
  drawing.drawText(topX + size.x + dimOffset + 10, topY + size.y/2, 3, 90, `${size.y.toFixed(2)}`);
  
  // Add dimensions for front view
  const frontX = margin;
  const frontY = offsetY;
  
  // Width dimension
  drawing.drawLine(frontX, frontY + dimOffset, frontX + size.x, frontY + dimOffset);
  drawing.drawLine(frontX, frontY + dimOffset - 5, frontX, frontY + dimOffset + 5);
  drawing.drawLine(frontX + size.x, frontY + dimOffset - 5, frontX + size.x, frontY + dimOffset + 5);
  drawing.drawText(frontX + size.x/2, frontY + dimOffset + 10, 3, 0, `${size.x.toFixed(2)}`);
  
  // Height dimension
  drawing.drawLine(frontX + size.x + dimOffset, frontY, frontX + size.x + dimOffset, frontY + size.z);
  drawing.drawLine(frontX + size.x + dimOffset - 5, frontY, frontX + size.x + dimOffset + 5, frontY);
  drawing.drawLine(frontX + size.x + dimOffset - 5, frontY + size.z, frontX + size.x + dimOffset + 5, frontY + size.z);
  drawing.drawText(frontX + size.x + dimOffset + 10, frontY + size.z/2, 3, 90, `${size.z.toFixed(2)}`);
}

// Load a Three.js JSON model and export it to DXF
export const exportThreeJsJsonToDXF = (
  jsonModel: string,
  filename: string,
  options = { includeTopView: true, includeFrontView: true, includeSideView: true }
): void => {
  try {
    // Parse the Three.js JSON model
    const jsonData = JSON.parse(jsonModel);
    const loader = new THREE.ObjectLoader();
    const threeObject = loader.parse(jsonData);
    
    // Export the loaded model to DXF
    enhancedThreeJsToDXF(threeObject, filename, options);
  } catch (error) {
    console.error('Failed to parse or export Three.js JSON:', error);
    throw error;
  }
};

// For specialized drill export with technical details
export const exportDrillToDXF = (
  parameters: any, // DrillParameters type
  filename: string
): void => {
  // Create a Three.js model of the drill
  const drillModel = createDrillModel(parameters);
  
  // Call the enhanced DXF exporter
  enhancedThreeJsToDXF(drillModel, filename);
};

// Create a simplified Three.js model of a drill based on parameters
function createDrillModel(parameters: any): THREE.Object3D {
  const { 
    diameter, 
    length, 
    shankDiameter, 
    shankLength,
    tipAngle,
    fluteCount,
    helixAngle
  } = parameters;
  
  const group = new THREE.Group();
  
  // Create shank cylinder
  const shankGeometry = new THREE.CylinderGeometry(
    shankDiameter / 2,
    shankDiameter / 2,
    shankLength,
    32
  );
  const shankMesh = new THREE.Mesh(shankGeometry);
  shankMesh.position.y = -length / 2 + shankLength / 2;
  group.add(shankMesh);
  
  // Calculate flute dimensions
  const fluteLength = length - shankLength;
  const tipHeight = (diameter / 2) * Math.tan((tipAngle * Math.PI) / 360);
  
  // Create fluted part
  const fluteGeometry = new THREE.CylinderGeometry(
    diameter / 2,
    diameter / 2,
    fluteLength,
    32
  );
  const fluteMesh = new THREE.Mesh(fluteGeometry);
  fluteMesh.position.y = -length / 2 + shankLength + fluteLength / 2;
  group.add(fluteMesh);
  
  // Create tip with proper geometry
  const tipGeometry = new THREE.ConeGeometry(
    diameter / 2,
    tipHeight,
    32
  );
  const tipMesh = new THREE.Mesh(tipGeometry);
  tipMesh.position.y = length / 2 - tipHeight / 2;
  group.add(tipMesh);
  
  // Add flutes
  if (fluteCount > 0) {
    const fluteAngle = (2 * Math.PI) / fluteCount;
    const fluteDepth = diameter * 0.1; // Flute depth as percentage of diameter
    
    for (let i = 0; i < fluteCount; i++) {
      const angle = i * fluteAngle;
      
      // Create flute cut
      const fluteShape = new THREE.Shape();
      fluteShape.moveTo(0, 0);
      fluteShape.lineTo(diameter/2 * Math.cos(angle), diameter/2 * Math.sin(angle));
      fluteShape.lineTo(diameter/2 * Math.cos(angle + fluteAngle/2), diameter/2 * Math.sin(angle + fluteAngle/2));
      fluteShape.lineTo(0, 0);
      
      const extrudeSettings = {
        steps: 1,
        depth: fluteDepth,
        bevelEnabled: false
      };
      
      const fluteGeometry = new THREE.ExtrudeGeometry(fluteShape, extrudeSettings);
      const fluteMesh = new THREE.Mesh(fluteGeometry);
      fluteMesh.position.y = -length / 2 + shankLength;
      fluteMesh.rotation.y = angle;
      group.add(fluteMesh);
    }
  }
  
  // Add helix lines for visualization
  if (fluteCount > 0) {
    const helixSegments = 32;
    const helixRadius = diameter / 2;
    const helixHeight = fluteLength;
    const helixAngleRad = (helixAngle * Math.PI) / 180;
    
    for (let i = 0; i < fluteCount; i++) {
      const startAngle = (i / fluteCount) * Math.PI * 2;
      const points = [];
      
      for (let j = 0; j <= helixSegments; j++) {
        const t = j / helixSegments;
        const angle = startAngle + t * helixAngleRad;
        const y = -length / 2 + shankLength + t * helixHeight;
        const x = helixRadius * Math.cos(angle);
        const z = helixRadius * Math.sin(angle);
        points.push(new THREE.Vector3(x, y, z));
      }
      
      // Create helix line
      for (let j = 0; j < points.length - 1; j++) {
        const start = points[j];
        const end = points[j + 1];
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([start, end]);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        group.add(line);
      }
    }
  }
  
  // Orient the drill along Y axis
  group.rotation.x = Math.PI / 2;
  
  return group;
}

// Simplified DXF export that only handles edges and helix
export const simplifiedDrillToDXF = (
  parameters: DrillParameters,
  filename: string
): void => {
  try {
    // Create a new DXF drawing
    const drawing = new Drawing();
    
    // Set up layers
    drawing.addLayer('Edges', Drawing.ACI.WHITE, 'CONTINUOUS');
    drawing.addLayer('Helix', Drawing.ACI.RED, 'CONTINUOUS');
    
    // Generate the drill geometry
    const geometry = generateDrillGeometry(parameters);
    const mesh = new THREE.Mesh(geometry);
    
    // 1. Extract edges from the geometry
    const edgesGeometry = new THREE.EdgesGeometry(geometry, 1); // Use small angle to get all edges
    const edges: { start: THREE.Vector3, end: THREE.Vector3 }[] = [];
    const positions = edgesGeometry.getAttribute('position').array;
    const uniqueEdges = new Map<string, { start: THREE.Vector3, end: THREE.Vector3 }>();
    
    // Get drill parameters for edge filtering
    const { diameter, length, shankDiameter, shankLength } = parameters;
    const fluteLength = length - shankLength;
    const maxRadius = Math.max(diameter/2, shankDiameter/2);
    
    // Extract and filter edges
    for (let i = 0; i < positions.length; i += 6) {
      const start = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
      const end = new THREE.Vector3(positions[i + 3], positions[i + 4], positions[i + 5]);
      
      // Check if this edge is part of the main outline
      const isOutlineEdge = (point: THREE.Vector3) => {
        // Check if point is on the outer radius
        const radius = Math.sqrt(point.x * point.x + point.z * point.z);
        const isOnOuterRadius = Math.abs(radius - maxRadius) < 0.01;
        
        // Check if point is at the ends of the drill
        const isAtEnd = Math.abs(point.y - length/2) < 0.01 || Math.abs(point.y + length/2) < 0.01;
        
        // Check if point is at the shank transition
        const isAtShankTransition = Math.abs(point.y - (-length/2 + shankLength)) < 0.01;
        
        return isOnOuterRadius || isAtEnd || isAtShankTransition;
      };
      
      // Keep edge if either endpoint is part of the outline
      if (isOutlineEdge(start) || isOutlineEdge(end)) {
        const key = [
          start.y.toFixed(3), start.z.toFixed(3),
          end.y.toFixed(3), end.z.toFixed(3)
        ].join(',');
        const reverseKey = [
          end.y.toFixed(3), end.z.toFixed(3),
          start.y.toFixed(3), start.z.toFixed(3)
        ].join(',');
        
        if (!uniqueEdges.has(key) && !uniqueEdges.has(reverseKey)) {
          uniqueEdges.set(key, { start, end });
        }
      }
    }
    
    // Convert unique edges back to array
    edges.push(...uniqueEdges.values());
    
    // 2. Generate helix polylines
    const helixLines: { start: THREE.Vector3, end: THREE.Vector3 }[] = [];
    const { fluteCount, helixAngle } = parameters;
    
    if (fluteCount > 0) {
      const helixSegments = 32;
      const helixRadius = diameter / 2;
      const helixAngleRad = (helixAngle * Math.PI) / 180;
      
      for (let i = 0; i < fluteCount; i++) {
        const startAngle = (i / fluteCount) * Math.PI * 2;
        const points: THREE.Vector3[] = [];
        
        // Generate points for this helix
        for (let j = 0; j <= helixSegments; j++) {
          const t = j / helixSegments;
          const angle = startAngle + t * helixAngleRad;
          const y = -length / 2 + shankLength + t * fluteLength;
          const x = helixRadius * Math.cos(angle);
          const z = helixRadius * Math.sin(angle);
          points.push(new THREE.Vector3(x, y, z));
        }
        
        // Convert points to line segments, only keeping visible ones
        for (let j = 0; j < points.length - 1; j++) {
          const start = points[j];
          const end = points[j + 1];
          
          // Only add visible helix segments (front half)
          if (start.x >= 0 && end.x >= 0) {
            helixLines.push({ start, end });
          }
        }
      }
    }
    
    // 3. Draw edges and helix in DXF
    // Draw edges
    drawing.setActiveLayer('Edges');
    edges.forEach(edge => {
      drawing.drawLine(
        edge.start.y,
        edge.start.z,
        edge.end.y,
        edge.end.z
      );
    });
    
    // Draw helix
    drawing.setActiveLayer('Helix');
    helixLines.forEach(line => {
      drawing.drawLine(
        line.start.y,
        line.start.z,
        line.end.y,
        line.end.z
      );
    });
    
    // Generate and save DXF file
    const dxfString = drawing.toDxfString();
    const blob = new Blob([dxfString], { type: 'application/dxf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.dxf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    
  } catch (error) {
    console.error('Failed to export DXF:', error);
    throw error;
  }
};

// Update the exportDrillModel function to use the simplified DXF export
export const exportDrillModel = async (
  parameters: DrillParameters,
  format: string,
  filename: string
): Promise<void> => {
  let loadingToast: string | number | undefined;
  
  try {
    loadingToast = toast.loading(`Generating ${format.toUpperCase()} file...`);
    
    switch (format.toLowerCase()) {
      case 'stl':
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
        link.download = `${filename || `Drill_${parameters.diameter}mm_${parameters.length}mm`}.stl`;
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
        break;
        
      case 'dxf':
        // Use the new simplified DXF export
        simplifiedDrillToDXF(
          parameters,
          filename || `Drill_${parameters.diameter}mm_${parameters.length}mm`
        );
        break;
        
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
    
    if (loadingToast) {
      toast.dismiss(loadingToast);
      loadingToast = undefined;
    }
    toast.success(`Exported ${filename || `Drill_${parameters.diameter}mm_${parameters.length}mm`}.${format} successfully`);
    
  } catch (error) {
    console.error('Export error:', error);
    if (loadingToast) {
      toast.dismiss(loadingToast);
      loadingToast = undefined;
    }
    toast.error('Failed to export file');
  }
};