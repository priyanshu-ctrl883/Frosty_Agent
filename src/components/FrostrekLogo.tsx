import React from "react";
import FrostyIcon from "@/components/FrostyIcon";

interface FrostrekLogoProps {
  size?: number;
  className?: string;
  color?: string;
}

export function FrostrekLogo({ size = 28, className = "", color }: FrostrekLogoProps) {
  return <FrostyIcon size={size} className={className} color={color} glow={0} />;
}

export default FrostrekLogo;
