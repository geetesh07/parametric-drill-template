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
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      console.log('Creating DXF drawing...');
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
      
      // Create orthographic camera for projections
      const orthoCamera = new THREE.OrthographicCamera(
        -size.x/2, size.x/2,  // left, right
        size.y/2, -size.y/2,  // top, bottom
        0.1, 1000            // near, far
      );
      
      // Process and add views with progress updates
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
      
      // Add dimensions
      console.log('Adding dimensions...');
      drawDimensions(drawing, size, margin, offsetY);
      
      // Generate the DXF content
      console.log('Generating DXF content...');
      const dxfString = drawing.toDxfString();
      
      // Create a blob and trigger download
      console.log('Creating download...');
      const blob = new Blob([dxfString], { type: 'application/dxf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.dxf`;
      document.body.appendChild(link);
      
      // Use a timeout to ensure the download starts properly
      setTimeout(() => {
        console.log('Triggering download...');
        link.click();
        
        // Clean up
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

// Add a top view (XY plane) to the drawing
function addTopView(drawing: any, object: THREE.Object3D, camera: THREE.OrthographicCamera, { x, y, scale }: { x: number, y: number, scale: number }) {
  drawing.setActiveLayer('Top');
  
  // Clone the object for manipulation
  const clone = object.clone();
  
  // Set up camera for top view
  camera.position.set(0, 0, 1000);
  camera.lookAt(0, 0, 0);
  camera.up.set(0, 1, 0);
  
  // Extract all edges from the object (from geometry)
  const edges = extractEdgesFromObject(clone);
  
  // Project all edges to XY plane (top view)
  for (const edge of edges) {
    const start = edge.start;
    const end = edge.end;
    
    // Project points using camera
    const startProjected = projectPointToPlane(start, camera);
    const endProjected = projectPointToPlane(end, camera);
    
    drawing.drawLine(
      x + startProjected.x * scale,
      y + startProjected.y * scale,
      x + endProjected.x * scale, 
      y + endProjected.y * scale
    );
  }
  
  // Add label for the view
  drawing.setActiveLayer('Text');
  drawing.drawText(x, y - 10, 3.5, 0, 'TOP VIEW');
}

// Add a front view (XZ plane) to the drawing
function addFrontView(drawing: any, object: THREE.Object3D, camera: THREE.OrthographicCamera, { x, y, scale }: { x: number, y: number, scale: number }) {
  drawing.setActiveLayer('Front');
  
  // Clone the object for manipulation
  const clone = object.clone();
  
  // Set up camera for front view
  camera.position.set(0, 1000, 0);
  camera.lookAt(0, 0, 0);
  camera.up.set(0, 0, -1);
  
  // Extract all edges from the object
  const edges = extractEdgesFromObject(clone);
  
  // Project all edges to XZ plane (front view)
  for (const edge of edges) {
    const start = edge.start;
    const end = edge.end;
    
    // Project points using camera
    const startProjected = projectPointToPlane(start, camera);
    const endProjected = projectPointToPlane(end, camera);
    
    drawing.drawLine(
      x + startProjected.x * scale,
      y + startProjected.z * scale,
      x + endProjected.x * scale, 
      y + endProjected.z * scale
    );
  }
  
  // Add label for the view
  drawing.setActiveLayer('Text');
  drawing.drawText(x, y - 10, 3.5, 0, 'FRONT VIEW');
}

// Add a side view (YZ plane) to the drawing
function addSideView(drawing: any, object: THREE.Object3D, camera: THREE.OrthographicCamera, { x, y, scale }: { x: number, y: number, scale: number }) {
  drawing.setActiveLayer('Side');
  
  // Clone the object for manipulation
  const clone = object.clone();
  
  // Set up camera for side view
  camera.position.set(1000, 0, 0);
  camera.lookAt(0, 0, 0);
  camera.up.set(0, 1, 0);
  
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
    
    // Project points using camera
    const startProjected = projectPointToPlane(start, camera);
    const endProjected = projectPointToPlane(end, camera);
    
    // Create a key for this line segment in YZ space
    const key = `${startProjected.y.toFixed(2)},${startProjected.z.toFixed(2)}-${endProjected.y.toFixed(2)},${endProjected.z.toFixed(2)}`;
    const reverseKey = `${endProjected.y.toFixed(2)},${endProjected.z.toFixed(2)}-${startProjected.y.toFixed(2)},${startProjected.z.toFixed(2)}`;
    
    // Only draw if we haven't drawn this region before (visible edge)
    if (!drawnRegions.has(key) && !drawnRegions.has(reverseKey)) {
      drawing.drawLine(
        x + startProjected.y * scale,
        y + startProjected.z * scale,
        x + endProjected.y * scale, 
        y + endProjected.z * scale
      );
      
      // Mark this region as drawn
      drawnRegions.add(key);
    }
  }
  
  // Add label for the view
  drawing.setActiveLayer('Text');
  drawing.drawText(x, y - 10, 3.5, 0, 'SIDE VIEW');
}

// Helper function to project a point to a plane using the camera
function projectPointToPlane(point: THREE.Vector3, camera: THREE.OrthographicCamera): THREE.Vector3 {
  const vector = point.clone().sub(camera.position);
  const normal = camera.position.clone().normalize();
  const distance = vector.dot(normal);
  return point.clone().sub(normal.multiplyScalar(distance));
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
        // Create an EdgesGeometry with a higher threshold to get only significant edges
        const edgesGeometry = new THREE.EdgesGeometry(geometry, 30); // 30-degree threshold for structural edges
        const positions = edgesGeometry.getAttribute('position').array;
        
        // Extract edges with improved visibility checks
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
          
          // Calculate edge properties
          const edgeLength = start.distanceTo(end);
          const edgeDirection = new THREE.Vector3().subVectors(end, start).normalize();
          
          // Check if edge is significant enough to be included
          const isSignificant = edgeLength > 0.1; // Minimum edge length threshold
          
          // Check if edge is part of the silhouette
          const isVertical = Math.abs(end.z - start.z) > Math.abs(end.x - start.x);
          const isHorizontal = Math.abs(end.x - start.x) > Math.abs(end.z - start.z);
          const isOutline = Math.abs(end.x - start.x) < 0.01 || Math.abs(end.z - start.z) < 0.01;
          
          // Check if edge is part of a circular feature
          const isCircular = Math.abs(edgeDirection.y) < 0.1; // Edges perpendicular to Y axis
          
          // Prioritize structural edges
          if (isSignificant && (isVertical || isHorizontal || isOutline || isCircular)) {
            silhouetteEdges.push({ start, end });
          }
        }
        
        // Add additional edges for circular features
        if (geometry instanceof THREE.CylinderGeometry || geometry instanceof THREE.ConeGeometry) {
          const radius = geometry.parameters.radiusTop || geometry.parameters.radiusBottom;
          const height = geometry.parameters.height;
          const segments = geometry.parameters.radialSegments || 32;
          
          // Add top and bottom circle edges
          for (let i = 0; i < segments; i++) {
            const angle1 = (i / segments) * Math.PI * 2;
            const angle2 = ((i + 1) / segments) * Math.PI * 2;
            
            // Top circle
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
            
            // Bottom circle
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
            
            // Apply world matrix
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
      // Extract points from line geometry (assumed to be helix lines)
      const geometry = child.geometry;
      if (geometry instanceof THREE.BufferGeometry) {
        const positions = geometry.getAttribute('position').array;
        
        // Extract only key helix line segments
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
        
        // Only add helix lines at key positions (start, middle, end)
        if (keyPoints.length >= 3) {
          // Add start segment
          helixLines.push({ start: keyPoints[0], end: keyPoints[1] });
          
          // Add middle segment (if long enough)
          if (keyPoints.length > 4) {
            const midIndex = Math.floor(keyPoints.length / 2);
            helixLines.push({ start: keyPoints[midIndex], end: keyPoints[midIndex + 1] });
          }
          
          // Add end segment
          helixLines.push({ start: keyPoints[keyPoints.length - 2], end: keyPoints[keyPoints.length - 1] });
        }
      }
    }
  });
  
  // Combine silhouette edges and minimal helix lines
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

// For specialized drill export with technical details
export const exportDrillToDXF = async (
  parameters: DrillParameters,
  filename: string
): Promise<void> => {
  try {
    console.log('Starting DXF export process...');
    
    // Generate the drill geometry from parameters
    console.log('Generating drill geometry...');
    const drillGeometry = generateDrillGeometry(parameters);
    
    // Create a mesh from the geometry
    const mesh = new THREE.Mesh(drillGeometry);
    
    // Create a group to hold the mesh
    const group = new THREE.Group();
    group.add(mesh);
    
    // Add helix lines for visualization if there are flutes
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
        
        // Create helix line
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        group.add(line);
      }
    }
    
    console.log('Converting to DXF format...');
    // Call the enhanced DXF exporter with the 3D model
    await enhancedThreeJsToDXF(group, filename);
    
    console.log('DXF export completed successfully');
    
  } catch (error) {
    console.error('Failed to export DXF:', error);
    throw new Error(`DXF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Export the 3D drill model to STL format
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
      
      // Use a timeout to ensure the download starts properly
      setTimeout(() => {
        link.click();
        
        // Clean up
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


// Main export function that handles all formats
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
    
    // Add a small delay to ensure the loading toast is visible
    await new Promise(resolve => setTimeout(resolve, 500));
    
    switch (format.toLowerCase()) {
      case 'stl':
        await exportDrillToSTL(parameters, sanitizedFilename);
        break;
        
      case 'dxf':
        await exportDrillToDXF(parameters, sanitizedFilename);
        break;
              
      default:
        throw new Error(`Unsupported format: ${format}`);
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
    // Always dismiss the loading toast when done, regardless of success or failure
    if (loadingToast && showToasts) {
      toast.dismiss(loadingToast);
    }
  }
}; 