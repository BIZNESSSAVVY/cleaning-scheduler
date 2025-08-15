import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Users, Activity } from 'lucide-react';
import { db } from './firebase.js';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const ActiveCleanersMap = () => {
  const [cleaners, setCleaners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});
  const [activeTab, setActiveTab] = useState('jobs');

  useEffect(() => {
    let unsubscribe;

    try {
      // Query for active cleaners (Available status)
      const cleanersQuery = query(
        collection(db, 'cleaners'),
        where('status', '==', 'Available')
      );

      unsubscribe = onSnapshot(cleanersQuery, 
        (snapshot) => {
          const activeCleaners = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.location && data.location.lat && data.location.lng) {
              activeCleaners.push({
                id: doc.id,
                ...data
              });
            }
          });
          
          setCleaners(activeCleaners);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error fetching active cleaners:', err);
          setError('Failed to load active cleaners');
          setLoading(false);
        }
      );
    } catch (err) {
      console.error('Error setting up cleaners listener:', err);
      setError('Failed to initialize map');
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      // Initialize Google Maps
      const defaultCenter = { lat: 39.5, lng: -98.35 };
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 4,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });
    }
  }, []);

  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.setMap(null));
    markersRef.current = {};

    // Add markers for active cleaners
    cleaners.forEach((cleaner) => {
      const position = {
        lat: cleaner.location.lat,
        lng: cleaner.location.lng
      };

      const marker = new window.google.maps.Marker({
        position,
        map: mapInstance.current,
        title: cleaner.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#10B981',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <h3 class="font-semibold text-gray-900">${cleaner.name}</h3>
            <p class="text-sm text-gray-600">Status: ${cleaner.status}</p>
            <p class="text-xs text-gray-500">
              Last updated: ${cleaner.location.timestamp ? 
                new Date(cleaner.location.timestamp.toDate()).toLocaleString() : 
                'Unknown'
              }
            </p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstance.current, marker);
      });

      markersRef.current[cleaner.id] = marker;
    });

    // Adjust map bounds if we have cleaners
    if (cleaners.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      cleaners.forEach((cleaner) => {
        bounds.extend({
          lat: cleaner.location.lat,
          lng: cleaner.location.lng
        });
      });
      mapInstance.current.fitBounds(bounds);
      
      // Don't zoom too close if there's only one marker
      const listener = window.google.maps.event.addListener(mapInstance.current, 'bounds_changed', () => {
        if (mapInstance.current.getZoom() > 15) {
          mapInstance.current.setZoom(15);
        }
        window.google.maps.event.removeListener(listener);
      });
    }
  }, [cleaners]);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-sm">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Activity className="w-8 h-8 text-blue-500 mx-auto mb-2 animate-spin" />
            <p className="text-gray-600">Loading active cleaners...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-sm">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <MapPin className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
            <p className="text-sm text-gray-500 mt-1">Please check your Firebase configuration</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Active Cleaners</h3>
              <p className="text-2xl font-bold text-gray-900">{cleaners.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Locations Tracked</h3>
              <p className="text-2xl font-bold text-gray-900">{cleaners.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Real-time Updates</h3>
              <p className="text-2xl font-bold text-gray-900">Live</p>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Active Cleaners Map</h2>
          <p className="text-sm text-gray-600 mt-1">
            Real-time locations of cleaners with "Available" status
          </p>
        </div>
        
        <div className="relative">
          <div
            ref={mapRef}
            className="w-full h-96"
            style={{ minHeight: '400px' }}
          />
          
          {cleaners.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-90">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No Active Cleaners</h3>
                <p className="text-gray-600 mt-1">
                  Cleaners will appear here when they set their status to "Available" and share their location.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cleaner List */}
      {cleaners.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Active Cleaners List</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {cleaners.map((cleaner) => (
              <div key={cleaner.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-sm font-medium text-gray-900">{cleaner.name}</h4>
                      <p className="text-sm text-gray-500">
                        Status: <span className="text-green-600 font-medium">{cleaner.status}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900">
                      {cleaner.location.lat.toFixed(4)}, {cleaner.location.lng.toFixed(4)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {cleaner.location.timestamp ? 
                        new Date(cleaner.location.timestamp.toDate()).toLocaleString() : 
                        'Unknown time'
                      }
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveCleanersMap;