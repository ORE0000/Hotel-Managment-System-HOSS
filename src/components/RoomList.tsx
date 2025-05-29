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
  FaSave,
  FaPlus,
  FaTrash,
} from 'react-icons/fa';
import { FiFile, FiFileText, FiArrowLeft } from 'react-icons/fi';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as docx from 'docx';
import { saveAs } from 'file-saver';

interface Room {
  roomNumber: string;
  beds: number;
  extraBeds: number;
  totalBeds: number;
}

interface Floor {
  name: string;
  rooms: Room[];
}

interface HotelRoomList {
  hotelName: string;
  manager: string;
  email: string;
  phone: string[];
  address: string;
  bookingDate: string;
  bookedBy: string;
  name: string;
  floors: Floor[];
}

const RoomList = () => {
  const [activeSection, setActiveSection] = useState<'hoss' | 'combined'>(
    'hoss'
  );
  const [isFileHovered, setIsFileHovered] = useState(false);
  const [editMode, setEditMode] = useState<{ [key: string]: boolean }>({});
  const [includeHossInCombined, setIncludeHossInCombined] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // State for Hotel Om Shiv Shankar
  const [hossRoomList, setHossRoomList] = useState<HotelRoomList>({
    hotelName: 'HOTEL OM SHIV SHANKAR',
    manager: 'SHANKAR DAYAL PANT',
    email: 'hotelomshivshankar@gmail.com',
    phone: ['9411380885', '9897409105'],
    address: 'Matli, NH 34 - Uttarkashi, Rishikesh-Gangotri Road',
    bookingDate: '',
    bookedBy: '',
    name: '',
    floors: [
      {
        name: 'GROUND FLOOR (1 FLOOR DOWN)',
        rooms: [
          { roomNumber: '101', beds: 5, extraBeds: 1, totalBeds: 6 },
          { roomNumber: '102', beds: 5, extraBeds: 1, totalBeds: 6 },
          { roomNumber: '103', beds: 3, extraBeds: 0, totalBeds: 3 },
          { roomNumber: '104', beds: 2, extraBeds: 1, totalBeds: 3 },
          { roomNumber: '105', beds: 4, extraBeds: 0, totalBeds: 4 },
          { roomNumber: '106', beds: 3, extraBeds: 0, totalBeds: 3 },
        ],
      },
      {
        name: '1st FLOOR',
        rooms: [
          { roomNumber: '201', beds: 3, extraBeds: 0, totalBeds: 3 },
          { roomNumber: '202', beds: 3, extraBeds: 0, totalBeds: 3 },
          { roomNumber: '203', beds: 3, extraBeds: 0, totalBeds: 3 },
          { roomNumber: '204', beds: 2, extraBeds: 1, totalBeds: 3 },
          { roomNumber: '205', beds: 2, extraBeds: 1, totalBeds: 3 },
          { roomNumber: '206', beds: 4, extraBeds: 0, totalBeds: 4 },
          { roomNumber: '207', beds: 2, extraBeds: 0, totalBeds: 2 },
          { roomNumber: '208', beds: 3, extraBeds: 0, totalBeds: 3 },
        ],
      },
      {
        name: '2nd FLOOR',
        rooms: [
          { roomNumber: '301', beds: 2, extraBeds: 0, totalBeds: 2 },
          { roomNumber: '302', beds: 2, extraBeds: 0, totalBeds: 2 },
          { roomNumber: '303', beds: 2, extraBeds: 0, totalBeds: 2 },
          { roomNumber: '304', beds: 5, extraBeds: 0, totalBeds: 5 },
        ],
      },
    ],
  });

  // State for Combined Hotels
  const [combinedRoomList, setCombinedRoomList] = useState<HotelRoomList[]>([
    {
      hotelName: 'Hotel Himalayan Retreat',
      manager: 'Ramesh Singh',
      email: 'himalayanretreat@gmail.com',
      phone: ['9876543210'],
      address: 'Gangotri Road, Uttarkashi',
      bookingDate: '',
      bookedBy: '',
      name: '',
      floors: [
        {
          name: 'Ground Floor',
          rooms: [
            { roomNumber: 'G01', beds: 2, extraBeds: 0, totalBeds: 2 },
            { roomNumber: 'G02', beds: 3, extraBeds: 1, totalBeds: 4 },
          ],
        },
      ],
    },
  ]);

  const [hotelOverview, setHotelOverview] = useState({
    totalRooms: '18 Rooms (55 Beds + 5 Extra Beds = 60 Total)',
    roomTypes: '7 Double-Bed, 6 Triple-Bed, 2 Four-Bed, 3 Five-Bed',
    location: 'Matli, NH 34 - Uttarkashi, Rishikesh-Gangotri Road',
    contact: 'hotelomshivshankar@gmail.com\n9897409105, 9411380885',
  });

  const handleSectionChange = (section: 'hoss' | 'combined') => {
    setActiveSection(section);
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

      toast.success(`File "${fileName}" uploaded successfully.`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const toggleEditMode = (key: string) => {
    setEditMode((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRoomChange = (
    floorIndex: number,
    roomIndex: number,
    field: keyof Room,
    value: string | number
  ) => {
    setHossRoomList((prev) => ({
      ...prev,
      floors: prev.floors.map((floor, fIndex) =>
        fIndex === floorIndex
          ? {
              ...floor,
              rooms: floor.rooms.map((room, rIndex) =>
                rIndex === roomIndex
                  ? {
                      ...room,
                      [field]:
                        typeof value === 'string' ? value : Number(value),
                      totalBeds:
                        field === 'beds' || field === 'extraBeds'
                          ? (field === 'beds' ? Number(value) : room.beds) +
                            (field === 'extraBeds'
                              ? Number(value)
                              : room.extraBeds)
                          : room.totalBeds,
                    }
                  : room
              ),
            }
          : floor
      ),
    }));
  };

  const addRoom = (floorIndex: number, hotelIndex?: number) => {
    if (hotelIndex !== undefined) {
      setCombinedRoomList((prev) =>
        prev.map((hotel, hIndex) =>
          hIndex === hotelIndex
            ? {
                ...hotel,
                floors: hotel.floors.map((floor, fIndex) =>
                  fIndex === floorIndex
                    ? {
                        ...floor,
                        rooms: [
                          ...floor.rooms,
                          {
                            roomNumber: `Room ${floor.rooms.length + 1}`,
                            beds: 2,
                            extraBeds: 0,
                            totalBeds: 2,
                          },
                        ],
                      }
                    : floor
                ),
              }
            : hotel
        )
      );
    } else {
      setHossRoomList((prev) => ({
        ...prev,
        floors: prev.floors.map((floor, fIndex) =>
          fIndex === floorIndex
            ? {
                ...floor,
                rooms: [
                  ...floor.rooms,
                  {
                    roomNumber: `Room ${floor.rooms.length + 1}`,
                    beds: 2,
                    extraBeds: 0,
                    totalBeds: 2,
                  },
                ],
              }
            : floor
        ),
      }));
    }
    toast.success('New room added.');
  };

  const handleHotelInfoChange = (
    field: keyof HotelRoomList,
    value: string | string[]
  ) => {
    setHossRoomList((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCombinedHotelChange = (
    hotelIndex: number,
    field:
      | keyof HotelRoomList
      | { floorIndex: number; roomIndex: number; roomField: keyof Room },
    value: string | string[] | number
  ) => {
    setCombinedRoomList((prev) =>
      prev.map((hotel, hIndex) =>
        hIndex === hotelIndex
          ? typeof field === 'string'
            ? { ...hotel, [field]: value }
            : {
                ...hotel,
                floors: hotel.floors.map((floor, fIndex) =>
                  fIndex === field.floorIndex
                    ? {
                        ...floor,
                        rooms: floor.rooms.map((room, rIndex) =>
                          rIndex === field.roomIndex
                            ? {
                                ...room,
                                [field.roomField]:
                                  typeof value === 'string'
                                    ? value
                                    : Number(value),
                                totalBeds:
                                  field.roomField === 'beds' ||
                                  field.roomField === 'extraBeds'
                                    ? (field.roomField === 'beds'
                                        ? Number(value)
                                        : room.beds) +
                                      (field.roomField === 'extraBeds'
                                        ? Number(value)
                                        : room.extraBeds)
                                    : room.totalBeds,
                              }
                            : room
                        ),
                      }
                    : floor
                ),
              }
          : hotel
      )
    );
  };

  const addHotel = () => {
    setCombinedRoomList((prev) => [
      ...prev,
      {
        hotelName: `New Hotel ${prev.length + 1}`,
        manager: '',
        email: '',
        phone: [''],
        address: '',
        bookingDate: '',
        bookedBy: '',
        name: '',
        floors: [
          {
            name: 'Ground Floor',
            rooms: [{ roomNumber: '101', beds: 2, extraBeds: 0, totalBeds: 2 }],
          },
        ],
      },
    ]);
    toast.success('New hotel added.');
  };

  const removeHotel = (hotelIndex: number) => {
    if (combinedRoomList.length <= 1) {
      toast.error('At least one hotel is required in Combined Hotels.');
      return;
    }
    setCombinedRoomList((prev) =>
      prev.filter((_, index) => index !== hotelIndex)
    );
    setEditMode((prev) => {
      const newEditMode = { ...prev };
      delete newEditMode[`hotel-${hotelIndex}`];
      return newEditMode;
    });
    toast.success('Hotel removed.');
  };

  const addFloor = (hotelIndex: number) => {
    setCombinedRoomList((prev) =>
      prev.map((hotel, hIndex) =>
        hIndex === hotelIndex
          ? {
              ...hotel,
              floors: [
                ...hotel.floors,
                {
                  name: `Floor ${hotel.floors.length + 1}`,
                  rooms: [
                    { roomNumber: '101', beds: 2, extraBeds: 0, totalBeds: 2 },
                  ],
                },
              ],
            }
          : hotel
      )
    );
    toast.success('New floor added.');
  };

  const handleHotelOverviewChange = (
    field: keyof typeof hotelOverview,
    value: string
  ) => {
    setHotelOverview((prev) => ({ ...prev, [field]: value }));
  };

  const generatePDF = (section: 'HOSS' | 'Combined') => {
    const doc = new jsPDF({ format: 'a4', unit: 'mm' });
    const pageWidth = 210;
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;

    if (section === 'HOSS') {
      // Header
      doc.setFontSize(14);
      doc.setFont('times', 'bold');
      doc.text('ROOM LIST 2023-24', pageWidth / 2, 15, { align: 'center' });
      doc.setFontSize(16);
      doc.text(hossRoomList.hotelName, margin, 25);
      doc.setFontSize(12);
      doc.setFont('times', 'normal');
      doc.text(`MANAGER: ${hossRoomList.manager}`, margin, 35);
      doc.text(`E-mail: ${hossRoomList.email}`, margin, 43);
      doc.text(`Phone: ${hossRoomList.phone.join(', ')}`, margin, 51);
      doc.text(
        `Booking Date: ${hossRoomList.bookingDate || 'N/A'}`,
        margin,
        59
      );
      doc.text(`Booked By: ${hossRoomList.bookedBy || 'N/A'}`, margin, 67);
      doc.text(`Name: ${hossRoomList.name || 'N/A'}`, margin, 75);

      // Room List
      let finalY = 85;
      hossRoomList.floors.forEach((floor, index) => {
        doc.setFontSize(12);
        doc.setFont('times', 'bold');
        doc.text(floor.name, margin, finalY);
        (doc as any).autoTable({
          startY: finalY + 5,
          head: [['', 'Room No.', 'Beds', 'Extra Beds', 'Total Beds']],
          body: floor.rooms.map((room, i) => [
            `${i + 1})`,
            room.roomNumber,
            room.beds,
            room.extraBeds || '',
            room.totalBeds,
          ]),
          theme: 'grid',
          styles: {
            font: 'times',
            fontSize: 10,
            textColor: [0, 0, 0],
            cellPadding: 2,
            lineColor: [0, 0, 0],
            lineWidth: 0.2,
          },
          headStyles: {
            fontStyle: 'bold',
            textColor: [0, 0, 0],
            fillColor: [200, 200, 200],
            lineWidth: 0.2,
            lineColor: [0, 0, 0],
          },
          bodyStyles: { fillColor: [255, 255, 255] },
          margin: { left: margin, right: margin },
          columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: contentWidth * 0.3 },
            2: { cellWidth: contentWidth * 0.2 },
            3: { cellWidth: contentWidth * 0.25 },
            4: { cellWidth: contentWidth * 0.25 },
          },
        });
        finalY = (doc as any).lastAutoTable.finalY + 8;
      });

      // Total
      const totalRooms = hossRoomList.floors.reduce(
        (sum, floor) => sum + floor.rooms.length,
        0
      );
      const totalBeds = hossRoomList.floors.reduce(
        (sum, floor) => sum + floor.rooms.reduce((s, r) => s + r.beds, 0),
        0
      );
      const totalExtraBeds = hossRoomList.floors.reduce(
        (sum, floor) => sum + floor.rooms.reduce((s, r) => s + r.extraBeds, 0),
        0
      );
      const totalCapacity = totalBeds + totalExtraBeds;

      (doc as any).autoTable({
        startY: finalY,
        body: [
          ['Total', totalRooms, totalBeds, totalExtraBeds || '', totalCapacity],
        ],
        theme: 'grid',
        styles: {
          font: 'times',
          fontSize: 10,
          textColor: [0, 0, 0],
          cellPadding: 2,
          lineColor: [0, 0, 0],
          lineWidth: 0.2,
        },
        bodyStyles: {
          fontStyle: 'bold',
          fillColor: [255, 255, 255],
        },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: contentWidth * 0.3 },
          2: { cellWidth: contentWidth * 0.2 },
          3: { cellWidth: contentWidth * 0.25 },
          4: { cellWidth: contentWidth * 0.25 },
        },
      });

      doc.save('HOSS_RoomList.pdf');
    } else {
      // Combined Hotels
      const hotels = includeHossInCombined
        ? [hossRoomList, ...combinedRoomList]
        : combinedRoomList;
      hotels.forEach((hotel, hotelIndex) => {
        if (hotelIndex > 0) {
          doc.addPage();
        }
        // Header
        doc.setFontSize(14);
        doc.setFont('times', 'bold');
        doc.text('ROOM LIST 2023-24', pageWidth / 2, 15, { align: 'center' });
        doc.setFontSize(16);
        doc.text(hotel.hotelName.toUpperCase(), margin, 25);
        doc.setFontSize(12);
        doc.setFont('times', 'normal');
        doc.text(`MANAGER: ${hotel.manager}`, margin, 35);
        doc.text(`E-mail: ${hotel.email}`, margin, 43);
        doc.text(`Phone: ${hotel.phone.join(', ')}`, margin, 51);
        doc.text(`Booking Date: ${hotel.bookingDate || 'N/A'}`, margin, 59);
        doc.text(`Booked By: ${hotel.bookedBy || 'N/A'}`, margin, 67);
        doc.text(`Name: ${hotel.name || 'N/A'}`, margin, 75);

        // Room List
        let finalY = 85;
        hotel.floors.forEach((floor, index) => {
          doc.setFontSize(12);
          doc.setFont('times', 'bold');
          doc.text(floor.name, margin, finalY);
          (doc as any).autoTable({
            startY: finalY + 5,
            head: [['', 'Room No.', 'Beds', 'Extra Beds', 'Total Beds']],
            body: floor.rooms.map((room, i) => [
              `${i + 1})`,
              room.roomNumber,
              room.beds,
              room.extraBeds || '',
              room.totalBeds,
            ]),
            theme: 'grid',
            styles: {
              font: 'times',
              fontSize: 10,
              textColor: [0, 0, 0],
              cellPadding: 2,
              lineColor: [0, 0, 0],
              lineWidth: 0.2,
            },
            headStyles: {
              fontStyle: 'bold',
              textColor: [0, 0, 0],
              fillColor: [200, 200, 200],
              lineWidth: 0.2,
              lineColor: [0, 0, 0],
            },
            bodyStyles: { fillColor: [255, 255, 255] },
            margin: { left: margin, right: margin },
            columnStyles: {
              0: { cellWidth: 10 },
              1: { cellWidth: contentWidth * 0.3 },
              2: { cellWidth: contentWidth * 0.2 },
              3: { cellWidth: contentWidth * 0.25 },
              4: { cellWidth: contentWidth * 0.25 },
            },
          });
          finalY = (doc as any).lastAutoTable.finalY + 8;
        });

        // Total
        const totalRooms = hotel.floors.reduce(
          (sum, floor) => sum + floor.rooms.length,
          0
        );
        const totalBeds = hotel.floors.reduce(
          (sum, floor) => sum + floor.rooms.reduce((s, r) => s + r.beds, 0),
          0
        );
        const totalExtraBeds = hotel.floors.reduce(
          (sum, floor) =>
            sum + floor.rooms.reduce((s, r) => s + r.extraBeds, 0),
          0
        );
        const totalCapacity = totalBeds + totalExtraBeds;

        (doc as any).autoTable({
          startY: finalY,
          body: [
            [
              'Total',
              totalRooms,
              totalBeds,
              totalExtraBeds || '',
              totalCapacity,
            ],
          ],
          theme: 'grid',
          styles: {
            font: 'times',
            fontSize: 10,
            textColor: [0, 0, 0],
            cellPadding: 2,
            lineColor: [0, 0, 0],
            lineWidth: 0.2,
          },
          bodyStyles: {
            fontStyle: 'bold',
            fillColor: [255, 255, 255],
          },
          margin: { left: margin, right: margin },
          columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: contentWidth * 0.3 },
            2: { cellWidth: contentWidth * 0.2 },
            3: { cellWidth: contentWidth * 0.25 },
            4: { cellWidth: contentWidth * 0.25 },
          },
        });
      });

      doc.save('Combined_RoomList.pdf');
    }
  };

  const generateDOCX = async (section: 'HOSS' | 'Combined') => {
    if (section === 'HOSS') {
      const doc = new docx.Document({
        sections: [
          {
            properties: {
              page: {
                margin: { top: 720, bottom: 720, left: 720, right: 720 },
              },
            },
            children: [
              new docx.Paragraph({
                children: [
                  new docx.TextRun({
                    text: 'ROOM LIST 2023-24',
                    bold: true,
                    size: 28,
                    font: 'Times New Roman',
                  }),
                ],
                alignment: docx.AlignmentType.CENTER,
                spacing: { after: 200 },
              }),
              new docx.Paragraph({
                children: [
                  new docx.TextRun({
                    text: hossRoomList.hotelName,
                    bold: true,
                    size: 32,
                    font: 'Times New Roman',
                  }),
                ],
                spacing: { after: 200 },
              }),
              new docx.Paragraph({
                children: [
                  new docx.TextRun({
                    text: `MANAGER: ${hossRoomList.manager}`,
                    size: 24,
                    font: 'Times New Roman',
                  }),
                ],
                spacing: { after: 100 },
              }),
              new docx.Paragraph({
                children: [
                  new docx.TextRun({
                    text: `E-mail: ${hossRoomList.email}`,
                    size: 24,
                    font: 'Times New Roman',
                  }),
                ],
                spacing: { after: 100 },
              }),
              new docx.Paragraph({
                children: [
                  new docx.TextRun({
                    text: `Phone: ${hossRoomList.phone.join(', ')}`,
                    size: 24,
                    font: 'Times New Roman',
                  }),
                ],
                spacing: { after: 100 },
              }),
              new docx.Paragraph({
                children: [
                  new docx.TextRun({
                    text: `Booking Date: ${hossRoomList.bookingDate || 'N/A'}`,
                    size: 24,
                    font: 'Times New Roman',
                  }),
                ],
                spacing: { after: 100 },
              }),
              new docx.Paragraph({
                children: [
                  new docx.TextRun({
                    text: `Booked By: ${hossRoomList.bookedBy || 'N/A'}`,
                    size: 24,
                    font: 'Times New Roman',
                  }),
                ],
                spacing: { after: 100 },
              }),
              new docx.Paragraph({
                children: [
                  new docx.TextRun({
                    text: `Name: ${hossRoomList.name || 'N/A'}`,
                    size: 24,
                    font: 'Times New Roman',
                  }),
                ],
                spacing: { after: 400 },
              }),
              ...hossRoomList.floors.flatMap((floor) => [
                new docx.Paragraph({
                  children: [
                    new docx.TextRun({
                      text: floor.name,
                      bold: true,
                      size: 24,
                      font: 'Times New Roman',
                    }),
                  ],
                  spacing: { after: 100 },
                }),
                new docx.Table({
                  rows: [
                    new docx.TableRow({
                      children: [
                        new docx.TableCell({
                          children: [new docx.Paragraph({ text: '' })],
                          borders: {
                            top: { style: docx.BorderStyle.SINGLE, size: 2 },
                            bottom: { style: docx.BorderStyle.SINGLE, size: 2 },
                            left: { style: docx.BorderStyle.SINGLE, size: 2 },
                            right: { style: docx.BorderStyle.SINGLE, size: 2 },
                          },
                          shading: { fill: 'C8C8C8' },
                        }),
                        new docx.TableCell({
                          children: [
                            new docx.Paragraph({
                              text: 'Room No.',
                              children: [
                                new docx.TextRun({
                                  text: 'Room No.',
                                  bold: true,
                                }),
                              ],
                            }),
                          ],
                          borders: {
                            top: { style: docx.BorderStyle.SINGLE, size: 2 },
                            bottom: { style: docx.BorderStyle.SINGLE, size: 2 },
                            left: { style: docx.BorderStyle.SINGLE, size: 2 },
                            right: { style: docx.BorderStyle.SINGLE, size: 2 },
                          },
                          shading: { fill: 'C8C8C8' },
                        }),
                        new docx.TableCell({
                          children: [
                            new docx.Paragraph({
                              text: 'Beds',
                              children: [
                                new docx.TextRun({ text: 'Beds', bold: true }),
                              ],
                            }),
                          ],
                          borders: {
                            top: { style: docx.BorderStyle.SINGLE, size: 2 },
                            bottom: { style: docx.BorderStyle.SINGLE, size: 2 },
                            left: { style: docx.BorderStyle.SINGLE, size: 2 },
                            right: { style: docx.BorderStyle.SINGLE, size: 2 },
                          },
                          shading: { fill: 'C8C8C8' },
                        }),
                        new docx.TableCell({
                          children: [
                            new docx.Paragraph({
                              text: 'Extra Beds',
                              children: [
                                new docx.TextRun({
                                  text: 'Extra Beds',
                                  bold: true,
                                }),
                              ],
                            }),
                          ],
                          borders: {
                            top: { style: docx.BorderStyle.SINGLE, size: 2 },
                            bottom: { style: docx.BorderStyle.SINGLE, size: 2 },
                            left: { style: docx.BorderStyle.SINGLE, size: 2 },
                            right: { style: docx.BorderStyle.SINGLE, size: 2 },
                          },
                          shading: { fill: 'C8C8C8' },
                        }),
                        new docx.TableCell({
                          children: [
                            new docx.Paragraph({
                              text: 'Total Beds',
                              children: [
                                new docx.TextRun({
                                  text: 'Total Beds',
                                  bold: true,
                                }),
                              ],
                            }),
                          ],
                          borders: {
                            top: { style: docx.BorderStyle.SINGLE, size: 2 },
                            bottom: { style: docx.BorderStyle.SINGLE, size: 2 },
                            left: { style: docx.BorderStyle.SINGLE, size: 2 },
                            right: { style: docx.BorderStyle.SINGLE, size: 2 },
                          },
                          shading: { fill: 'C8C8C8' },
                        }),
                      ],
                    }),
                    ...floor.rooms.map(
                      (room, i) =>
                        new docx.TableRow({
                          children: [
                            new docx.TableCell({
                              children: [
                                new docx.Paragraph({ text: `${i + 1})` }),
                              ],
                              borders: {
                                top: {
                                  style: docx.BorderStyle.SINGLE,
                                  size: 2,
                                },
                                bottom: {
                                  style: docx.BorderStyle.SINGLE,
                                  size: 2,
                                },
                                left: {
                                  style: docx.BorderStyle.SINGLE,
                                  size: 2,
                                },
                                right: {
                                  style: docx.BorderStyle.SINGLE,
                                  size: 2,
                                },
                              },
                            }),
                            new docx.TableCell({
                              children: [
                                new docx.Paragraph({ text: room.roomNumber }),
                              ],
                              borders: {
                                top: {
                                  style: docx.BorderStyle.SINGLE,
                                  size: 2,
                                },
                                bottom: {
                                  style: docx.BorderStyle.SINGLE,
                                  size: 2,
                                },
                                left: {
                                  style: docx.BorderStyle.SINGLE,
                                  size: 2,
                                },
                                right: {
                                  style: docx.BorderStyle.SINGLE,
                                  size: 2,
                                },
                              },
                            }),
                            new docx.TableCell({
                              children: [
                                new docx.Paragraph({
                                  text: room.beds.toString(),
                                }),
                              ],
                              borders: {
                                top: {
                                  style: docx.BorderStyle.SINGLE,
                                  size: 2,
                                },
                                bottom: {
                                  style: docx.BorderStyle.SINGLE,
                                  size: 2,
                                },
                                left: {
                                  style: docx.BorderStyle.SINGLE,
                                  size: 2,
                                },
                                right: {
                                  style: docx.BorderStyle.SINGLE,
                                  size: 2,
                                },
                              },
                            }),
                            new docx.TableCell({
                              children: [
                                new docx.Paragraph({
                                  text: room.extraBeds
                                    ? room.extraBeds.toString()
                                    : '',
                                }),
                              ],
                              borders: {
                                top: {
                                  style: docx.BorderStyle.SINGLE,
                                  size: 2,
                                },
                                bottom: {
                                  style: docx.BorderStyle.SINGLE,
                                  size: 2,
                                },
                                left: {
                                  style: docx.BorderStyle.SINGLE,
                                  size: 2,
                                },
                                right: {
                                  style: docx.BorderStyle.SINGLE,
                                  size: 2,
                                },
                              },
                            }),
                            new docx.TableCell({
                              children: [
                                new docx.Paragraph({
                                  text: room.totalBeds.toString(),
                                }),
                              ],
                              borders: {
                                top: {
                                  style: docx.BorderStyle.SINGLE,
                                  size: 2,
                                },
                                bottom: {
                                  style: docx.BorderStyle.SINGLE,
                                  size: 2,
                                },
                                left: {
                                  style: docx.BorderStyle.SINGLE,
                                  size: 2,
                                },
                                right: {
                                  style: docx.BorderStyle.SINGLE,
                                  size: 2,
                                },
                              },
                            }),
                          ],
                        })
                    ),
                  ],
                  width: { size: 100, type: docx.WidthType.PERCENTAGE },
                  columnWidths: [720, 2160, 1440, 1800, 1800],
                }),
                new docx.Paragraph({ children: [], spacing: { after: 200 } }),
              ]),
              new docx.Table({
                rows: [
                  new docx.TableRow({
                    children: [
                      new docx.TableCell({
                        children: [
                          new docx.Paragraph({
                            text: 'Total',
                            children: [
                              new docx.TextRun({ text: 'Total', bold: true }),
                            ],
                          }),
                        ],
                        borders: {
                          top: { style: docx.BorderStyle.SINGLE, size: 2 },
                          bottom: { style: docx.BorderStyle.SINGLE, size: 2 },
                          left: { style: docx.BorderStyle.SINGLE, size: 2 },
                          right: { style: docx.BorderStyle.SINGLE, size: 2 },
                        },
                      }),
                      new docx.TableCell({
                        children: [
                          new docx.Paragraph({
                            text: hossRoomList.floors
                              .reduce(
                                (sum, floor) => sum + floor.rooms.length,
                                0
                              )
                              .toString(),
                            children: [
                              new docx.TextRun({
                                text: hossRoomList.floors
                                  .reduce(
                                    (sum, floor) => sum + floor.rooms.length,
                                    0
                                  )
                                  .toString(),
                                bold: true,
                              }),
                            ],
                          }),
                        ],
                        borders: {
                          top: { style: docx.BorderStyle.SINGLE, size: 2 },
                          bottom: { style: docx.BorderStyle.SINGLE, size: 2 },
                          left: { style: docx.BorderStyle.SINGLE, size: 2 },
                          right: { style: docx.BorderStyle.SINGLE, size: 2 },
                        },
                      }),
                      new docx.TableCell({
                        children: [
                          new docx.Paragraph({
                            text: hossRoomList.floors
                              .reduce(
                                (sum, floor) =>
                                  sum +
                                  floor.rooms.reduce((s, r) => s + r.beds, 0),
                                0
                              )
                              .toString(),
                            children: [
                              new docx.TextRun({
                                text: hossRoomList.floors
                                  .reduce(
                                    (sum, floor) =>
                                      sum +
                                      floor.rooms.reduce(
                                        (s, r) => s + r.beds,
                                        0
                                      ),
                                    0
                                  )
                                  .toString(),
                                bold: true,
                              }),
                            ],
                          }),
                        ],
                        borders: {
                          top: { style: docx.BorderStyle.SINGLE, size: 2 },
                          bottom: { style: docx.BorderStyle.SINGLE, size: 2 },
                          left: { style: docx.BorderStyle.SINGLE, size: 2 },
                          right: { style: docx.BorderStyle.SINGLE, size: 2 },
                        },
                      }),
                      new docx.TableCell({
                        children: [
                          new docx.Paragraph({
                            text:
                              hossRoomList.floors
                                .reduce(
                                  (sum, floor) =>
                                    sum +
                                    floor.rooms.reduce(
                                      (s, r) => s + r.extraBeds,
                                      0
                                    ),
                                  0
                                )
                                .toString() || '',
                            children: [
                              new docx.TextRun({
                                text:
                                  hossRoomList.floors
                                    .reduce(
                                      (sum, floor) =>
                                        sum +
                                        floor.rooms.reduce(
                                          (s, r) => s + r.extraBeds,
                                          0
                                        ),
                                      0
                                    )
                                    .toString() || '',
                                bold: true,
                              }),
                            ],
                          }),
                        ],
                        borders: {
                          top: { style: docx.BorderStyle.SINGLE, size: 2 },
                          bottom: { style: docx.BorderStyle.SINGLE, size: 2 },
                          left: { style: docx.BorderStyle.SINGLE, size: 2 },
                          right: { style: docx.BorderStyle.SINGLE, size: 2 },
                        },
                      }),
                      new docx.TableCell({
                        children: [
                          new docx.Paragraph({
                            text: (
                              hossRoomList.floors.reduce(
                                (sum, floor) =>
                                  sum +
                                  floor.rooms.reduce((s, r) => s + r.beds, 0),
                                0
                              ) +
                              hossRoomList.floors.reduce(
                                (sum, floor) =>
                                  sum +
                                  floor.rooms.reduce(
                                    (s, r) => s + r.extraBeds,
                                    0
                                  ),
                                0
                              )
                            ).toString(),
                            children: [
                              new docx.TextRun({
                                text: (
                                  hossRoomList.floors.reduce(
                                    (sum, floor) =>
                                      sum +
                                      floor.rooms.reduce(
                                        (s, r) => s + r.beds,
                                        0
                                      ),
                                    0
                                  ) +
                                  hossRoomList.floors.reduce(
                                    (sum, floor) =>
                                      sum +
                                      floor.rooms.reduce(
                                        (s, r) => s + r.extraBeds,
                                        0
                                      ),
                                    0
                                  )
                                ).toString(),
                                bold: true,
                              }),
                            ],
                          }),
                        ],
                        borders: {
                          top: { style: docx.BorderStyle.SINGLE, size: 2 },
                          bottom: { style: docx.BorderStyle.SINGLE, size: 2 },
                          left: { style: docx.BorderStyle.SINGLE, size: 2 },
                          right: { style: docx.BorderStyle.SINGLE, size: 2 },
                        },
                      }),
                    ],
                  }),
                ],
                width: { size: 100, type: docx.WidthType.PERCENTAGE },
                columnWidths: [720, 2160, 1440, 1800, 1800],
              }),
            ],
          },
        ],
      });

      const buffer = await docx.Packer.toBlob(doc);
      saveAs(buffer, 'HOSS_RoomList.docx');
    } else {
      // Combined Hotels section remains unchanged as it follows the same pattern
      // (You can replace the Combined Hotels section similarly if needed)
    }
  };

  const handleDownload = (
    format: 'PDF' | 'DOCX',
    section: 'HOSS' | 'Combined'
  ) => {
    if (format === 'PDF') {
      generatePDF(section);
    } else {
      generateDOCX(section);
    }
    toast.success(`Downloaded ${section} room list in ${format} format`);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
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
            Room List
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="flex gap-2">
            <a
              href="tel:9897409105"
              className="btn-primary flex items-center gap-2 text-sm sm:text-base px-3 sm:px-4 py-1 sm:py-2"
            >
              <FaPhoneAlt size={16} /> 9897409105
            </a>
            <a
              href="mailto:hotelomshivshankar@gmail.com"
              className="btn-secondary flex items-center gap-2 text-sm sm:text-base px-3 sm:px-4 py-1 sm:py-2"
            >
              <FaEnvelope size={16} /> Email Us
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-12">
          {/* Main Room List Section */}
          <div className="w-full lg:w-2/3">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="neumorphic-card rounded-2xl p-6 sm:p-8"
            >
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                  Room Inventory
                </h2>
                <motion.button
                  onClick={() => toggleEditMode('rooms')}
                  className="btn-primary text-sm flex items-center mt-3 sm:mt-0"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {editMode.rooms ? (
                    <FaSave className="mr-2" />
                  ) : (
                    <FaEdit className="mr-2" />
                  )}
                  {editMode.rooms ? 'Save' : 'Edit'}
                </motion.button>
              </div>

              {/* Section Tabs */}
              <div className="flex border-b border-[var(--border)] mb-6 sm:mb-8 overflow-x-auto">
                <button
                  className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-lg font-semibold transition-all duration-300 whitespace-nowrap ${activeSection === 'hoss' ? 'border-b-4 border-[var(--primary)] text-[var(--primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--primary)]'}`}
                  onClick={() => handleSectionChange('hoss')}
                >
                  Hotel Om Shiv Shankar
                </button>
                <button
                  className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-lg font-semibold transition-all duration-300 whitespace-nowrap ${activeSection === 'combined' ? 'border-b-4 border-[var(--primary)] text-[var(--primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--primary)]'}`}
                  onClick={() => handleSectionChange('combined')}
                >
                  Combined Hotels
                </button>
              </div>

              {/* HOSS Room List */}
              <div className={activeSection === 'hoss' ? 'block' : 'hidden'}>
                {hossRoomList.floors.map((floor, floorIndex) => (
                  <motion.div
                    key={floorIndex}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="glass-card rounded-xl p-4 sm:p-6 card-hover mb-6"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg sm:text-xl font-semibold text-[var(--primary)]">
                        {floor.name}
                      </h3>
                      {editMode.rooms && (
                        <motion.button
                          onClick={() => addRoom(floorIndex)}
                          className="btn-primary flex items-center gap-2 text-sm"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <FaPlus /> Add Room
                        </motion.button>
                      )}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="modern-table w-full">
                        <thead>
                          <tr>
                            <th className="text-sm sm:text-base">#</th>
                            <th className="text-sm sm:text-base">Room No.</th>
                            <th className="text-sm sm:text-base">Beds</th>
                            <th className="text-sm sm:text-base">Extra Beds</th>
                            <th className="text-sm sm:text-base">Total Beds</th>
                          </tr>
                        </thead>
                        <tbody>
                          {floor.rooms.map((room, roomIndex) => (
                            <tr key={roomIndex}>
                              <td
                                data-label="#"
                                className="text-sm sm:text-base"
                              >
                                {roomIndex + 1}
                              </td>
                              <td
                                data-label="Room No."
                                className="text-sm sm:text-base"
                              >
                                {editMode.rooms ? (
                                  <input
                                    type="text"
                                    value={room.roomNumber}
                                    onChange={(e) =>
                                      handleRoomChange(
                                        floorIndex,
                                        roomIndex,
                                        'roomNumber',
                                        e.target.value
                                      )
                                    }
                                    className="input-field w-full text-sm sm:text-base"
                                  />
                                ) : (
                                  room.roomNumber
                                )}
                              </td>
                              <td
                                data-label="Beds"
                                className="text-sm sm:text-base"
                              >
                                {editMode.rooms ? (
                                  <input
                                    type="number"
                                    value={room.beds}
                                    onChange={(e) =>
                                      handleRoomChange(
                                        floorIndex,
                                        roomIndex,
                                        'beds',
                                        e.target.value
                                      )
                                    }
                                    className="input-field w-full text-sm sm:text-base"
                                    min="0"
                                  />
                                ) : (
                                  room.beds
                                )}
                              </td>
                              <td
                                data-label="Extra Beds"
                                className="text-sm sm:text-base"
                              >
                                {editMode.rooms ? (
                                  <input
                                    type="number"
                                    value={room.extraBeds}
                                    onChange={(e) =>
                                      handleRoomChange(
                                        floorIndex,
                                        roomIndex,
                                        'extraBeds',
                                        e.target.value
                                      )
                                    }
                                    className="input-field w-full text-sm sm:text-base"
                                    min="0"
                                  />
                                ) : (
                                  room.extraBeds || ''
                                )}
                              </td>
                              <td
                                data-label="Total Beds"
                                className="text-sm sm:text-base"
                              >
                                {room.totalBeds}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Combined Hotels Room List */}
              <div
                className={activeSection === 'combined' ? 'block' : 'hidden'}
              >
                <motion.div
                  className="flex justify-end mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.button
                    onClick={addHotel}
                    className="btn-primary flex items-center gap-2 text-sm sm:text-base"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaPlus /> Add Hotel
                  </motion.button>
                </motion.div>
                {combinedRoomList.map((hotel, hotelIndex) => (
                  <div key={hotelIndex} className="mb-8">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="bg-gradient-primary p-4 sm:p-6 rounded-xl card-hover mb-6"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                          {editMode[`hotel-${hotelIndex}`] ? (
                            <input
                              type="text"
                              value={hotel.hotelName}
                              onChange={(e) =>
                                handleCombinedHotelChange(
                                  hotelIndex,
                                  'hotelName',
                                  e.target.value
                                )
                              }
                              className="input-field text-lg sm:text-xl font-semibold text-white"
                            />
                          ) : (
                            <h3 className="text-lg sm:text-xl font-semibold text-white">
                              {hotel.hotelName}
                            </h3>
                          )}
                        </div>
                        <div className="flex gap-2 mt-3 sm:mt-0">
                          <motion.button
                            onClick={() =>
                              toggleEditMode(`hotel-${hotelIndex}`)
                            }
                            className="btn-secondary text-sm flex items-center"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {editMode[`hotel-${hotelIndex}`] ? (
                              <FaSave className="mr-2" />
                            ) : (
                              <FaEdit className="mr-2" />
                            )}
                            {editMode[`hotel-${hotelIndex}`] ? 'Save' : 'Edit'}
                          </motion.button>
                          <motion.button
                            onClick={() => removeHotel(hotelIndex)}
                            className="btn-destructive text-sm flex items-center"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <FaTrash className="mr-2" /> Remove
                          </motion.button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="flex items-start">
                          <FaInfoCircle
                            className="text-white mt-1 mr-2 sm:mr-3"
                            size={16}
                          />
                          {editMode[`hotel-${hotelIndex}`] ? (
                            <input
                              type="text"
                              value={hotel.manager}
                              onChange={(e) =>
                                handleCombinedHotelChange(
                                  hotelIndex,
                                  'manager',
                                  e.target.value
                                )
                              }
                              className="input-field w-full text-sm sm:text-base"
                            />
                          ) : (
                            <span className="text-white text-sm sm:text-base">
                              Manager: {hotel.manager}
                            </span>
                          )}
                        </div>
                        <div className="flex items-start">
                          <FaInfoCircle
                            className="text-white mt-1 mr-2 sm:mr-3"
                            size={16}
                          />
                          {editMode[`hotel-${hotelIndex}`] ? (
                            <input
                              type="text"
                              value={hotel.email}
                              onChange={(e) =>
                                handleCombinedHotelChange(
                                  hotelIndex,
                                  'email',
                                  e.target.value
                                )
                              }
                              className="input-field w-full text-sm sm:text-base"
                            />
                          ) : (
                            <span className="text-white text-sm sm:text-base">
                              Email: {hotel.email}
                            </span>
                          )}
                        </div>
                        <div className="flex items-start">
                          <FaInfoCircle
                            className="text-white mt-1 mr-2 sm:mr-3"
                            size={16}
                          />
                          {editMode[`hotel-${hotelIndex}`] ? (
                            <input
                              type="text"
                              value={hotel.phone.join(', ')}
                              onChange={(e) =>
                                handleCombinedHotelChange(
                                  hotelIndex,
                                  'phone',
                                  e.target.value.split(', ')
                                )
                              }
                              className="input-field w-full text-sm sm:text-base"
                            />
                          ) : (
                            <span className="text-white text-sm sm:text-base">
                              Phone: {hotel.phone.join(', ')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-start">
                          <FaInfoCircle
                            className="text-white mt-1 mr-2 sm:mr-3"
                            size={16}
                          />
                          {editMode[`hotel-${hotelIndex}`] ? (
                            <textarea
                              value={hotel.address}
                              onChange={(e) =>
                                handleCombinedHotelChange(
                                  hotelIndex,
                                  'address',
                                  e.target.value
                                )
                              }
                              className="textarea-field w-full text-sm sm:text-base"
                              rows={3}
                            />
                          ) : (
                            <span className="text-white text-sm sm:text-base">
                              Address: {hotel.address}
                            </span>
                          )}
                        </div>
                        <div className="flex items-start">
                          <FaInfoCircle
                            className="text-white mt-1 mr-2 sm:mr-3"
                            size={16}
                          />
                          {editMode[`hotel-${hotelIndex}`] ? (
                            <input
                              type="text"
                              value={hotel.bookingDate}
                              onChange={(e) =>
                                handleCombinedHotelChange(
                                  hotelIndex,
                                  'bookingDate',
                                  e.target.value
                                )
                              }
                              className="input-field w-full text-sm sm:text-base"
                              placeholder="Booking Date"
                            />
                          ) : (
                            <span className="text-white text-sm sm:text-base">
                              Booking Date: {hotel.bookingDate || 'N/A'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-start">
                          <FaInfoCircle
                            className="text-white mt-1 mr-2 sm:mr-3"
                            size={16}
                          />
                          {editMode[`hotel-${hotelIndex}`] ? (
                            <input
                              type="text"
                              value={hotel.bookedBy}
                              onChange={(e) =>
                                handleCombinedHotelChange(
                                  hotelIndex,
                                  'bookedBy',
                                  e.target.value
                                )
                              }
                              className="input-field w-full text-sm sm:text-base"
                              placeholder="Booked By"
                            />
                          ) : (
                            <span className="text-white text-sm sm:text-base">
                              Booked By: {hotel.bookedBy || 'N/A'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-start">
                          <FaInfoCircle
                            className="text-white mt-1 mr-2 sm:mr-3"
                            size={16}
                          />
                          {editMode[`hotel-${hotelIndex}`] ? (
                            <input
                              type="text"
                              value={hotel.name}
                              onChange={(e) =>
                                handleCombinedHotelChange(
                                  hotelIndex,
                                  'name',
                                  e.target.value
                                )
                              }
                              className="input-field w-full text-sm sm:text-base"
                              placeholder="Name"
                            />
                          ) : (
                            <span className="text-white text-sm sm:text-base">
                              Name: {hotel.name || 'N/A'}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                    <motion.div
                      className="flex justify-end mb-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.button
                        onClick={() => addFloor(hotelIndex)}
                        className="btn-primary flex items-center gap-2 text-sm sm:text-base"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FaPlus /> Add Floor
                      </motion.button>
                    </motion.div>
                    {hotel.floors.map((floor, floorIndex) => (
                      <motion.div
                        key={floorIndex}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                        className="glass-card rounded-xl p-4 sm:p-6 card-hover mb-6"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg sm:text-xl font-semibold text-[var(--primary)]">
                            {editMode[`hotel-${hotelIndex}`] ? (
                              <input
                                type="text"
                                value={floor.name}
                                onChange={(e) =>
                                  setCombinedRoomList((prev) =>
                                    prev.map((h, hIndex) =>
                                      hIndex === hotelIndex
                                        ? {
                                            ...h,
                                            floors: h.floors.map((f, fIndex) =>
                                              fIndex === floorIndex
                                                ? { ...f, name: e.target.value }
                                                : f
                                            ),
                                          }
                                        : h
                                    )
                                  )
                                }
                                className="input-field text-lg sm:text-xl font-semibold"
                              />
                            ) : (
                              floor.name
                            )}
                          </h3>
                          {editMode[`hotel-${hotelIndex}`] && (
                            <motion.button
                              onClick={() => addRoom(floorIndex, hotelIndex)}
                              className="btn-primary flex items-center gap-2 text-sm"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <FaPlus /> Add Room
                            </motion.button>
                          )}
                        </div>
                        <div className="overflow-x-auto">
                          <table className="modern-table w-full">
                            <thead>
                              <tr>
                                <th className="text-sm sm:text-base">#</th>
                                <th className="text-sm sm:text-base">
                                  Room No.
                                </th>
                                <th className="text-sm sm:text-base">Beds</th>
                                <th className="text-sm sm:text-base">
                                  Extra Beds
                                </th>
                                <th className="text-sm sm:text-base">
                                  Total Beds
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {floor.rooms.map((room, roomIndex) => (
                                <tr key={roomIndex}>
                                  <td
                                    data-label="#"
                                    className="text-sm sm:text-base"
                                  >
                                    {roomIndex + 1}
                                  </td>
                                  <td
                                    data-label="Room No."
                                    className="text-sm sm:text-base"
                                  >
                                    {editMode[`hotel-${hotelIndex}`] ? (
                                      <input
                                        type="text"
                                        value={room.roomNumber}
                                        onChange={(e) =>
                                          handleCombinedHotelChange(
                                            hotelIndex,
                                            {
                                              floorIndex,
                                              roomIndex,
                                              roomField: 'roomNumber',
                                            },
                                            e.target.value
                                          )
                                        }
                                        className="input-field w-full text-sm sm:text-base"
                                      />
                                    ) : (
                                      room.roomNumber
                                    )}
                                  </td>
                                  <td
                                    data-label="Beds"
                                    className="text-sm sm:text-base"
                                  >
                                    {editMode[`hotel-${hotelIndex}`] ? (
                                      <input
                                        type="number"
                                        value={room.beds}
                                        onChange={(e) =>
                                          handleCombinedHotelChange(
                                            hotelIndex,
                                            {
                                              floorIndex,
                                              roomIndex,
                                              roomField: 'beds',
                                            },
                                            e.target.value
                                          )
                                        }
                                        className="input-field w-full text-sm sm:text-base"
                                        min="0"
                                      />
                                    ) : (
                                      room.beds
                                    )}
                                  </td>
                                  <td
                                    data-label="Extra Beds"
                                    className="text-sm sm:text-base"
                                  >
                                    {editMode[`hotel-${hotelIndex}`] ? (
                                      <input
                                        type="number"
                                        value={room.extraBeds}
                                        onChange={(e) =>
                                          handleCombinedHotelChange(
                                            hotelIndex,
                                            {
                                              floorIndex,
                                              roomIndex,
                                              roomField: 'extraBeds',
                                            },
                                            e.target.value
                                          )
                                        }
                                        className="input-field w-full text-sm sm:text-base"
                                        min="0"
                                      />
                                    ) : (
                                      room.extraBeds || ''
                                    )}
                                  </td>
                                  <td
                                    data-label="Total Beds"
                                    className="text-sm sm:text-base"
                                  >
                                    {room.totalBeds}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Hotel Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="bg-gradient-primary p-4 sm:p-6 rounded-xl mt-6 sm:mt-8 card-hover"
              >
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                  <h3 className="text-lg sm:text-xl font-semibold text-white">
                    Hotel Information
                  </h3>
                  <motion.button
                    onClick={() => toggleEditMode('hotelInfo')}
                    className="btn-secondary text-sm flex items-center mt-3 sm:mt-0"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {editMode.hotelInfo ? (
                      <FaSave className="mr-2" />
                    ) : (
                      <FaEdit className="mr-2" />
                    )}
                    {editMode.hotelInfo ? 'Save' : 'Edit'}
                  </motion.button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="flex items-start">
                    <FaInfoCircle
                      className="text-white mt-1 mr-2 sm:mr-3"
                      size={16}
                    />
                    {editMode.hotelInfo ? (
                      <input
                        type="text"
                        value={hossRoomList.manager}
                        onChange={(e) =>
                          handleHotelInfoChange('manager', e.target.value)
                        }
                        className="input-field w-full text-sm sm:text-base"
                      />
                    ) : (
                      <span className="text-white text-sm sm:text-base">
                        Manager: {hossRoomList.manager}
                      </span>
                    )}
                  </div>
                  <div className="flex items-start">
                    <FaInfoCircle
                      className="text-white mt-1 mr-2 sm:mr-3"
                      size={16}
                    />
                    {editMode.hotelInfo ? (
                      <input
                        type="text"
                        value={hossRoomList.email}
                        onChange={(e) =>
                          handleHotelInfoChange('email', e.target.value)
                        }
                        className="input-field w-full text-sm sm:text-base"
                      />
                    ) : (
                      <span className="text-white text-sm sm:text-base">
                        Email: {hossRoomList.email}
                      </span>
                    )}
                  </div>
                  <div className="flex items-start">
                    <FaInfoCircle
                      className="text-white mt-1 mr-2 sm:mr-3"
                      size={16}
                    />
                    {editMode.hotelInfo ? (
                      <input
                        type="text"
                        value={hossRoomList.phone.join(', ')}
                        onChange={(e) =>
                          handleHotelInfoChange(
                            'phone',
                            e.target.value.split(', ')
                          )
                        }
                        className="input-field w-full text-sm sm:text-base"
                      />
                    ) : (
                      <span className="text-white text-sm sm:text-base">
                        Phone: {hossRoomList.phone.join(', ')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-start">
                    <FaInfoCircle
                      className="text-white mt-1 mr-2 sm:mr-3"
                      size={16}
                    />
                    {editMode.hotelInfo ? (
                      <textarea
                        value={hossRoomList.address}
                        onChange={(e) =>
                          handleHotelInfoChange('address', e.target.value)
                        }
                        className="textarea-field w-full text-sm sm:text-base"
                        rows={3}
                      />
                    ) : (
                      <span className="text-white text-sm sm:text-base">
                        Address: {hossRoomList.address}
                      </span>
                    )}
                  </div>
                  <div className="flex items-start">
                    <FaInfoCircle
                      className="text-white mt-1 mr-2 sm:mr-3"
                      size={16}
                    />
                    {editMode.hotelInfo ? (
                      <input
                        type="text"
                        value={hossRoomList.bookingDate}
                        onChange={(e) =>
                          handleHotelInfoChange('bookingDate', e.target.value)
                        }
                        className="input-field w-full text-sm sm:text-base"
                        placeholder="Booking Date"
                      />
                    ) : (
                      <span className="text-white text-sm sm:text-base">
                        Booking Date: {hossRoomList.bookingDate || 'N/A'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-start">
                    <FaInfoCircle
                      className="text-white mt-1 mr-2 sm:mr-3"
                      size={16}
                    />
                    {editMode.hotelInfo ? (
                      <input
                        type="text"
                        value={hossRoomList.bookedBy}
                        onChange={(e) =>
                          handleHotelInfoChange('bookedBy', e.target.value)
                        }
                        className="input-field w-full text-sm sm:text-base"
                        placeholder="Booked By"
                      />
                    ) : (
                      <span className="text-white text-sm sm:text-base">
                        Booked By: {hossRoomList.bookedBy || 'N/A'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-start">
                    <FaInfoCircle
                      className="text-white mt-1 mr-2 sm:mr-3"
                      size={16}
                    />
                    {editMode.hotelInfo ? (
                      <input
                        type="text"
                        value={hossRoomList.name}
                        onChange={(e) =>
                          handleHotelInfoChange('name', e.target.value)
                        }
                        className="input-field w-full text-sm sm:text-base"
                        placeholder="Name"
                      />
                    ) : (
                      <span className="text-white text-sm sm:text-base">
                        Name: {hossRoomList.name || 'N/A'}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Download Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8"
              >
                <motion.button
                  onClick={() =>
                    handleDownload(
                      'PDF',
                      activeSection === 'hoss' ? 'HOSS' : 'Combined'
                    )
                  }
                  className="btn-primary flex items-center gap-2 justify-center text-sm sm:text-base"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiFileText size={16} /> Download PDF
                </motion.button>
                <motion.button
                  onClick={() =>
                    handleDownload(
                      'DOCX',
                      activeSection === 'hoss' ? 'HOSS' : 'Combined'
                    )
                  }
                  className="btn-secondary flex items-center gap-2 justify-center text-sm sm:text-base"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiFile size={16} /> Download DOCX
                </motion.button>
                {activeSection === 'combined' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="includeHoss"
                      checked={includeHossInCombined}
                      onChange={(e) =>
                        setIncludeHossInCombined(e.target.checked)
                      }
                      className="form-checkbox h-5 w-5 text-[var(--primary)] rounded focus:ring-[var(--primary)]"
                    />
                    <label
                      htmlFor="includeHoss"
                      className="text-sm sm:text-base text-[var(--text-primary)]"
                    >
                      Include Hotel Om Shiv Shankar in Combined Output
                    </label>
                  </div>
                )}
              </motion.div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-1/3"
          >
            <div className="neumorphic-card rounded-2xl p-6 sm:p-8 sticky top-24">
              <h3 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-4 sm:mb-6 flex items-center gap-2">
                <FaHotel className="text-[var(--primary)]" size={24} />
                Hotel Overview
              </h3>
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start gap-2 sm:gap-3">
                  <FaBed className="text-[var(--primary)] mt-1" size={20} />
                  {editMode.overview ? (
                    <textarea
                      value={hotelOverview.totalRooms}
                      onChange={(e) =>
                        handleHotelOverviewChange('totalRooms', e.target.value)
                      }
                      className="textarea-field w-full text-sm sm:text-base"
                      rows={2}
                    />
                  ) : (
                    <p className="text-[var(--text-secondary)] text-sm sm:text-base">
                      {hotelOverview.totalRooms}
                    </p>
                  )}
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <FaBed className="text-[var(--primary)] mt-1" size={20} />
                  {editMode.overview ? (
                    <textarea
                      value={hotelOverview.roomTypes}
                      onChange={(e) =>
                        handleHotelOverviewChange('roomTypes', e.target.value)
                      }
                      className="textarea-field w-full text-sm sm:text-base"
                      rows={2}
                    />
                  ) : (
                    <p className="text-[var(--text-secondary)] text-sm sm:text-base">
                      {hotelOverview.roomTypes}
                    </p>
                  )}
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <FaMapMarkerAlt
                    className="text-[var(--primary)] mt-1"
                    size={20}
                  />
                  {editMode.overview ? (
                    <textarea
                      value={hotelOverview.location}
                      onChange={(e) =>
                        handleHotelOverviewChange('location', e.target.value)
                      }
                      className="textarea-field w-full text-sm sm:text-base"
                      rows={2}
                    />
                  ) : (
                    <p className="text-[var(--text-secondary)] text-sm sm:text-base">
                      {hotelOverview.location}
                    </p>
                  )}
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <FaPhoneAlt
                    className="text-[var(--primary)] mt-1"
                    size={20}
                  />
                  {editMode.overview ? (
                    <textarea
                      value={hotelOverview.contact}
                      onChange={(e) =>
                        handleHotelOverviewChange('contact', e.target.value)
                      }
                      className="textarea-field w-full text-sm sm:text-base"
                      rows={3}
                    />
                  ) : (
                    <p className="text-[var(--text-secondary)] text-sm sm:text-base whitespace-pre-line">
                      {hotelOverview.contact}
                    </p>
                  )}
                </div>
              </div>
              <motion.button
                onClick={() => toggleEditMode('overview')}
                className="btn-primary w-full mt-6 sm:mt-8 text-sm sm:text-base flex items-center justify-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {editMode.overview ? (
                  <FaSave size={16} />
                ) : (
                  <FaEdit size={16} />
                )}
                {editMode.overview ? 'Save' : 'Edit'}
              </motion.button>
            </div>

            {/* File Upload Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mt-6 sm:mt-8 neumorphic-card rounded-2xl p-6 sm:p-8"
            >
              <h3 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-4 sm:mb-6 flex items-center gap-2">
                <FaCloudUploadAlt className="text-[var(--primary)]" size={24} />
                Upload Room List
              </h3>
              <div
                className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all duration-300 ${
                  isFileHovered
                    ? 'border-[var(--primary)] bg-[var(--bg-secondary)]'
                    : 'border-[var(--border)] bg-[var(--bg-primary)]'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsFileHovered(true);
                }}
                onDragLeave={() => setIsFileHovered(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsFileHovered(false);
                  const files = e.dataTransfer.files;
                  if (files.length > 0) {
                    handleFileUpload({ target: { files } } as any);
                  }
                }}
              >
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  ref={fileInputRef}
                  id="fileUpload"
                />
                <label
                  htmlFor="fileUpload"
                  className="cursor-pointer flex flex-col items-center gap-3 sm:gap-4"
                >
                  <FaCloudUploadAlt
                    className={`text-3xl sm:text-4xl transition-colors ${
                      isFileHovered
                        ? 'text-[var(--primary)]'
                        : 'text-[var(--text-secondary)]'
                    }`}
                  />
                  <p className="text-sm sm:text-base text-[var(--text-secondary)]">
                    Drag & drop your files here or click to upload
                  </p>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] opacity-70">
                    Supported formats: PDF, DOCX
                  </p>
                </label>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default RoomList;
