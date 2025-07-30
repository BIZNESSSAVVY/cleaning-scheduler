import React, { useState, useMemo, useCallback } from 'react';
import { Calendar, Clock, Users, Wifi, Package, MapPin, Search, Bell, Printer, Eye, CheckCircle, AlertCircle, Phone, Mail, Filter, X, ChevronDown, ChevronUp, Plus, Settings, MessageSquare, Send, Zap, Star, Award } from 'lucide-react';

// PERFORMANCE FIX 1: Move data generation outside component and make it static
const FAKE_DATA = (() => {
  const locations = ['Downtown Hotel', 'Riverside Inn', 'City Center Lodge', 'Park View Resort', 'Marina Hotel'];
  const roomTypes = ['Standard Room', 'Deluxe Suite', 'Presidential Suite', 'Studio Apartment'];
  
  const cleaners = Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    name: `${['Sarah', 'Mike', 'Jessica', 'David', 'Maria', 'John', 'Lisa', 'Carlos', 'Amanda', 'Robert'][i % 10]} ${['Johnson', 'Smith', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson'][Math.floor(i / 10)]}`,
    team: `Team ${Math.floor(i / 10) + 1}`,
    phone: `(443) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    email: `${['sarah', 'mike', 'jessica', 'david', 'maria', 'john', 'lisa', 'carlos', 'amanda', 'robert'][i % 10]}.${['johnson', 'smith', 'williams', 'brown', 'davis', 'miller', 'wilson', 'moore', 'taylor', 'anderson'][Math.floor(i / 10)]}@cleanteam.com`,
    available: Math.random() > 0.2,
    assignedJobs: Math.floor(Math.random() * 5),
    rating: 4 + Math.random()
  }));

  // PERFORMANCE FIX 2: Reduce initial data to 50 jobs instead of 500
  const jobs = Array.from({ length: 50 }, (_, i) => {
    const startHour = 8 + Math.floor(Math.random() * 8);
    const duration = 1 + Math.floor(Math.random() * 3);
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(Math.random() * 7));
    
    return {
      id: i + 1,
      location: locations[Math.floor(Math.random() * locations.length)],
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

  return { jobs, cleaners };
})();

// PERFORMANCE FIX 3: Memoize JobCard component to prevent unnecessary re-renders
const JobCard = React.memo(({ job, isSelected, onSelect }) => {
  // PERFORMANCE FIX 4: Use useCallback for event handlers
  const handleCheckboxChange = useCallback((e) => {
    onSelect(job.id, e.target.checked);
  }, [job.id, onSelect]);

  const handleCardClick = useCallback((e) => {
    e.stopPropagation();
    // Add click handler if needed
  }, []);

  return (
    <div className={`
      relative bg-white rounded-xl shadow-md border transition-all duration-200 hover:shadow-lg cursor-pointer
      ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
      ${job.priority === 'high' ? 'ring-1 ring-red-300' : ''}
    `}>
      <div className="p-4">
        {/* Simplified header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleCheckboxChange}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
            <div>
              <div className="text-xl font-bold text-gray-900">Room {job.room}</div>
              <div className="text-sm text-gray-600">{job.roomType}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {job.priority === 'high' && (
              <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                URGENT
              </div>
            )}
            <div className="flex gap-1">
              {job.wifiIncluded && <Wifi className="w-4 h-4 text-blue-600" />}
              {job.linenPickup && <Package className="w-4 h-4 text-orange-600" />}
            </div>
          </div>
        </div>

        {/* Simplified content */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-gray-700">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="font-medium">{job.location}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Clock className="w-4 h-4 text-green-600" />
            <span>{job.startTime} - {job.dueTime}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Users className="w-4 h-4 text-purple-600" />
            <span>{job.guestCount} guests{job.dogCount > 0 ? `, ${job.dogCount} dogs` : ''}</span>
          </div>
        </div>

        {/* Simplified status */}
        <div className="mb-4">
          {job.assigned ? (
            <div className="flex items-center gap-2 bg-green-50 p-2 rounded border border-green-200">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div>
                <div className="font-medium text-green-800">{job.assigned.name}</div>
                <div className="text-sm text-green-600">{job.assigned.team}</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-yellow-50 p-2 rounded border border-yellow-200">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="font-medium text-yellow-800">Awaiting Assignment</span>
            </div>
          )}
        </div>
        
        {/* Simplified buttons */}
        <div className="flex gap-2">
          <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors text-sm font-medium">
            View
          </button>
          {job.assigned && (
            <>
              <button className="flex-1 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors text-sm font-medium">
                Print
              </button>
              <button className="flex-1 bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 transition-colors text-sm font-medium">
                Notify
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

const ModernCleaningSystem = () => {
  // PERFORMANCE FIX 5: Initialize with static data
  const [jobs, setJobs] = useState(FAKE_DATA.jobs);
  const [selectedJobs, setSelectedJobs] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ location: '', date: '', status: 'unassigned' });
  const [showJobDetail, setShowJobDetail] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(null);
  const [showBulkSMSModal, setShowBulkSMSModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentView, setCurrentView] = useState('grid');
  const [bulkSMSMessage, setBulkSMSMessage] = useState('');

  // PERFORMANCE FIX 6: Optimize filtering with better dependency array
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
      
      return matchesSearch && matchesLocation && matchesDate && matchesStatus;
    });
  }, [jobs, searchTerm, filters]);

  // PERFORMANCE FIX 7: Optimize stats calculation
  const stats = useMemo(() => {
    const total = jobs.length;
    const unassigned = jobs.filter(job => !job.assigned).length;
    const assigned = jobs.filter(job => job.assigned).length;
    const printed = jobs.filter(job => job.status === 'printed').length;
    const availableCleaners = FAKE_DATA.cleaners.filter(cleaner => cleaner.available).length;
    const scheduled = jobs.filter(job => job.scheduledNotification).length;
    
    return { total, unassigned, assigned, printed, availableCleaners, scheduled };
  }, [jobs]);

  // PERFORMANCE FIX 8: Use useCallback for event handlers
  const handleJobSelect = useCallback((jobId, isSelected) => {
    setSelectedJobs(prev => {
      const newSelected = new Set(prev);
      if (isSelected) {
        newSelected.add(jobId);
      } else {
        newSelected.delete(jobId);
      }
      return newSelected;
    });
  }, []);

  const handleToggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  const assignJobs = useCallback((cleanerId) => {
    const cleaner = FAKE_DATA.cleaners.find(c => c.id === cleanerId);
    const jobIds = Array.from(selectedJobs);
    
    setJobs(prevJobs => 
      prevJobs.map(job => 
        jobIds.includes(job.id) ? { ...job, assigned: cleaner, status: 'assigned' } : job
      )
    );
    setSelectedJobs(new Set());
    setShowAssignModal(false);
  }, [selectedJobs]);

  const printJobs = useCallback((jobIds = []) => {
    const ids = jobIds.length > 0 ? jobIds : Array.from(selectedJobs);
    const jobsToPrint = jobs.filter(job => ids.includes(job.id));
    
    jobsToPrint.forEach(job => {
      const printWindow = window.open('', '', 'height=800,width=600');
      printWindow.document.write(generatePrintTemplate(job));
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
      }, 500);
    });
    
    setJobs(prevJobs => 
      prevJobs.map(job => 
        ids.includes(job.id) ? { ...job, status: 'printed' } : job
      )
    );
    setSelectedJobs(new Set());
  }, [selectedJobs, jobs]);

  const generatePrintTemplate = (job) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { 
              font-family: 'Arial', sans-serif; 
              padding: 20px; 
              line-height: 1.4; 
              background: white;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
            }
            .header { 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 20px; 
              text-align: center; 
              color: #2563EB;
              border-bottom: 2px solid #2563EB;
              padding-bottom: 10px;
            }
            .section { 
              margin: 15px 0; 
              padding: 10px; 
              border-left: 3px solid #3B82F6; 
              background: #F8FAFC;
            }
            .label { 
              font-weight: bold; 
              color: #1F2937; 
              margin-bottom: 5px;
            }
            .value { 
              margin-left: 10px; 
              margin-bottom: 5px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            🏨 ${job.location} - Room ${job.room}
          </div>
          
          <div class="section">
            <div class="label">📍 Property Address:</div>
            <div class="value">${job.location}<br>131 Georgia Avenue, Ocean City, MD 21842</div>
          </div>

          <div class="section">
            <div class="label">👤 Property Manager:</div>
            <div class="value">${job.unitManagerName}</div>
            <div class="value">📞 (443) 953-6024</div>
          </div>
          
          <div class="section">
            <div class="label">🕐 Schedule:</div>
            <div class="value">Start Time: ${job.startTime}</div>
            <div class="value">Due Time: ${job.dueTime}</div>
            <div class="value">Date: ${new Date(job.date).toLocaleDateString()}</div>
          </div>
          
          <div class="section">
            <div class="label">🔑 Access Information:</div>
            <div class="value">Lock Code: <strong>${job.lockCode}</strong></div>
            <div class="value">Room Type: ${job.roomType}</div>
          </div>
        </body>
      </html>
    `;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simplified Header */}
      <div className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Savvy OS</h1>
                <p className="text-gray-600">Cleaning Management System</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowBulkSMSModal(true)}
                disabled={selectedJobs.size === 0}
                className={`${selectedJobs.size > 0 ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-300 cursor-not-allowed'} text-white px-4 py-2 rounded-lg transition-colors font-medium`}
              >
                Bulk SMS ({selectedJobs.size})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Simplified Stats Dashboard */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-gray-600">Total Jobs</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="text-2xl font-bold text-yellow-600">{stats.unassigned}</div>
            <div className="text-gray-600">Unassigned</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="text-2xl font-bold text-green-600">{stats.assigned}</div>
            <div className="text-gray-600">Assigned</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">{stats.printed}</div>
            <div className="text-gray-600">Printed</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="text-2xl font-bold text-purple-600">{stats.availableCleaners}</div>
            <div className="text-gray-600">Available</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="text-2xl font-bold text-indigo-600">{stats.scheduled}</div>
            <div className="text-gray-600">Scheduled</div>
          </div>
        </div>

        {/* Simplified Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by room number or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <button
              onClick={handleToggleFilters}
              className={`${showFilters ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} px-6 py-3 rounded-lg transition-colors flex items-center gap-2 font-medium`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
          
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 lg:grid-cols-3 gap-4">
              <select
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Locations</option>
                <option value="Downtown Hotel">Downtown Hotel</option>
                <option value="Riverside Inn">Riverside Inn</option>
                <option value="City Center Lodge">City Center Lodge</option>
                <option value="Park View Resort">Park View Resort</option>
                <option value="Marina Hotel">Marina Hotel</option>
              </select>
              
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Jobs</option>
                <option value="unassigned">Unassigned Only</option>
                <option value="assigned">Assigned Only</option>
              </select>
            </div>
          )}
        </div>

        {/* Simplified Bulk Actions */}
        {selectedJobs.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <div className="font-medium text-blue-900">
                {selectedJobs.size} job{selectedJobs.size > 1 ? 's' : ''} selected
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Assign Selected
                </button>
                <button
                  onClick={() => printJobs()}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Print Selected
                </button>
                <button
                  onClick={() => setSelectedJobs(new Set())}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredJobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              isSelected={selectedJobs.has(job.id)}
              onSelect={handleJobSelect}
            />
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-xl mb-4">No jobs found</div>
            <p className="text-gray-400 mb-4">Try adjusting your search criteria or filters</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilters({ location: '', date: '', status: 'all' });
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Assignment Modal (simplified) */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Assign Cleaners</h3>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 max-h-96 overflow-auto">
              <div className="space-y-3">
                {FAKE_DATA.cleaners.filter(c => c.available).map(cleaner => (
                  <div
                    key={cleaner.id}
                    onClick={() => assignJobs(cleaner.id)}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{cleaner.name}</div>
                      <div className="text-sm text-gray-600">{cleaner.team} • {cleaner.phone}</div>
                    </div>
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium">
                      Assign
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernCleaningSystem;