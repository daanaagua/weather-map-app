'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GeoData, GeoFeature, Coordinates } from '@/types';
import { 
  loadCombinedMapData, 
  calculateBounds, 
  geometryToSVGPath, 
  projectCoordinate,
  getRegionCenter,
  MapBounds 
} from '@/lib/map-utils';
import ZoomControls from './ZoomControls';

interface SVGMapProps {
  onRegionClick?: (regionName: string, coordinates: [number, number]) => void;
  selectedRegion?: string;
  className?: string;
}

const SVGMap: React.FC<SVGMapProps> = ({ 
  onRegionClick, 
  selectedRegion, 
  className = '' 
}) => {
  const [mapData, setMapData] = useState<GeoData | null>(null);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // 加载地图数据
  useEffect(() => {
    const loadMapData = async () => {
      try {
        setLoading(true);
        const { combined } = await loadCombinedMapData();
        const mapBounds = calculateBounds(combined);
        
        setMapData(combined);
        setBounds(mapBounds);
        setError(null);
      } catch (err) {
        console.error('Failed to load map data:', err);
        setError('地图数据加载失败');
      } finally {
        setLoading(false);
      }
    };

    loadMapData();
  }, []);

  // 处理区域点击
  const handleRegionClick = useCallback((feature: GeoFeature) => {
    if (!onRegionClick) return;
    
    const center = getRegionCenter(feature);
    // 传递区域名称和坐标数组[longitude, latitude]
    onRegionClick(feature.properties.name, [center.lng, center.lat]);
  }, [onRegionClick]);

  // 获取城市类型
  const getCityType = useCallback((adcode: number): string => {
    const codeStr = String(adcode);
    if (codeStr.startsWith('310')) return 'shanghai';
    if (codeStr.startsWith('3301')) return 'hangzhou';
    if (codeStr.startsWith('3305')) return 'huzhou';
    if (codeStr.startsWith('3304')) return 'jiaxing';
    if (codeStr.startsWith('3302')) return 'ningbo';
    if (codeStr.startsWith('3306')) return 'shaoxing';
    if (codeStr.startsWith('3309')) return 'zhoushan';
    return 'unknown';
  }, []);

  // 获取区域样式
  const getRegionStyle = useCallback((feature: GeoFeature) => {
    const regionName = feature.properties.name;
    const isSelected = selectedRegion === regionName;
    const isHovered = hoveredRegion === regionName;
    const cityType = getCityType(feature.properties.adcode);
    
    // 城市颜色映射
    const cityColors: Record<string, string> = {
      shanghai: '#e0f2fe',    // 浅蓝色
      hangzhou: '#f0f9ff',    // 极浅蓝色
      huzhou: '#ecfdf5',      // 浅绿色
      jiaxing: '#fef7cd',     // 浅黄色
      ningbo: '#fdf2f8',      // 浅粉色
      shaoxing: '#f3e8ff',    // 浅紫色
      zhoushan: '#ecfccb',    // 浅青色
      unknown: '#f8fafc'      // 默认灰色
    };
    
    return {
      fill: isSelected 
        ? '#3b82f6' 
        : isHovered 
        ? '#60a5fa' 
        : cityColors[cityType],
      stroke: isSelected || isHovered ? '#1d4ed8' : '#94a3b8',
      strokeWidth: isSelected ? 2 : 1,
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out'
    };
  }, [selectedRegion, hoveredRegion, getCityType]);

  // 缩放控制函数
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev * 1.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.5));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // 鼠标拖拽处理
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // 左键
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  }, [panOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 鼠标滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoomLevel(prev => Math.max(0.5, Math.min(3, prev * delta)));
  }, []);

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">加载地图中...</span>
      </div>
    );
  }

  if (error || !mapData || !bounds) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-gray-600">{error || '地图数据不可用'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${bounds.width} ${bounds.height}`}
        className="w-full h-auto border border-gray-200 rounded-lg shadow-sm bg-white cursor-grab"
        style={{ 
          maxHeight: '600px',
          minHeight: '300px',
          height: 'clamp(300px, 50vh, 600px)',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`}>
        {/* 地图区域 */}
        {mapData.features.map((feature, index) => {
          if (feature.geometry.type !== 'Polygon' && feature.geometry.type !== 'MultiPolygon') return null;
          
          const path = geometryToSVGPath(feature.geometry, bounds);
          const regionName = feature.properties.name;
          
          return (
            <g key={`${feature.properties.adcode}-${index}`}>
              <path
                d={path}
                style={getRegionStyle(feature)}
                onMouseEnter={() => setHoveredRegion(regionName)}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => {
                  console.log('Region clicked:', feature.properties.name, feature.properties.center);
                  handleRegionClick(feature);
                }}
              />
              
              {/* 区域标签 */}
              {feature.properties.center && (
                <text
                  x={projectCoordinate(
                    { lat: feature.properties.center[1], lng: feature.properties.center[0] }, 
                    bounds
                  ).x}
                  y={projectCoordinate(
                    { lat: feature.properties.center[1], lng: feature.properties.center[0] }, 
                    bounds
                  ).y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs font-medium pointer-events-none select-none"
                  fill={selectedRegion === regionName ? '#ffffff' : '#374151'}
                >
                  {regionName}
                </text>
              )}
            </g>
          );
        })}
        </g>
      </svg>
      
      {/* 图例 */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg max-h-48 overflow-y-auto">
        <div className="text-sm font-medium text-gray-700 mb-2">图例</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-100 border border-gray-300 rounded"></div>
            <span className="text-gray-600">上海市</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-sky-50 border border-gray-300 rounded"></div>
            <span className="text-gray-600">杭州市</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-50 border border-gray-300 rounded"></div>
            <span className="text-gray-600">湖州市</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-50 border border-gray-300 rounded"></div>
            <span className="text-gray-600">嘉兴市</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-pink-50 border border-gray-300 rounded"></div>
            <span className="text-gray-600">宁波市</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-50 border border-gray-300 rounded"></div>
            <span className="text-gray-600">绍兴市</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-cyan-50 border border-gray-300 rounded"></div>
            <span className="text-gray-600">舟山市</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 border border-blue-700 rounded"></div>
            <span className="text-gray-600">已选择</span>
          </div>
        </div>
      </div>
      
      {/* 缩放控制 */}
      <ZoomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleZoomReset}
        zoomLevel={zoomLevel}
        className="absolute top-4 right-4"
      />
      
      {/* 悬停提示 */}
      {hoveredRegion && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/75 text-white px-3 py-2 rounded-lg text-sm">
          {hoveredRegion}
        </div>
      )}
    </div>
  );
};

export default SVGMap;