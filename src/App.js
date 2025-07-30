import React, { useState, useMemo, useCallback } from 'react';
import { FixedSizeList } from 'react-window';
import { debounce } from 'lodash';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Calendar, Clock, Users, Wifi, Package, MapPin, Search, Bell, Printer, Eye, CheckCircle, AlertCircle, Phone, Mail, Filter, X, ChevronDown, ChevronUp, Plus, MessageSquare, Send, Zap, Star, Award } from 'lucide-react';

// Static data generation (unchanged)
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
})();

const ModernCleaningSystem = () => {
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
  const [bulkSMSMessage, setBulkSMSMessage] = useState('');

  // PERFORMANCE FIX 1: Debounce search input
  const debouncedSetSearchTerm = useCallback(
    debounce((value) => setSearchTerm(value), 300),
    []
  );

  // PERFORMANCE FIX 2: Optimized filtered jobs
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

  // PERFORMANCE FIX 3: Memoized stats
  const stats = useMemo(() => {
    const total = jobs.length;
    const unassigned = jobs.filter(job => !job.assigned).length;
    const assigned = jobs.filter(job => job.assigned).length;
    const printed = jobs.filter(job => job.status === 'printed').length;
    const availableCleaners = FAKE_DATA.cleaners.filter(cleaner => cleaner.available).length;
    const scheduled = jobs.filter(job => job.scheduledNotification).length;
    
    return { total, unassigned, assigned, printed, availableCleaners, scheduled };
  }, [jobs]);

  // PERFORMANCE FIX 4: Memoized event handlers
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

  const assignJobs = useCallback((cleanerId) => {
    const cleaner = FAKE_DATA.cleaners.find(c => c.id === cleanerId);
    const jobIds = Array.from(selectedJobs);
    
    console.log('Assigning jobs:', { cleanerId, jobIds }); // Debug log
    
    if (!cleaner || jobIds.length === 0) {
      console.error('Invalid assignment:', { cleaner, jobIds });
      return;
    }

    // Optimize: Update only selected jobs to reduce computation
    setJobs(prevJobs => {
      const updatedJobs = [...prevJobs];
      jobIds.forEach(jobId => {
        const index = updatedJobs.findIndex(job => job.id === jobId);
        if (index !== -1) {
          updatedJobs[index] = { ...updatedJobs[index], assigned: cleaner, status: 'assigned' };
        }
      });
      return updatedJobs;
    });

    // Batch state updates to minimize re-renders
    setSelectedJobs(new Set());
    setShowAssignModal(false);
    
    // Trigger toast notification
    try {
      toast.success(`Assigned ${jobIds.length} job${jobIds.length > 1 ? 's' : ''} to ${cleaner.name}.`, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      console.log('Toast triggered successfully');
    } catch (error) {
      console.error('Toast error:', error);
    }
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

  const sendNotification = useCallback((job, messageType = 'full') => {
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
  }, []);

  const scheduleNotification = useCallback((job, scheduleData) => {
    setJobs(prevJobs => 
      prevJobs.map(j => 
        j.id === job.id ? { ...j, scheduledNotification: scheduleData } : j
      )
    );
    alert(`📅 Notification scheduled for ${job.assigned?.name}!`);
    setShowScheduleModal(null);
  }, []);

  const sendBulkSMS = useCallback(() => {
    const assignedJobs = jobs.filter(job => job.assigned && selectedJobs.has(job.id));
    const uniqueCleaners = [...new Set(assignedJobs.map(job => job.assigned.id))];
    
    uniqueCleaners.forEach(cleanerId => {
      const cleaner = FAKE_DATA.cleaners.find(c => c.id === cleanerId);
      console.log(`SMS to ${cleaner.name}:`, bulkSMSMessage);
    });
    
    alert(`📱 Bulk SMS sent to ${uniqueCleaners.length} cleaners!`);
    setBulkSMSMessage('');
    setShowBulkSMSModal(false);
    setSelectedJobs(new Set());
  }, [jobs, selectedJobs, bulkSMSMessage]);

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
            <div className="value">Start Time: ${job.startTime}</div>
            <div className="value">Due Time: ${job.dueTime}</div>
            <div className="value">Estimated Duration: ${job.predictedTime}</div>
            <div className="value">Date: ${new Date(job.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
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

  // PERFORMANCE FIX 5: Memoized JobCard component
  const JobCard = React.memo(({ job, isSelected, onSelect, style }) => (
    <div style={style} className={`
      relative bg-white rounded-xl shadow-md border-2 transition-all duration-200 hover:shadow-lg cursor-pointer mx-2
      ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
      ${job.priority === 'high' ? 'ring-2 ring-red-300' : ''}
    `}>
      <div className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(job.id, e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
            <div>
              <div className="text-xl font-bold text-gray-900 flex items-center gap-2">
                Room {job.room}
                {job.scheduledNotification && (
                  <Calendar className="w-4 h-4 text-purple-600" title="Notification Scheduled" />
                )}
              </div>
              <div className="text-sm text-gray-600">{job.roomType}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {job.priority === 'high' && (
              <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
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

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-gray-700">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="font-medium">{job.location}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Clock className="w-4 h-4 text-green-600" />
            <span>{job.startTime} - {job.dueTime} ({job.predictedTime})</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Users className="w-4 h-4 text-purple-600" />
            <span>{job.guestCount} guests{job.dogCount > 0 ? `, ${job.dogCount} dogs` : ''}</span>
          </div>
        </div>

        <div className="mb-4">
          {job.assigned ? (
            <div className="flex items-center gap-2 bg-green-50 p-2 rounded-lg border border-green-200">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div className="flex-1">
                <div className="font-medium text-green-800">{job.assigned.name}</div>
                <div className="text-sm text-green-600">{job.assigned.team}</div>
              </div>
              <div className="flex items-center gap-1 text-yellow-500">
                {[...Array(Math.floor(job.assigned.rating))].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-current" />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-yellow-50 p-2 rounded-lg border border-yellow-200">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="font-medium text-yellow-800">Awaiting Assignment</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowJobDetail(job);
            }}
            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-1"
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
                className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-1"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print</span>
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNotifyModal(job);
                }}
                className="flex-1 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-1"
              >
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Notify</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  ));

  // PERFORMANCE FIX 6: Virtualization for job list
  const Row = ({ index, style }) => {
    const job = filteredJobs[index];
    return (
      <JobCard
        key={job.id}
        job={job}
        isSelected={selectedJobs.has(job.id)}
        onSelect={handleJobSelect}
        style={style}
      />
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Container */}
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
        className="z-[100]"
      />

      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-xl">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Savvy OS</h1>
                <p className="text-gray-600 text-sm">Professional Cleaning Management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowBulkSMSModal(true)}
                disabled={selectedJobs.size === 0}
                className={`${selectedJobs.size > 0 ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-300 cursor-not-allowed'} text-white px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2`}
              >
                <MessageSquare className="w-4 h-4" />
                Bulk SMS ({selectedJobs.size})
              </button>
              <label className="bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors font-medium flex items-center gap-2">
                <Plus className="w-4 h-4" />
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

      {/* Stats Dashboard */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-gray-600 text-sm">Total Jobs</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{width: '100%'}}></div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="text-2xl font-bold text-yellow-600">{stats.unassigned}</div>
            <div className="text-gray-600 text-sm">Unassigned</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-yellow-500 h-2 rounded-full" style={{width: `${(stats.unassigned/stats.total)*100}%`}}></div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="text-2xl font-bold text-green-600">{stats.assigned}</div>
            <div className="text-gray-600 text-sm">Assigned</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-green-500 h-2 rounded-full" style={{width: `${(stats.assigned/stats.total)*100}%`}}></div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="text-2xl font-bold text-blue-600">{stats.printed}</div>
            <div className="text-gray-600 text-sm">Printed</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{width: `${(stats.printed/stats.total)*100}%`}}></div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="text-2xl font-bold text-purple-600">{stats.availableCleaners}</div>
            <div className="text-gray-600 text-sm">Available</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{width: '85%'}}></div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="text-2xl font-bold text-indigo-600">{stats.scheduled}</div>
            <div className="text-gray-600 text-sm">Scheduled</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-indigo-500 h-2 rounded-full" style={{width: `${(stats.scheduled/stats.total)*100}%`}}></div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by room number or location..."
                onChange={(e) => debouncedSetSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 font-medium"
            >
              <Filter className="w-5 h-5" />
              Filters
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {selectedJobs.size > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
                >
                  <Users className="w-4 h-4" />
                  Assign ({selectedJobs.size})
                </button>
                <button
                  onClick={() => printJobs()}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
                >
                  <Printer className="w-4 h-4" />
                  Print All ({selectedJobs.size})
                </button>
              </div>
            )}
          </div>

          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={filters.date}
                    onChange={(e) => setFilters({...filters, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
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
              </div>
            </div>
          )}
        </div>

        {/* PERFORMANCE FIX 7: Virtualized Job List */}
        <div className="bg-white rounded-xl shadow-md p-4">
          {filteredJobs.length > 0 ? (
            <FixedSizeList
              height={600}
              width="100%"
              itemCount={filteredJobs.length}
              itemSize={280}
              className="overflow-auto"
            >
              {Row}
            </FixedSizeList>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 text-xl mb-2">No jobs found</div>
              <div className="text-gray-400">Try adjusting your search or filters</div>
            </div>
          )}
        </div>
      </div>

      {/* Job Detail Modal */}
      {showJobDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {showJobDetail.location} - Room {showJobDetail.room}
                  </h2>
                  <p className="text-gray-600">{showJobDetail.roomType}</p>
                </div>
                <button
                  onClick={() => setShowJobDetail(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">Schedule</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span>{new Date(showJobDetail.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-green-600" />
                        <span>{showJobDetail.startTime} - {showJobDetail.dueTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-600" />
                        <span>{showJobDetail.guestCount} guests{showJobDetail.dogCount > 0 ? `, ${showJobDetail.dogCount} dogs` : ''}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">Property Details</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Address:</strong> 131 Georgia Avenue, Ocean City, MD 21842</div>
                      <div><strong>Manager:</strong> {showJobDetail.unitManagerName}</div>
                      <div><strong>Lock Code:</strong> {showJobDetail.lockCode}</div>
                      <div><strong>Beds:</strong> {showJobDetail.bedInfo}</div>
                      <div><strong>Bathrooms:</strong> {showJobDetail.bathInfo}</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">WiFi & Amenities</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Network:</strong> {showJobDetail.wifiNetwork}</div>
                      <div><strong>Password:</strong> {showJobDetail.wifiPassword}</div>
                      <div className="flex gap-4 mt-2">
                        {showJobDetail.wifiIncluded && (
                          <span className="flex items-center gap-1 text-blue-600">
                            <Wifi className="w-4 h-4" /> WiFi Included
                          </span>
                        )}
                        {showJobDetail.linenPickup && (
                          <span className="flex items-center gap-1 text-orange-600">
                            <Package className="w-4 h-4" /> Linen Pickup
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">Cleaning Instructions</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Standard:</strong> {showJobDetail.permanentInstructions}</div>
                      <div><strong>This Week:</strong> {showJobDetail.weekSpecificInstructions}</div>
                      <div><strong>Linen:</strong> {showJobDetail.linenInstructions}</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">Parking</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Space:</strong> {showJobDetail.parkingSpace}</div>
                      <div><strong>Instructions:</strong> {showJobDetail.parkingInstructions}</div>
                    </div>
                  </div>

                  {showJobDetail.assigned ? (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h3 className="font-semibold text-green-900 mb-3">Assigned Cleaner</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-medium">{showJobDetail.assigned.name}</span>
                        </div>
                        <div className="text-sm text-green-700">
                          <div>{showJobDetail.assigned.team}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Phone className="w-4 h-4" />
                            {showJobDetail.assigned.phone}
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            {showJobDetail.assigned.email}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-500 mt-2">
                          {[...Array(Math.floor(showJobDetail.assigned.rating))].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-current" />
                          ))}
                          <span className="text-sm text-gray-600 ml-1">
                            ({showJobDetail.assigned.rating.toFixed(1)})
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-medium">Not yet assigned</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                {showJobDetail.assigned && (
                  <>
                    <button
                      onClick={() => printJobs([showJobDetail.id])}
                      className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <Printer className="w-5 h-5" />
                      Print Job Sheet
                    </button>
                    <button
                      onClick={() => setShowNotifyModal(showJobDetail)}
                      className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <Bell className="w-5 h-5" />
                      Send Notification
                    </button>
                    <button
                      onClick={() => setShowScheduleModal(showJobDetail)}
                      className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-5 h-5" />
                      Schedule
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Assign Jobs ({selectedJobs.size} selected)
                </h2>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {FAKE_DATA.cleaners.filter(c => c.available).map(cleaner => (
                  <div
                    key={cleaner.id}
                    onClick={() => assignJobs(cleaner.id)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">{cleaner.name}</div>
                        <div className="text-sm text-gray-600">{cleaner.team}</div>
                        <div className="text-xs text-gray-500">{cleaner.phone}</div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-yellow-500">
                          {[...Array(Math.floor(cleaner.rating))].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-current" />
                          ))}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {cleaner.assignedJobs} current jobs
                        </div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Send Notification</h2>
                <button
                  onClick={() => setShowNotifyModal(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <strong>To:</strong> {showNotifyModal.assigned?.name}<br/>
                  <strong>Job:</strong> {showNotifyModal.location} Room {showNotifyModal.room}
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => sendNotification(showNotifyModal, 'full')}
                    className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Mail className="w-5 h-5" />
                    Send Full Email Details
                  </button>
                  <button
                    onClick={() => sendNotification(showNotifyModal, 'sms')}
                    className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Send Quick SMS
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk SMS Modal */}
      {showBulkSMSModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Bulk SMS</h2>
                <button
                  onClick={() => setShowBulkSMSModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  Sending to {[...new Set(jobs.filter(job => job.assigned && selectedJobs.has(job.id)).map(job => job.assigned.id))].length} cleaners
                </div>

                <textarea
                  value={bulkSMSMessage}
                  onChange={(e) => setBulkSMSMessage(e.target.value)}
                  placeholder="Enter your message..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
                />

                <button
                  onClick={sendBulkSMS}
                  disabled={!bulkSMSMessage.trim()}
                  className={`w-full ${bulkSMSMessage.trim() ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'} text-white px-4 py-3 rounded-lg transition-colors font-medium flex items-center justify-center gap-2`}
                >
                  <Send className="w-5 h-5" />
                  Send Bulk SMS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Schedule Notification</h2>
                <button
                  onClick={() => setShowScheduleModal(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <strong>Job:</strong> {showScheduleModal.location} Room {showScheduleModal.room}<br/>
                  <strong>Cleaner:</strong> {showScheduleModal.assigned?.name}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Date & Time</label>
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message Type</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>Email Reminder</option>
                    <option>SMS Reminder</option>
                    <option>Both Email & SMS</option>
                  </select>
                </div>

                <button
                  onClick={() => scheduleNotification(showScheduleModal, { date: new Date(), type: 'email' })}
                  className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Calendar className="w-5 h-5" />
                  Schedule Notification
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernCleaningSystem;