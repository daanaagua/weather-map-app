'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus, RotateCcw } from 'lucide-react';

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  zoomLevel: number;
  minZoom?: number;
  maxZoom?: number;
  className?: string;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onReset,
  zoomLevel,
  minZoom = 0.5,
  maxZoom = 3,
  className = ''
}) => {
  const canZoomIn = zoomLevel < maxZoom;
  const canZoomOut = zoomLevel > minZoom;
  const isDefaultZoom = Math.abs(zoomLevel - 1) < 0.01;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* 放大按钮 */}
      <Button
        variant="outline"
        size="sm"
        onClick={onZoomIn}
        disabled={!canZoomIn}
        className="w-10 h-10 p-0 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg border-gray-200"
        title="放大地图"
      >
        <Plus className="h-4 w-4" />
      </Button>
      
      {/* 缩小按钮 */}
      <Button
        variant="outline"
        size="sm"
        onClick={onZoomOut}
        disabled={!canZoomOut}
        className="w-10 h-10 p-0 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg border-gray-200"
        title="缩小地图"
      >
        <Minus className="h-4 w-4" />
      </Button>
      
      {/* 重置按钮 */}
      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
        disabled={isDefaultZoom}
        className="w-10 h-10 p-0 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg border-gray-200"
        title="重置缩放"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
      
      {/* 缩放级别显示 */}
      <div className="text-xs text-center text-gray-600 bg-white/90 backdrop-blur-sm rounded px-2 py-1 shadow-lg border border-gray-200">
        {Math.round(zoomLevel * 100)}%
      </div>
    </div>
  );
};

export default ZoomControls;