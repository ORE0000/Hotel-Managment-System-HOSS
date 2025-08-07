import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaPhoneAlt, 
  FaEnvelope, 
  FaCheckCircle, 
  FaInfoCircle, 
  FaBed, 
  FaHotel, 
  FaMapMarkerAlt, 
  FaCloudUploadAlt,
  FaDownload,
  FaEdit,
  FaSave
} from 'react-icons/fa';
import { FiFile, FiFileText, FiArrowLeft, FiCalendar } from 'react-icons/fi';
import { RateType } from '../types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as docx from 'docx';
import { saveAs } from 'file-saver';

const Rate = () => {
  const [activeSeason, setActiveSeason] = useState<'peak' | 'off'>('peak');
  const [isFileHovered, setIsFileHovered] = useState(false);
  const [editMode, setEditMode] = useState<{ [key: string]: boolean }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // State for editable fields
  const [peakSeasonRates, setPeakSeasonRates] = useState<{
    ep: RateType[];
    map: RateType[];
  }>({
    ep: [
      { roomType: 'Double Bed', rate: '₹2000/-' },
      { roomType: 'Triple Bed', rate: '₹2200/-' },
      { roomType: 'Four Bed (Family Room)', rate: '₹2800/-' },
      { roomType: 'Extra Person/Bed', rate: '₹400/-' }
    ],
    map: [
      { roomType: 'Double Bed', rate: '₹2600/-' },
      { roomType: 'Triple Bed', rate: '₹3400/-' },
      { roomType: 'Four Bed (Family Room)', rate: '₹4400/-' },
      { roomType: 'Extra Person/Bed', rate: '₹800/-' }
    ]
  });

  const [offSeasonRates, setOffSeasonRates] = useState<{
    ep: RateType[];
    map: RateType[];
  }>({
    ep: [
      { roomType: 'Double Bed', rate: '₹1800/-' },
      { roomType: 'Triple Bed', rate: '₹1800/-' },
      { roomType: 'Four Bed (Family Room)', rate: '₹2400/-' },
      { roomType: 'Extra Person/Bed', rate: '₹300/-' }
    ],
    map: [
      { roomType: 'Double Bed', rate: '₹2600/-' },
      { roomType: 'Triple Bed', rate: '₹3400/-' },
      { roomType: 'Four Bed (Family Room)', rate: '₹4400/-' },
      { roomType: 'Extra Person/Bed', rate: '₹800/-' }
    ]
  });

  const [additionalInfo, setAdditionalInfo] = useState([
    'Kitchen & Dining Charge: ₹1500/- per day (up to 50 members)',
    'Full payment to be made at the time of check-in',
    'Children (6-10 yrs): 50% charges',
    'Children (below 5 yrs): Complimentary'
  ]);

  const [bookingPolicy, setBookingPolicy] = useState([
    'Date reserved for 15 days at booking with 25% advance',
    'Booking confirmed at 75% advance',
    'Booking in advance is non-refundable'
  ]);

  const [bankDetails, setBankDetails] = useState({
    accountName: 'Hotel Om Shiv Shankar',
    accountNumber: '76035462374325434',
    ifscCode: 'SBIN0RRUTGB',
    bankBranch: 'Uttarakhand Gramin Bank, Matli, Uttarkashi'
  });

  const [hotelOverview, setHotelOverview] = useState({
    totalRooms: '18 Rooms (55 Beds + 5 Extra Beds = 60 Total)',
    roomTypes: '7 Double-Bed, 6 Triple-Bed, 2 Four-Bed, 3 Five-Bed',
    location: 'Matli, NH 34 - Uttarkashi, Rishikesh-Gangotri Road',
    contact: 'hotelomshivshankar@gmail.com\n9897409105, 9411380885'
  });

  const handleSeasonChange = (season: 'peak' | 'off') => {
    setActiveSeason(season);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const fileName = file.name;
      const fileExt = fileName.split('.').pop()?.toLowerCase();

      if (fileExt !== 'docx' && fileExt !== 'pdf') {
        toast.error('Please upload only DOCX or PDF files.');
        return;
      }

      toast.success(`File "${fileName}" selected for upload.`);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const toggleEditMode = (key: string) => {
    setEditMode(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRateChange = (
    season: 'peak' | 'off',
    type: 'ep' | 'map',
    index: number,
    field: 'roomType' | 'rate',
    value: string
  ) => {
    const setRates = season === 'peak' ? setPeakSeasonRates : setOffSeasonRates;
    setRates(prev => ({
      ...prev,
      [type]: prev[type].map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleAdditionalInfoChange = (index: number, value: string) => {
    setAdditionalInfo(prev => prev.map((item, i) => (i === index ? value : item)));
  };

  const handleBookingPolicyChange = (index: number, value: string) => {
    setBookingPolicy(prev => prev.map((item, i) => (i === index ? value : item)));
  };

  const handleBankDetailsChange = (field: keyof typeof bankDetails, value: string) => {
    setBankDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleHotelOverviewChange = (field: keyof typeof hotelOverview, value: string) => {
    setHotelOverview(prev => ({ ...prev, [field]: value }));
  };

  const generatePDF = (season: 'Peak Season' | 'Off Season') => {
    const doc = new jsPDF();
    const rates = season === 'Peak Season' ? peakSeasonRates : offSeasonRates;
    
    // Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('Hotel Om Shiv Shankar', 20, 20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Matli, NH 34 - Uttarkashi, Rishikesh-Gangotri Road', 20, 28);
    
    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text(`Room Rates - ${season}`, 20, 40);
    
    // EP Rates Table
    doc.setFontSize(14);
    doc.text('EP Rates (Room Only)', 20, 55);
    (doc as any).autoTable({
      startY: 60,
      head: [['Room Category', 'Rate']],
      body: rates.ep.map(item => [item.roomType, item.rate]),
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
      bodyStyles: { textColor: [31, 41, 55] },
      alternateRowStyles: { fillColor: [240, 244, 255] },
      margin: { left: 20, right: 20 }
    });
    
    // MAP Rates Table
    let finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('MAP Rates (Breakfast + One Meal)', 20, finalY);
    (doc as any).autoTable({
      startY: finalY + 5,
      head: [['Room Category', 'Rate']],
      body: rates.map.map(item => [item.roomType, item.rate]),
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
      bodyStyles: { textColor: [31, 41, 55] },
      alternateRowStyles: { fillColor: [240, 244, 255] },
      margin: { left: 20, right: 20 }
    });
    
    // Additional Information
    finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Additional Information', 20, finalY);
    finalY += 5;
    additionalInfo.forEach((info, index) => {
      doc.setFontSize(12);
      doc.text(`• ${info}`, 25, finalY + index * 6);
    });
    
    // Booking Policy
    finalY += additionalInfo.length * 6 + 10;
    doc.setFontSize(14);
    doc.text('Booking Policy', 20, finalY);
    finalY += 5;
    bookingPolicy.forEach((policy, index) => {
      doc.setFontSize(12);
      doc.text(`• ${policy}`, 25, finalY + index * 6);
    });
    
    // Bank Details
    finalY += bookingPolicy.length * 6 + 10;
    doc.setFontSize(14);
    doc.text('Bank Details', 20, finalY);
    (doc as any).autoTable({
      startY: finalY + 5,
      body: [
        ['Account Name', bankDetails.accountName],
        ['Account Number', bankDetails.accountNumber],
        ['IFSC Code', bankDetails.ifscCode],
        ['Bank & Branch', bankDetails.bankBranch]
      ],
      theme: 'plain',
      bodyStyles: { textColor: [31, 41, 55], fontSize: 12 },
      margin: { left: 20, right: 20 }
    });
    
    // Hotel Overview
    finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Hotel Overview', 20, finalY);
    (doc as any).autoTable({
      startY: finalY + 5,
      body: [
        ['Total Rooms', hotelOverview.totalRooms],
        ['Room Types', hotelOverview.roomTypes],
        ['Location', hotelOverview.location],
        ['Contact', hotelOverview.contact.replace('\n', ', ')]
      ],
      theme: 'plain',
      bodyStyles: { textColor: [31, 41, 55], fontSize: 12 },
      margin: { left: 20, right: 20 }
    });
    
    doc.save(`${season}_Rates.pdf`);
  };

  const generateDOCX = async (season: 'Peak Season' | 'Off Season') => {
    const rates = season === 'Peak Season' ? peakSeasonRates : offSeasonRates;
    
    const doc = new docx.Document({
      sections: [{
        properties: {},
        children: [
          new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: 'Hotel Om Shiv Shankar',
                bold: true,
                size: 48,
                color: '1F2937'
              })
            ],
            spacing: { after: 200 }
          }),
          new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: 'Matli, NH 34 - Uttarkashi, Rishikesh-Gangotri Road',
                size: 24,
                color: '64748B'
              })
            ],
            spacing: { after: 400 }
          }),
          new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: `Room Rates - ${season}`,
                bold: true,
                size: 36,
                color: '1F2937'
              })
            ],
            spacing: { after: 300 }
          }),
          new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: 'EP Rates (Room Only)',
                bold: true,
                size: 28,
                color: '1F2937'
              })
            ],
            spacing: { after: 200 }
          }),
          new docx.Table({
            rows: [
              new docx.TableRow({
                children: [
                  new docx.TableCell({
                    children: [new docx.Paragraph('Room Category')],
                    shading: { fill: '4F46E5' },
                    margins: { top: 100, bottom: 100, left: 100, right: 100 }
                  }),
                  new docx.TableCell({
                    children: [new docx.Paragraph('Rate')],
                    shading: { fill: '4F46E5' },
                    margins: { top: 100, bottom: 100, left: 100, right: 100 }
                  })
                ]
              }),
              ...rates.ep.map(item => new docx.TableRow({
                children: [
                  new docx.TableCell({
                    children: [new docx.Paragraph(item.roomType)],
                    margins: { top: 100, bottom: 100, left: 100, right: 100 }
                  }),
                  new docx.TableCell({
                    children: [new docx.Paragraph(item.rate)],
                    margins: { top: 100, bottom: 100, left: 100, right: 100 }
                  })
                ]
              }))
            ],
            width: { size: 100, type: docx.WidthType.PERCENTAGE }
          }),
          new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: 'MAP Rates (Breakfast + One Meal)',
                bold: true,
                size: 28,
                color: '1F2937'
              })
            ],
            spacing: { before: 400, after: 200 }
          }),
          new docx.Table({
            rows: [
              new docx.TableRow({
                children: [
                  new docx.TableCell({
                    children: [new docx.Paragraph('Room Category')],
                    shading: { fill: '4F46E5' },
                    margins: { top: 100, bottom: 100, left: 100, right: 100 }
                  }),
                  new docx.TableCell({
                    children: [new docx.Paragraph('Rate')],
                    shading: { fill: '4F46E5' },
                    margins: { top: 100, bottom: 100, left: 100, right: 100 }
                  })
                ]
              }),
              ...rates.map.map(item => new docx.TableRow({
                children: [
                  new docx.TableCell({
                    children: [new docx.Paragraph(item.roomType)],
                    margins: { top: 100, bottom: 100, left: 100, right: 100 }
                  }),
                  new docx.TableCell({
                    children: [new docx.Paragraph(item.rate)],
                    margins: { top: 100, bottom: 100, left: 100, right: 100 }
                  })
                ]
              }))
            ],
            width: { size: 100, type: docx.WidthType.PERCENTAGE }
          }),
          new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: 'Additional Information',
                bold: true,
                size: 28,
                color: '1F2937'
              })
            ],
            spacing: { before: 400, after: 200 }
          }),
          ...additionalInfo.map(info => new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: `• ${info}`,
                size: 24,
                color: '1F2937'
              })
            ],
            spacing: { after: 100 }
          })),
          new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: 'Booking Policy',
                bold: true,
                size: 28,
                color: '1F2937'
              })
            ],
            spacing: { before: 400, after: 200 }
          }),
          ...bookingPolicy.map(policy => new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: `• ${policy}`,
                size: 24,
                color: '1F2937'
              })
            ],
            spacing: { after: 100 }
          })),
          new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: 'Bank Details',
                bold: true,
                size: 28,
                color: '1F2937'
              })
            ],
            spacing: { before: 400, after: 200 }
          }),
          new docx.Table({
            rows: [
              new docx.TableRow({
                children: [
                  new docx.TableCell({ children: [new docx.Paragraph('Account Name')] }),
                  new docx.TableCell({ children: [new docx.Paragraph(bankDetails.accountName)] })
                ]
              }),
              new docx.TableRow({
                children: [
                  new docx.TableCell({ children: [new docx.Paragraph('Account Number')] }),
                  new docx.TableCell({ children: [new docx.Paragraph(bankDetails.accountNumber)] })
                ]
              }),
              new docx.TableRow({
                children: [
                  new docx.TableCell({ children: [new docx.Paragraph('IFSC Code')] }),
                  new docx.TableCell({ children: [new docx.Paragraph(bankDetails.ifscCode)] })
                ]
              }),
              new docx.TableRow({
                children: [
                  new docx.TableCell({ children: [new docx.Paragraph('Bank & Branch')] }),
                  new docx.TableCell({ children: [new docx.Paragraph(bankDetails.bankBranch)] })
                ]
              })
            ],
            width: { size: 100, type: docx.WidthType.PERCENTAGE }
          }),
          new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: 'Hotel Overview',
                bold: true,
                size: 28,
                color: '1F2937'
              })
            ],
            spacing: { before: 400, after: 200 }
          }),
          new docx.Table({
            rows: [
              new docx.TableRow({
                children: [
                  new docx.TableCell({ children: [new docx.Paragraph('Total Rooms')] }),
                  new docx.TableCell({ children: [new docx.Paragraph(hotelOverview.totalRooms)] })
                ]
              }),
              new docx.TableRow({
                children: [
                  new docx.TableCell({ children: [new docx.Paragraph('Room Types')] }),
                  new docx.TableCell({ children: [new docx.Paragraph(hotelOverview.roomTypes)] })
                ]
              }),
              new docx.TableRow({
                children: [
                  new docx.TableCell({ children: [new docx.Paragraph('Location')] }),
                  new docx.TableCell({ children: [new docx.Paragraph(hotelOverview.location)] })
                ]
              }),
              new docx.TableRow({
                children: [
                  new docx.TableCell({ children: [new docx.Paragraph('Contact')] }),
                  new docx.TableCell({ children: [new docx.Paragraph(hotelOverview.contact.replace('\n', ', '))] })
                ]
              })
            ],
            width: { size: 100, type: docx.WidthType.PERCENTAGE }
          })
        ]
      }]
    });

    const buffer = await docx.Packer.toBlob(doc);
    saveAs(buffer, `${season}_Rates.docx`);
  };

  const handleDownload = (format: 'PDF' | 'DOCX', season: 'Peak Season' | 'Off Season') => {
    if (format === 'PDF') {
      generatePDF(season);
    } else {
      generateDOCX(season);
    }
    toast.success(`Downloaded ${season} rates in ${format} format`);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 sticky top-0 bg-[var(--bg-primary)] z-10 py-4 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <motion.button 
            onClick={() => navigate(-1)}
            className="mr-3 text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors"
            aria-label="Go back"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiArrowLeft size={20} />
          </motion.button>
          <h2 className="text-2xl md:text-3xl font-bold text-gradient flex items-center gap-2">
            <FaHotel className="text-indigo-500" size={24} />
            Hotel Om Shiv Shankar Rates
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="flex gap-2">
            <a href="tel:9897409105" className="btn-primary flex items-center gap-2 text-sm sm:text-base px-3 sm:px-4 py-1 sm:py-2">
              <FaPhoneAlt size={16} /> 9897409105
            </a>
            <a href="mailto:hotelomshivshankar@gmail.com" className="btn-secondary flex items-center gap-2 text-sm sm:text-base px-3 sm:px-4 py-1 sm:py-2">
              <FaEnvelope size={16} /> Email Us
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="w-full px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-12">
          {/* Main Rates Section */}
          <div className="w-full lg:w-2/3">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="neumorphic-card rounded-2xl p-6 sm:p-8"
            >
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Our Room Rates</h2>
                <motion.button
                  onClick={() => toggleEditMode('rates')}
                  className="btn-primary text-sm flex items-center mt-3 sm:mt-0"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {editMode.rates ? <FaSave className="mr-2" /> : <FaEdit className="mr-2" />}
                  {editMode.rates ? 'Save' : 'Edit'}
                </motion.button>
              </div>
              
              {/* Season Tabs */}
              <div className="flex border-b border-[var(--border)] mb-6 sm:mb-8 overflow-x-auto">
                <button 
                  className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-lg font-semibold transition-all duration-300 whitespace-nowrap ${activeSeason === 'peak' ? 'border-b-4 border-[var(--primary)] text-[var(--primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--primary)]'}`}
                  onClick={() => handleSeasonChange('peak')}
                >
                  Peak Season (May, June, Sept, Oct)
                </button>
                <button 
                  className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-lg font-semibold transition-all duration-300 whitespace-nowrap ${activeSeason === 'off' ? 'border-b-4 border-[var(--primary)] text-[var(--primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--primary)]'}`}
                  onClick={() => handleSeasonChange('off')}
                >
                  Off Season (July, Aug, Nov-Apr)
                </button>
              </div>
              
              {/* Rates Content */}
              <div className={activeSeason === 'peak' ? 'block' : 'hidden'}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-10">
                  {/* EP Rates */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="glass-card rounded-xl p-4 sm:p-6 card-hover"
                  >
                    <h3 className="text-lg sm:text-xl font-semibold text-[var(--primary)] mb-4">EP Rates (Room Only)</h3>
                    <div className="overflow-x-auto">
                      <table className="modern-table w-full">
                        <thead>
                          <tr>
                            <th className="text-sm sm:text-base">Room Category</th>
                            <th className="text-sm sm:text-base">Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {peakSeasonRates.ep.map((room, index) => (
                            <tr key={index}>
                              <td data-label="Room Category" className="text-sm sm:text-base">
                                {editMode.rates ? (
                                  <input
                                    type="text"
                                    value={room.roomType}
                                    onChange={(e) => handleRateChange('peak', 'ep', index, 'roomType', e.target.value)}
                                    className="input-field w-full text-sm sm:text-base"
                                  />
                                ) : (
                                  room.roomType
                                )}
                              </td>
                              <td data-label="Rate" className="text-sm sm:text-base">
                                {editMode.rates ? (
                                  <input
                                    type="text"
                                    value={room.rate}
                                    onChange={(e) => handleRateChange('peak', 'ep', index, 'rate', e.target.value)}
                                    className="input-field w-full text-sm sm:text-base"
                                  />
                                ) : (
                                  room.rate
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                  
                  {/* MAP Rates */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="glass-card rounded-xl p-4 sm:p-6 card-hover"
                  >
                    <h3 className="text-lg sm:text-xl font-semibold text-[var(--primary)] mb-4">MAP Rates (Breakfast + One Meal)</h3>
                    <div className="overflow-x-auto">
                      <table className="modern-table w-full">
                        <thead>
                          <tr>
                            <th className="text-sm sm:text-base">Room Category</th>
                            <th className="text-sm sm:text-base">Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {peakSeasonRates.map.map((room, index) => (
                            <tr key={index}>
                              <td data-label="Room Category" className="text-sm sm:text-base">
                                {editMode.rates ? (
                                  <input
                                    type="text"
                                    value={room.roomType}
                                    onChange={(e) => handleRateChange('peak', 'map', index, 'roomType', e.target.value)}
                                    className="input-field w-full text-sm sm:text-base"
                                  />
                                ) : (
                                  room.roomType
                                )}
                              </td>
                              <td data-label="Rate" className="text-sm sm:text-base">
                                {editMode.rates ? (
                                  <input
                                    type="text"
                                    value={room.rate}
                                    onChange={(e) => handleRateChange('peak', 'map', index, 'rate', e.target.value)}
                                    className="input-field w-full text-sm sm:text-base"
                                  />
                                ) : (
                                  room.rate
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                </div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="glass-card rounded-xl p-4 sm:p-6 card-hover"
                >
                  <h3 className="text-lg sm:text-xl font-semibold text-[var(--primary)] mb-4">Additional Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {additionalInfo.map((info, index) => (
                      <div key={index} className="flex items-start">
                        <FaCheckCircle className="text-[var(--icon-bg-green)] mt-1 mr-2 sm:mr-3" size={16} />
                        {editMode.rates ? (
                          <textarea
                            value={info}
                            onChange={(e) => handleAdditionalInfoChange(index, e.target.value)}
                            className="textarea-field w-full text-sm sm:text-base"
                            rows={3}
                          />
                        ) : (
                          <span className="text-[var(--text-primary)] text-sm sm:text-base">{info}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
              
              {/* Off Season Rates */}
              <div className={activeSeason === 'off' ? 'block' : 'hidden'}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-10">
                  {/* EP Rates */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="glass-card rounded-xl p-4 sm:p-6 card-hover"
                  >
                    <h3 className="text-lg sm:text-xl font-semibold text-[var(--primary)] mb-4">EP Rates (Room Only)</h3>
                    <div className="overflow-x-auto">
                      <table className="modern-table w-full">
                        <thead>
                          <tr>
                            <th className="text-sm sm:text-base">Room Category</th>
                            <th className="text-sm sm:text-base">Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {offSeasonRates.ep.map((room, index) => (
                            <tr key={index}>
                              <td data-label="Room Category" className="text-sm sm:text-base">
                                {editMode.rates ? (
                                  <input
                                    type="text"
                                    value={room.roomType}
                                    onChange={(e) => handleRateChange('off', 'ep', index, 'roomType', e.target.value)}
                                    className="input-field w-full text-sm sm:text-base"
                                  />
                                ) : (
                                  room.roomType
                                )}
                              </td>
                              <td data-label="Rate" className="text-sm sm:text-base">
                                {editMode.rates ? (
                                  <input
                                    type="text"
                                    value={room.rate}
                                    onChange={(e) => handleRateChange('off', 'ep', index, 'rate', e.target.value)}
                                    className="input-field w-full text-sm sm:text-base"
                                  />
                                ) : (
                                  room.rate
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                  
                  {/* MAP Rates */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="glass-card rounded-xl p-4 sm:p-6 card-hover"
                  >
                    <h3 className="text-lg sm:text-xl font-semibold text-[var(--primary)] mb-4">MAP Rates (Breakfast + One Meal)</h3>
                    <div className="overflow-x-auto">
                      <table className="modern-table w-full">
                        <thead>
                          <tr>
                            <th className="text-sm sm:text-base">Room Category</th>
                            <th className="text-sm sm:text-base">Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {offSeasonRates.map.map((room, index) => (
                            <tr key={index}>
                              <td data-label="Room Category" className="text-sm sm:text-base">
                                {editMode.rates ? (
                                  <input
                                    type="text"
                                    value={room.roomType}
                                    onChange={(e) => handleRateChange('off', 'map', index, 'roomType', e.target.value)}
                                    className="input-field w-full text-sm sm:text-base"
                                  />
                                ) : (
                                  room.roomType
                                )}
                              </td>
                              <td data-label="Rate" className="text-sm sm:text-base">
                                {editMode.rates ? (
                                  <input
                                    type="text"
                                    value={room.rate}
                                    onChange={(e) => handleRateChange('off', 'map', index, 'rate', e.target.value)}
                                    className="input-field w-full text-sm sm:text-base"
                                  />
                                ) : (
                                  room.rate
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                </div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="glass-card rounded-xl p-4 sm:p-6 card-hover"
                >
                  <h3 className="text-lg sm:text-xl font-semibold text-[var(--primary)] mb-4">Additional Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {additionalInfo.map((info, index) => (
                      <div key={index} className="flex items-start">
                        <FaCheckCircle className="text-[var(--icon-bg-green)] mt-1 mr-2 sm:mr-3" size={16} />
                        {editMode.rates ? (
                          <textarea
                            value={info}
                            onChange={(e) => handleAdditionalInfoChange(index, e.target.value)}
                            className="textarea-field w-full text-sm sm:text-base"
                            rows={3}
                          />
                        ) : (
                          <span className="text-[var(--text-primary)] text-sm sm:text-base">{info}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
              
              {/* Booking Policy */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="bg-gradient-primary p-4 sm:p-6 rounded-xl mt-6 sm:mt-8 card-hover"
              >
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                  <h3 className="text-lg sm:text-xl font-semibold text-white">Booking Policy</h3>
                  <motion.button
                    onClick={() => toggleEditMode('bookingPolicy')}
                    className="btn-secondary text-sm flex items-center mt-3 sm:mt-0"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {editMode.bookingPolicy ? <FaSave className="mr-2" /> : <FaEdit className="mr-2" />}
                    {editMode.bookingPolicy ? 'Save' : 'Edit'}
                  </motion.button>
                </div>
                <ul className="space-y-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                  {bookingPolicy.map((policy, index) => (
                    <li key={index} className="flex items-start">
                      <FaInfoCircle className="text-white mt-1 mr-2 sm:mr-3" size={16} />
                      {editMode.bookingPolicy ? (
                        <textarea
                          value={policy}
                          onChange={(e) => handleBookingPolicyChange(index, e.target.value)}
                          className="textarea-field w-full text-sm sm:text-base"
                          rows={3}
                        />
                      ) : (
                        <span className="text-white text-sm sm:text-base">{policy}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </motion.div>
              
              {/* Bank Details */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="glass-card p-4 sm:p-8 rounded-xl mt-6 sm:mt-8 card-hover"
              >
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-[var(--primary)]">Bank Details</h3>
                  <motion.button
                    onClick={() => toggleEditMode('bankDetails')}
                    className="btn-primary text-sm flex items-center mt-3 sm:mt-0"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {editMode.bankDetails ? <FaSave className="mr-2" /> : <FaEdit className="mr-2" />}
                    {editMode.bankDetails ? 'Save' : 'Edit'}
                  </motion.button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="glass-card p-3 sm:p-4">
                    {editMode.bankDetails ? (
                      <>
                        <p className="text-sm sm:text-base text-[var(--text-primary)]">
                          <span className="font-medium">Account Name:</span>
                          <input
                            type="text"
                            value={bankDetails.accountName}
                            onChange={(e

) => handleBankDetailsChange('accountName', e.target.value)}
                            className="input-field w-full mt-1 text-sm sm:text-base"
                          />
                        </p>
                        <p className="text-sm sm:text-base text-[var(--text-primary)] mt-2">
                          <span className="font-medium">Account Number:</span>
                          <input
                            type="text"
                            value={bankDetails.accountNumber}
                            onChange={(e) => handleBankDetailsChange('accountNumber', e.target.value)}
                            className="input-field w-full mt-1 text-sm sm:text-base"
                          />
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm sm:text-base text-[var(--text-primary)]">
                          <span className="font-medium">Account Name:</span> {bankDetails.accountName}
                        </p>
                        <p className="text-sm sm:text-base text-[var(--text-primary)] mt-2">
                          <span className="font-medium">Account Number:</span> {bankDetails.accountNumber}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="glass-card p-3 sm:p-4">
                    {editMode.bankDetails ? (
                      <>
                        <p className="text-sm sm:text-base text-[var(--text-primary)]">
                          <span className="font-medium">IFSC Code:</span>
                          <input
                            type="text"
                            value={bankDetails.ifscCode}
                            onChange={(e) => handleBankDetailsChange('ifscCode', e.target.value)}
                            className="input-field w-full mt-1 text-sm sm:text-base"
                          />
                        </p>
                        <p className="text-sm sm:text-base text-[var(--text-primary)] mt-2">
                          <span className="font-medium">Bank & Branch:</span>
                          <textarea
                            value={bankDetails.bankBranch}
                            onChange={(e) => handleBankDetailsChange('bankBranch', e.target.value)}
                            className="textarea-field w-full mt-1 text-sm sm:text-base"
                            rows={3}
                          />
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm sm:text-base text-[var(--text-primary)]">
                          <span className="font-medium">IFSC Code:</span> {bankDetails.ifscCode}
                        </p>
                        <p className="text-sm sm:text-base text-[var(--text-primary)] mt-2">
                          <span className="font-medium">Bank & Branch:</span> {bankDetails.bankBranch}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
          
          {/* Sidebar */}
          <div className="w-full lg:w-1/3">
            {/* Download Rate Sheets */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="neumorphic-card rounded-2xl p-6 sm:p-8 mb-6 sm:mb-8"
            >
              <h3 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-4 sm:mb-6 flex items-center">
                <FaDownload className="mr-2 sm:mr-3 text-[var(--primary)]" size={20} />
                Download Rate Sheets
              </h3>
              
              <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row items-center justify-between glass-card p-3 sm:p-4">
                  <div>
                    <h4 className="font-medium text-[var(--text-primary)] text-sm sm:text-base">Peak Season Rates</h4>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Updated: May 1, 2025</p>
                  </div>
                  <div className="flex space-x-2 sm:space-x-3 mt-2 sm:mt-0">
                    <motion.button 
                      onClick={() => handleDownload('DOCX', 'Peak Season')}
                      className="btn-primary text-xs sm:text-sm flex items-center px-2 sm:px-3 py-1 sm:py-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FiFileText className="mr-1 sm:mr-2" size={16} /> DOCX
                    </motion.button>
                    <motion.button 
                      onClick={() => handleDownload('PDF', 'Peak Season')}
                      className="btn-secondary text-xs sm:text-sm flex items-center px-2 sm:px-3 py-1 sm:py-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FiFile className="mr-1 sm:mr-2" size={16} /> PDF
                    </motion.button>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center justify-between glass-card p-3 sm:p-4">
                  <div>
                    <h4 className="font-medium text-[var(--text-primary)] text-sm sm:text-base">Off Season Rates</h4>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Updated: May 1, 2025</p>
                  </div>
                  <div className="flex space-x-2 sm:space-x-3 mt-2 sm:mt-0">
                    <motion.button 
                      onClick={() => handleDownload('DOCX', 'Off Season')}
                      className="btn-primary text-xs sm:text-sm flex items-center px-2 sm:px-3 py-1 sm:py-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FiFileText className="mr-1 sm:mr-2" size={16} /> DOCX
                    </motion.button>
                    <motion.button 
                      onClick={() => handleDownload('PDF', 'Off Season')}
                      className="btn-secondary text-xs sm:text-sm flex items-center px-2 sm:px-3 py-1 sm:py-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FiFile className="mr-1 sm:mr-2" size={16} /> PDF
                    </motion.button>
                  </div>
                </div>
              </div>
              
              <div 
                className={`glass-card p-6 sm:p-8 text-center cursor-pointer border-2 border-dashed ${isFileHovered ? 'border-[var(--primary)] bg-[var(--card)]' : 'border-[var(--border)]'}`}
                onClick={() => fileInputRef.current?.click()}
                onMouseEnter={() => setIsFileHovered(true)}
                onMouseLeave={() => setIsFileHovered(false)}
              >
                <input 
                  type="file" 
                  id="rate-upload" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept=".docx,.pdf" 
                  onChange={handleFileUpload}
                />
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mx-auto w-12 sm:w-16 h-12 sm:h-16 bg-[var(--card)] rounded-full flex items-center justify-center mb-3 sm:mb-4"
                >
                  <FaCloudUploadAlt className="text-[var(--primary)] text-xl sm:text-2xl" />
                </motion.div>
                <h4 className="font-medium text-[var(--text-primary)] text-sm sm:text-base mb-2">Upload Updated Rate Sheet</h4>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-3 sm:mb-4">DOCX or PDF files only</p>
                <motion.button 
                  className="btn-primary text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Select File
                </motion.button>
              </div>
            </motion.div>
            
            {/* Hotel Overview */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="neumorphic-card rounded-2xl p-6 sm:p-8"
            >
              <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">Hotel Overview</h3>
                <motion.button
                  onClick={() => toggleEditMode('hotelOverview')}
                  className="btn-primary text-sm flex items-center mt-3 sm:mt-0"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {editMode.hotelOverview ? <FaSave className="mr-2" /> : <FaEdit className="mr-2" />}
                  {editMode.hotelOverview ? 'Save' : 'Edit'}
                </motion.button>
              </div>
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center glass-card p-3 sm:p-4">
                  <div className="bg-gradient-primary p-2 sm:p-3 rounded-full mr-3 sm:mr-4">
                    <FaBed className="text-white" size={16} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-[var(--text-primary)] text-sm sm:text-base">Total Rooms</h4>
                    {editMode.hotelOverview ? (
                      <input
                        type="text"
                        value={hotelOverview.totalRooms}
                        onChange={(e) => handleHotelOverviewChange('totalRooms', e.target.value)}
                        className="input-field w-full mt-1 text-sm sm:text-base"
                      />
                    ) : (
                      <p className="text-xs sm:text-sm text-[var(--text-secondary)]">{hotelOverview.totalRooms}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center glass-card p-3 sm:p-4">
                  <div className="bg-gradient-primary p-2 sm:p-3 rounded-full mr-3 sm:mr-4">
                    <FaHotel className="text-white" size={16} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-[var(--text-primary)] text-sm sm:text-base">Room Types</h4>
                    {editMode.hotelOverview ? (
                      <textarea
                        value={hotelOverview.roomTypes}
                        onChange={(e) => handleHotelOverviewChange('roomTypes', e.target.value)}
                        className="textarea-field w-full mt-1 text-sm sm:text-base"
                        rows={3}
                      />
                    ) : (
                      <p className="text-xs sm:text-sm text-[var(--text-secondary)]">{hotelOverview.roomTypes}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center glass-card p-3 sm:p-4">
                  <div className="bg-gradient-primary p-2 sm:p-3 rounded-full mr-3 sm:mr-4">
                    <FaMapMarkerAlt className="text-white" size={16} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-[var(--text-primary)] text-sm sm:text-base">Location</h4>
                    {editMode.hotelOverview ? (
                      <textarea
                        value={hotelOverview.location}
                        onChange={(e) => handleHotelOverviewChange('location', e.target.value)}
                        className="textarea-field w-full mt-1 text-sm sm:text-base"
                        rows={3}
                      />
                    ) : (
                      <p className="text-xs sm:text-sm text-[var(--text-secondary)]">{hotelOverview.location}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center glass-card p-3 sm:p-4">
                  <div className="bg-gradient-primary p-2 sm:p-3 rounded-full mr-3 sm:mr-4">
                    <FaEnvelope className="text-white" size={16} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-[var(--text-primary)] text-sm sm:text-base">Contact</h4>
                    {editMode.hotelOverview ? (
                      <textarea
                        value={hotelOverview.contact}
                        onChange={(e) => handleHotelOverviewChange('contact', e.target.value)}
                        className="textarea-field w-full mt-1 text-sm sm:text-base"
                        rows={3}
                      />
                    ) : (
                      <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                        {hotelOverview.contact.split('\n').map((line, i) => (
                          <span key={i}>
                            {line}
                            <br />
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div> 
        </div>
      </main>
    </div>
  );
};

export default Rate;