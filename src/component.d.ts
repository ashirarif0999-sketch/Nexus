declare module '../component/DarkVeil' {
  import { FC } from 'react';
  interface DarkVeilProps {
    hueShift?: number;
    noiseIntensity?: number;
    scanlineIntensity?: number;
    speed?: number;
    scanlineFrequency?: number;
    warpAmount?: number;
    resolutionScale?: number;
  }
  const DarkVeil: FC<DarkVeilProps>;
  export default DarkVeil;
}

declare module '../component/BorderGlow' {
  import { FC, ReactNode } from 'react';
  interface BorderGlowProps {
    children?: ReactNode;
    className?: string;
    edgeSensitivity?: number;
    glowColor?: string;
    backgroundColor?: string;
    borderRadius?: number;
    glowRadius?: number;
    glowIntensity?: number;
    coneSpread?: number;
    animated?: boolean;
    colors?: string[];
    fillOpacity?: number;
  }
  const BorderGlow: FC<BorderGlowProps>;
  export default BorderGlow;
}
