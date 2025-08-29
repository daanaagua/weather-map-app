import { GeoData, GeoFeature, Coordinates } from '@/types';

/**
 * 支持的城市类型
 */
export type CityType = 'shanghai' | 'hangzhou' | 'huzhou' | 'jiaxing' | 'ningbo' | 'shaoxing' | 'zhoushan';

/**
 * 加载单个城市的GeoJSON数据
 */
export async function loadGeoData(city: CityType): Promise<GeoData> {
  // Map English city names to Chinese file names
  const cityFileMap: Record<CityType, string> = {
    'shanghai': 'shanghai.geoJson',
    'hangzhou': '杭州市.geoJson',
    'huzhou': '湖州市.geoJson',
    'jiaxing': '嘉兴市.geoJson',
    'ningbo': '宁波市.geoJson',
    'shaoxing': '绍兴市.geoJson',
    'zhoushan': '舟山市.geoJson'
  };
  
  try {
    const fileName = cityFileMap[city];
    const response = await fetch(`/data/${fileName}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${fileName}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error loading ${city} geo data:`, error);
    throw error;
  }
}

/**
 * 将Polygon坐标转换为SVG路径
 */
export function polygonToSVGPath(coordinates: number[][][], bounds: MapBounds): string {
  const paths: string[] = [];
  
  // Polygon coordinates: [ring][coordinate][lng, lat]
  coordinates.forEach((ring) => {
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
  
  return paths.join(' ');
}

/**
 * 将MultiPolygon坐标转换为SVG路径
 */
export function multiPolygonToSVGPath(coordinates: number[][][][], bounds: MapBounds): string {
  const paths: string[] = [];
  
  // MultiPolygon coordinates: [polygon][ring][coordinate][lng, lat]
  coordinates.forEach(polygon => {
    polygon.forEach((ring) => {
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
 * 通用的几何体到SVG路径转换函数
 */
export function geometryToSVGPath(geometry: { type: string; coordinates: number[][][] | number[][][][] }, bounds: MapBounds): string {
  switch (geometry.type) {
    case 'Polygon':
      return polygonToSVGPath(geometry.coordinates as number[][][], bounds);
    case 'MultiPolygon':
      return multiPolygonToSVGPath(geometry.coordinates as number[][][][], bounds);
    default:
      console.warn(`Unsupported geometry type: ${geometry.type}`);
      return '';
  }
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
      const coordinates = feature.geometry.coordinates as number[][][][];
      coordinates.forEach(polygon => {
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
    } else if (feature.geometry.type === 'Polygon') {
      const coordinates = feature.geometry.coordinates as number[][][];
      coordinates.forEach(ring => {
        ring.forEach(coord => {
          const [lng, lat] = coord;
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
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
 * 加载所有城市的区县级地图数据
 */
export async function loadCombinedMapData(): Promise<{
  cities: Record<CityType, GeoData>;
  combined: GeoData;
}> {
  const cityNames: CityType[] = ['shanghai', 'hangzhou', 'huzhou', 'jiaxing', 'ningbo', 'shaoxing', 'zhoushan'];
  
  try {
    // 并行加载所有城市的数据
    const cityDataArray = await Promise.all(
      cityNames.map(city => loadGeoData(city))
    );
    
    // 创建城市数据映射
    const cities: Record<CityType, GeoData> = {} as Record<CityType, GeoData>;
    cityNames.forEach((city, index) => {
      cities[city] = cityDataArray[index];
    });
    
    // 合并所有特征
    const allFeatures = cityDataArray.flatMap(cityData => cityData.features);
    
    const combined: GeoData = {
      type: 'FeatureCollection',
      features: allFeatures
    };
    
    return { cities, combined };
  } catch (error) {
    console.error('Error loading combined map data:', error);
    throw error;
  }
}