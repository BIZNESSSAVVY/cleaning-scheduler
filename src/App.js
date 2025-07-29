
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

  const assignJobs = (cleanerId) => {
    const cleaner = cleaners.find(c => c.id === cleanerId);
    const jobIds = Array.from(selectedJobs);
    
    setJobs(prevJobs => 
      prevJobs.map(job => 
        jobIds.includes(job.id) ? { ...job, assigned: cleaner, status: 'assigned' } : job
      )
    );
    setSelectedJobs(new Set());
    setShowAssignModal(false);
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
      relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-2xl cursor-pointer transform hover:-translate-y-1
      ${isSelected ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-blue-200' : 'border-gray-200 hover:border-gray-300'}
      ${job.priority === 'high' ? 'ring-2 ring-red-300 shadow-red-100' : ''}
    `}>
      <div className="p-6">
        {/* Header with improved spacing */}
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(job.id, e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded-lg focus:ring-blue-500 focus:ring-2"
              onClick={(e) => e.stopPropagation()}
            />
            <div>
              <div className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                Room {job.room}
                {job.scheduledNotification && (
                  <Calendar className="w-5 h-5 text-purple-600" title="Notification Scheduled" />
                )}
              </div>
              <div className="text-sm text-gray-600 font-medium">{job.roomType}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {job.priority === 'high' && (
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">
                <Zap className="w-3 h-3" />
                URGENT
              </div>
            )}
            <div className="flex gap-1">
              {job.wifiIncluded && <Wifi className="w-4 h-4 text-blue-600" title="WiFi Included" />}
              {job.linenPickup && <Package className="w-4 h-4 text-orange-600" title="Linen Pickup Required" />}
            </div>
          </div>
        </div>

        {/* Enhanced location & time section */}
        <div className="space-y-3 mb-5">
          <div className="flex items-center gap-3 text-gray-700">
            <div className="bg-blue-100 p-2 rounded-lg">
              <MapPin className="w-4 h-4 text-blue-600" />
            </div>
            <span className="font-semibold text-lg">{job.location}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <div className="bg-green-100 p-2 rounded-lg">
              <Clock className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <span className="font-medium">{job.startTime} - {job.dueTime}</span>
              <span className="text-gray-500 ml-2">({job.predictedTime})</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <span>{job.guestCount} guests{job.dogCount > 0 ? `, ${job.dogCount} dogs` : ''}</span>
          </div>
        </div>

        {/* Enhanced status and actions */}
        <div className="flex flex-col gap-4">
          {job.assigned ? (
            <div className="flex items-center gap-3 bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-xl border border-green-200">
              <div className="bg-green-100 p-2 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-green-800">{job.assigned.name}</div>
                <div className="text-sm text-green-600">{job.assigned.team}</div>
              </div>
              <div className="flex items-center gap-1 text-yellow-500">
                {[...Array(Math.floor(job.assigned.rating))].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-current" />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-gradient-to-r from-yellow-50 to-amber-50 p-3 rounded-xl border border-yellow-200">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
              </div>
              <span className="font-semibold text-yellow-800">Awaiting Assignment</span>
            </div>
          )}
          
          {/* Improved action buttons with better spacing */}
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowJobDetail(job);
              }}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">View</span>
            </button>
            
            {job.assigned && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    printJobs([job.id]);
                  }}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2.5 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Print</span>
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNotifyModal(job);
                  }}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2.5 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Bell className="w-4 h-4" />
                  <span className="hidden sm:inline">Notify</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Enhanced Header */}
      <div className="bg-white shadow-xl border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-2xl shadow-lg">
                <Award className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Savvy OS
                </h1>
                <p className="text-gray-600 mt-1 font-medium">Professional Cleaning Management Platform</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowBulkSMSModal(true)}
                disabled={selectedJobs.size === 0}
                className={`${selectedJobs.size > 0 ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700' : 'bg-gray-300 cursor-not-allowed'} text-white px-6 py-3 rounded-xl transition-all duration-200 font-semibold shadow-lg flex items-center gap-2`}
              >
                <MessageSquare className="w-5 h-5" />
                Bulk SMS ({selectedJobs.size})
              </button>
              <label className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl cursor-pointer hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Import Jobs
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

      {/* Enhanced Stats Dashboard */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-gray-600 font-semibold">Total Jobs</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{width: '100%'}}></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
            <div className="text-3xl font-bold text-yellow-600">{stats.unassigned}</div>
            <div className="text-gray-600 font-semibold">Unassigned</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-2 rounded-full" style={{width: `${(stats.unassigned/stats.total)*100}%`}}></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
            <div className="text-3xl font-bold text-green-600">{stats.assigned}</div>
            <div className="text-gray-600 font-semibold">Assigned</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full" style={{width: `${(stats.assigned/stats.total)*100}%`}}></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
            <div className="text-3xl font-bold text-blue-600">{stats.printed}</div>
            <div className="text-gray-600 font-semibold">Printed</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{width: `${(stats.printed/stats.total)*100}%`}}></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
            <div className="text-3xl font-bold text-purple-600">{stats.availableCleaners}</div>
            <div className="text-gray-600 font-semibold">Available</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full" style={{width: `${(stats.availableCleaners/cleaners.length)*100}%`}}></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
            <div className="text-3xl font-bold text-indigo-600">{stats.scheduled}</div>
            <div className="text-gray-600 font-semibold">Scheduled</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2 rounded-full" style={{width: `${(stats.scheduled/stats.total)*100}%`}}></div>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filter Bar */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-6 h-6 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by room number or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium transition-all duration-200 bg-gray-50 hover:bg-white"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`${showFilters ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} px-8 py-4 rounded-xl transition-all duration-200 flex items-center gap-3 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105`}
            >
              <Filter className="w-5 h-5" />
              Filters
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
          
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-top duration-300">
              <select
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                className="border-2 border-gray-200 rounded-xl px-6 py-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium bg-gray-50 hover:bg-white transition-all duration-200"
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
                className="border-2 border-gray-200 rounded-xl px-6 py-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium bg-gray-50 hover:bg-white transition-all duration-200"
              />
              
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="border-2 border-gray-200 rounded-xl px-6 py-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium bg-gray-50 hover:bg-white transition-all duration-200"
              >
                <option value="all">All Jobs</option>
                <option value="unassigned">Unassigned Only</option>
                <option value="assigned">Assigned Only</option>
              </select>
            </div>
          )}
        </div>

        {/* Enhanced Bulk Actions */}
        {selectedJobs.size > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 mb-8 shadow-lg animate-in slide-in-from-top duration-300">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="text-xl font-bold text-blue-900 flex items-center gap-3">
                <div className="bg-blue-600 text-white p-2 rounded-xl">
                  <CheckCircle className="w-5 h-5" />
                </div>
                {selectedJobs.size} job{selectedJobs.size > 1 ? 's' : ''} selected
              </div>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                >
                  <Users className="w-5 h-5" />
                  Assign Selected
                </button>
                <button
                  onClick={() => printJobs()}
                  className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                >
                  <Printer className="w-5 h-5" />
                  Print Selected
                </button>
                <button
                  onClick={() => setSelectedJobs(new Set())}
                  className="bg-gray-500 text-white px-8 py-3 rounded-xl hover:bg-gray-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <X className="w-5 h-5" />
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
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
          <div className="text-center py-16">
            <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <div className="text-gray-500 text-2xl mb-4 font-semibold">No jobs found</div>
            <p className="text-gray-400 mb-6">Try adjusting your search criteria or filters</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilters({ location: '', date: '', status: 'all' });
              }}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Enhanced Job Detail Modal */}
      {showJobDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-auto shadow-2xl">
            <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">
                    {showJobDetail.location} - Room {showJobDetail.room}
                  </h3>
                  <div className="flex items-center gap-4 text-gray-600">
                    <span className="bg-blue-100 px-3 py-1 rounded-full text-sm font-medium">
                      {showJobDetail.roomType}
                    </span>
                    {showJobDetail.priority === 'high' && (
                      <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        High Priority
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowJobDetail(null)}
                  className="text-gray-500 hover:text-gray-700 p-3 rounded-full hover:bg-gray-100 transition-all duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-8 space-y-8">
              {/* Basic Info Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="text-sm text-gray-600 font-semibold mb-1">Time Schedule</div>
                  <div className="text-xl font-bold text-gray-900">{showJobDetail.startTime} - {showJobDetail.dueTime}</div>
                  <div className="text-sm text-gray-500">Est. {showJobDetail.predictedTime}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="text-sm text-gray-600 font-semibold mb-1">Date</div>
                  <div className="text-xl font-bold text-gray-900">
                    {new Date(showJobDetail.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              </div>

              {/* Access Information */}
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-2xl border border-yellow-200">
                <h4 className="font-bold text-gray-900 mb-4 text-xl flex items-center gap-2">
                  🔑 Access Information
                </h4>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-gray-600 font-semibold mb-1">Lock Code</div>
                    <div className="text-2xl font-mono font-bold text-gray-900 bg-white px-4 py-2 rounded-lg">
                      {showJobDetail.lockCode}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 font-semibold mb-1">Unit Manager</div>
                    <div className="text-lg font-semibold text-gray-900">{showJobDetail.unitManagerName}</div>
                    <div className="text-blue-600 font-medium">(443) 953-6024</div>
                  </div>
                </div>
              </div>

              {/* Occupancy Details */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-2xl border border-blue-200">
                <h4 className="font-bold text-gray-900 mb-4 text-xl flex items-center gap-2">
                  👥 Occupancy Details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><strong>Guests:</strong> {showJobDetail.guestCount}</div>
                  {showJobDetail.dogCount > 0 && <div><strong>Dogs:</strong> {showJobDetail.dogCount}</div>}
                  <div><strong>Beds:</strong> {showJobDetail.bedInfo}</div>
                  <div><strong>Baths:</strong> {showJobDetail.bathInfo}</div>
                </div>
              </div>

              {/* WiFi & Amenities */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
                <h4 className="font-bold text-gray-900 mb-4 text-xl flex items-center gap-2">
                  📶 WiFi & Amenities
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>Network:</strong> 
                    <div className="font-mono bg-white px-3 py-1 rounded mt-1">{showJobDetail.wifiNetwork}</div>
                  </div>
                  <div>
                    <strong>Password:</strong> 
                    <div className="font-mono bg-white px-3 py-1 rounded mt-1">{showJobDetail.wifiPassword}</div>
                  </div>
                </div>
                <div className="mt-4">
                  <strong>Linen Pickup:</strong> {showJobDetail.linenPickup ? '✅ Required' : '❌ Not required'}
                </div>
              </div>

              {/* Parking */}
              <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-6 rounded-2xl border border-purple-200">
                <h4 className="font-bold text-gray-900 mb-4 text-xl flex items-center gap-2">
                  🚗 Parking Information
                </h4>
                <div className="space-y-3">
                  <div><strong>Space:</strong> {showJobDetail.parkingSpace}</div>
                  <div><strong>Instructions:</strong> {showJobDetail.parkingInstructions}</div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-6 rounded-2xl border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-4 text-xl flex items-center gap-2">
                  📋 Cleaning Instructions
                </h4>
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg">
                    <strong className="text-blue-600">Standard:</strong> 
                    <p className="mt-1">{showJobDetail.permanentInstructions}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <strong className="text-green-600">This Week:</strong> 
                    <p className="mt-1">{showJobDetail.weekSpecificInstructions}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <strong className="text-purple-600">Linen:</strong> 
                    <p className="mt-1">{showJobDetail.linenInstructions}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-6 border-t border-gray-200">
                {!showJobDetail.assigned ? (
                  <button
                    onClick={() => {
                      setSelectedJobs(new Set([showJobDetail.id]));
                      setShowJobDetail(null);
                      setShowAssignModal(true);
                    }}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Assign Cleaner
                  </button>
                ) : (
                  <div className="flex gap-4 w-full">
                    <button
                      onClick={() => {
                        printJobs([showJobDetail.id]);
                        setShowJobDetail(null);
                      }}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <Printer className="w-5 h-5" />
                      Print Job Sheet
                    </button>
                    <button
                      onClick={() => {
                        setShowNotifyModal(showJobDetail);
                        setShowJobDetail(null);
                      }}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <Bell className="w-5 h-5" />
                      Notify Now
                    </button>
                    <button
                      onClick={() => {
                        setShowScheduleModal(showJobDetail);
                        setShowJobDetail(null);
                      }}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-4 rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-5 h-5" />
                      Schedule
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl">
            <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Assign Cleaners</h3>
                  <p className="text-gray-600 mt-2 font-medium">
                    Assigning {selectedJobs.size} job{selectedJobs.size > 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-3 rounded-full hover:bg-gray-100 transition-all duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-8 max-h-96 overflow-auto">
              <div className="space-y-4">
                {cleaners.filter(c => c.available).map(cleaner => (
                  <div
                    key={cleaner.id}
                    onClick={() => assignJobs(cleaner.id)}
                    className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-all duration-200 border-2 border-transparent hover:border-blue-200 transform hover:scale-105"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg">
                        {cleaner.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-lg">{cleaner.name}</div>
                        <div className="text-sm text-gray-600 font-medium">{cleaner.team} • {cleaner.phone}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1 text-yellow-500">
                            {[...Array(Math.floor(cleaner.rating))].map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-current" />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">
                            {cleaner.assignedJobs} current jobs
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl">
                      Assign
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Notification Modal */}
      {showNotifyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl">
            <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Send Notification</h3>
                  <p className="text-gray-600 mt-2 font-medium">
                    Notify {showNotifyModal.assigned?.name} about {showNotifyModal.location} - Room {showNotifyModal.room}
                  </p>
                </div>
                <button
                  onClick={() => setShowNotifyModal(null)}
                  className="text-gray-500 hover:text-gray-700 p-3 rounded-full hover:bg-gray-100 transition-all duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-8">
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-6 rounded-2xl border border-gray-200">
                  <div className="font-semibold text-gray-900 mb-3 text-lg">Cleaner Contact</div>
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg">
                      {showNotifyModal.assigned?.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{showNotifyModal.assigned?.name}</div>
                      <div className="text-gray-600">{showNotifyModal.assigned?.phone}</div>
                      <div className="text-gray-600">{showNotifyModal.assigned?.email}</div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => sendNotification(showNotifyModal, 'full')}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-6 rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex flex-col items-center gap-3"
                  >
                    <Mail className="w-8 h-8" />
                    <div>
                      <div className="text-lg">Send Full Email</div>
                      <div className="text-sm opacity-80">Complete job details</div>
                    </div>
                  </button>
                  <button
                    onClick={() => sendNotification(showNotifyModal, 'short')}
                    className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-6 rounded-2xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex flex-col items-center gap-3"
                  >
                    <Phone className="w-8 h-8" />
                    <div>
                      <div className="text-lg">Send SMS</div>
                      <div className="text-sm opacity-80">Essential info only</div>
                    </div>
                  </button>
                </div>
                
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-2xl border border-yellow-200">
                  <div className="text-sm text-yellow-800 leading-relaxed">
                    <strong>📧 Full Email:</strong> Includes complete job information, access codes, parking details, and cleaning instructions<br/>
                    <strong>📱 SMS Summary:</strong> Essential info only - location, time, lock code, and manager contact
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Notification Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl">
            <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Schedule Notification</h3>
                  <p className="text-gray-600 mt-2 font-medium">
                    Schedule notification for {showScheduleModal.assigned?.name}
                  </p>
                </div>
                <button
                  onClick={() => setShowScheduleModal(null)}
                  className="text-gray-500 hover:text-gray-700 p-3 rounded-full hover:bg-gray-100 transition-all duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-8">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Send Date</label>
                    <input
                      type="date"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      defaultValue={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Send Time</label>
                    <input
                      type="time"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                     defaultValue="08:00"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Notification Type</label>
                  <select className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="email">Full Email</option>
                    <option value="sms">SMS Summary</option>
                    <option value="both">Both Email & SMS</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Custom Message (Optional)</label>
                  <textarea
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows="3"
                    placeholder="Add a custom message to include with the notification..."
                  />
                </div>
                
                <div className="flex gap-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowScheduleModal(null)}
                    className="flex-1 bg-gray-500 text-white px-8 py-4 rounded-xl hover:bg-gray-600 transition-all duration-200 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      scheduleNotification(showScheduleModal, {
                        date: new Date().toISOString().split('T')[0],
                        time: '08:00',
                        type: 'email'
                      });
                    }}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-5 h-5" />
                    Schedule Notification
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk SMS Modal */}
      {showBulkSMSModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl">
            <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Send Bulk SMS</h3>
                  <p className="text-gray-600 mt-2 font-medium">
                    Send SMS to cleaners for {selectedJobs.size} selected jobs
                  </p>
                </div>
                <button
                  onClick={() => setShowBulkSMSModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-3 rounded-full hover:bg-gray-100 transition-all duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-8">
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-2xl border border-blue-200">
                  <div className="font-semibold text-gray-900 mb-3">Recipients</div>
                  <div className="text-sm text-gray-600">
                    {(() => {
                      const assignedJobs = jobs.filter(job => job.assigned && selectedJobs.has(job.id));
                      const uniqueCleaners = [...new Set(assignedJobs.map(job => job.assigned.id))];
                      return `${uniqueCleaners.length} cleaner${uniqueCleaners.length > 1 ? 's' : ''} will receive this message`;
                    })()}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                  <textarea
                    value={bulkSMSMessage}
                    onChange={(e) => setBulkSMSMessage(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows="4"
                    placeholder="Enter your message here..."
                  />
                  <div className="text-sm text-gray-500 mt-2">
                    {bulkSMSMessage.length}/160 characters
                  </div>
                </div>
                
                <div className="flex gap-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowBulkSMSModal(false)}
                    className="flex-1 bg-gray-500 text-white px-8 py-4 rounded-xl hover:bg-gray-600 transition-all duration-200 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendBulkSMS}
                    disabled={!bulkSMSMessage.trim()}
                    className={`flex-1 ${bulkSMSMessage.trim() ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' : 'bg-gray-300 cursor-not-allowed'} text-white px-8 py-4 rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2`}
                  >
                    <Send className="w-5 h-5" />
                    Send SMS
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernCleaningSystem;