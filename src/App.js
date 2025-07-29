import React, { useState, useMemo } from 'react';
import { Calendar, Clock, Users, Wifi, Package, MapPin, Search, Bell, Printer, Eye, CheckCircle, AlertCircle, Phone, Mail, Filter, X, ChevronDown, ChevronUp, Plus, Settings, MessageSquare, Send, Zap, Star, Award } from 'lucide-react';

const generateFakeData = () => {
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

  const jobs = Array.from({ length: 500 }, (_, i) => {
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
};

const ModernCleaningSystem = () => {
  const { jobs: initialJobs, cleaners } = useMemo(() => generateFakeData(), []);
  const [jobs, setJobs] = useState(initialJobs);
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
  const [isLoading, setIsLoading] = useState(false);

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

  const stats = useMemo(() => {
    const total = jobs.length;
    const unassigned = jobs.filter(job => !job.assigned).length;
    const assigned = jobs.filter(job => job.assigned).length;
    const printed = jobs.filter(job => job.status === 'printed').length;
    const availableCleaners = cleaners.filter(cleaner => cleaner.available).length;
    const scheduled = jobs.filter(job => job.scheduledNotification).length;
    
    return { total, unassigned, assigned, printed, availableCleaners, scheduled };
  }, [jobs, cleaners]);

  const handleJobSelect = (jobId, isSelected) => {
    const newSelected = new Set(selectedJobs);
    if (isSelected) {
      newSelected.add(jobId);
    } else {
      newSelected.delete(jobId);
    }
    setSelectedJobs(newSelected);
  };

  const assignJobs = async (cleanerId) => {
    setIsLoading(true);
    // Simulate network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const cleaner = cleaners.find(c => c.id === cleanerId);
    const jobIds = Array.from(selectedJobs);
    
    setJobs(prevJobs => 
      prevJobs.map(job => 
        jobIds.includes(job.id) ? { ...job, assigned: cleaner, status: 'assigned' } : job
      )
    );
    setSelectedJobs(new Set());
    setShowAssignModal(false);
    setIsLoading(false);
  };

  const printJobs = (jobIds = []) => {
    const ids = jobIds.length > 0 ? jobIds : Array.from(selectedJobs);
    const jobsToPrint = jobs.filter(job => ids.includes(job.id));
    
    jobsToPrint.forEach(job => {
      const printWindow = window.open('', '', 'height=800,width=600');
      printWindow.document.write(generatePrintTemplate(job));
      printWindow.document.close();
      
      // Show print preview
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
  };

  const sendNotification = (job, messageType = 'full') => {
    const message = messageType === 'full' ? 
      `Job Assignment - ${job.location}
Location: ${job.location}, 131 Georgia Avenue, Ocean City, MD
Room: ${job.room} (${job.roomType})
Time: ${job.startTime} - ${job.dueTime}
Lock Code: ${job.lockCode}
Manager: ${job.unitManagerName} (443) 953-6024
Guests: ${job.guestCount}, Dogs: ${job.dogCount}
WiFi: ${job.wifiNetwork} / ${job.wifiPassword}
Parking: ${job.parkingSpace} - ${job.parkingInstructions}
Instructions: ${job.weekSpecificInstructions}
Linen: ${job.linenInstructions}` :
      `${job.assigned?.name}: ${job.location} Room ${job.room}, ${job.startTime}, Code: ${job.lockCode}, Manager: (443) 953-6024`;
    
    console.log('Notification sent:', message);
    alert(`✅ ${messageType === 'full' ? 'Email' : 'SMS'} sent to ${job.assigned?.name}!`);
    setShowNotifyModal(null);
  };

  const scheduleNotification = (job, scheduleData) => {
    setJobs(prevJobs => 
      prevJobs.map(j => 
        j.id === job.id ? { ...j, scheduledNotification: scheduleData } : j
      )
    );
    alert(`📅 Notification scheduled for ${job.assigned?.name}!`);
    setShowScheduleModal(null);
  };

  const sendBulkSMS = () => {
    const assignedJobs = jobs.filter(job => job.assigned && selectedJobs.has(job.id));
    const uniqueCleaners = [...new Set(assignedJobs.map(job => job.assigned.id))];
    
    uniqueCleaners.forEach(cleanerId => {
      const cleaner = cleaners.find(c => c.id === cleanerId);
      const cleanerJobs = assignedJobs.filter(job => job.assigned.id === cleanerId);
      console.log(`SMS to ${cleaner.name}:`, bulkSMSMessage);
    });
    
    alert(`📱 Bulk SMS sent to ${uniqueCleaners.length} cleaners!`);
    setBulkSMSMessage('');
    setShowBulkSMSModal(false);
    setSelectedJobs(new Set());
  };

  const generatePrintTemplate = (job) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { 
              font-family: 'Arial', sans-serif; 
              padding: 30px; 
              line-height: 1.6; 
              background: white;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
            }
            .header { 
              font-size: 28px; 
              font-weight: bold; 
              margin-bottom: 30px; 
              text-align: center; 
              color: #2563EB;
              border-bottom: 3px solid #2563EB;
              padding-bottom: 15px;
            }
            .section { 
              margin: 20px 0; 
              padding: 15px; 
              border-left: 5px solid #3B82F6; 
              background: #F8FAFC;
              border-radius: 0 8px 8px 0;
            }
            .label { 
              font-weight: bold; 
              color: #1F2937; 
              font-size: 16px;
              margin-bottom: 5px;
            }
            .value { 
              margin-left: 15px; 
              font-size: 15px;
              margin-bottom: 8px;
            }
            .important { 
              background: #FEF3C7; 
              padding: 20px; 
              border-radius: 8px; 
              margin: 15px 0; 
              border: 2px solid #F59E0B;
            }
            .contact-info {
              background: #DBEAFE;
              padding: 20px;
              border-radius: 8px;
              margin: 15px 0;
              border: 2px solid #3B82F6;
            }
            .instructions {
              background: #F0FDF4;
              padding: 20px;
              border-radius: 8px;
              margin: 15px 0;
              border: 2px solid #10B981;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #6B7280;
              border-top: 1px solid #E5E7EB;
              padding-top: 20px;
            }
            .emoji { font-size: 18px; margin-right: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            🏨 ${job.location} - Room ${job.room}
          </div>
          
          <div class="important">
            <div class="label"><span class="emoji">📍</span>Property Address:</div>
            <div class="value">${job.location}<br>131 Georgia Avenue, Ocean City, MD 21842</div>
          </div>

          <div class="contact-info">
            <div class="label"><span class="emoji">👤</span>Property Manager:</div>
            <div class="value">${job.unitManagerName}</div>
            <div class="value">📞 (443) 953-6024</div>
          </div>
          
          <div class="section">
            <div class="label"><span class="emoji">🕐</span>Schedule:</div>
            <div class="value">Start Time: ${job.startTime}</div>
            <div class="value">Due Time: ${job.dueTime}</div>
            <div class="value">Estimated Duration: ${job.predictedTime}</div>
            <div class="value">Date: ${new Date(job.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
          
          <div class="section">
            <div class="label"><span class="emoji">🔑</span>Access Information:</div>
            <div class="value">Lock Code: <strong>${job.lockCode}</strong></div>
            <div class="value">Room Type: ${job.roomType}</div>
          </div>
          
          <div class="section">
            <div class="label"><span class="emoji">👥</span>Occupancy Details:</div>
            <div class="value">Number of Guests: ${job.guestCount}</div>
            ${job.dogCount > 0 ? `<div class="value">Dogs: ${job.dogCount}</div>` : ''}
            <div class="value">Bed Configuration: ${job.bedInfo}</div>
            <div class="value">Bathroom Details: ${job.bathInfo}</div>
          </div>
          
          <div class="section">
            <div class="label"><span class="emoji">📶</span>WiFi Information:</div>
            <div class="value">Network: ${job.wifiNetwork}</div>
            <div class="value">Password: ${job.wifiPassword}</div>
          </div>
          
          <div class="section">
            <div class="label"><span class="emoji">🚗</span>Parking Instructions:</div>
            <div class="value">Assigned Space: ${job.parkingSpace}</div>
            <div class="value">${job.parkingInstructions}</div>
          </div>
          
          <div class="instructions">
            <div class="label"><span class="emoji">📋</span>Cleaning Instructions:</div>
            <div class="value"><strong>Standard Protocol:</strong> ${job.permanentInstructions}</div>
            <div class="value"><strong>This Week Special:</strong> ${job.weekSpecificInstructions}</div>
            <div class="value"><strong>Linen Instructions:</strong> ${job.linenInstructions}</div>
          </div>

          <div class="footer">
            <p><strong>Savvy OS</strong> - Professional Cleaning Management System</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `;
  };

  const JobCard = ({ job, isSelected, onSelect }) => (
    <div className={`
      relative bg-white rounded-xl shadow-md border transition-all duration-200 hover:shadow-xl cursor-pointer group
      ${isSelected ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}
      ${job.priority === 'high' ? 'ring-2 ring-red-300 shadow-red-100' : ''}
    `}>
      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(job.id, e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
              onClick={(e) => e.stopPropagation()}
            />
            <div>
              <div className="text-xl font-bold text-gray-900 flex items-center gap-2">
                Room {job.room}
                {job.scheduledNotification && (
                  <Calendar className="w-4 h-4 text-purple-600" title="Notification Scheduled" />
                )}
              </div>
              <div className="text-sm text-gray-600 font-medium">{job.roomType}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {job.priority === 'high' && (
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span className="hidden sm:inline">URGENT</span>
              </div>
            )}
            <div className="flex gap-1">
              {job.wifiIncluded && <Wifi className="w-4 h-4 text-blue-600" title="WiFi Included" />}
              {job.linenPickup && <Package className="w-4 h-4 text-orange-600" title="Linen Pickup Required" />}
            </div>
          </div>
        </div>

        {/* Location & Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-gray-700">
            <div className="bg-blue-100 p-1.5 rounded-lg">
              <MapPin className="w-3 h-3 text-blue-600" />
            </div>
            <span className="font-semibold text-base">{job.location}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <div className="bg-green-100 p-1.5 rounded-lg">
              <Clock className="w-3 h-3 text-green-600" />
            </div>
            <span className="font-medium text-sm">{job.startTime} - {job.dueTime}</span>
            <span className="text-gray-500 text-sm">({job.predictedTime})</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <div className="bg-purple-100 p-1.5 rounded-lg">
              <Users className="w-3 h-3 text-purple-600" />
            </div>
            <span className="text-sm">{job.guestCount} guests{job.dogCount > 0 ? `, ${job.dogCount} dogs` : ''}</span>
          </div>
        </div>

        {/* Status */}
        <div className="mb-4">
          {job.assigned ? (
            <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
              <div className="bg-green-100 p-1.5 rounded-lg">
                <CheckCircle className="w-3 h-3 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-green-800 text-sm truncate">{job.assigned.name}</div>
                <div className="text-xs text-green-600">{job.assigned.team}</div>
              </div>
              <div className="flex items-center gap-0.5 text-yellow-500">
                {[...Array(Math.floor(job.assigned.rating))].map((_, i) => (
                  <Star key={i} className="w-2.5 h-2.5 fill-current" />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-amber-50 p-3 rounded-lg border border-yellow-200">
              <div className="bg-yellow-100 p-1.5 rounded-lg">
                <AlertCircle className="w-3 h-3 text-yellow-600" />
              </div>
              <span className="font-semibold text-yellow-800 text-sm">Awaiting Assignment</span>
            </div>
          )}
        </div>
        
        {/* Action buttons - improved mobile layout */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowJobDetail(job);
            }}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <Eye className="w-4 h-4" />
            <span>View Details</span>
          </button>
          
          {job.assigned && (
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  printJobs([job.id]);
                }}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-3 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 font-semibold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print</span>
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNotifyModal(job);
                }}
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-3 py-2 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-semibold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Notify</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Enhanced Header - Better mobile responsiveness */}
      <div className="bg-white shadow-xl border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 sm:p-3 rounded-xl shadow-lg">
                <Award className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Savvy OS
                </h1>
                <p className="text-gray-600 text-sm sm:text-base font-medium">Professional Cleaning Management</p>
              </div>
            </div>
            
            {/* Improved mobile header buttons */}
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <button 
                onClick={() => setShowBulkSMSModal(true)}
                disabled={selectedJobs.size === 0}
                className={`${selectedJobs.size > 0 ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700' : 'bg-gray-300 cursor-not-allowed'} text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-200 font-semibold shadow-lg flex items-center gap-1 sm:gap-2 text-sm sm:text-base flex-1 sm:flex-initial justify-center`}
              >
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden xs:inline">Bulk SMS</span>
                <span className="sm:hidden">SMS</span>
                <span className="bg-white bg-opacity-20 px-1.5 py-0.5 rounded-full text-xs ml-1">
                  {selectedJobs.size}
                </span>
              </button>
              <label className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl cursor-pointer hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Import Jobs</span>
                <span className="sm:hidden">Import</span>
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Dashboard - Better mobile grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {[
            { label: 'Total Jobs', value: stats.total, color: 'blue', width: '100%' },
            { label: 'Unassigned', value: stats.unassigned, color: 'yellow', width: `${(stats.unassigned/stats.total)*100}%` },
            { label: 'Assigned', value: stats.assigned, color: 'green', width: `${(stats.assigned/stats.total)*100}%` },
            { label: 'Printed', value: stats.printed, color: 'blue', width: `${(stats.printed/stats.total)*100}%` },
            { label: 'Available', value: stats.availableCleaners, color: 'purple', width: `${(stats.availableCleaners/cleaners.length)*100}%` },
            { label: 'Scheduled', value: stats.scheduled, color: 'indigo', width: `${(stats.scheduled/stats.total)*100}%` }
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-3 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200">
              <div className="text-lg sm:text-3xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-gray-600 font-semibold text-xs sm:text-base">{stat.label}</div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 mt-2 sm:mt-3">
                <div 
                  className={`bg-gradient-to-r from-${stat.color}-500 to-${stat.color}-600 h-1.5 sm:h-2 rounded-full transition-all duration-500`}style={{ width: stat.width }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Search and Filter Bar - Better mobile layout */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by room number or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:from-gray-200 hover:to-gray-300 transition-all duration-200 font-semibold flex items-center gap-2"
              >
                <Filter className="w-5 h-5" />
                <span>Filters</span>
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setShowAssignModal(true)}
                disabled={selectedJobs.size === 0}
                className={`${selectedJobs.size > 0 ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' : 'bg-gray-300 cursor-not-allowed'} text-white px-6 py-3 rounded-lg transition-all duration-200 font-semibold shadow-lg flex items-center gap-2`}
              >
                <Users className="w-5 h-5" />
                <span>Assign ({selectedJobs.size})</span>
              </button>

              <button
                onClick={() => printJobs()}
                disabled={selectedJobs.size === 0}
                className={`${selectedJobs.size > 0 ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' : 'bg-gray-300 cursor-not-allowed'} text-white px-6 py-3 rounded-lg transition-all duration-200 font-semibold shadow-lg flex items-center gap-2`}
              >
                <Printer className="w-5 h-5" />
                <span>Print ({selectedJobs.size})</span>
              </button>
            </div>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                  <select
                    value={filters.location}
                    onChange={(e) => setFilters({...filters, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Locations</option>
                    {['Downtown Hotel', 'Riverside Inn', 'City Center Lodge', 'Park View Resort', 'Marina Hotel'].map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={filters.date}
                    onChange={(e) => setFilters({...filters, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Jobs</option>
                    <option value="unassigned">Unassigned</option>
                    <option value="assigned">Assigned</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => setFilters({ location: '', date: '', status: 'unassigned' })}
                    className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-2 rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-semibold"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
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
            <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No jobs found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Job Detail Modal */}
      {showJobDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">
                {showJobDetail.location} - Room {showJobDetail.room}
              </h2>
              <button
                onClick={() => setShowJobDetail(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Schedule Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Date:</span> {new Date(showJobDetail.date).toLocaleDateString()}</div>
                      <div><span className="font-medium">Start Time:</span> {showJobDetail.startTime}</div>
                      <div><span className="font-medium">Due Time:</span> {showJobDetail.dueTime}</div>
                      <div><span className="font-medium">Estimated Duration:</span> {showJobDetail.predictedTime}</div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Location Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Property:</span> {showJobDetail.location}</div>
                      <div><span className="font-medium">Address:</span> 131 Georgia Avenue, Ocean City, MD</div>
                      <div><span className="font-medium">Room:</span> {showJobDetail.room}</div>
                      <div><span className="font-medium">Type:</span> {showJobDetail.roomType}</div>
                      <div><span className="font-medium">Lock Code:</span> <span className="bg-yellow-200 px-2 py-1 rounded font-mono">{showJobDetail.lockCode}</span></div>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Occupancy
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Guests:</span> {showJobDetail.guestCount}</div>
                      <div><span className="font-medium">Dogs:</span> {showJobDetail.dogCount}</div>
                      <div><span className="font-medium">Beds:</span> {showJobDetail.bedInfo}</div>
                      <div><span className="font-medium">Bathrooms:</span> {showJobDetail.bathInfo}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <h3 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                      <Wifi className="w-5 h-5" />
                      WiFi & Technology
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Network:</span> {showJobDetail.wifiNetwork}</div>
                      <div><span className="font-medium">Password:</span> <span className="bg-yellow-200 px-2 py-1 rounded font-mono">{showJobDetail.wifiPassword}</span></div>
                    </div>
                  </div>

                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                      <Phone className="w-5 h-5" />
                      Contact Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Manager:</span> {showJobDetail.unitManagerName}</div>
                      <div><span className="font-medium">Phone:</span> (443) 953-6024</div>
                    </div>
                  </div>

                  <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                    <h3 className="font-semibold text-teal-900 mb-3">Parking</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Space:</span> {showJobDetail.parkingSpace}</div>
                      <div><span className="font-medium">Instructions:</span> {showJobDetail.parkingInstructions}</div>
                    </div>
                  </div>

                  {showJobDetail.assigned && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Assigned Cleaner
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Name:</span> {showJobDetail.assigned.name}</div>
                        <div><span className="font-medium">Team:</span> {showJobDetail.assigned.team}</div>
                        <div><span className="font-medium">Phone:</span> {showJobDetail.assigned.phone}</div>
                        <div><span className="font-medium">Email:</span> {showJobDetail.assigned.email}</div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Rating:</span>
                          <div className="flex items-center gap-0.5">
                            {[...Array(Math.floor(showJobDetail.assigned.rating))].map((_, i) => (
                              <Star key={i} className="w-3 h-3 text-yellow-500 fill-current" />
                            ))}
                            <span className="text-xs text-gray-600 ml-1">
                              ({showJobDetail.assigned.rating.toFixed(1)})
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Cleaning Instructions</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Standard Protocol:</span>
                    <p className="text-gray-600 mt-1">{showJobDetail.permanentInstructions}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">This Week Special:</span>
                    <p className="text-gray-600 mt-1">{showJobDetail.weekSpecificInstructions}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Linen Instructions:</span>
                    <p className="text-gray-600 mt-1">{showJobDetail.linenInstructions}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => printJobs([showJobDetail.id])}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold flex items-center justify-center gap-2"
                >
                  <Printer className="w-5 h-5" />
                  Print Job Details
                </button>
                
                {showJobDetail.assigned && (
                  <>
                    <button
                      onClick={() => setShowNotifyModal(showJobDetail)}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold flex items-center justify-center gap-2"
                    >
                      <Bell className="w-5 h-5" />
                      Send Notification
                    </button>
                    
                    <button
                      onClick={() => setShowScheduleModal(showJobDetail)}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-semibold flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-5 h-5" />
                      Schedule Notification
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                Assign {selectedJobs.size} Job{selectedJobs.size !== 1 ? 's' : ''}
              </h2>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {cleaners.filter(cleaner => cleaner.available).map(cleaner => (
                  <div
                    key={cleaner.id}
                    onClick={() => assignJobs(cleaner.id)}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {cleaner.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{cleaner.name}</div>
                        <div className="text-sm text-gray-600">{cleaner.team}</div>
                        <div className="text-xs text-gray-500">{cleaner.phone}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-gray-600">Current Jobs</div>
                        <div className="font-semibold text-gray-900">{cleaner.assignedJobs}</div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[...Array(Math.floor(cleaner.rating))].map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-yellow-500 fill-current" />
                        ))}
                        <span className="text-xs text-gray-600 ml-1">
                          ({cleaner.rating.toFixed(1)})
                        </span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotifyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Send Notification</h2>
              <button
                onClick={() => setShowNotifyModal(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Send job details to <span className="font-semibold">{showNotifyModal.assigned?.name}</span>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => sendNotification(showNotifyModal, 'full')}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold flex items-center justify-center gap-2"
                >
                  <Mail className="w-5 h-5" />
                  Send Full Email
                </button>
                
                <button
                  onClick={() => sendNotification(showNotifyModal, 'sms')}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-5 h-5" />
                  Send Quick SMS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk SMS Modal */}
      {showBulkSMSModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                Bulk SMS ({selectedJobs.size} jobs)
              </h2>
              <button
                onClick={() => setShowBulkSMSModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={bulkSMSMessage}
                  onChange={(e) => setBulkSMSMessage(e.target.value)}
                  placeholder="Enter your message here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>
              
              <div className="text-sm text-gray-600">
                This message will be sent to all cleaners assigned to the selected jobs.
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBulkSMSModal(false)}
                  className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-all duration-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={sendBulkSMS}
                  disabled={!bulkSMSMessage.trim()}
                  className={`flex-1 ${bulkSMSMessage.trim() ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' : 'bg-gray-300 cursor-not-allowed'} text-white px-6 py-3 rounded-lg transition-all duration-200 font-semibold flex items-center justify-center gap-2`}
                >
                  <Send className="w-5 h-5" />
                  Send SMS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Notification Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Schedule Notification</h2>
              <button
                onClick={() => setShowScheduleModal(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Schedule notification for <span className="font-semibold">{showScheduleModal.assigned?.name}</span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Notification Type
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="both">Both Email & SMS</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowScheduleModal(null)}
                  className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-all duration-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => scheduleNotification(showScheduleModal, { date: new Date(), type: 'email' })}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-semibold flex items-center justify-center gap-2"
                >
                  <Calendar className="w-5 h-5" />
                  Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-8 flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="font-semibold text-gray-900">Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernCleaningSystem;