'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { WeatherData } from '@/types';

interface SearchResult {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
  admin2?: string;
}

interface SearchBoxProps {
  onLocationSelect: (location: SearchResult, weatherData: WeatherData) => void;
  className?: string;
}

const SearchBox: React.FC<SearchBoxProps> = ({ onLocationSelect, className = '' }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // 地理编码搜索
  const searchLocations = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      // 使用Open-Meteo的地理编码API
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=10&language=zh&format=json`
      );
      
      if (!response.ok) {
        throw new Error('搜索失败');
      }

      const data = await response.json();
      const locations: SearchResult[] = data.results || [];
      
      // 过滤中国的结果，优先显示上海和浙江的结果
      const filteredResults = locations
        .filter(location => location.country === 'China')
        .sort((a, b) => {
          const aIsTarget = (a.admin1 === 'Shanghai' || a.admin1 === 'Zhejiang');
          const bIsTarget = (b.admin1 === 'Shanghai' || b.admin1 === 'Zhejiang');
          if (aIsTarget && !bIsTarget) return -1;
          if (!aIsTarget && bIsTarget) return 1;
          return 0;
        })
        .slice(0, 8);

      setResults(filteredResults);
      setShowResults(filteredResults.length > 0);
    } catch (err) {
      setError('搜索失败，请重试');
      setResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // 获取天气数据
  const fetchWeatherData = useCallback(async (location: SearchResult): Promise<WeatherData> => {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=Asia%2FShanghai&forecast_days=1`
    );

    if (!response.ok) {
      throw new Error('获取天气数据失败');
    }

    const data = await response.json();
    const current = data.current;

    return {
      temperature: Math.round(current.temperature_2m),
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      weatherCode: current.weather_code,
      pressure: current.pressure_msl,
      cloudCover: current.cloud_cover,
      precipitation: current.precipitation,
      windDirection: current.wind_direction_10m,
      apparentTemperature: Math.round(current.apparent_temperature),
      isDay: current.is_day === 1
    };
  }, []);

  // 处理位置选择
  const handleLocationSelect = useCallback(async (location: SearchResult) => {
    setIsLoadingWeather(true);
    setShowResults(false);
    setQuery(`${location.name}${location.admin2 ? `, ${location.admin2}` : ''}${location.admin1 ? `, ${location.admin1}` : ''}`);

    try {
      const weatherData = await fetchWeatherData(location);
      onLocationSelect(location, weatherData);
    } catch (err) {
      setError('获取天气数据失败');
    } finally {
      setIsLoadingWeather(false);
    }
  }, [fetchWeatherData, onLocationSelect]);

  // 防抖搜索
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchLocations(value);
    }, 300);
  }, [searchLocations]);

  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowResults(false);
    }
  }, []);

  // 点击外部关闭结果
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={resultsRef}>
      <div className="relative">
        <Input
          type="text"
          placeholder="搜索区县或乡镇名称..."
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setShowResults(true)}
          className="pl-10 pr-12 bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg"
          disabled={isLoadingWeather}
        />
        
        {/* 搜索图标 */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          {isSearching ? (
            <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
          ) : (
            <Search className="h-4 w-4 text-gray-400" />
          )}
        </div>
        
        {/* 加载天气数据指示器 */}
        {isLoadingWeather && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
          </div>
        )}
      </div>

      {/* 搜索结果 */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {results.map((result, index) => (
            <button
              key={index}
              onClick={() => handleLocationSelect(result)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
              disabled={isLoadingWeather}
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {result.name}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {[result.admin2, result.admin1, result.country].filter(Boolean).join(', ')}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
};

export default SearchBox;