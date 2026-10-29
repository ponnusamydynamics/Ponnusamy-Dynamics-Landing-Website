import React, { useEffect, useRef } from 'react';

interface Point3D {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  radius: number;
  alpha: number;
  isAnchor?: boolean;
  type: 'globe' | 'continent' | 'atlas_muscle' | 'atlas_hand' | 'atlas_head' | 'anchor';
}

interface Edge3D {
  p1: number;
  p2: number;
  alpha: number;
  type: 'atlas_major' | 'atlas_muscle' | 'globe' | 'grip';
}

interface AmbientNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  isHub: boolean;
  ox: number;
  oy: number;
}

export const AtlasEarthCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Mouse tracking for parallax and responsive depth tilt
    const mouse = {
      x: -9999,
      y: -9999,
      active: false,
      targetYaw: 0,
      targetPitch: 0,
      currentYaw: 0,
      currentPitch: 0,
    };

    // -------------------------------------------------------------
    // 1. AMBIENT BACKGROUND CONNECTIVITY WEB (Subtle & clean)
    // -------------------------------------------------------------
    const ambientNodes: AmbientNode[] = [];
    const MAX_CONNECT_DISTANCE = 150;
    const REPULSE_RADIUS = 165;
    const REPULSE_FORCE = 70;

    function initAmbientNodes() {
      ambientNodes.length = 0;
      // Greater density of celestial nodes across the background
      const count = Math.max(85, Math.min(165, Math.floor((width * height) / 7800)));
      for (let i = 0; i < count; i++) {
        const isHub = Math.random() < 0.14;
        ambientNodes.push({
          x: Math.random() * (width - 40) + 20,
          y: Math.random() * (height - 40) + 20,
          vx: (Math.random() - 0.5) * 0.28,
          vy: (Math.random() - 0.5) * 0.28,
          radius: isHub ? 2.0 : 1.3,
          opacity: isHub ? 0.42 : 0.22,
          isHub,
          ox: 0,
          oy: 0,
        });
      }
    }

    // -------------------------------------------------------------
    // 2. 3D VOLUMETRIC ATLAS & ROTATING CELESTIAL GLOBE
    // -------------------------------------------------------------
    const points3D: Point3D[] = [];
    const edges3D: Edge3D[] = [];

    // Scaled-up hero globe dimensions
    const GLOBE_CENTER_Y = -145;
    const GLOBE_RADIUS = 185;

    function buildModel() {
      points3D.length = 0;
      edges3D.length = 0;

      // ==========================================
      // A. THE CELESTIAL GLOBE (Latitude rings & Longitude meridians)
      // ==========================================
      const latitudeAngles = [-75, -60, -45, -30, -15, 0, 15, 30, 45, 60, 75];
      const pointsPerLat = 24;
      const latRingIndices: number[][] = [];

      latitudeAngles.forEach((latDeg) => {
        const phi = (latDeg * Math.PI) / 180;
        const ringY = GLOBE_CENTER_Y - Math.sin(phi) * GLOBE_RADIUS;
        const ringRadius = Math.cos(phi) * GLOBE_RADIUS;
        const currentRing: number[] = [];

        for (let i = 0; i < pointsPerLat; i++) {
          const theta = (i / pointsPerLat) * Math.PI * 2;
          const px = Math.cos(theta) * ringRadius;
          const pz = Math.sin(theta) * ringRadius;
          const isEquator = latDeg === 0;

          const idx = points3D.length;
          points3D.push({
            x: px,
            y: ringY,
            z: pz,
            baseX: px,
            baseY: ringY,
            baseZ: pz,
            radius: isEquator ? 2.4 : 1.8,
            alpha: isEquator ? 0.85 : 0.48,
            isAnchor: isEquator && i % 6 === 0,
            type: 'globe',
          });
          currentRing.push(idx);
        }

        // Connect latitude ring
        for (let i = 0; i < pointsPerLat; i++) {
          const nextI = (i + 1) % pointsPerLat;
          edges3D.push({
            p1: currentRing[i],
            p2: currentRing[nextI],
            alpha: latDeg === 0 ? 0.38 : 0.22,
            type: 'globe',
          });
        }
        latRingIndices.push(currentRing);
      });

      // Connect longitude meridians along adjacent latitude rings
      for (let r = 0; r < latRingIndices.length - 1; r++) {
        const ringA = latRingIndices[r];
        const ringB = latRingIndices[r + 1];
        for (let i = 0; i < pointsPerLat; i++) {
          edges3D.push({
            p1: ringA[i],
            p2: ringB[i],
            alpha: i % 3 === 0 ? 0.26 : 0.16,
            type: 'globe',
          });
        }
      }

      // North and South Poles
      const northPoleIdx = points3D.length;
      points3D.push({
        x: 0,
        y: GLOBE_CENTER_Y - GLOBE_RADIUS,
        z: 0,
        baseX: 0,
        baseY: GLOBE_CENTER_Y - GLOBE_RADIUS,
        baseZ: 0,
        radius: 3.2,
        alpha: 0.95,
        isAnchor: true,
        type: 'anchor',
      });

      const southPoleIdx = points3D.length;
      points3D.push({
        x: 0,
        y: GLOBE_CENTER_Y + GLOBE_RADIUS,
        z: 0,
        baseX: 0,
        baseY: GLOBE_CENTER_Y + GLOBE_RADIUS,
        baseZ: 0,
        radius: 3.2,
        alpha: 0.95,
        isAnchor: true,
        type: 'anchor',
      });

      // Connect poles to polar latitude rings
      const topRing = latRingIndices[latRingIndices.length - 1];
      const btmRing = latRingIndices[0];
      for (let i = 0; i < pointsPerLat; i += 2) {
        edges3D.push({ p1: northPoleIdx, p2: topRing[i], alpha: 0.24, type: 'globe' });
        edges3D.push({ p1: southPoleIdx, p2: btmRing[i], alpha: 0.24, type: 'globe' });
      }

      // Continents Outlines mapped to 3D sphere
      const continentPolygons: { lat: number; lon: number }[][] = [
        // Africa
        [
          { lat: 36, lon: -5 }, { lat: 37, lon: 11 }, { lat: 31, lon: 32 }, { lat: 12, lon: 43 },
          { lat: 12, lon: 51 }, { lat: -4, lon: 40 }, { lat: -25, lon: 32 }, { lat: -34, lon: 18 },
          { lat: -15, lon: 12 }, { lat: 5, lon: 2 }, { lat: 5, lon: -8 }, { lat: 14, lon: -17 },
          { lat: 28, lon: -13 }, { lat: 36, lon: -5 },
        ],
        // Europe & Mediterranean
        [
          { lat: 36, lon: -9 }, { lat: 43, lon: -9 }, { lat: 46, lon: -1 }, { lat: 48, lon: -4 },
          { lat: 55, lon: 8 }, { lat: 60, lon: 5 }, { lat: 71, lon: 28 }, { lat: 65, lon: 45 },
          { lat: 52, lon: 38 }, { lat: 44, lon: 28 }, { lat: 36, lon: 22 }, { lat: 36, lon: -5 },
        ],
        // North America
        [
          { lat: 60, lon: -140 }, { lat: 70, lon: -120 }, { lat: 62, lon: -65 }, { lat: 45, lon: -65 },
          { lat: 30, lon: -80 }, { lat: 22, lon: -95 }, { lat: 15, lon: -95 }, { lat: 30, lon: -115 },
          { lat: 48, lon: -124 }, { lat: 60, lon: -140 },
        ],
        // South America
        [
          { lat: 11, lon: -74 }, { lat: 5, lon: -52 }, { lat: -5, lon: -35 }, { lat: -23, lon: -43 },
          { lat: -54, lon: -67 }, { lat: -40, lon: -73 }, { lat: -15, lon: -75 }, { lat: 0, lon: -80 },
          { lat: 11, lon: -74 },
        ],
        // Eurasia
        [
          { lat: 70, lon: 80 }, { lat: 65, lon: 140 }, { lat: 45, lon: 135 }, { lat: 35, lon: 120 },
          { lat: 22, lon: 110 }, { lat: 10, lon: 80 }, { lat: 25, lon: 60 }, { lat: 40, lon: 50 },
        ],
      ];

      continentPolygons.forEach((poly) => {
        const polyIndices: number[] = [];
        poly.forEach((coord) => {
          const phi = (coord.lat * Math.PI) / 180;
          const theta = (coord.lon * Math.PI) / 180;
          const cx = Math.cos(phi) * Math.sin(theta) * GLOBE_RADIUS;
          const cy = GLOBE_CENTER_Y - Math.sin(phi) * GLOBE_RADIUS;
          const cz = Math.cos(phi) * Math.cos(theta) * GLOBE_RADIUS;

          const idx = points3D.length;
          points3D.push({
            x: cx,
            y: cy,
            z: cz,
            baseX: cx,
            baseY: cy,
            baseZ: cz,
            radius: 2.2,
            alpha: 0.95,
            isAnchor: false,
            type: 'continent',
          });
          polyIndices.push(idx);
        });

        for (let i = 0; i < polyIndices.length - 1; i++) {
          edges3D.push({
            p1: polyIndices[i],
            p2: polyIndices[i + 1],
            alpha: 0.48,
            type: 'globe',
          });
        }
      });

      // ==========================================
      // B. VOLUMETRIC ATLAS TITAN SCULPTURE
      // Dense 3D points forming thick muscular cross-sections and limbs
      // ==========================================
      const atlasStartIdx = points3D.length;

      const atlasNodes: {
        x: number;
        y: number;
        z: number;
        r: number;
        a: number;
        anchor?: boolean;
        type: 'atlas_head' | 'atlas_muscle' | 'atlas_hand' | 'anchor';
      }[] = [
        // --- HEAD, BROW, BEARD & HAIR (Bow forward, bearing load) ---
        // 0: Crown of head (Anchor)
        { x: 0, y: -8, z: 24, r: 3.2, a: 1.0, anchor: true, type: 'anchor' },
        // 1: Forehead / Stern Brow Ridge (Anchor)
        { x: 0, y: 8, z: 42, r: 3.0, a: 1.0, anchor: true, type: 'anchor' },
        // 2: Left temple
        { x: -18, y: 6, z: 34, r: 2.4, a: 0.88, type: 'atlas_head' },
        // 3: Right temple
        { x: 18, y: 6, z: 34, r: 2.4, a: 0.88, type: 'atlas_head' },
        // 4: Nose bridge
        { x: 0, y: 22, z: 46, r: 2.4, a: 0.9, type: 'atlas_head' },
        // 5: Left cheekbone
        { x: -20, y: 24, z: 36, r: 2.4, a: 0.88, type: 'atlas_head' },
        // 6: Right cheekbone
        { x: 20, y: 24, z: 36, r: 2.4, a: 0.88, type: 'atlas_head' },
        // 7: Mouth / Jaw angle
        { x: 0, y: 36, z: 40, r: 2.4, a: 0.88, type: 'atlas_head' },
        // 8: Full Beard Tip (flows forward & downward)
        { x: 0, y: 56, z: 46, r: 3.0, a: 0.95, anchor: true, type: 'atlas_head' },
        // 9: Left Beard Flare
        { x: -16, y: 46, z: 38, r: 2.4, a: 0.85, type: 'atlas_head' },
        // 10: Right Beard Flare
        { x: 16, y: 46, z: 38, r: 2.4, a: 0.85, type: 'atlas_head' },
        // 11: Nape / Occipital (Anchor)
        { x: 0, y: -12, z: 10, r: 3.0, a: 0.95, anchor: true, type: 'anchor' },
        // 12: Left flowing hair crest
        { x: -26, y: -4, z: 18, r: 2.2, a: 0.82, type: 'atlas_head' },
        // 13: Right flowing hair crest
        { x: 26, y: -4, z: 18, r: 2.2, a: 0.82, type: 'atlas_head' },

        // --- NECK & HEAVY TRAPEZIUS ---
        // 14: Neck Base / C7 vertebra (Anchor)
        { x: 0, y: 20, z: 10, r: 3.4, a: 1.0, anchor: true, type: 'anchor' },
        // 15: Left Trap Ridge
        { x: -36, y: 26, z: 14, r: 2.8, a: 0.9, type: 'atlas_muscle' },
        // 16: Right Trap Ridge
        { x: 36, y: 26, z: 14, r: 2.8, a: 0.9, type: 'atlas_muscle' },

        // --- MASSIVE 3D DELTOID CAPS (Thick Volumetric Shoulders) ---
        // Left Deltoid Group:
        // 17: Left Anterior Deltoid
        { x: -68, y: 32, z: 30, r: 3.2, a: 0.95, type: 'atlas_muscle' },
        // 18: Left Lateral Deltoid Peak (Anchor)
        { x: -96, y: 36, z: 16, r: 4.0, a: 1.0, anchor: true, type: 'anchor' },
        // 19: Left Posterior Deltoid
        { x: -74, y: 30, z: -4, r: 3.0, a: 0.9, type: 'atlas_muscle' },
        // 20: Left Deltoid Upper Cap
        { x: -80, y: 16, z: 16, r: 2.8, a: 0.92, type: 'atlas_muscle' },

        // Right Deltoid Group:
        // 21: Right Anterior Deltoid
        { x: 68, y: 32, z: 30, r: 3.2, a: 0.95, type: 'atlas_muscle' },
        // 22: Right Lateral Deltoid Peak (Anchor)
        { x: 96, y: 36, z: 16, r: 4.0, a: 1.0, anchor: true, type: 'anchor' },
        // 23: Right Posterior Deltoid
        { x: 74, y: 30, z: -4, r: 3.0, a: 0.9, type: 'atlas_muscle' },
        // 24: Right Deltoid Upper Cap
        { x: 80, y: 16, z: 16, r: 2.8, a: 0.92, type: 'atlas_muscle' },

        // --- CHEST & PECTORAL PLATES (Deep anterior volume) ---
        // 25: Sternum notch (upper)
        { x: 0, y: 34, z: 32, r: 2.8, a: 0.9, type: 'atlas_muscle' },
        // 26: Mid-Sternum divide (Anchor)
        { x: 0, y: 58, z: 36, r: 3.4, a: 1.0, anchor: true, type: 'anchor' },
        // 27: Lower-Sternum / Xiphoid
        { x: 0, y: 82, z: 32, r: 3.0, a: 0.95, type: 'atlas_muscle' },

        // Left Pec:
        // 28: Left Pec Upper Clavicular
        { x: -36, y: 44, z: 36, r: 3.0, a: 0.95, type: 'atlas_muscle' },
        // 29: Left Pec Mid Ridge Bulge
        { x: -50, y: 62, z: 40, r: 3.4, a: 1.0, type: 'atlas_muscle' },
        // 30: Left Pec Lower Contour
        { x: -32, y: 78, z: 36, r: 3.0, a: 0.95, type: 'atlas_muscle' },

        // Right Pec:
        // 31: Right Pec Upper Clavicular
        { x: 36, y: 44, z: 36, r: 3.0, a: 0.95, type: 'atlas_muscle' },
        // 32: Right Pec Mid Ridge Bulge
        { x: 50, y: 62, z: 40, r: 3.4, a: 1.0, type: 'atlas_muscle' },
        // 33: Right Pec Lower Contour
        { x: 32, y: 78, z: 36, r: 3.0, a: 0.95, type: 'atlas_muscle' },

        // --- THORACIC SPINE & LATISSIMUS DORSI (Back volume) ---
        // 34: Mid Spine (T6)
        { x: 0, y: 60, z: -8, r: 2.8, a: 0.85, type: 'atlas_muscle' },
        // 35: Lower Spine (T12)
        { x: 0, y: 95, z: -6, r: 2.8, a: 0.85, type: 'atlas_muscle' },
        // 36: Left Latissimus outer rib
        { x: -60, y: 74, z: 12, r: 2.8, a: 0.88, type: 'atlas_muscle' },
        // 37: Right Latissimus outer rib
        { x: 60, y: 74, z: 12, r: 2.8, a: 0.88, type: 'atlas_muscle' },

        // --- ABDOMINALS (Defined 6-pack block volume) ---
        // 38: Left Upper Ab
        { x: -18, y: 96, z: 30, r: 2.8, a: 0.92, type: 'atlas_muscle' },
        // 39: Right Upper Ab
        { x: 18, y: 96, z: 30, r: 2.8, a: 0.92, type: 'atlas_muscle' },
        // 40: Linea Alba 1
        { x: 0, y: 96, z: 28, r: 2.4, a: 0.85, type: 'atlas_muscle' },

        // 41: Left Mid Ab
        { x: -18, y: 114, z: 28, r: 2.8, a: 0.92, type: 'atlas_muscle' },
        // 42: Right Mid Ab
        { x: 18, y: 114, z: 28, r: 2.8, a: 0.92, type: 'atlas_muscle' },
        // 43: Linea Alba 2 / Navel (Anchor)
        { x: 0, y: 114, z: 26, r: 3.2, a: 0.95, anchor: true, type: 'anchor' },

        // 44: Left Lower Ab
        { x: -16, y: 132, z: 24, r: 2.6, a: 0.9, type: 'atlas_muscle' },
        // 45: Right Lower Ab
        { x: 16, y: 132, z: 24, r: 2.6, a: 0.9, type: 'atlas_muscle' },

        // Lateral Obliques:
        // 46: Left Oblique upper
        { x: -44, y: 104, z: 22, r: 2.6, a: 0.88, type: 'atlas_muscle' },
        // 47: Left Oblique lower
        { x: -40, y: 124, z: 18, r: 2.6, a: 0.88, type: 'atlas_muscle' },
        // 48: Right Oblique upper
        { x: 44, y: 104, z: 22, r: 2.6, a: 0.88, type: 'atlas_muscle' },
        // 49: Right Oblique lower
        { x: 40, y: 124, z: 18, r: 2.6, a: 0.88, type: 'atlas_muscle' },

        // --- ARMS: FULL 3D CYLINDRICAL/VOLUMETRIC LIMBS ---
        // Left Upper Arm (Biceps / Triceps Cross-Sections):
        // 50: Left Bicep Anterior Belly (Flexed high)
        { x: -110, y: 16, z: 22, r: 3.6, a: 0.98, type: 'atlas_muscle' },
        // 51: Left Bicep Lateral
        { x: -126, y: 6, z: 10, r: 3.8, a: 1.0, type: 'atlas_muscle' },
        // 52: Left Tricep Posterior
        { x: -112, y: 10, z: -16, r: 3.2, a: 0.92, type: 'atlas_muscle' },
        // 53: Left Bicep Medial
        { x: -94, y: 22, z: 4, r: 3.0, a: 0.92, type: 'atlas_muscle' },

        // Left Power Elbow Ring:
        // 54: Left Elbow Olecranon Point (Anchor)
        { x: -142, y: -18, z: 6, r: 4.0, a: 1.0, anchor: true, type: 'anchor' },
        // 55: Left Elbow Anterior Crease
        { x: -128, y: -14, z: 24, r: 3.2, a: 0.95, type: 'atlas_muscle' },

        // Left Forearm Volume:
        // 56: Left Forearm Brachioradialis Bulge
        { x: -152, y: -48, z: 18, r: 3.2, a: 0.95, type: 'atlas_muscle' },
        // 57: Left Forearm Inner Flexor Mass
        { x: -136, y: -46, z: 32, r: 3.2, a: 0.95, type: 'atlas_muscle' },
        // 58: Left Forearm Posterior Extensor
        { x: -144, y: -52, z: -4, r: 3.0, a: 0.9, type: 'atlas_muscle' },
        // 59: Left Wrist Joint Block (Anchor)
        { x: -154, y: -82, z: 36, r: 3.8, a: 1.0, anchor: true, type: 'anchor' },

        // Right Upper Arm (Biceps / Triceps Cross-Sections):
        // 60: Right Bicep Anterior Belly (Flexed high)
        { x: 110, y: 16, z: 22, r: 3.6, a: 0.98, type: 'atlas_muscle' },
        // 61: Right Bicep Lateral
        { x: 126, y: 6, z: 10, r: 3.8, a: 1.0, type: 'atlas_muscle' },
        // 62: Right Tricep Posterior
        { x: 112, y: 10, z: -16, r: 3.2, a: 0.92, type: 'atlas_muscle' },
        // 63: Right Bicep Medial
        { x: 94, y: 22, z: 4, r: 3.0, a: 0.92, type: 'atlas_muscle' },

        // Right Power Elbow Ring:
        // 64: Right Elbow Olecranon Point (Anchor)
        { x: 142, y: -18, z: 6, r: 4.0, a: 1.0, anchor: true, type: 'anchor' },
        // 65: Right Elbow Anterior Crease
        { x: 128, y: -14, z: 24, r: 3.2, a: 0.95, type: 'atlas_muscle' },

        // Right Forearm Volume:
        // 66: Right Forearm Brachioradialis Bulge
        { x: 152, y: -48, z: 18, r: 3.2, a: 0.95, type: 'atlas_muscle' },
        // 67: Right Forearm Inner Flexor Mass
        { x: 136, y: -46, z: 32, r: 3.2, a: 0.95, type: 'atlas_muscle' },
        // 68: Right Forearm Posterior Extensor
        { x: 144, y: -52, z: -4, r: 3.0, a: 0.9, type: 'atlas_muscle' },
        // 69: Right Wrist Joint Block (Anchor)
        { x: 154, y: -82, z: 36, r: 3.8, a: 1.0, anchor: true, type: 'anchor' },

        // --- ARTICULATED CLAWED HANDS GRIPPING THE GLOBE ---
        // Left Hand Gripping:
        // 70: Left Palm Center
        { x: -150, y: -96, z: 44, r: 3.4, a: 1.0, type: 'atlas_hand' },
        // 71: Left Thumb Claw Tip (Grips front of sphere) (Anchor)
        { x: -128, y: -106, z: 62, r: 3.2, a: 1.0, anchor: true, type: 'anchor' },
        // 72: Left Index Knuckle
        { x: -152, y: -118, z: 52, r: 2.6, a: 0.95, type: 'atlas_hand' },
        // 73: Left Index Claw Tip (Anchor)
        { x: -144, y: -138, z: 60, r: 3.2, a: 1.0, anchor: true, type: 'anchor' },
        // 74: Left Middle Knuckle
        { x: -160, y: -122, z: 40, r: 2.6, a: 0.95, type: 'atlas_hand' },
        // 75: Left Middle Claw Tip (Anchor)
        { x: -154, y: -146, z: 46, r: 3.2, a: 1.0, anchor: true, type: 'anchor' },
        // 76: Left Ring Knuckle
        { x: -164, y: -116, z: 24, r: 2.6, a: 0.95, type: 'atlas_hand' },
        // 77: Left Ring Claw Tip (Anchor)
        { x: -162, y: -138, z: 28, r: 3.0, a: 1.0, anchor: true, type: 'anchor' },
        // 78: Left Pinky Knuckle
        { x: -164, y: -106, z: 12, r: 2.4, a: 0.9, type: 'atlas_hand' },
        // 79: Left Pinky Claw Tip (Anchor)
        { x: -164, y: -126, z: 14, r: 2.8, a: 0.98, anchor: true, type: 'anchor' },

        // Right Hand Gripping:
        // 80: Right Palm Center
        { x: 150, y: -96, z: 44, r: 3.4, a: 1.0, type: 'atlas_hand' },
        // 81: Right Thumb Claw Tip (Grips front of sphere) (Anchor)
        { x: 128, y: -106, z: 62, r: 3.2, a: 1.0, anchor: true, type: 'anchor' },
        // 82: Right Index Knuckle
        { x: 152, y: -118, z: 52, r: 2.6, a: 0.95, type: 'atlas_hand' },
        // 83: Right Index Claw Tip (Anchor)
        { x: 144, y: -138, z: 60, r: 3.2, a: 1.0, anchor: true, type: 'anchor' },
        // 84: Right Middle Knuckle
        { x: 160, y: -122, z: 40, r: 2.6, a: 0.95, type: 'atlas_hand' },
        // 85: Right Middle Claw Tip (Anchor)
        { x: 154, y: -146, z: 46, r: 3.2, a: 1.0, anchor: true, type: 'anchor' },
        // 86: Right Ring Knuckle
        { x: 164, y: -116, z: 24, r: 2.6, a: 0.95, type: 'atlas_hand' },
        // 87: Right Ring Claw Tip (Anchor)
        { x: 162, y: -138, z: 28, r: 3.0, a: 1.0, anchor: true, type: 'anchor' },
        // 88: Right Pinky Knuckle
        { x: 164, y: -106, z: 12, r: 2.4, a: 0.9, type: 'atlas_hand' },
        // 89: Right Pinky Claw Tip (Anchor)
        { x: 164, y: -126, z: 14, r: 2.8, a: 0.98, anchor: true, type: 'anchor' },

        // --- KNEELING LOWER BODY IN 3D PERSPECTIVE ---
        // 90: Left Hip / Iliac Crest
        { x: -36, y: 150, z: 16, r: 3.0, a: 0.95, type: 'atlas_muscle' },
        // 91: Right Hip / Iliac Crest
        { x: 36, y: 150, z: 16, r: 3.0, a: 0.95, type: 'atlas_muscle' },
        // 92: Pelvis Center / Pubic Arch
        { x: 0, y: 154, z: 22, r: 3.0, a: 0.95, type: 'atlas_muscle' },

        // Left Leg (Bent forward toward viewer - powerful thigh mass):
        // 93: Left Thigh Rectus Femoris (high volume)
        { x: -48, y: 180, z: 40, r: 3.6, a: 0.98, type: 'atlas_muscle' },
        // 94: Left Thigh Vastus Lateralis (outer)
        { x: -66, y: 186, z: 26, r: 3.4, a: 0.95, type: 'atlas_muscle' },
        // 95: Left Thigh Vastus Medialis (inner)
        { x: -32, y: 188, z: 32, r: 3.4, a: 0.95, type: 'atlas_muscle' },
        // 96: Left Knee Patella Cap (Major Anchor)
        { x: -56, y: 224, z: 62, r: 4.4, a: 1.0, anchor: true, type: 'anchor' },
        // 97: Left Shin / Tibia Ridge
        { x: -52, y: 260, z: 48, r: 3.4, a: 0.95, type: 'atlas_muscle' },
        // 98: Left Calf Gastrocnemius
        { x: -64, y: 256, z: 32, r: 3.4, a: 0.92, type: 'atlas_muscle' },
        // 99: Left Ankle & Planted Foot (Anchor)
        { x: -46, y: 294, z: 30, r: 3.8, a: 0.95, anchor: true, type: 'anchor' },

        // Right Leg (Kneeling grounded power anchor):
        // 100: Right Thigh Rectus Femoris
        { x: 48, y: 178, z: -4, r: 3.2, a: 0.9, type: 'atlas_muscle' },
        // 101: Right Thigh Lateral
        { x: 68, y: 184, z: -16, r: 3.2, a: 0.88, type: 'atlas_muscle' },
        // 102: Right Knee on Ground (Anchor)
        { x: 74, y: 232, z: -24, r: 4.2, a: 1.0, anchor: true, type: 'anchor' },
        // 103: Right Shin / Calf
        { x: 86, y: 268, z: -10, r: 3.2, a: 0.88, type: 'atlas_muscle' },
        // 104: Right Heel & Ground Foot Base (Anchor)
        { x: 96, y: 296, z: 8, r: 3.6, a: 0.92, anchor: true, type: 'anchor' },
      ];

      atlasNodes.forEach((node) => {
        points3D.push({
          x: node.x,
          y: node.y,
          z: node.z,
          baseX: node.x,
          baseY: node.y,
          baseZ: node.z,
          radius: node.r,
          alpha: node.a,
          isAnchor: Boolean(node.anchor),
          type: node.type,
        });
      });

      // ==========================================
      // C. THICK STRUCTURAL & VOLUMETRIC WIREFRAME EDGES
      // Cross-sections, longitudinal ribs, and structural anchors
      // ==========================================
      const rawAtlasEdges: [number, number, 'atlas_major' | 'atlas_muscle', number?][] = [
        // Head & Facial Contours
        [0, 1, 'atlas_major', 0.8], [1, 2, 'atlas_muscle', 0.6], [1, 3, 'atlas_muscle', 0.6],
        [1, 4, 'atlas_major', 0.85], [4, 5, 'atlas_muscle', 0.6], [4, 6, 'atlas_muscle', 0.6],
        [5, 2, 'atlas_muscle', 0.5], [6, 3, 'atlas_muscle', 0.5], [4, 7, 'atlas_muscle', 0.7],
        [7, 8, 'atlas_major', 0.85], [7, 9, 'atlas_muscle', 0.6], [7, 10, 'atlas_muscle', 0.6],
        [9, 8, 'atlas_muscle', 0.65], [10, 8, 'atlas_muscle', 0.65],
        [0, 11, 'atlas_major', 0.8], [11, 14, 'atlas_major', 0.85],
        [11, 12, 'atlas_muscle', 0.55], [11, 13, 'atlas_muscle', 0.55],
        [12, 15, 'atlas_muscle', 0.55], [13, 16, 'atlas_muscle', 0.55],

        // Neck & Trapezius to Deltoids
        [14, 15, 'atlas_major', 0.8], [14, 16, 'atlas_major', 0.8],
        [14, 25, 'atlas_major', 0.85],
        [15, 17, 'atlas_muscle', 0.7], [16, 21, 'atlas_muscle', 0.7],
        [15, 20, 'atlas_major', 0.8], [16, 24, 'atlas_major', 0.8],

        // 3D Volumetric Left Deltoid Ring
        [20, 17, 'atlas_muscle', 0.75], [20, 18, 'atlas_major', 0.9], [20, 19, 'atlas_muscle', 0.7],
        [17, 18, 'atlas_major', 0.85], [18, 19, 'atlas_major', 0.85], [19, 17, 'atlas_muscle', 0.6],

        // 3D Volumetric Right Deltoid Ring
        [24, 21, 'atlas_muscle', 0.75], [24, 22, 'atlas_major', 0.9], [24, 23, 'atlas_muscle', 0.7],
        [21, 22, 'atlas_major', 0.85], [22, 23, 'atlas_major', 0.85], [23, 21, 'atlas_muscle', 0.6],

        // Chest & Pectorals
        [25, 26, 'atlas_major', 0.9], [26, 27, 'atlas_major', 0.9],
        [25, 28, 'atlas_muscle', 0.75], [25, 31, 'atlas_muscle', 0.75],
        [28, 29, 'atlas_major', 0.85], [29, 30, 'atlas_major', 0.85],
        [30, 27, 'atlas_muscle', 0.75], [29, 26, 'atlas_muscle', 0.75],
        [28, 17, 'atlas_muscle', 0.7], [30, 17, 'atlas_muscle', 0.65],
        [31, 32, 'atlas_major', 0.85], [32, 33, 'atlas_major', 0.85],
        [33, 27, 'atlas_muscle', 0.75], [32, 26, 'atlas_muscle', 0.75],
        [31, 21, 'atlas_muscle', 0.7], [33, 21, 'atlas_muscle', 0.65],

        // Thoracic Spine & Rib Cage Depth
        [14, 34, 'atlas_muscle', 0.6], [34, 35, 'atlas_muscle', 0.6],
        [34, 36, 'atlas_muscle', 0.55], [34, 37, 'atlas_muscle', 0.55],
        [29, 36, 'atlas_muscle', 0.6], [32, 37, 'atlas_muscle', 0.6],

        // Six-Pack Abdominals & Obliques
        [27, 40, 'atlas_major', 0.85], [40, 43, 'atlas_major', 0.9], [43, 92, 'atlas_major', 0.85],
        [27, 38, 'atlas_muscle', 0.7], [38, 41, 'atlas_muscle', 0.75], [41, 44, 'atlas_muscle', 0.75], [44, 90, 'atlas_muscle', 0.7],
        [27, 39, 'atlas_muscle', 0.7], [39, 42, 'atlas_muscle', 0.75], [42, 45, 'atlas_muscle', 0.75], [45, 91, 'atlas_muscle', 0.7],
        [38, 40, 'atlas_muscle', 0.7], [39, 40, 'atlas_muscle', 0.7],
        [41, 43, 'atlas_muscle', 0.75], [42, 43, 'atlas_muscle', 0.75],
        [44, 92, 'atlas_muscle', 0.7], [45, 92, 'atlas_muscle', 0.7],
        [36, 46, 'atlas_muscle', 0.6], [46, 47, 'atlas_muscle', 0.6], [47, 90, 'atlas_muscle', 0.65],
        [37, 48, 'atlas_muscle', 0.6], [48, 49, 'atlas_muscle', 0.6], [49, 91, 'atlas_muscle', 0.65],

        // Left Arm: 3D Tubular Cross-Sections
        // Shoulder to Upper Bicep ring
        [18, 51, 'atlas_major', 0.9], [17, 50, 'atlas_major', 0.85], [19, 52, 'atlas_muscle', 0.7], [20, 53, 'atlas_muscle', 0.7],
        // Bicep ring interconnect
        [50, 51, 'atlas_muscle', 0.75], [51, 52, 'atlas_muscle', 0.75], [52, 53, 'atlas_muscle', 0.7], [53, 50, 'atlas_muscle', 0.7],
        // Bicep ring to Elbow
        [51, 54, 'atlas_major', 0.95], [50, 55, 'atlas_major', 0.85], [52, 54, 'atlas_muscle', 0.8], [53, 55, 'atlas_muscle', 0.75],
        [54, 55, 'atlas_major', 0.85],
        // Elbow to Forearm ring
        [54, 56, 'atlas_major', 0.9], [55, 57, 'atlas_major', 0.85], [54, 58, 'atlas_muscle', 0.75],
        [56, 57, 'atlas_muscle', 0.75], [57, 58, 'atlas_muscle', 0.7], [58, 56, 'atlas_muscle', 0.7],
        // Forearm to Wrist
        [56, 59, 'atlas_major', 0.95], [57, 59, 'atlas_major', 0.9], [58, 59, 'atlas_muscle', 0.8],

        // Right Arm: 3D Tubular Cross-Sections
        // Shoulder to Upper Bicep ring
        [22, 61, 'atlas_major', 0.9], [21, 60, 'atlas_major', 0.85], [23, 62, 'atlas_muscle', 0.7], [24, 63, 'atlas_muscle', 0.7],
        // Bicep ring interconnect
        [60, 61, 'atlas_muscle', 0.75], [61, 62, 'atlas_muscle', 0.75], [62, 63, 'atlas_muscle', 0.7], [63, 60, 'atlas_muscle', 0.7],
        // Bicep ring to Elbow
        [61, 64, 'atlas_major', 0.95], [60, 65, 'atlas_major', 0.85], [62, 64, 'atlas_muscle', 0.8], [63, 65, 'atlas_muscle', 0.75],
        [64, 65, 'atlas_major', 0.85],
        // Elbow to Forearm ring
        [64, 66, 'atlas_major', 0.9], [65, 67, 'atlas_major', 0.85], [64, 68, 'atlas_muscle', 0.75],
        [66, 67, 'atlas_muscle', 0.75], [67, 68, 'atlas_muscle', 0.7], [68, 66, 'atlas_muscle', 0.7],
        // Forearm to Wrist
        [66, 69, 'atlas_major', 0.95], [67, 69, 'atlas_major', 0.9], [68, 69, 'atlas_muscle', 0.8],

        // Left Hand & Clawed Fingers
        [59, 70, 'atlas_major', 0.9],
        [70, 71, 'atlas_major', 0.95],
        [70, 72, 'atlas_muscle', 0.8], [72, 73, 'atlas_major', 0.95],
        [70, 74, 'atlas_muscle', 0.8], [74, 75, 'atlas_major', 0.95],
        [70, 76, 'atlas_muscle', 0.8], [76, 77, 'atlas_major', 0.9],
        [70, 78, 'atlas_muscle', 0.75], [78, 79, 'atlas_major', 0.9],
        [72, 74, 'atlas_muscle', 0.65], [74, 76, 'atlas_muscle', 0.65], [76, 78, 'atlas_muscle', 0.65],

        // Right Hand & Clawed Fingers
        [69, 80, 'atlas_major', 0.9],
        [80, 81, 'atlas_major', 0.95],
        [80, 82, 'atlas_muscle', 0.8], [82, 83, 'atlas_major', 0.95],
        [80, 84, 'atlas_muscle', 0.8], [84, 85, 'atlas_major', 0.95],
        [80, 86, 'atlas_muscle', 0.8], [86, 87, 'atlas_major', 0.9],
        [80, 88, 'atlas_muscle', 0.75], [88, 89, 'atlas_major', 0.9],
        [82, 84, 'atlas_muscle', 0.65], [84, 86, 'atlas_muscle', 0.65], [86, 88, 'atlas_muscle', 0.65],

        // Pelvis & Kneeling Legs:
        [90, 92, 'atlas_major', 0.85], [91, 92, 'atlas_major', 0.85], [90, 91, 'atlas_muscle', 0.7],
        // Left Leg (Bent forward, prominent 3D quad & knee)
        [90, 93, 'atlas_major', 0.9], [92, 95, 'atlas_muscle', 0.8], [90, 94, 'atlas_muscle', 0.8],
        [93, 94, 'atlas_muscle', 0.7], [93, 95, 'atlas_muscle', 0.7],
        [93, 96, 'atlas_major', 1.0], [94, 96, 'atlas_major', 0.85], [95, 96, 'atlas_major', 0.85],
        [96, 97, 'atlas_major', 0.95], [96, 98, 'atlas_muscle', 0.8], [97, 98, 'atlas_muscle', 0.7],
        [97, 99, 'atlas_major', 0.95], [98, 99, 'atlas_major', 0.85],

        // Right Leg (Grounded anchor knee)
        [91, 100, 'atlas_major', 0.85], [92, 100, 'atlas_muscle', 0.75], [91, 101, 'atlas_muscle', 0.75],
        [100, 101, 'atlas_muscle', 0.65],
        [100, 102, 'atlas_major', 0.95], [101, 102, 'atlas_major', 0.85],
        [102, 103, 'atlas_major', 0.85], [103, 104, 'atlas_major', 0.85],
      ];

      rawAtlasEdges.forEach(([i, j, edgeType, customAlpha]) => {
        edges3D.push({
          p1: atlasStartIdx + i,
          p2: atlasStartIdx + j,
          alpha: customAlpha ?? (edgeType === 'atlas_major' ? 0.85 : 0.6),
          type: edgeType,
        });
      });

      // ==========================================
      // D. RADIANT HAND-TO-GLOBE TRANSMISSION GRIP ARCS
      // Clawing firmly into the rotating globe's surface!
      // ==========================================
      const leftGripFingers = [71, 73, 75, 77, 79];
      const rightGripFingers = [81, 83, 85, 87, 89];

      if (latRingIndices.length > 2) {
        const ringEquator = latRingIndices[Math.floor(latRingIndices.length / 2)];
        const ringLower = latRingIndices[Math.floor(latRingIndices.length / 2) - 1];

        leftGripFingers.forEach((fingerIdx, fI) => {
          const targetNode = ringEquator[(16 + fI) % pointsPerLat];
          const targetLower = ringLower[(16 + fI) % pointsPerLat];
          edges3D.push({
            p1: atlasStartIdx + fingerIdx,
            p2: targetNode,
            alpha: 0.85,
            type: 'grip',
          });
          edges3D.push({
            p1: atlasStartIdx + fingerIdx,
            p2: targetLower,
            alpha: 0.55,
            type: 'grip',
          });
        });

        rightGripFingers.forEach((fingerIdx, fI) => {
          const targetNode = ringEquator[(4 + fI) % pointsPerLat];
          const targetLower = ringLower[(4 + fI) % pointsPerLat];
          edges3D.push({
            p1: atlasStartIdx + fingerIdx,
            p2: targetNode,
            alpha: 0.85,
            type: 'grip',
          });
          edges3D.push({
            p1: atlasStartIdx + fingerIdx,
            p2: targetLower,
            alpha: 0.55,
            type: 'grip',
          });
        });

        // Load-bearing energy pillars from shoulders/crown to sphere south base
        edges3D.push({ p1: atlasStartIdx + 0, p2: southPoleIdx, alpha: 0.45, type: 'grip' });
        edges3D.push({ p1: atlasStartIdx + 14, p2: southPoleIdx, alpha: 0.4, type: 'grip' });
      }
    }

    // -------------------------------------------------------------
    // 3. CANVAS RESIZE & DYNAMIC HERO PROPORTIONS
    // -------------------------------------------------------------
    function resizeCanvas() {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resizeCanvas();
    initAmbientNodes();
    buildModel();

    // -------------------------------------------------------------
    // 4. ANIMATION & 3D PROJECTION LOOP
    // -------------------------------------------------------------
    let globeAngle = 0;
    let breathPhase = 0;
    let pulsePhase = 0;

    function render() {
      ctx.fillStyle = '#040404';
      ctx.fillRect(0, 0, width, height);

      // --- A. Ambient Particle & Network Web ---
      const ambLen = ambientNodes.length;
      for (let i = 0; i < ambLen; i++) {
        const n = ambientNodes[i];
        n.x += n.vx;
        n.y += n.vy;

        const pad = 15;
        if (n.x < pad) {
          n.x = pad;
          n.vx = Math.abs(n.vx);
        } else if (n.x > width - pad) {
          n.x = width - pad;
          n.vx = -Math.abs(n.vx);
        }

        if (n.y < pad) {
          n.y = pad;
          n.vy = Math.abs(n.vy);
        } else if (n.y > height - pad) {
          n.y = height - pad;
          n.vy = -Math.abs(n.vy);
        }

        const currX = n.x + n.ox;
        const currY = n.y + n.oy;
        const dx = currX - mouse.x;
        const dy = currY - mouse.y;
        const dist = Math.hypot(dx, dy);

        let targetOx = 0;
        let targetOy = 0;

        if (mouse.active && dist < REPULSE_RADIUS && dist > 0.1) {
          const factor = Math.pow(1 - dist / REPULSE_RADIUS, 1.4);
          targetOx = (dx / dist) * factor * REPULSE_FORCE;
          targetOy = (dy / dist) * factor * REPULSE_FORCE;
        }

        n.ox += (targetOx - n.ox) * 0.08;
        n.oy += (targetOy - n.oy) * 0.08;
      }

      // 1. Draw ambient triangular wireframe facets (greater density, elegant faint white)
      let triangleCount = 0;
      const MAX_TRIANGLES = 48;

      for (let i = 0; i < ambLen && triangleCount < MAX_TRIANGLES; i++) {
        const a = ambientNodes[i];
        const ax = a.x + a.ox;
        const ay = a.y + a.oy;

        for (let j = i + 1; j < ambLen && triangleCount < MAX_TRIANGLES; j++) {
          const b = ambientNodes[j];
          const bx = b.x + b.ox;
          const by = b.y + b.oy;
          const dAB = Math.hypot(bx - ax, by - ay);
          if (dAB > 135) continue;

          for (let k = j + 1; k < ambLen && triangleCount < MAX_TRIANGLES; k++) {
            const c = ambientNodes[k];
            const cx = c.x + c.ox;
            const cy = c.y + c.oy;
            const dBC = Math.hypot(cx - bx, cy - by);
            const dCA = Math.hypot(ax - cx, ay - cy);

            if (dBC < 135 && dCA < 135) {
              const avgDist = (dAB + dBC + dCA) / 3;
              const triFactor = Math.max(0, 1 - avgDist / 135);

              // Faint starlight facet fill (subtle, clearly perceptible without glare)
              ctx.fillStyle = `rgba(255, 255, 255, ${triFactor * 0.032})`;
              ctx.beginPath();
              ctx.moveTo(ax, ay);
              ctx.lineTo(bx, by);
              ctx.lineTo(cx, cy);
              ctx.closePath();
              ctx.fill();

              // Crisp, faint white triangular perimeter wireframe
              ctx.strokeStyle = `rgba(255, 255, 255, ${triFactor * 0.11})`;
              ctx.lineWidth = 0.85;
              ctx.stroke();

              triangleCount++;
            }
          }
        }
      }

      // 2. Draw ambient lines (faint white constellation threads, clearly visible)
      ctx.lineWidth = 0.9;
      for (let i = 0; i < ambLen; i++) {
        const a = ambientNodes[i];
        const ax = a.x + a.ox;
        const ay = a.y + a.oy;

        for (let j = i + 1; j < ambLen; j++) {
          const b = ambientNodes[j];
          const bx = b.x + b.ox;
          const by = b.y + b.oy;

          const dx = bx - ax;
          const dy = by - ay;
          const dist = Math.hypot(dx, dy);

          if (dist < MAX_CONNECT_DISTANCE) {
            const proximity = 1 - dist / MAX_CONNECT_DISTANCE;
            // Clean, faint white constellation lines
            ctx.strokeStyle = `rgba(255, 255, 255, ${proximity * 0.14})`;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();
          }
        }
      }

      // 3. Draw ambient dots (greater density, crisp stars in night sky)
      for (let i = 0; i < ambLen; i++) {
        const n = ambientNodes[i];
        const px = n.x + n.ox;
        const py = n.y + n.oy;

        ctx.fillStyle = `rgba(255, 255, 255, ${n.opacity})`;
        ctx.beginPath();
        ctx.arc(px, py, n.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- B. Scaled-Up 3D Volumetric Atlas & Rotating Globe ---
      globeAngle += 0.0055;
      breathPhase += 0.024;
      pulsePhase += 0.045;
      const breathOffset = Math.sin(breathPhase) * 4.0;
      const anchorPulse = (Math.sin(pulsePhase) + 1) * 0.5; // 0 to 1

      // Mouse Parallax easing
      mouse.currentYaw += (mouse.targetYaw - mouse.currentYaw) * 0.055;
      mouse.currentPitch += (mouse.targetPitch - mouse.currentPitch) * 0.055;

      // Positioning: Balanced and vertically centered in the window
      const isDesktop = width >= 1024;
      const isTablet = width >= 640 && width < 1024;
      const modelCenterX = isDesktop ? width * 0.67 : width * 0.5;
      const modelCenterY = height * 0.49;

      // Substantially larger scale multiplier for bolder impact!
      const scaleMultiplier = isDesktop
        ? Math.min(1.42, Math.max(1.18, (width / 1380) * 1.35))
        : isTablet
        ? 1.05
        : 0.82;

      const fov = 650;
      const cosYaw = Math.cos(mouse.currentYaw);
      const sinYaw = Math.sin(mouse.currentYaw);
      const cosPitch = Math.cos(mouse.currentPitch);
      const sinPitch = Math.sin(mouse.currentPitch);

      // Earth axial tilt (~23.4 degrees)
      const AXIAL_TILT = 0.408;
      const cosTilt = Math.cos(AXIAL_TILT);
      const sinTilt = Math.sin(AXIAL_TILT);

      const cosRot = Math.cos(globeAngle);
      const sinRot = Math.sin(globeAngle);

      interface ScreenPoint {
        x: number;
        y: number;
        z: number;
        depthAlpha: number;
        radius: number;
        type: string;
        isAnchor: boolean;
      }

      const screenPoints: ScreenPoint[] = [];

      for (let i = 0; i < points3D.length; i++) {
        const p = points3D[i];
        let px = p.baseX;
        let py = p.baseY;
        let pz = p.baseZ;

        if (p.type === 'globe' || p.type === 'continent') {
          // Rotate globe around its tilted polar axis
          const relY = py - GLOBE_CENTER_Y;
          const rotX = px * cosRot - pz * sinRot;
          const rotZ = px * sinRot + pz * cosRot;

          // Apply axial tilt
          const tiltedY = relY * cosTilt - rotZ * sinTilt;
          const tiltedZ = relY * sinTilt + rotZ * cosTilt;

          px = rotX;
          py = GLOBE_CENTER_Y + tiltedY + breathOffset * 0.4;
          pz = tiltedZ;
        } else {
          // Atlas breathing motion
          py += breathOffset;
        }

        // Parallax Yaw (Y-axis)
        const yawX = px * cosYaw - pz * sinYaw;
        const yawZ = px * sinYaw + pz * cosYaw;

        // Parallax Pitch (X-axis)
        const pitchY = py * cosPitch - yawZ * sinPitch;
        const pitchZ = py * sinPitch + yawZ * cosPitch;

        const scaledX = yawX * scaleMultiplier;
        const scaledY = pitchY * scaleMultiplier;
        const scaledZ = pitchZ * scaleMultiplier;

        const perspScale = fov / (fov + scaledZ + 320);
        let screenX = modelCenterX + scaledX * perspScale;
        let screenY = modelCenterY + scaledY * perspScale;

        // Subtle interactive mouse dispersion
        const distToMouse = Math.hypot(screenX - mouse.x, screenY - mouse.y);
        if (mouse.active && distToMouse < 95 && distToMouse > 0.1) {
          const push = Math.pow(1 - distToMouse / 95, 1.4) * 20;
          screenX += ((screenX - mouse.x) / distToMouse) * push;
          screenY += ((screenY - mouse.y) / distToMouse) * push;
        }

        // Depth cueing: front nodes are significantly brighter and sharper
        const depthFactor = Math.max(0.18, Math.min(1.0, (scaledZ + 260) / 520));
        const depthAlpha = p.alpha * depthFactor;

        screenPoints.push({
          x: screenX,
          y: screenY,
          z: scaledZ,
          depthAlpha,
          radius: Math.max(1.0, p.radius * perspScale * (0.85 + depthFactor * 0.4)),
          type: p.type,
          isAnchor: Boolean(p.isAnchor),
        });
      }

      // --- C. Draw Edges with Volumetric & Glowing Stroke Weights ---
      for (let e = 0; e < edges3D.length; e++) {
        const edge = edges3D[e];
        const p1 = screenPoints[edge.p1];
        const p2 = screenPoints[edge.p2];
        if (!p1 || !p2) continue;

        const avgDepth = (p1.depthAlpha + p2.depthAlpha) * 0.5;
        const edgeAlpha = edge.alpha * avgDepth;
        if (edgeAlpha <= 0.02) continue;

        if (edge.type === 'grip') {
          // Radiant Emerald Transmission Grip Lines (Clawing the Globe)
          // Under-glow pass
          ctx.strokeStyle = `rgba(16, 185, 129, ${edgeAlpha * 0.35})`;
          ctx.lineWidth = 4.2;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();

          // Core crisp stroke
          ctx.strokeStyle = `rgba(52, 211, 153, ${edgeAlpha * 0.95})`;
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        } else if (edge.type === 'atlas_major') {
          // Primary Structural Wireframe Edges (Thick, bold, authoritative)
          // Soft bloom stroke
          ctx.strokeStyle = `rgba(255, 255, 255, ${edgeAlpha * 0.28})`;
          ctx.lineWidth = 3.6;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();

          // Bright crisp core stroke
          ctx.strokeStyle = `rgba(255, 255, 255, ${edgeAlpha * 0.92})`;
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        } else if (edge.type === 'atlas_muscle') {
          // Volumetric Cross-Section & Muscle Contour Edges
          ctx.strokeStyle = `rgba(220, 225, 235, ${edgeAlpha * 0.72})`;
          ctx.lineWidth = 1.35;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        } else {
          // Celestial Globe Latitude/Longitude Grid (Spherical 3D attenuation)
          const isFront = (p1.z + p2.z) * 0.5 > -30;
          const globeAlpha = isFront ? edgeAlpha * 0.65 : edgeAlpha * 0.22;
          ctx.strokeStyle = isFront
            ? `rgba(195, 220, 255, ${globeAlpha})`
            : `rgba(120, 160, 210, ${globeAlpha})`;
          ctx.lineWidth = isFront ? 1.25 : 0.85;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }

      // --- D. Draw 3D Nodes & Major Glowing Anchor Vertices ---
      for (let i = 0; i < screenPoints.length; i++) {
        const sp = screenPoints[i];

        if (sp.isAnchor) {
          // GLOWING ANCHOR NODES (Joints, Head, Knees, Claw Tips)
          // 1. Soft Outer Radial Bloom Glow
          const bloomRadius = sp.radius * (3.8 + anchorPulse * 1.5);
          const bloomGrad = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, bloomRadius);
          bloomGrad.addColorStop(0, `rgba(52, 211, 153, ${sp.depthAlpha * 0.55})`);
          bloomGrad.addColorStop(0.5, `rgba(16, 185, 129, ${sp.depthAlpha * 0.2})`);
          bloomGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
          ctx.fillStyle = bloomGrad;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, bloomRadius, 0, Math.PI * 2);
          ctx.fill();

          // 2. Pulsing Anchor Halo Ring
          ctx.strokeStyle = `rgba(167, 243, 208, ${sp.depthAlpha * (0.6 + anchorPulse * 0.35)})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, sp.radius + 3.2 + anchorPulse * 2.0, 0, Math.PI * 2);
          ctx.stroke();

          // 3. Crisp Intense Core Point
          ctx.fillStyle = `rgba(255, 255, 255, ${sp.depthAlpha * 0.98})`;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, sp.radius * 1.2, 0, Math.PI * 2);
          ctx.fill();
        } else if (sp.type === 'atlas_hand') {
          // Hand knuckles and palms
          ctx.fillStyle = `rgba(52, 211, 153, ${sp.depthAlpha * 0.95})`;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, sp.radius * 1.1, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = `rgba(16, 185, 129, ${sp.depthAlpha * 0.45})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, sp.radius + 2.4, 0, Math.PI * 2);
          ctx.stroke();
        } else if (sp.type === 'atlas_muscle' || sp.type === 'atlas_head') {
          // Muscular wireframe node
          ctx.fillStyle = `rgba(255, 255, 255, ${sp.depthAlpha * 0.92})`;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
          ctx.fill();
        } else if (sp.type === 'continent') {
          // Continental landmass node
          ctx.fillStyle = `rgba(224, 242, 254, ${sp.depthAlpha * 0.95})`;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = `rgba(56, 189, 248, ${sp.depthAlpha * 0.35})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, sp.radius + 2.2, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // Globe meridian nodes
          const isFront = sp.z > -30;
          ctx.fillStyle = isFront
            ? `rgba(215, 235, 255, ${sp.depthAlpha * 0.85})`
            : `rgba(140, 180, 230, ${sp.depthAlpha * 0.35})`;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // --- E. Central Radiant Core between Atlas & the Earth ---
      const glowGrad = ctx.createRadialGradient(
        modelCenterX,
        modelCenterY + (GLOBE_CENTER_Y + GLOBE_RADIUS * 0.88) * scaleMultiplier,
        8,
        modelCenterX,
        modelCenterY + (GLOBE_CENTER_Y + GLOBE_RADIUS * 0.88) * scaleMultiplier,
        220 * scaleMultiplier
      );
      glowGrad.addColorStop(0, 'rgba(16, 185, 129, 0.12)');
      glowGrad.addColorStop(0.45, 'rgba(56, 189, 248, 0.04)');
      glowGrad.addColorStop(1, 'rgba(4, 4, 4, 0)');

      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(
        modelCenterX,
        modelCenterY + (GLOBE_CENTER_Y + GLOBE_RADIUS * 0.88) * scaleMultiplier,
        220 * scaleMultiplier,
        0,
        Math.PI * 2
      );
      ctx.fill();

      if (!prefersReducedMotion) {
        animId = requestAnimationFrame(render);
      }
    }

    // -------------------------------------------------------------
    // 5. EVENT LISTENERS FOR PARALLAX & DISPERSION
    // -------------------------------------------------------------
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;

      const centerX = width * 0.5;
      const centerY = height * 0.5;
      mouse.targetYaw = (e.clientX - centerX) * 0.00045;
      mouse.targetPitch = (e.clientY - centerY) * 0.00035;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
      mouse.targetYaw = 0;
      mouse.targetPitch = 0;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        mouse.active = true;
        const centerX = width * 0.5;
        const centerY = height * 0.5;
        mouse.targetYaw = (e.touches[0].clientX - centerX) * 0.0004;
        mouse.targetPitch = (e.touches[0].clientY - centerY) * 0.0003;
      }
    };

    const handleTouchEnd = () => {
      mouse.active = false;
      mouse.targetYaw = 0;
      mouse.targetPitch = 0;
    };

    const handleResize = () => {
      resizeCanvas();
      initAmbientNodes();
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('resize', handleResize, { passive: true });

    if (prefersReducedMotion) {
      render();
    } else {
      animId = requestAnimationFrame(render);
    }

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="bg-canvas"
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};
