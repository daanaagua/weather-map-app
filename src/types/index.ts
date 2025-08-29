// 地理位置相关类型
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeoFeature {
  type: 'Feature';
  properties: {
    adcode: number;
    name: string;
    center: [number, number];
    centroid: [number, number];
    childrenNum: number;
    level: string;
    subFeatureIndex: number;
    acroutes: number[];
    site: string;
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

export interface GeoData {
  type: 'FeatureCollection';
  features: GeoFeature[];
}

// 天气数据相关类型
export interface WeatherData {
  temperature?: number; // 添加temperature属性用于SearchBox
  humidity?: number; // 添加humidity属性用于SearchBox
  windSpeed?: number; // 添加windSpeed属性用于SearchBox
  weatherCode?: number; // 添加weatherCode属性用于SearchBox
  pressure?: number; // 添加pressure属性用于SearchBox
  cloudCover?: number; // 添加cloudCover属性用于SearchBox
  precipitation?: number; // 添加precipitation属性用于SearchBox
  windDirection?: number; // 添加windDirection属性用于SearchBox
  apparentTemperature?: number; // 添加apparentTemperature属性用于SearchBox
  isDay?: boolean; // 添加isDay属性用于SearchBox
  current: {
    time: string; // 添加time属性
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    weather_code: number;
    pressure_msl: number; // 添加pressure_msl属性
    cloud_cover: number; // 添加cloud_cover属性
    precipitation: number; // 添加precipitation属性
    apparent_temperature: number; // 添加apparent_temperature属性
    is_day: number; // 添加is_day属性
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
    precipitation_sum: number[];
  };
  location?: {
    name: string;
    latitude: number;
    longitude: number;
  };
}

export interface WeatherLocation {
  name: string;
  latitude: number;
  longitude: number;
  weather?: WeatherData;
}

// 天气代码映射
export interface WeatherCodeInfo {
  description: string;
  icon: string;
}

export const WEATHER_CODES: Record<number, WeatherCodeInfo> = {
  0: { description: '晴朗', icon: '☀️' },
  1: { description: '大部分晴朗', icon: '🌤️' },
  2: { description: '部分多云', icon: '⛅' },
  3: { description: '阴天', icon: '☁️' },
  45: { description: '雾', icon: '🌫️' },
  48: { description: '霜雾', icon: '🌫️' },
  51: { description: '小雨', icon: '🌦️' },
  53: { description: '中雨', icon: '🌧️' },
  55: { description: '大雨', icon: '🌧️' },
  61: { description: '小雨', icon: '🌦️' },
  63: { description: '中雨', icon: '🌧️' },
  65: { description: '大雨', icon: '🌧️' },
  71: { description: '小雪', icon: '🌨️' },
  73: { description: '中雪', icon: '❄️' },
  75: { description: '大雪', icon: '❄️' },
  80: { description: '阵雨', icon: '🌦️' },
  81: { description: '阵雨', icon: '🌦️' },
  82: { description: '大阵雨', icon: '⛈️' },
  95: { description: '雷暴', icon: '⛈️' },
  96: { description: '雷暴伴冰雹', icon: '⛈️' },
  99: { description: '强雷暴伴冰雹', icon: '⛈️' },
};