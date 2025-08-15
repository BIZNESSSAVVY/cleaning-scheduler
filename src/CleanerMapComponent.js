import React, { useState, useEffect } from 'react';
import { MapPin, Users, Clock, Phone } from 'lucide-react';

// Mock cleaner data - replace with your Firebase data
const mockCleaners = [
  {
    id: 'cleaner_001',
    name: 'Sarah Johnson',
    phone: '+1 (555) 123-4567',
    status: 'active',
    location: { lat: 39.7392, lng: -104.9903, address: '1455 Market St, Denver CO' },
    lastUpdate: new Date(Date.now() - 30000)
  },
  {
    id: 'cleaner_002',
    name: 'Mike Torres', 
    phone: '+1 (555) 234-5678',
    status: 'active',
    location: { lat: 39.7502, lng: -104.9962, address: '890 Broadway Ave, Denver CO' },
    lastUpdate: new Date(Date.now() - 45000)
  },
  {
    id: 'cleaner_003',
    name: 'Lisa Chen',
    phone: '+1 (555) 345-6789', 
    status: 'inactive',
    location: { lat: 39.7612, lng: -104.9838, address: '2200 17th St, Denver CO' },
    lastUpdate: new Date(Date.now() - 300000)
  }
];

const CleanerMapComponent = () => {
  const [cleaners, setCleaners] = useState(mockCleaners);
  const [selectedCleaner, setSelectedCleaner] = useState(null);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCleaners(prev => prev.map(cleaner => ({
        ...cleaner,
        location: {
          ...cleaner.location,
          lat: cleaner.location.lat + (Math.random() - 0.5) * 0.0005,
          lng: cleaner.location.lng + (Math.random() - 0.5) * 0.0005,
        },
        lastUpdate: cleaner.status === 'active' ? new Date() : cleaner.lastUpdate
      })));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    return status === 'active' ? 'bg-green-500' : 'bg-yellow-500';
  };

  const getTimeSince = (timestamp) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    return minutes < 1 ? 'Just now' : `${minutes}m ago`;
  };

  const centerMap = (cleaner) => {
    setSelectedCleaner(cleaner);
    // In real implementation, this would center your Google Map
    console.log('Center map on:', cleaner.name, cleaner.location);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            <MapPin className="w-6 h-6" />
            <div>
              <h3 className="text-lg font-semibold">Live Cleaner Locations</h3>
              <p className="text-blue-100 text-sm">Real-time field team tracking</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-blue-100">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">
              {cleaners.filter(c => c.status === 'active').length} Active
            </span>
          </div>
        </div>
      </div>

      <div className="flex h-96">
        {/* Map Area */}
        <div className="flex-1 relative bg-gradient-to-br from-slate-100 to-slate-200">
          {/* Mock Map Background */}
          <div className="absolute inset-0 opacity-20">
            <div className="w-full h-full bg-repeat" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='0.1'%3E%3Cpath d='m0 0h20v20h-20z'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '20px 20px'
            }}></div>
          </div>
          
          {/* Cleaner Markers */}
          {cleaners.map((cleaner, index) => (
            <div
              key={cleaner.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 hover:scale-110"
              style={{
                left: `${20 + (index * 20)}%`,
                top: `${30 + (index * 15)}%`,
              }}
              onClick={() => centerMap(cleaner)}
            >
              {/* Pulse Animation */}
              {cleaner.status === 'active' && (
                <div className={`absolute inset-0 ${getStatusColor(cleaner.status)} rounded-full animate-ping opacity-75`}></div>
              )}
              
              {/* Marker */}
              <div className={`relative w-4 h-4 ${getStatusColor(cleaner.status)} rounded-full border-2 border-white shadow-lg`}>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full"></div>
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none z-10">
                {cleaner.name}
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black/80 rotate-45"></div>
              </div>
            </div>
          ))}
          
          {/* Map Center Indicator */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
            <div className="absolute inset-0 w-8 h-8 border border-blue-300 rounded-full -m-4 animate-pulse"></div>
          </div>
        </div>

        {/* Cleaner List Sidebar */}
        <div className="w-80 bg-slate-50 border-l border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <h4 className="font-semibold text-slate-800 text-sm">Field Team ({cleaners.length})</h4>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {cleaners.map((cleaner) => (
              <div
                key={cleaner.id}
                className={`p-4 border-b border-slate-200 cursor-pointer hover:bg-white transition-colors ${
                  selectedCleaner?.id === cleaner.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => centerMap(cleaner)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 ${getStatusColor(cleaner.status)} rounded-full`}></div>
                    <span className="font-medium text-slate-800 text-sm">{cleaner.name}</span>
                  </div>
                  <span className="text-xs text-slate-500 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {getTimeSince(cleaner.lastUpdate)}
                  </span>
                </div>
                
                <p className="text-xs text-slate-600 mb-2 pl-4">{cleaner.location.address}</p>
                
                <div className="flex items-center justify-between pl-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    cleaner.status === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {cleaner.status === 'active' ? 'On Duty' : 'Break'}
                  </span>
                  
                  <button 
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`tel:${cleaner.phone}`);
                    }}
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Footer Stats */}
      <div className="bg-slate-50 px-6 py-3 border-t border-slate-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
          <div className="flex items-center space-x-4 text-slate-600">
            <span className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Active: {cleaners.filter(c => c.status === 'active').length}
            </span>
            <span className="flex items-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
              Break: {cleaners.filter(c => c.status === 'inactive').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CleanerMapComponent;