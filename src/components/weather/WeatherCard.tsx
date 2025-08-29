'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WeatherData, WEATHER_CODES } from '@/types';
import { 
  formatTemperature, 
  formatWindSpeed, 
  formatHumidity, 
  formatPrecipitation 
} from '@/lib/api/weather';

interface WeatherCardProps {
  weatherData: WeatherData;
  locationName: string;
  className?: string;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ 
  weatherData, 
  locationName, 
  className = '' 
}) => {
  const currentWeather = weatherData.current;
  const dailyWeather = weatherData.daily;
  
  // 获取天气描述
  const getWeatherDescription = (code: number): string => {
    const weatherInfo = WEATHER_CODES[code];
    return weatherInfo ? weatherInfo.description : '未知天气';
  };
  
  // 获取天气图标
  const getWeatherIcon = (code: number): string => {
    const weatherInfo = WEATHER_CODES[code];
    return weatherInfo ? weatherInfo.icon : '🌤️';
  };
  
  // 获取风向
  const getWindDirection = (degree: number): string => {
    const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
    const index = Math.round(degree / 45) % 8;
    return directions[index];
  };
  
  // 格式化日期
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return '今天';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return '明天';
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="text-base sm:text-lg font-semibold">{locationName}</span>
          <Badge variant="outline" className="text-xs">
            实时天气
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3 sm:space-y-4">
        {/* 当前天气 */}
        <div className="text-center py-3 sm:py-4 bg-gradient-to-br from-blue-50 to-sky-50 rounded-lg">
          <div className="text-3xl sm:text-4xl mb-2">
            {getWeatherIcon(currentWeather.weather_code)}
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">
            {formatTemperature(currentWeather.temperature_2m)}
          </div>
          <div className="text-xs sm:text-sm text-gray-600">
            {getWeatherDescription(currentWeather.weather_code)}
          </div>
        </div>
        
        {/* 详细信息 */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
          <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
            <div className="text-gray-500 mb-1">湿度</div>
            <div className="font-semibold">
              {formatHumidity(currentWeather.relative_humidity_2m)}
            </div>
          </div>
          
          <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
            <div className="text-gray-500 mb-1">风速</div>
            <div className="font-semibold">
              {formatWindSpeed(currentWeather.wind_speed_10m)}
            </div>
          </div>
          
          <div className="bg-gray-50 p-2 sm:p-3 rounded-lg col-span-2">
            <div className="text-gray-500 mb-1">风向</div>
            <div className="font-semibold">
              {getWindDirection(currentWeather.wind_direction_10m)} 
              ({currentWeather.wind_direction_10m}°)
            </div>
          </div>
        </div>
        
        {/* 未来几天预报 */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">未来3天预报</h4>
          {dailyWeather.time.slice(1, 4).map((date, index) => (
            <div key={date} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-xl sm:text-2xl">
                  {getWeatherIcon(dailyWeather.weather_code[index + 1])}
                </span>
                <div>
                  <div className="font-medium text-xs sm:text-sm">
                    {formatDate(date)}
                  </div>
                  <div className="text-xs text-gray-500 hidden sm:block">
                    {getWeatherDescription(dailyWeather.weather_code[index + 1])}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-semibold text-xs sm:text-sm">
                  {formatTemperature(dailyWeather.temperature_2m_max[index + 1])}
                </div>
                <div className="text-xs text-gray-500">
                  {formatTemperature(dailyWeather.temperature_2m_min[index + 1])}
                </div>
                {dailyWeather.precipitation_sum[index + 1] > 0 && (
                  <div className="text-xs text-blue-600">
                    {formatPrecipitation(dailyWeather.precipitation_sum[index + 1])}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* 更新时间 */}
        <div className="text-xs text-gray-400 text-center pt-2 border-t border-gray-100">
          更新时间: {new Date(currentWeather.time).toLocaleString('zh-CN')}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeatherCard;