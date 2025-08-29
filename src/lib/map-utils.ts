import { GeoData, GeoFeature, Coordinates } from '@/types';

/**
 * 加载GeoJSON数据
 */
export async function loadGeoData(region: 'shanghai' | 'zhejiang'): Promise<GeoData> {
  try {
    const response = await fetch(`/data/${region}.geoJson`);
    if (!response.ok) {
      throw new Error(`Failed to load ${region} geo data`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error loading ${region} geo data:`, error);
    throw error;
  }
}

/**
 * 将GeoJSON坐标转换为SVG路径
 */
export function coordinatesToSVGPath(coordinates: number[][][], bounds: MapBounds): string {
  const paths: string[] = [];
  
  coordinates.forEach(polygon => {
    polygon.forEach((ring, ringIndex) => {
      const pathCommands: string[] = [];
      
      ring.forEach((coord, coordIndex) => {
        const [lng, lat] = coord;
        const { x, y } = projectCoordinate({ lat, lng }, bounds);
        
        if (coordIndex === 0) {
          pathCommands.push(`M ${x} ${y}`);
        } else {
          pathCommands.push(`L ${x} ${y}`);
        }
      });
      
      pathCommands.push('Z'); // 闭合路径
      paths.push(pathCommands.join(' '));
    });
  });
  
  return paths.join(' ');
}

/**
 * 地图边界接口
 */
export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  width: number;
  height: number;
}

/**
 * 计算GeoJSON数据的边界
 */
export function calculateBounds(geoData: GeoData, padding: number = 0.1): MapBounds {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  geoData.features.forEach(feature => {
    if (feature.geometry.type === 'MultiPolygon') {
      feature.geometry.coordinates.forEach(polygon => {
        polygon.forEach(ring => {
          ring.forEach(coord => {
            const [lng, lat] = coord;
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
          });
        });
      });
    }
  });

  // 添加边距
  const latPadding = (maxLat - minLat) * padding;
  const lngPadding = (maxLng - minLng) * padding;

  return {
    minLat: minLat - latPadding,
    maxLat: maxLat + latPadding,
    minLng: minLng - lngPadding,
    maxLng: maxLng + lngPadding,
    width: 800, // 默认SVG宽度
    height: 600 // 默认SVG高度
  };
}

/**
 * 将地理坐标投影到SVG坐标
 */
export function projectCoordinate(coord: Coordinates, bounds: MapBounds): { x: number; y: number } {
  const { lat, lng } = coord;
  const { minLat, maxLat, minLng, maxLng, width, height } = bounds;
  
  const x = ((lng - minLng) / (maxLng - minLng)) * width;
  const y = height - ((lat - minLat) / (maxLat - minLat)) * height; // 翻转Y轴
  
  return { x, y };
}

/**
 * 检查点是否在多边形内（射线法）
 */
export function pointInPolygon(point: { x: number; y: number }, polygon: { x: number; y: number }[]): boolean {
  const { x, y } = point;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

/**
 * 获取区域中心点坐标
 */
export function getRegionCenter(feature: GeoFeature): Coordinates {
  const [lng, lat] = feature.properties.center;
  return { lat, lng };
}

/**
 * 合并上海和浙江的地图数据
 */
export async function loadCombinedMapData(): Promise<{
  shanghai: GeoData;
  zhejiang: GeoData;
  combined: GeoData;
}> {
  const [shanghai, zhejiang] = await Promise.all([
    loadGeoData('shanghai'),
    loadGeoData('zhejiang')
  ]);

  const combined: GeoData = {
    type: 'FeatureCollection',
    features: [...shanghai.features, ...zhejiang.features]
  };

  return { shanghai, zhejiang, combined };
}