type ToleranceType = 'h7' | 'h8' | 'h9' | 'h10' | 'H7' | 'H8';
type MaterialType = 'hss' | 'carbide' | 'cobalt' | 'titanium';
type SurfaceFinishType = 'polished' | 'black-oxide' | 'tin' | 'aln';

export interface DrillParameters {
  diameter: number;        // Diameter of the drill bit (fluted part)
  length: number;         // Total length of the drill bit (editable)
  shankDiameter: number;   // Diameter of the shank
  shankLength: number;     // Length of the shank
  fluteCount: number;      // Number of flutes
  fluteLength: number;     // Length of the fluted portion (including tip)
  nonCuttingLength: number; // Length of the non-cutting portion (auto-calculated)
  tipAngle: number;        // Angle of the drill tip in degrees
  helixAngle: number;      // Helix angle of the flutes in degrees
  material: MaterialType;        // Material of the drill bit
  tolerance: ToleranceType;       // Diameter tolerance
  surfaceFinish: SurfaceFinishType;   // Surface finish type
}

interface ProjectSettings {
  units: 'mm' | 'inch';
  precision: number;
  author: string;
  company: string;
  projectName: string;
}

interface GDTSettings {
  runout: number;
  concentricity: number;
  cylindricity: number;
  perpendicularity: number;
}

// Helper function to validate drill parameters
export const validateDrillParameters = (params: DrillParameters): boolean => {
  // Check if dimensions are positive and reasonable
  if (params.diameter <= 0 || params.length <= 0 || params.shankDiameter <= 0 || 
      params.shankLength <= 0 || params.fluteLength <= 0) {
    console.error("Dimensions must be positive");
    return false;
  }

  // Calculate minimum required length
  const minLength = params.shankLength + params.fluteLength + 
    (Math.abs(params.diameter - params.shankDiameter) / 2);

  // Check if length is sufficient
  if (params.length < minLength) {
    console.error(`Length (${params.length}) is less than minimum required (${minLength})`);
    return false;
  }

  // Check if angles are within reasonable ranges
  if (params.tipAngle <= 0 || params.tipAngle >= 180) {
    console.error("Tip angle must be between 0 and 180 degrees");
    return false;
  }

  if (params.helixAngle < 0 || params.helixAngle > 60) {
    console.error("Helix angle must be between 0 and 60 degrees");
    return false;
  }

  // Check if flute count is reasonable
  if (params.fluteCount < 1 || params.fluteCount > 4) {
    console.error("Flute count must be between 1 and 4");
    return false;
  }

  return true;
};

