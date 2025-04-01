import * as THREE from 'three';
import { DrillParameters } from '@/types/drill';

export function enhancedThreeJsToDXF(
  object: THREE.Object3D,
  filename: string,
  options: {
    includeTopView: boolean;
    includeFrontView: boolean;
    includeSideView: boolean;
  }
): void {
  // Basic DXF generation for now
  const dxfContent = generateBasicDXF(object);
  const blob = new Blob([dxfContent], { type: 'application/dxf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.dxf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function generateBasicDXF(object: THREE.Object3D): string {
  // Basic DXF content generation
  return `0
SECTION
2
HEADER
0
ENDSEC
0
SECTION
2
ENTITIES
0
ENDSEC
0
EOF`;
}

export function createDrillModel(parameters: DrillParameters): THREE.Object3D {
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
  
  // Create fluted part
  const fluteLength = length - shankLength - (diameter / 2) * Math.tan((tipAngle * Math.PI) / 360);
  const fluteGeometry = new THREE.CylinderGeometry(
    diameter / 2,
    diameter / 2,
    fluteLength,
    32
  );
  const fluteMesh = new THREE.Mesh(fluteGeometry);
  fluteMesh.position.y = -length / 2 + shankLength + fluteLength / 2;
  group.add(fluteMesh);
  
  // Create tip cone
  const tipHeight = (diameter / 2) * Math.tan((tipAngle * Math.PI) / 360);
  const tipGeometry = new THREE.ConeGeometry(
    diameter / 2,
    tipHeight * 2,
    32
  );
  const tipMesh = new THREE.Mesh(tipGeometry);
  tipMesh.position.y = length / 2 - tipHeight;
  tipMesh.rotation.x = Math.PI;
  group.add(tipMesh);
  
  // Orient the drill along Y axis
  group.rotation.x = Math.PI / 2;
  
  return group;
} 