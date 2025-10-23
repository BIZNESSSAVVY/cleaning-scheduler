import React, { useState, useMemo, useCallback, useRef } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { debounce } from 'lodash';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { unstable_batchedUpdates } from 'react-dom';
import { 
  Calendar, Clock, Users, Wifi, Package, MapPin, Search, Bell, Printer, 
  Eye, CheckCircle, AlertCircle, Phone, Mail, Filter, X, ChevronDown, 
  ChevronUp, Plus, MessageSquare, Send, Zap, Star, Award, TrendingUp,
  Activity, LogOut, CheckSquare
} from 'lucide-react';

// ============================================================================
// DATA LAYER - ENHANCED WITH GUEST STATUS
// ============================================================================

const FAKE_DATA = (() => {
  const locations = [
    { name: 'Downtown Hotel', address: '123 Main St, Ocean City, MD 21842', lat: 38.3365, lng: -75.0849 },
    { name: 'Riverside Inn', address: '456 River Rd, Ocean City, MD 21843', lat: 38.3265, lng: -75.0749 },
    { name: 'City Center Lodge', address: '789 City Ave, Ocean City, MD 21844', lat: 38.3465, lng: -75.0949 },
    { name: 'Park View Resort', address: '101 Park Ln, Ocean City, MD 21845', lat: 38.3165, lng: -75.0649 },
    { name: 'Marina Hotel', address: '202 Marina Dr, Ocean City, MD 21846', lat: 38.3565, lng: -75.1049 }
  ];
  const roomTypes = ['Standard Room', 'Deluxe Suite', 'Presidential Suite', 'Studio Apartment'];
  
  const cleaners = Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    name: `${['Sarah', 'Mike', 'Jessica', 'David', 'Maria', 'John', 'Lisa', 'Carlos', 'Amanda', 'Robert'][i % 10]} ${['Johnson', 'Smith', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson'][Math.floor(i / 10)]}`,
    team: `Team ${Math.floor(i / 10) + 1}`,
    phone: `(443) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    email: `${['sarah', 'mike', 'jessica', 'david', 'maria', 'john', 'lisa', 'carlos', 'amanda', 'robert'][i % 10]}.${['johnson', 'smith', 'williams', 'brown', 'davis', 'miller', 'wilson', 'moore', 'taylor', 'anderson'][Math.floor(i / 10)]}@cleanteam.com`,
    available: Math.random() > 0.2,
    assignedJobs: Math.floor(Math.random() * 5),
    rating: 4 + Math.random(),
    currentLocation: i % 10 < 5 ? { lat: locations[i % 5].lat + (Math.random() - 0.5) * 0.01, lng: locations[i % 5].lng + (Math.random() - 0.5) * 0.01 } : null
  }));

  const jobs = Array.from({ length: 500 }, (_, i) => {
    const startHour = 8 + Math.floor(Math.random() * 8);
    const duration = 1 + Math.floor(Math.random() * 3);
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(Math.random() * 7));
    const locationData = locations[Math.floor(Math.random() * locations.length)];
    
    return {
      id: i + 1,
      location: locationData.name,
      address: locationData.address,
      lat: locationData.lat,
      lng: locationData.lng,
      room: `${Math.floor(Math.random() * 300) + 100}`,
      roomType: roomTypes[Math.floor(Math.random() * roomTypes.length)],
      startTime: `${startHour}:00`,
      dueTime: `${startHour + duration}:00`,
      predictedTime: `${duration}h ${Math.floor(Math.random() * 60)}m`,
      guestCount: Math.floor(Math.random() * 4) + 1,
      dogCount: Math.random() > 0.7 ? Math.floor(Math.random() * 2) + 1 : 0,
      wifiIncluded: Math.random() > 0.5,
      linenPickup: Math.random() > 0.6,
      date: date.toISOString().split('T')[0],
      assigned: Math.random() > 0.6 ? cleaners[Math.floor(Math.random() * cleaners.length)] : null,
      priority: Math.random() > 0.8 ? 'high' : 'normal',
      status: Math.random() > 0.6 ? (Math.random() > 0.5 ? 'assigned' : 'printed') : 'unassigned',
      guestsOut: Math.random() > 0.5, // NEW: Guest departure status
      unitManagerName: 'Richard Lynard',
      lockCode: '356374',
      wifiNetwork: 'Rockyroad',
      wifiPassword: 'COvid$Sucks!',
      bedInfo: '3 Beds (2 Queen, 1 Double)',
      bathInfo: '3 Baths (2 Full, 1 Half)',
      permanentInstructions: 'Standard deep clean protocol',
      weekSpecificInstructions: 'Focus on bathroom deep clean',
      linenInstructions: 'Pick up at 128th Street office',
      parkingSpace: 'Space #A-12',
      parkingInstructions: 'Enter through main gate, follow blue signs',
      scheduledNotification: null
    };
  });

  return { jobs, cleaners, locations };
})();

// ============================================================================
// INTERACTIVE MAP COMPONENT
// ============================================================================

const InteractiveMap = ({ jobs, cleaners }) => {
  const activeJobs = jobs.filter(job => job.assigned && job.guestsOut);
  const activeCleaners = cleaners.filter(cleaner => cleaner.currentLocation);

  return (
    <div className="relative w-full h-96 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl overflow-hidden border-2 border-blue-200">
      {/* Map Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-blue-300" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 35px, rgba(59, 130, 246, 0.1) 35px, rgba(59, 130, 246, 0.1) 36px), repeating-linear-gradient(90deg, transparent, transparent 35px, rgba(59, 130, 246, 0.1) 35px, rgba(59, 130, 246, 0.1) 36px)'
        }}></div>
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 z-10 border border-gray-200">
        <div className="text-xs font-bold text-gray-900 mb-2">Map Legend</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-700">Active Cleaners ({activeCleaners.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-xs text-gray-700">Ready Units ({activeJobs.length})</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 z-10 border border-gray-200">
        <div className="text-xs font-bold text-gray-900 mb-2">Live Status</div>
        <div className="space-y-1">
          <div className="text-xs text-gray-700">Cleaners Active: <span className="font-bold text-green-600">{activeCleaners.length}</span></div>
          <div className="text-xs text-gray-700">Units Ready: <span className="font-bold text-blue-600">{activeJobs.length}</span></div>
        </div>
      </div>

      {/* Map Content */}
      <div className="relative w-full h-full">
        {/* Job Markers */}
        {activeJobs.map(job => {
          const x = ((job.lng + 75.09) / 0.1) * 100;
          const y = ((job.lat - 38.31) / 0.1) * 100;
          return (
            <div
              key={`job-${job.id}`}
              className="absolute w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse cursor-pointer hover:scale-125 transition-transform"
              style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
              title={`${job.location} - Room ${job.room}`}
            >
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
                Room {job.room}
              </div>
            </div>
          );
        })}

        {/* Cleaner Markers */}
        {activeCleaners.map(cleaner => {
          const x = ((cleaner.currentLocation.lng + 75.09) / 0.1) * 100;
          const y = ((cleaner.currentLocation.lat - 38.31) / 0.1) * 100;
          return (
            <div
              key={`cleaner-${cleaner.id}`}
              className="absolute w-8 h-8 cursor-pointer hover:scale-125 transition-transform"
              style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
              title={cleaner.name}
            >
              <div className="relative">
                <div className="w-8 h-8 bg-green-500 rounded-full border-3 border-white shadow-xl flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full border border-white animate-ping"></div>
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
                  {cleaner.name.split(' ')[0]}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

const StatCard = ({ icon: Icon, value, label, color, trend, trendValue }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-semibold ${trendValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className={`w-3 h-3 ${trendValue < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(trendValue)}%
            </div>
          )}
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
        <div className="text-sm text-gray-600 font-medium">{label}</div>
      </div>
    </div>
    <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
      <div 
        className={`h-full bg-gradient-to-r ${color} transition-all duration-500`}
        style={{ width: `${Math.min((value / 500) * 100, 100)}%` }}
      />
    </div>
  </div>
);

const Badge = ({ children, variant = 'default', icon: Icon }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-50 text-green-700 border border-green-200',
    warning: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    danger: 'bg-red-50 text-red-700 border border-red-200',
    info: 'bg-blue-50 text-blue-700 border border-blue-200',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${variants[variant]}`}>
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </span>
  );
};

// ============================================================================
// JOB CARD COMPONENT - ENHANCED WITH GUEST STATUS
// ============================================================================

const JobCard = React.memo(({ job, isSelected, onSelect, onViewDetail, onPrint, onNotify, onToggleGuestStatus }) => (
  <div className={`
    bg-white rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-lg cursor-pointer m-2 overflow-hidden
    ${isSelected ? 'border-blue-500 ring-4 ring-blue-100' : 'border-gray-100 hover:border-gray-200'}
    ${job.priority === 'high' ? 'ring-2 ring-red-200' : ''}
  `}>
    {job.priority === 'high' && (
      <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 text-xs font-bold flex items-center gap-2">
        <Zap className="w-3.5 h-3.5" />
        HIGH PRIORITY
      </div>
    )}
    <div className="p-5">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(job.id, e.target.checked)}
            className="w-5 h-5 text-blue-600 rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
          <div>
            <div className="text-xl font-bold text-gray-900 flex items-center gap-2">
              Room {job.room}
              {job.scheduledNotification && (
                <Calendar className="w-4 h-4 text-purple-600" title="Notification Scheduled" />
              )}
            </div>
            <div className="text-sm text-gray-500 font-medium">{job.roomType}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {job.wifiIncluded && <Badge variant="info" icon={Wifi}>WiFi</Badge>}
          {job.linenPickup && <Badge variant="warning" icon={Package}>Linen</Badge>}
        </div>
      </div>

      {/* NEW: Guest Status Indicator */}
      <div className="mb-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleGuestStatus(job.id);
          }}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all ${
            job.guestsOut
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 hover:border-green-400'
              : 'bg-gradient-to-r from-amber-50 to-yellow-50 border-yellow-300 hover:border-yellow-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {job.guestsOut ? (
              <>
                <CheckSquare className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-900 text-sm">Guests Out - Ready to Clean</span>
              </>
            ) : (
              <>
                <LogOut className="w-5 h-5 text-yellow-600" />
                <span className="font-semibold text-yellow-900 text-sm">Guests Still In Unit</span>
              </>
            )}
          </div>
          <span className="text-xs text-gray-500">Click to toggle</span>
        </button>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-gray-700">
          <div className="p-1.5 bg-blue-50 rounded-lg">
            <MapPin className="w-4 h-4 text-blue-600" />
          </div>
          <span className="font-medium text-sm">{job.location}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <div className="p-1.5 bg-green-50 rounded-lg">
            <Clock className="w-4 h-4 text-green-600" />
          </div>
          <span className="text-sm">{job.startTime} - {job.dueTime} <span className="text-gray-500">({job.predictedTime})</span></span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <div className="p-1.5 bg-purple-50 rounded-lg">
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-sm">{job.guestCount} guests{job.dogCount > 0 ? `, ${job.dogCount} dogs` : ''}</span>
        </div>
      </div>

      <div className="mb-4">
        {job.assigned ? (
          <div className="flex items-center gap-3 bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-xl border border-green-200">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-green-900 truncate">{job.assigned.name}</div>
              <div className="text-xs text-green-700">{job.assigned.team}</div>
            </div>
            <div className="flex items-center gap-0.5">
              {[...Array(Math.floor(job.assigned.rating))].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-yellow-50 p-3 rounded-xl border border-yellow-200">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <span className="font-semibold text-yellow-900">Awaiting Assignment</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => onViewDetail(job)}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md"
        >
          <Eye className="w-4 h-4" />
          <span className="text-xs">View</span>
        </button>
        {job.assigned && (
          <>
            <button
              onClick={() => onPrint([job.id])}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-3 py-2.5 rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span className="text-xs">Print</span>
            </button>
            <button
              onClick={() => onNotify(job)}
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-3 py-2.5 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all font-semibold flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md"
            >
              <Bell className="w-4 h-4" />
              <span className="text-xs">Notify</span>
            </button>
          </>
        )}
      </div>
    </div>
  </div>
));

// ============================================================================
// VIRTUALIZED GRID COMPONENT
// ============================================================================

const GridCell = React.memo(({ columnIndex, rowIndex, style, data }) => {
  const { filteredJobs, selectedJobs, onJobSelect, onViewDetail, onPrint, onNotify, onToggleGuestStatus, columnsPerRow } = data;
  const jobIndex = rowIndex * columnsPerRow + columnIndex;
  const job = filteredJobs[jobIndex];
  
  if (!job) return <div style={style} />;
  
  return (
    <div style={style}>
      <JobCard
        job={job}
        isSelected={selectedJobs.has(job.id)}
        onSelect={onJobSelect}
        onViewDetail={onViewDetail}
        onPrint={onPrint}
        onNotify={onNotify}
        onToggleGuestStatus={onToggleGuestStatus}
      />
    </div>
  );
});

// ============================================================================
// MODAL COMPONENT
// ============================================================================

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className={`bg-white rounded-2xl ${sizes[size]} w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200`}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN APPLICATION
// ============================================================================

const ModernCleaningSystem = () => {
  const [jobs, setJobs] = useState(FAKE_DATA.jobs);
  const [selectedJobs, setSelectedJobs] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ location: '', date: '', status: 'unassigned', cleaner: '' });
  const [showJobDetail, setShowJobDetail] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(null);
  const [showBulkSMSModal, setShowBulkSMSModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [bulkSMSMessage, setBulkSMSMessage] = useState('');
  const [showMapView, setShowMapView] = useState(true); // Map visible by default
  const gridRef = useRef();

  const debouncedSetSearchTerm = useCallback(
    debounce((value) => setSearchTerm(value), 300),
    []
  );

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = job.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          job.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLocation = !filters.location || job.location === filters.location;
      const matchesDate = !filters.date || job.date === filters.date;
      const matchesStatus = !filters.status || 
        (filters.status === 'unassigned' && !job.assigned) ||
        (filters.status === 'assigned' && job.assigned) ||
        (filters.status === 'all');
      const matchesCleaner = !filters.cleaner || (job.assigned && job.assigned.id === Number(filters.cleaner));
      
      return matchesSearch && matchesLocation && matchesDate && matchesStatus && matchesCleaner;
    });
  }, [jobs, searchTerm, filters]);

  const stats = useMemo(() => {
    const total = jobs.length;
    const unassigned = jobs.filter(job => !job.assigned).length;
    const assigned = jobs.filter(job => job.assigned).length;
    const printed = jobs.filter(job => job.status === 'printed').length;
    const availableCleaners = FAKE_DATA.cleaners.filter(cleaner => cleaner.available).length;
    const scheduled = jobs.filter(job => job.scheduledNotification).length;
    const guestsOut = jobs.filter(job => job.guestsOut).length; // NEW
    
    return { total, unassigned, assigned, printed, availableCleaners, scheduled, guestsOut };
  }, [jobs]);

  const handleJobSelect = useCallback((jobId, isSelected) => {
    setSelectedJobs(prev => {
      const newSelected = new Set(prev);
      if (isSelected) newSelected.add(jobId);
      else newSelected.delete(jobId);
      return newSelected;
    });
  }, []);

  // NEW: Toggle guest departure status
  const handleToggleGuestStatus = useCallback((jobId) => {
    setJobs(prevJobs => prevJobs.map(job => 
      job.id === jobId ? { ...job, guestsOut: !job.guestsOut } : job
    ));
    const job = jobs.find(j => j.id === jobId);
    toast.success(!job.guestsOut ? '✅ Unit marked as ready for cleaning!' : '⏳ Unit marked as guests still present', {
      position: 'top-right',
      autoClose: 2000,
    });
  }, [jobs]);

  const handleViewDetail = useCallback((job) => setShowJobDetail(job), []);
  const handleNotify = useCallback((job) => setShowNotifyModal(job), []);

  const sendNotification = useCallback((job, messageType = 'full') => {
    if (!job.assigned) return;
    const message = messageType === 'full' 
      ? `Job Assignment - ${job.location} Location: ${job.location}, Room: ${job.room}`
      : `${job.assigned.name}: ${job.location} Room ${job.room}, ${job.startTime}`;
    
    toast.success(`✅ ${messageType === 'full' ? 'Email' : 'SMS'} sent to ${job.assigned.name}!`, {
      position: 'top-right',
      autoClose: 3000,
    });
    setShowNotifyModal(null);
  }, []);

  const assignJobs = useCallback((cleanerId) => {
    const cleaner = FAKE_DATA.cleaners.find(c => c.id === cleanerId);
    const jobIds = Array.from(selectedJobs);
    
    if (!cleaner || jobIds.length === 0) return;

    const updatedJobs = [...jobs];
    jobIds.forEach(jobId => {
      const index = updatedJobs.findIndex(job => job.id === jobId);
      if (index !== -1) updatedJobs[index] = { ...updatedJobs[index], assigned: cleaner, status: 'assigned' };
    });

    unstable_batchedUpdates(() => {
      setJobs(updatedJobs);
      setSelectedJobs(new Set());
      setShowAssignModal(false);
    });

    toast.success(`✅ Successfully assigned ${jobIds.length} job${jobIds.length > 1 ? 's' : ''} to ${cleaner.name}`, {
      position: 'top-right',
      autoClose: 3000,
      icon: <CheckCircle className="w-5 h-5" />
    });
  }, [jobs, selectedJobs]);

  const printCleanerSummary = useCallback(() => {
    const cleanerId = Number(filters.cleaner);
    if (!cleanerId) {
      toast.error('Please select a cleaner to print summary.', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    const cleaner = FAKE_DATA.cleaners.find(c => c.id === cleanerId);
    if (!cleaner) {
      toast.error('Selected cleaner not found.', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    const cleanerJobs = jobs.filter(job => job.assigned && job.assigned.id === cleanerId);
    if (cleanerJobs.length === 0) {
      toast.info('No jobs assigned to this cleaner.', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    const sortedJobs = cleanerJobs.sort((a, b) => a.startTime.localeCompare(b.startTime));
    const generateSummaryTemplate = () => `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; background: #f8fafc; margin: 0; display: flex; justify-content: center; }
            .container { max-width: 900px; background: #ffffff; border-radius: 12px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1); padding: 30px; }
            .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: #ffffff; padding: 20px; text-align: center; font-size: 28px; font-weight: 700; border-radius: 8px 8px 0 0; margin: -30px -30px 30px -30px; }
            .header-logo { font-size: 14px; color: #bfdbfe; position: absolute; top: 10px; left: 20px; font-weight: 500; }
            .info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 16px; color: #1f2937; margin-bottom: 30px; }
            .job-list { background: #f9fafb; padding: 20px; border-radius: 8px; }
            .job-item { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 15px 0; font-size: 15px; color: #1f2937; border-bottom: 1px solid #e5e7eb; }
            .job-item:last-child { border-bottom: none; }
            .highlight { color: #dc2626; font-weight: 600; }
            .rating { color: #f59e0b; font-weight: 600; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
            @page { margin: 0.75in; size: A4; }
            @media print { body { padding: 0; background: #ffffff; } .container { box-shadow: none; margin: 0; } }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <span class="header-logo">Savvy OS</span>
              ${cleaner.name} - ${cleaner.team}
            </div>
            <div class="info">
              <div>Date: ${new Date().toLocaleDateString()}</div>
              <div>Total Jobs: ${cleanerJobs.length}</div>
              <div>Phone: ${cleaner.phone}</div>
              <div class="rating">Rating: ${'★'.repeat(Math.floor(cleaner.rating))}</div>
            </div>
            <div class="job-list">
              <div style="font-weight: 600; color: #1f2937; margin-bottom: 20px; font-size: 18px;">Job Schedule</div>
              ${sortedJobs.map((job, index) => `
                <div class="job-item">
                  <span>${index + 1}. ${job.location} Room ${job.room} - ${job.startTime}</span>
                  <span>Address: ${job.address}</span>
                  <span class="highlight">Lock: ${job.lockCode}</span>
                  <span>${job.guestsOut ? '✓ Ready to Clean' : '⏳ Guests Still In'}</span>
                </div>
              `).join('')}
            </div>
            <div class="footer">Powered by Savvy OS - Enterprise Cleaning Management Platform</div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '', 'height=600,width=400');
    if (printWindow) {
      printWindow.document.write(generateSummaryTemplate());
      printWindow.document.close();
      printWindow.print();
    } else {
      toast.error('Failed to open print window. Please check popup settings.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  }, [jobs, filters.cleaner]);

  const printJobs = useCallback((jobIds = []) => {
    const ids = jobIds.length > 0 ? jobIds : Array.from(selectedJobs);
    const jobsToPrint = jobs.filter(job => ids.includes(job.id));
    
    if (jobsToPrint.length === 0) {
      toast.error('No jobs selected to print.', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    const cleaningQuotes = [
      "A clean space is a happy place. Let's make it sparkle! – Savvy OS",
      "Dust is just glitter that lost its shine. Time to bring it back! – Savvy OS",
      "Transform chaos into calm with every sweep. – Savvy OS",
      "Clean today, serene tomorrow. – Savvy OS",
      "A spotless room is a canvas for new memories. – Savvy OS"
    ];

    const placeholderImageUrl = '/seawatch.jpg';
    const locationImages = FAKE_DATA.locations.reduce((acc, loc) => ({
      ...acc,
      [loc.name]: placeholderImageUrl
    }), {});

    const generateJobTemplate = (job, index) => `
      <div class="card">
        <div class="header">
          <span class="header-logo">Savvy OS</span>
          ${job.location} - Room ${job.room}
        </div>
        <img src="${locationImages[job.location] || placeholderImageUrl}" class="location-image" alt="Location Image">
        <div class="content">
          <div class="guest-status ${job.guestsOut ? 'ready' : 'waiting'}">
            ${job.guestsOut ? '✓ GUESTS OUT - READY TO CLEAN' : '⏳ GUESTS STILL IN UNIT'}
          </div>
          <div class="section">
            <div class="label">Schedule</div>
            <div class="value">${new Date(job.date).toLocaleDateString()} | ${job.startTime} - ${job.dueTime}</div>
            <div class="value">Predicted Time: ${job.predictedTime}</div>
            <div class="value">${job.guestCount} guests${job.dogCount > 0 ? `, ${job.dogCount} dogs` : ''}</div>
          </div>
          <div class="section">
            <div class="label">Property Details</div>
            <div class="value">Address: ${job.address}</div>
            <div class="value">Manager: ${job.unitManagerName}</div>
            <div class="value">Lock Code: <span class="highlight">${job.lockCode}</span></div>
            <div class="value">Beds: ${job.bedInfo}</div>
            <div class="value">Baths: ${job.bathInfo}</div>
          </div>
          <div class="section">
            <div class="label">WiFi & Amenities</div>
            <div class="value">Network: ${job.wifiNetwork}</div>
            <div class="value">Password: <span class="highlight">${job.wifiPassword}</span></div>
            ${job.wifiIncluded ? '<div class="value">✓ WiFi Included</div>' : ''}
            ${job.linenPickup ? '<div class="value">✓ Linen Pickup Required</div>' : ''}
          </div>
          <div class="section">
            <div class="label">Cleaning Instructions</div>
            <div class="value">Standard: ${job.permanentInstructions}</div>
            <div class="value">This Week: ${job.weekSpecificInstructions}</div>
            <div class="value">Linen: ${job.linenInstructions}</div>
          </div>
          <div class="section">
            <div class="label">Parking</div>
            <div class="value">Space: ${job.parkingSpace}</div>
            <div class="value">Instructions: ${job.parkingInstructions}</div>
          </div>
          ${job.assigned ? `
            <div class="section">
              <div class="label">Assigned Cleaner</div>
              <div class="value">Name: ${job.assigned.name}</div>
              <div class="value">Team: ${job.assigned.team}</div>
              <div class="value">Phone: <span class="highlight">${job.assigned.phone}</span></div>
              <div class="value">Email: ${job.assigned.email}</div>
              <div class="value">Rating: ${job.assigned.rating.toFixed(1)}★</div>
            </div>
          ` : '<div class="section"><div class="value">Not Assigned</div></div>'}
        </div>
        <img src="/qrcode.png" class="qr-image" alt="QR Code">
        <div class="quote">"${cleaningQuotes[index % cleaningQuotes.length]}"</div>
        <div class="footer">Powered by Savvy OS - Enterprise Cleaning Management Platform</div>
      </div>
    `;

    const printWindow = window.open('', '', 'height=800,width=600');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
              body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background: #ffffff; }
              .card { max-width: 900px; min-height: 842px; margin: 0 auto; background: #ffffff; border-radius: 16px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1); padding: 48px; display: flex; flex-direction: column; justify-content: space-between; page-break-before: always; }
              .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: #ffffff; padding: 24px; text-align: center; font-size: 32px; font-weight: 700; border-radius: 12px; margin: -48px -48px 20px -48px; position: relative; box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3); }
              .header-logo { font-size: 14px; color: #bfdbfe; position: absolute; top: 12px; left: 24px; font-weight: 600; letter-spacing: 0.5px; }
              .guest-status { padding: 16px; text-align: center; font-weight: 700; font-size: 16px; border-radius: 12px; margin-bottom: 24px; }
              .guest-status.ready { background: linear-gradient(135deg, #dcfce7, #86efac); color: #166534; border: 2px solid #22c55e; }
              .guest-status.waiting { background: linear-gradient(135deg, #fef3c7, #fde047); color: #854d0e; border: 2px solid #eab308; }
              .content { flex-grow: 1; }
              .section { margin-bottom: 24px; }
              .label { font-size: 14px; font-weight: 700; color: #1f2937; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 2px solid #3b82f6; padding-bottom: 6px; }
              .value { font-size: 14px; color: #374151; line-height: 1.8; margin-left: 12px; padding: 4px 0; }
              .highlight { color: #dc2626; font-weight: 700; background: #fef2f2; padding: 2px 6px; border-radius: 4px; }
              .location-image { width: 100%; height: 220px; object-fit: cover; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
              .qr-image { width: 150px; height: 150px; object-fit: contain; border-radius: 12px; margin: 24px auto; display: block; }
              .quote { font-size: 16px; font-style: italic; color: #1f2937; text-align: center; margin: 24px 0; padding: 24px; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-left: 4px solid #3b82f6; border-radius: 12px; font-weight: 500; }
              .footer { text-align: center; font-size: 11px; color: #6b7280; padding-top: 24px; border-top: 2px solid #e5e7eb; font-weight: 500; }
              @page { margin: 0.75in; size: A4; }
              @media print { 
                body { padding: 0; background: #ffffff; } 
                .card { box-shadow: none; margin: 0 auto; } 
              }
            </style>
          </head>
          <body>
            ${jobsToPrint.map((job, index) => generateJobTemplate(job, index)).join('')}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    } else {
      toast.error('Failed to open print window. Please check popup settings.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
    setJobs(prevJobs => prevJobs.map(job => ids.includes(job.id) ? { ...job, status: 'printed' } : job));
    setSelectedJobs(new Set());
  }, [jobs, selectedJobs]);

  const printJobsForCleaner = useCallback(() => {
    const cleanerId = Number(filters.cleaner);
    if (!cleanerId) {
      toast.error('Please select a cleaner to print jobs.', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }
    const cleanerJobs = jobs.filter(job => job.assigned && job.assigned.id === cleanerId).map(job => job.id);
    if (cleanerJobs.length === 0) {
      toast.info('No jobs assigned to this cleaner.', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    const cleaner = FAKE_DATA.cleaners.find(c => c.id === cleanerId);
    const jobsToPrint = jobs.filter(job => cleanerJobs.includes(job.id)).sort((a, b) => a.startTime.localeCompare(b.startTime));

    const cleaningQuotes = [
      "A clean space is a happy place. Let's make it sparkle! – Savvy OS",
      "Dust is just glitter that lost its shine. Time to bring it back! – Savvy OS",
      "Transform chaos into calm with every sweep. – Savvy OS",
      "Clean today, serene tomorrow. – Savvy OS",
      "A spotless room is a canvas for new memories. – Savvy OS"
    ];

    const placeholderImageUrl = '/seawatch.jpg';
    const locationImages = FAKE_DATA.locations.reduce((acc, loc) => ({
      ...acc,
      [loc.name]: placeholderImageUrl
    }), {});

    const generateSummaryTemplate = () => `
      <div class="summary">
        <div class="header">
          <span class="header-logo">Savvy OS</span>
          ${cleaner.name} - ${cleaner.team}
        </div>
        <div class="info">
          <div>Date: ${new Date().toLocaleDateString()}</div>
          <div>Total Jobs: ${cleanerJobs.length}</div>
          <div>Phone: ${cleaner.phone}</div>
          <div class="rating">Rating: ${'★'.repeat(Math.floor(cleaner.rating))}</div>
        </div>
        <div class="job-list">
          <div class="job-list-header">Job Schedule</div>
          ${jobsToPrint.map((job, index) => `
            <div class="job-item">
              <span>${index + 1}. ${job.location} Room ${job.room} - ${job.startTime}</span>
              <span>Address: ${job.address}</span>
              <span class="highlight">Lock: ${job.lockCode}</span>
              <span>${job.guestsOut ? '✓ Ready' : '⏳ Waiting'}</span>
            </div>
          `).join('')}
        </div>
        <div class="footer">Powered by Savvy OS - Enterprise Cleaning Management Platform</div>
      </div>
    `;

    const generateJobTemplate = (job, index) => `
      <div class="card">
        <div class="header">
          <span class="header-logo">Savvy OS</span>
          ${job.location} - Room ${job.room}
        </div>
        <img src="${locationImages[job.location] || placeholderImageUrl}" class="location-image" alt="Location Image">
        <div class="content">
          <div class="guest-status ${job.guestsOut ? 'ready' : 'waiting'}">
            ${job.guestsOut ? '✓ GUESTS OUT - READY TO CLEAN' : '⏳ GUESTS STILL IN UNIT'}
          </div>
          <div class="section">
            <div class="label">Schedule</div>
            <div class="value">${new Date(job.date).toLocaleDateString()} | ${job.startTime} - ${job.dueTime}</div>
            <div class="value">Predicted Time: ${job.predictedTime}</div>
            <div class="value">${job.guestCount} guests${job.dogCount > 0 ? `, ${job.dogCount} dogs` : ''}</div>
          </div>
          <div class="section">
            <div class="label">Property Details</div>
            <div class="value">Address: ${job.address}</div>
            <div class="value">Manager: ${job.unitManagerName}</div>
            <div class="value">Lock Code: <span class="highlight">${job.lockCode}</span></div>
            <div class="value">Beds: ${job.bedInfo}</div>
            <div class="value">Baths: ${job.bathInfo}</div>
          </div>
          <div class="section">
            <div class="label">WiFi & Amenities</div>
            <div class="value">Network: ${job.wifiNetwork}</div>
            <div class="value">Password: <span class="highlight">${job.wifiPassword}</span></div>
            ${job.wifiIncluded ? '<div class="value">✓ WiFi Included</div>' : ''}
            ${job.linenPickup ? '<div class="value">✓ Linen Pickup Required</div>' : ''}
          </div>
          <div class="section">
            <div class="label">Cleaning Instructions</div>
            <div class="value">Standard: ${job.permanentInstructions}</div>
            <div class="value">This Week: ${job.weekSpecificInstructions}</div>
            <div class="value">Linen: ${job.linenInstructions}</div>
          </div>
          <div class="section">
            <div class="label">Parking</div>
            <div class="value">Space: ${job.parkingSpace}</div>
            <div class="value">Instructions: ${job.parkingInstructions}</div>
          </div>
          ${job.assigned ? `
            <div class="section">
              <div class="label">Assigned Cleaner</div>
              <div class="value">Name: ${job.assigned.name}</div>
              <div class="value">Team: ${job.assigned.team}</div>
              <div class="value">Phone: <span class="highlight">${job.assigned.phone}</span></div>
              <div class="value">Email: ${job.assigned.email}</div>
              <div class="value">Rating: ${job.assigned.rating.toFixed(1)}★</div>
            </div>
          ` : '<div class="section"><div class="value">Not Assigned</div></div>'}
        </div>
        <img src="/qrcode.png" class="qr-image" alt="QR Code">
        <div class="quote">"${cleaningQuotes[index % cleaningQuotes.length]}"</div>
        <div class="footer">Powered by Savvy OS - Enterprise Cleaning Management Platform</div>
      </div>
    `;

    const printWindow = window.open('', '', 'height=800,width=600');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
              body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background: #ffffff; }
              .summary { max-width: 900px; margin: 40px auto; background: #ffffff; border-radius: 12px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1); padding: 40px; page-break-after: always; }
              .card { max-width: 900px; min-height: 842px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1); padding: 40px; display: flex; flex-direction: column; justify-content: space-between; page-break-before: always; }
              .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: #ffffff; padding: 20px; text-align: center; font-size: 32px; font-weight: 700; border-radius: 8px 8px 0 0; margin: -40px -40px 30px -40px; position: relative; }
              .header-logo { font-size: 16px; color: #bfdbfe; position: absolute; top: 10px; left: 20px; font-weight: 500; }
              .summary-header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: #ffffff; padding: 20px; text-align: center; font-size: 32px; font-weight: 700; border-radius: 8px 8px 0 0; margin: -40px -40px 30px -40px; position: relative; }
              .info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 16px; color: #1f2937; margin-bottom: 30px; }
              .job-list { background: #f9fafb; padding: 20px; border-radius: 8px; }
              .job-list-header { font-weight: 600; color: #1f2937; margin-bottom: 20px; font-size: 20px; }
              .job-item { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 15px 0; font-size: 15px; color: #1f2937; border-bottom: 1px solid #e5e7eb; }
              .job-item:last-child { border-bottom: none; }
              .content { flex-grow: 1; }
              .section { margin-bottom: 20px; }
              .label { font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.1em; }
              .value { font-size: 15px; color: #374151; line-height: 1.8; margin-left: 10px; }
              .highlight { color: #dc2626; font-weight: 600; }
              .rating { color: #f59e0b; font-weight: 600; }
              .guest-status { padding: 16px; text-align: center; font-weight: 700; font-size: 16px; border-radius: 12px; margin-bottom: 24px; }
              .guest-status.ready { background: linear-gradient(135deg, #dcfce7, #86efac); color: #166534; border: 2px solid #22c55e; }
              .guest-status.waiting { background: linear-gradient(135deg, #fef3c7, #fde047); color: #854d0e; border: 2px solid #eab308; }
              .location-image { width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 20px; }
              .qr-image { width: 150px; height: 150px; object-fit: contain; border-radius: 8px; margin: 20px auto; display: block; }
              .quote { font-size: 18px; font-style: italic; color: #1f2937; text-align: center; margin: 20px 0; padding: 20px; background: #f9fafb; border-left: 4px solid #3b82f6; border-radius: 8px; }
              .footer { text-align: center; font-size: 12px; color: #6b7280; padding-top: 20px; border-top: 1px solid #e5e7eb; }
              @page { margin: 0.75in; size: A4; }
              @media print { 
                body { padding: 0; background: #ffffff; } 
                .summary, .card { box-shadow: none; margin: 0 auto; } 
                .summary { page-break-after: always; }
                .card { page-break-before: always; }
              }
            </style>
          </head>
          <body>
            ${generateSummaryTemplate()}
            ${jobsToPrint.map((job, index) => generateJobTemplate(job, index)).join('')}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    } else {
      toast.error('Failed to open print window. Please check popup settings.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  }, [jobs, filters.cleaner]);

  const scheduleNotification = useCallback((job, scheduleData) => {
    setJobs(prevJobs => prevJobs.map(j => j.id === job.id ? { ...j, scheduledNotification: scheduleData } : j));
    toast.success(`📅 Notification scheduled for ${job.assigned?.name}!`, {
      position: 'top-right',
      autoClose: 3000,
    });
    setShowScheduleModal(null);
  }, []);

  const sendBulkSMS = useCallback(() => {
    const assignedJobs = jobs.filter(job => job.assigned && selectedJobs.has(job.id));
    const uniqueCleaners = [...new Set(assignedJobs.map(job => job.assigned.id))];
    
    toast.success(`📱 Bulk SMS sent to ${uniqueCleaners.length} cleaners!`, {
      position: 'top-right',
      autoClose: 3000,
    });
    
    setBulkSMSMessage('');
    setShowBulkSMSModal(false);
    setSelectedJobs(new Set());
  }, [jobs, selectedJobs, bulkSMSMessage]);

  const columnsPerRow = 3;
  const cardHeight = 400; // Increased for guest status
  const cardWidth = 400;
  const rowCount = Math.ceil(filteredJobs.length / columnsPerRow);

  const gridData = useMemo(() => ({
    filteredJobs,
    selectedJobs,
    onJobSelect: handleJobSelect,
    onViewDetail: handleViewDetail,
    onPrint: printJobs,
    onNotify: handleNotify,
    onToggleGuestStatus: handleToggleGuestStatus,
    columnsPerRow
  }), [filteredJobs, selectedJobs, handleJobSelect, handleViewDetail, printJobs, handleNotify, handleToggleGuestStatus]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        className="z-[1000]"
      />

      {/* Premium Header */}
      <div className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-8 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl blur-sm opacity-50"></div>
                <img src="/logo.png" alt="Savvy Logo" className="relative h-12 w-12 rounded-2xl shadow-lg" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 bg-clip-text text-transparent">
                  Savvy OS
                </h1>
                <p className="text-gray-600 text-sm font-medium">Enterprise Cleaning Management Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowBulkSMSModal(true)}
                disabled={selectedJobs.size === 0}
                className={`${
                  selectedJobs.size > 0 
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-lg shadow-indigo-500/30' 
                    : 'bg-gray-200 cursor-not-allowed'
                } text-white px-5 py-2.5 rounded-xl transition-all font-semibold flex items-center gap-2`}
              >
                <MessageSquare className="w-4 h-4" />
                Bulk SMS ({selectedJobs.size})
              </button>
              <label className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl cursor-pointer hover:from-blue-700 hover:to-blue-800 transition-all font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/30">
                <Plus className="w-4 h-4" />
                Import Jobs
                <input type="file" accept=".csv,.xlsx" className="hidden" />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-7 gap-5 mb-8">
          <StatCard 
            icon={Activity} 
            value={stats.total} 
            label="Total Jobs" 
            color="from-blue-500 to-blue-600"
            trend
            trendValue={12}
          />
          <StatCard 
            icon={AlertCircle} 
            value={stats.unassigned} 
            label="Unassigned" 
            color="from-yellow-500 to-orange-500"
            trend
            trendValue={-8}
          />
          <StatCard 
            icon={CheckCircle} 
            value={stats.assigned} 
            label="Assigned" 
            color="from-green-500 to-emerald-600"
            trend
            trendValue={15}
          />
          <StatCard 
            icon={Printer} 
            value={stats.printed} 
            label="Printed" 
            color="from-blue-500 to-cyan-600"
            trend
            trendValue={5}
          />
          <StatCard 
            icon={Users} 
            value={stats.availableCleaners} 
            label="Available Cleaners" 
            color="from-purple-500 to-purple-600"
            trend
            trendValue={3}
          />
          <StatCard 
            icon={Calendar} 
            value={stats.scheduled} 
            label="Scheduled" 
            color="from-indigo-500 to-indigo-600"
            trend
            trendValue={20}
          />
          <StatCard 
            icon={CheckSquare} 
            value={stats.guestsOut} 
            label="Ready to Clean" 
            color="from-green-600 to-green-700"
            trend
            trendValue={18}
          />
        </div>

        {/* INTERACTIVE MAP SECTION */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 mb-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200/50">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">Live Cleaner Map</h3>
                <span className="text-sm text-gray-500">Real-time tracking</span>
              </div>
              <button
                onClick={() => setShowMapView(!showMapView)}
                className={`px-5 py-2 rounded-xl transition-all duration-300 font-semibold flex items-center gap-2 ${
                  showMapView 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <MapPin className="w-4 h-4" />
                {showMapView ? 'Hide Map' : 'Show Map'}
              </button>
            </div>
          </div>
          
          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
            showMapView ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="p-6">
              <InteractiveMap jobs={jobs} cleaners={FAKE_DATA.cleaners} />
            </div>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by room number, location, or cleaner name..."
                onChange={(e) => debouncedSetSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium bg-white/50"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all flex items-center gap-2 font-semibold shadow-sm"
            >
              <Filter className="w-5 h-5" />
              Filters
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAssignModal(true)}
                disabled={selectedJobs.size === 0}
                className={`${
                  selectedJobs.size > 0 
                    ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-500/30' 
                    : 'bg-gray-200 cursor-not-allowed'
                } text-white px-5 py-3.5 rounded-xl transition-all flex items-center gap-2 font-semibold`}
              >
                <Users className="w-5 h-5" />
                Assign ({selectedJobs.size})
              </button>
              <button
                onClick={() => filters.cleaner ? printCleanerSummary() : toast.error('Please select a cleaner.')}
                disabled={!filters.cleaner}
                className={`${
                  filters.cleaner 
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-lg shadow-indigo-500/30' 
                    : 'bg-gray-200 cursor-not-allowed'
                } text-white px-5 py-3.5 rounded-xl transition-all flex items-center gap-2 font-semibold`}
              >
                <Printer className="w-5 h-5" />
                Summary
              </button>
              <button
                onClick={() => filters.cleaner ? printJobsForCleaner() : printJobs()}
                disabled={selectedJobs.size === 0 && !filters.cleaner}
                className={`${
                  (selectedJobs.size > 0 || filters.cleaner)
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30' 
                    : 'bg-gray-200 cursor-not-allowed'
                } text-white px-5 py-3.5 rounded-xl transition-all flex items-center gap-2 font-semibold`}
              >
                <Printer className="w-5 h-5" />
                {filters.cleaner ? 'Cleaner Jobs' : `Print (${selectedJobs.size})`}
              </button>
            </div>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                  <select
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium bg-white"
                  >
                    <option value="">All Locations</option>
                    {FAKE_DATA.locations.map(loc => (
                      <option key={loc.name} value={loc.name}>{loc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={filters.date}
                    onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium bg-white"
                  >
                    <option value="all">All Jobs</option>
                    <option value="unassigned">Unassigned</option>
                    <option value="assigned">Assigned</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Cleaner</label>
                  <select
                    value={filters.cleaner}
                    onChange={(e) => setFilters({ ...filters, cleaner: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium bg-white"
                  >
                    <option value="">All Cleaners</option>
                    {FAKE_DATA.cleaners.map(cleaner => (
                      <option key={cleaner.id} value={cleaner.id}>{cleaner.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Virtualized Job Grid */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-600" />
              Job Overview
              <span className="text-sm font-normal text-gray-500">({filteredJobs.length} jobs)</span>
            </h3>
          </div>
          {filteredJobs.length > 0 ? (
            <div className="h-[650px] rounded-xl overflow-hidden">
              <Grid
                ref={gridRef}
                columnCount={columnsPerRow}
                columnWidth={cardWidth}
                height={650}
                rowCount={rowCount}
                rowHeight={cardHeight}
                itemData={gridData}
                width={1200}
                className="scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-gray-100"
              >
                {GridCell}
              </Grid>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <div className="text-gray-500 text-xl font-semibold mb-2">No jobs found</div>
              <div className="text-gray-400">Try adjusting your search criteria or filters</div>
            </div>
          )}
        </div>
      </div>

      {/* Job Detail Modal */}
      <Modal 
        isOpen={!!showJobDetail} 
        onClose={() => setShowJobDetail(null)}
        title={showJobDetail ? `${showJobDetail.location} - Room ${showJobDetail.room}` : ''}
        size="lg"
      >
        {showJobDetail && (
          <>
            {/* Guest Status in Modal */}
            <div className="mb-6">
              <button
                onClick={() => handleToggleGuestStatus(showJobDetail.id)}
                className={`w-full flex items-center justify-between px-6 py-4 rounded-xl border-2 transition-all ${
                  showJobDetail.guestsOut
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 hover:border-green-400'
                    : 'bg-gradient-to-r from-amber-50 to-yellow-50 border-yellow-300 hover:border-yellow-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  {showJobDetail.guestsOut ? (
                    <>
                      <CheckSquare className="w-6 h-6 text-green-600" />
                      <span className="font-bold text-green-900 text-lg">Guests Out - Ready to Clean</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="w-6 h-6 text-yellow-600" />
                      <span className="font-bold text-yellow-900 text-lg">Guests Still In Unit</span>
                    </>
                  )}
                </div>
                <span className="text-sm text-gray-500">Click to toggle</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 p-5 rounded-xl border border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Schedule
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">{new Date(showJobDetail.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-green-600" />
                      <span>{showJobDetail.startTime} - {showJobDetail.dueTime}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span>{showJobDetail.guestCount} guests{showJobDetail.dogCount > 0 ? `, ${showJobDetail.dogCount} dogs` : ''}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 p-5 rounded-xl border border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    Property Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Address:</strong> {showJobDetail.address}</div>
                    <div><strong>Manager:</strong> {showJobDetail.unitManagerName}</div>
                    <div><strong>Lock Code:</strong> <span className="text-red-600 font-bold">{showJobDetail.lockCode}</span></div>
                    <div><strong>Beds:</strong> {showJobDetail.bedInfo}</div>
                    <div><strong>Bathrooms:</strong> {showJobDetail.bathInfo}</div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 p-5 rounded-xl border border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Wifi className="w-5 h-5 text-blue-600" />
                    WiFi & Amenities
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Network:</strong> {showJobDetail.wifiNetwork}</div>
                    <div><strong>Password:</strong> <span className="text-red-600 font-bold">{showJobDetail.wifiPassword}</span></div>
                    <div className="flex gap-3 mt-3">
                      {showJobDetail.wifiIncluded && <Badge variant="info" icon={Wifi}>WiFi Included</Badge>}
                      {showJobDetail.linenPickup && <Badge variant="warning" icon={Package}>Linen Pickup</Badge>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 p-5 rounded-xl border border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-4">Cleaning Instructions</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Standard:</strong> {showJobDetail.permanentInstructions}</div>
                    <div><strong>This Week:</strong> {showJobDetail.weekSpecificInstructions}</div>
                    <div><strong>Linen:</strong> {showJobDetail.linenInstructions}</div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 p-5 rounded-xl border border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-4">Parking</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Space:</strong> {showJobDetail.parkingSpace}</div>
                    <div><strong>Instructions:</strong> {showJobDetail.parkingInstructions}</div>
                  </div>
                </div>

                {showJobDetail.assigned ? (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border-2 border-green-200">
                    <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Assigned Cleaner
                    </h3>
                    <div className="space-y-3">
                      <div className="font-semibold text-lg">{showJobDetail.assigned.name}</div>
                      <div className="text-sm space-y-2 text-green-800">
                        <div>{showJobDetail.assigned.team}</div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {showJobDetail.assigned.phone}
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {showJobDetail.assigned.email}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-3">
                        {[...Array(Math.floor(showJobDetail.assigned.rating))].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                        <span className="text-sm text-gray-600 ml-2">
                          ({showJobDetail.assigned.rating.toFixed(1)})
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-5 rounded-xl border-2 border-yellow-200">
                    <div className="flex items-center gap-3 text-yellow-900">
                      <AlertCircle className="w-6 h-6" />
                      <span className="font-semibold text-lg">Not yet assigned</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {showJobDetail?.assigned && (
              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => printJobs([showJobDetail.id])}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-semibold flex items-center justify-center gap-2 shadow-lg shadow-green-500/30"
                >
                  <Printer className="w-5 h-5" />
                  Print Job Sheet
                </button>
                <button
                  onClick={() => setShowNotifyModal(showJobDetail)}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30"
                >
                  <Bell className="w-5 h-5" />
                  Send Notification
                </button>
                <button
                  onClick={() => setShowScheduleModal(showJobDetail)}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-4 rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30"
                >
                  <Calendar className="w-5 h-5" />
                  Schedule
                </button>
              </div>
            )}
          </>
        )}
      </Modal>

      {/* Assign Modal */}
      <Modal 
        isOpen={showAssignModal} 
        onClose={() => setShowAssignModal(false)}
        title={`Assign Jobs (${selectedJobs.size} selected)`}
        size="md"
      >
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {FAKE_DATA.cleaners.filter(c => c.available).map(cleaner => (
            <div
              key={cleaner.id}
              onClick={() => assignJobs(cleaner.id)}
              className="p-5 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{cleaner.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{cleaner.team}</div>
                  <div className="text-xs text-gray-500 mt-1">{cleaner.phone}</div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-0.5 justify-end mb-2">
                    {[...Array(Math.floor(cleaner.rating))].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <Badge variant="default">
                    {cleaner.assignedJobs} jobs
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Notification Modal */}
      <Modal 
        isOpen={!!showNotifyModal} 
        onClose={() => setShowNotifyModal(null)}
        title="Send Notification"
        size="sm"
      >
        {showNotifyModal && (
          <div className="space-y-5">
            <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 p-4 rounded-xl border border-gray-200">
              <div className="text-sm space-y-1">
                <div><strong>To:</strong> {showNotifyModal.assigned?.name}</div>
                <div><strong>Job:</strong> {showNotifyModal.location} Room {showNotifyModal.room}</div>
                <div><strong>Status:</strong> {showNotifyModal.guestsOut ? '✓ Ready to Clean' : '⏳ Guests Still In'}</div>
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => sendNotification(showNotifyModal, 'full')}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
              >
                <Mail className="w-5 h-5" />
                Send Full Email Details
              </button>
              <button
                onClick={() => sendNotification(showNotifyModal, 'sms')}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-5 py-4 rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-semibold flex items-center justify-center gap-2 shadow-lg shadow-green-500/30"
              >
                <MessageSquare className="w-5 h-5" />
                Send Quick SMS
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Bulk SMS Modal */}
      <Modal 
        isOpen={showBulkSMSModal} 
        onClose={() => setShowBulkSMSModal(false)}
        title="Bulk SMS"
        size="sm"
      >
        <div className="space-y-5">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-200">
            <div className="text-sm font-semibold text-indigo-900">
              Sending to {[...new Set(jobs.filter(job => job.assigned && selectedJobs.has(job.id)).map(job => job.assigned.id))].length} cleaners
            </div>
          </div>
          <textarea
            value={bulkSMSMessage}
            onChange={(e) => setBulkSMSMessage(e.target.value)}
            placeholder="Enter your message..."
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all h-32 resize-none font-medium"
          />
          <button
            onClick={sendBulkSMS}
            disabled={!bulkSMSMessage.trim()}
            className={`w-full ${
              bulkSMSMessage.trim() 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30' 
                : 'bg-gray-200 cursor-not-allowed'
            } text-white px-5 py-4 rounded-xl transition-all font-semibold flex items-center justify-center gap-2`}
          >
            <Send className="w-5 h-5" />
            Send Bulk SMS
          </button>
        </div>
      </Modal>

      {/* Schedule Modal */}
      <Modal 
        isOpen={!!showScheduleModal} 
        onClose={() => setShowScheduleModal(null)}
        title="Schedule Notification"
        size="sm"
      >
        {showScheduleModal && (
          <div className="space-y-5">
            <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 p-4 rounded-xl border border-gray-200">
              <div className="text-sm space-y-1">
                <div><strong>Job:</strong> {showScheduleModal.location} Room {showScheduleModal.room}</div>
                <div><strong>Cleaner:</strong> {showScheduleModal.assigned?.name}</div>
                <div><strong>Status:</strong> {showScheduleModal.guestsOut ? '✓ Ready to Clean' : '⏳ Guests Still In'}</div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Schedule Date & Time</label>
              <input
                type="datetime-local"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Message Type</label>
              <select className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium">
                <option>Email Reminder</option>
                <option>SMS Reminder</option>
                <option>Both Email & SMS</option>
              </select>
            </div>
            <button
              onClick={() => scheduleNotification(showScheduleModal, { date: new Date(), type: 'email' })}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-5 py-4 rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30"
            >
              <Calendar className="w-5 h-5" />
              Schedule Notification
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ModernCleaningSystem;