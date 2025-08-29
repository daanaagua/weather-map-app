'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { GeoData, GeoFeature, Coordinates } from '@/types';
import { 
  loadCombinedMapData, 
  calculateBounds, 
  coordinatesToSVGPath, 
  projectCoordinate,
  getRegionCenter,
  MapBounds 
} from '@/lib/map-utils';

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

  // 获取区域样式
  const getRegionStyle = useCallback((feature: GeoFeature) => {
    const regionName = feature.properties.name;
    const isSelected = selectedRegion === regionName;
    const isHovered = hoveredRegion === regionName;
    const adcode = feature.properties.adcode;
    const isShanghai = String(adcode).startsWith('310');
    const isZhejiang = String(adcode).startsWith('330');
    
    return {
      fill: isSelected 
        ? '#3b82f6' 
        : isHovered 
        ? '#60a5fa' 
        : isShanghai 
        ? '#e0f2fe' 
        : '#f0f9ff',
      stroke: isSelected || isHovered ? '#1d4ed8' : '#94a3b8',
      strokeWidth: isSelected ? 2 : 1,
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out'
    };
  }, [selectedRegion, hoveredRegion]);

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
        viewBox={`0 0 ${bounds.width} ${bounds.height}`}
        className="w-full h-auto border border-gray-200 rounded-lg shadow-sm bg-white"
        style={{ 
          maxHeight: '600px',
          minHeight: '300px',
          height: 'clamp(300px, 50vh, 600px)'
        }}
      >
        {/* 地图区域 */}
        {mapData.features.map((feature, index) => {
          if (feature.geometry.type !== 'MultiPolygon') return null;
          
          const path = coordinatesToSVGPath(feature.geometry.coordinates, bounds);
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
      </svg>
      
      {/* 图例 */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="text-sm font-medium text-gray-700 mb-2">图例</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-100 border border-gray-300 rounded"></div>
            <span className="text-gray-600">上海市</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-sky-50 border border-gray-300 rounded"></div>
            <span className="text-gray-600">浙江省</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 border border-blue-700 rounded"></div>
            <span className="text-gray-600">已选择</span>
          </div>
        </div>
      </div>
      
      {/* 悬停提示 */}
      {hoveredRegion && (
        <div className="absolute top-4 right-4 bg-black/75 text-white px-3 py-2 rounded-lg text-sm">
          {hoveredRegion}
        </div>
      )}
    </div>
  );
};

export default SVGMap;