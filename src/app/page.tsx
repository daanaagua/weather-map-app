'use client';

import React, { useState, useCallback } from 'react';
import SVGMap from '@/components/map/SVGMap';
import WeatherCard from '@/components/weather/WeatherCard';
import SearchBox from '@/components/search/SearchBox';
import { Button } from '@/components/ui/button';
import { WeatherAPI } from '@/lib/api/weather';
import { WeatherData, Coordinates } from '@/types';

export default function HomePage() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchLocation, setSearchLocation] = useState<{name: string, latitude: number, longitude: number} | null>(null);

  // 处理地图区域点击
  const handleRegionClick = useCallback(async (regionName: string, coordinates: [number, number]) => {
    setSelectedRegion(regionName);
    setLoading(true);
    setError(null);
    
    try {
      // coordinates格式为[longitude, latitude]
      const coords: Coordinates = {
        lat: coordinates[1],
        lng: coordinates[0]
      };
      const weather = await WeatherAPI.getWeatherData(coords);
      setWeatherData({
        ...weather,
        location: {
          name: regionName,
          lat: coordinates[1],
          lng: coordinates[0],
          latitude: coordinates[1],
          longitude: coordinates[0]
        }
      });
    } catch (err) {
      console.error('Failed to fetch weather data:', err);
      setError(err instanceof Error ? err.message : '获取天气数据失败');
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // 处理搜索位置选择
  const handleLocationSelect = useCallback((location: any, weatherData: WeatherData) => {
    setSearchLocation({
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude
    });
    setSelectedRegion(null); // 清除地图选择
    setWeatherData({
      ...weatherData,
      location: {
        name: location.name,
        lat: location.latitude,
        lng: location.longitude,
        latitude: location.latitude,
        longitude: location.longitude
      }
    });
    setError(null);
  }, []);

  // 清除选择
  const handleClearSelection = useCallback(() => {
    setSelectedRegion(null);
    setSearchLocation(null);
    setWeatherData(null);
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50">
      {/* 头部 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                🌤️ 长三角天气预报
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                点击地图区域或搜索地名查看天气信息
              </p>
            </div>
            
            {/* 搜索框 */}
            <div className="w-full sm:w-80">
              <SearchBox 
                onLocationSelect={handleLocationSelect}
                className="w-full"
              />
            </div>
            
            {(selectedRegion || searchLocation) && (
              <Button 
                variant="outline" 
                onClick={handleClearSelection}
                className="text-sm w-full sm:w-auto"
                size="sm"
              >
                清除选择
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="container mx-auto px-4 py-4 sm:py-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* 地图区域 */}
          <div className="xl:col-span-2 order-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                  上海 & 浙江地区
                </h2>
                {(selectedRegion || searchLocation) && (
                  <div className="text-xs sm:text-sm text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-md">
                    已选择: {selectedRegion || searchLocation?.name}
                    {searchLocation && (
                      <span className="ml-1 text-gray-500">
                        (搜索结果)
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <SVGMap
                onRegionClick={handleRegionClick}
                selectedRegion={selectedRegion || undefined}
                className="w-full"
              />
            </div>
          </div>

          {/* 天气信息区域 */}
          <div className="space-y-3 sm:space-y-4 order-2 xl:order-2">
            {!selectedRegion && !searchLocation && !loading && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 text-center">
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🗺️</div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
                  选择地区查看天气
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                  点击地图上的任意区域，或使用搜索框查找地名，即可查看该地区的实时天气信息
                </p>
              </div>
            )}
            
            {loading && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-blue-600"></div>
                  <span className="text-gray-600 text-sm sm:text-base">正在获取天气数据...</span>
                </div>
              </div>
            )}
            
            {error && (
              <div className="bg-white rounded-xl shadow-sm border border-red-200 p-4 sm:p-6">
                <div className="text-center">
                  <div className="text-red-500 text-xl sm:text-2xl mb-2">⚠️</div>
                  <h3 className="text-base sm:text-lg font-semibold text-red-800 mb-2">
                    获取天气数据失败
                  </h3>
                  <p className="text-red-600 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => {
                      if (selectedRegion || searchLocation) {
                        // 重新触发当前选中区域的天气获取
                        setError(null);
                        setLoading(true);
                      }
                    }}
                  >
                    重试
                  </Button>
                </div>
              </div>
            )}
            
            {weatherData && (selectedRegion || searchLocation) && !loading && (
              <WeatherCard
                weatherData={weatherData}
                locationName={selectedRegion || searchLocation?.name || ''}
                className="shadow-sm"
              />
            )}
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-white/50 border-t border-gray-200 mt-6 sm:mt-12">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="text-center text-xs sm:text-sm text-gray-600">
            <p className="mb-2">
              数据来源: 
              <a 
                href="https://open-meteo.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Open-Meteo API
              </a>
            </p>
            <p>
              © 2024 长三角天气预报 - 基于 Next.js 构建
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
