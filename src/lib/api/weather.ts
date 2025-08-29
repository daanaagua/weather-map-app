import { WeatherData, Coordinates } from '@/types';

const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

export class WeatherAPI {
  /**
   * 获取指定坐标的天气数据
   */
  static async getWeatherData(coordinates: Coordinates): Promise<WeatherData> {
    const { lat, lng } = coordinates;
    
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lng.toString(),
      current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code',
      daily: 'temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum',
      timezone: 'Asia/Shanghai',
      forecast_days: '7'
    });

    try {
      const response = await fetch(`${OPEN_METEO_BASE_URL}?${params}`);
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      return data as WeatherData;
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
      throw new Error('无法获取天气数据，请稍后重试');
    }
  }

  /**
   * 批量获取多个位置的天气数据
   */
  static async getBatchWeatherData(locations: Coordinates[]): Promise<WeatherData[]> {
    const promises = locations.map(coord => this.getWeatherData(coord));
    
    try {
      return await Promise.all(promises);
    } catch (error) {
      console.error('Failed to fetch batch weather data:', error);
      throw error;
    }
  }

  /**
   * 根据城市名称获取天气数据（使用预设坐标）
   */
  static async getWeatherByCity(cityName: string): Promise<WeatherData> {
    const cityCoordinates: Record<string, Coordinates> = {
      '上海': { lat: 31.2304, lng: 121.4737 },
      '杭州': { lat: 30.2741, lng: 120.1551 },
      '宁波': { lat: 29.8683, lng: 121.5440 },
      '温州': { lat: 28.0000, lng: 120.6700 },
      '嘉兴': { lat: 30.7527, lng: 120.7550 },
      '湖州': { lat: 30.8703, lng: 120.0873 },
      '绍兴': { lat: 30.0023, lng: 120.5810 },
      '金华': { lat: 29.1028, lng: 119.6498 },
      '衢州': { lat: 28.9700, lng: 118.8700 },
      '舟山': { lat: 30.0360, lng: 122.2070 },
      '台州': { lat: 28.6129, lng: 121.4200 },
      '丽水': { lat: 28.4517, lng: 119.9220 }
    };

    const coordinates = cityCoordinates[cityName];
    if (!coordinates) {
      throw new Error(`未找到城市 ${cityName} 的坐标信息`);
    }

    return this.getWeatherData(coordinates);
  }
}

/**
 * 格式化温度显示
 */
export function formatTemperature(temp: number): string {
  return `${Math.round(temp)}°C`;
}

/**
 * 格式化风速显示
 */
export function formatWindSpeed(speed: number): string {
  return `${Math.round(speed)} km/h`;
}

/**
 * 格式化湿度显示
 */
export function formatHumidity(humidity: number): string {
  return `${Math.round(humidity)}%`;
}

/**
 * 格式化降水量显示
 */
export function formatPrecipitation(precipitation: number): string {
  return `${precipitation.toFixed(1)} mm`;
}