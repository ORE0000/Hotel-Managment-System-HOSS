import React from 'react';
import { Enquiry } from 'src/types';
import '../BillingSystem/Billing.css'; // Reuse Billing.css for consistent styling

interface EnquirySummaryPreviewProps {
  enquiryData: Enquiry | Enquiry[];
}

const EnquirySummaryPreview: React.FC<EnquirySummaryPreviewProps> = ({ enquiryData }) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Helper function to safely parse string to number
  const parseNumber = (value: string): number => {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Normalize enquiryData to always be an array
  const enquiries = Array.isArray(enquiryData) ? enquiryData : [enquiryData];

  // Calculate Due as Bill Amount - Advance - Cash-In
  const calculateDue = (enquiry: Enquiry) => {
    return enquiry.billAmount - enquiry.advance - enquiry.cashIn;
  };

  // Calculate totals for the summary
  const totals = {
    totalBill: enquiries.reduce((sum, enquiry) => sum + enquiry.billAmount, 0),
    totalAdvance: enquiries.reduce((sum, enquiry) => sum + enquiry.advance, 0),
    totalCashIn: enquiries.reduce((sum, enquiry) => sum + enquiry.cashIn, 0),
    totalDue: enquiries.reduce((sum, enquiry) => sum + (enquiry.billAmount - enquiry.advance - enquiry.cashIn), 0),
  };

  return (
    <div className="card print:shadow-none" style={{ width: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-blue-900">
          {enquiries.length === 1 ? enquiries[0].hotel : 'Hotel Om Shiv Shankar'}
        </h2>
        <p className="text-gray-600">
          Gangotri Rishikesh Road Nh 34 Matli (Uttarkashi) -249193 Uttarakhand
        </p>
        <h3 className="text-xl font-semibold mt-4">
          {enquiries.length === 1 ? 'Guest Enquiry Summary' : 'Multiple Bill Summary'}
        </h3>
      </div>

      {/* Summary Table */}
      <div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-blue-50">
              <th className="py-2 px-3 text-left">Guest Name</th>
              <th className="py-2 px-3 text-left">Hotel</th>
              <th className="py-2 px-3 text-left">PAX</th>
              <th className="py-2 px-3 text-left">Double Bed</th>
              <th className="py-2 px-3 text-left">Triple Bed</th>
              <th className="py-2 px-3 text-left">Four Bed</th>
              <th className="py-2 px-3 text-left">Extra Bed</th>
              <th className="py-2 px-3 text-left">Kitchen</th>
              <th className="py-2 px-3 text-left">Check-In</th>
              <th className="py-2 px-3 text-left">Check-Out</th>
              <th className="py-2 px-3 text-left">Plan</th>
              <th className="py-2 px-3 text-left">Bill Amount</th>
              <th className="py-2 px-3 text-left">Advance</th>
              <th className="py-2 px-3 text-left">Cash-In</th>
              <th className="py-2 px-3 text-left">Due</th>
              <th className="py-2 px-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {enquiries.map((enquiry, idx) => (
              <tr key={idx} className="border-b border-gray-100">
                <td className="py-2 px-3">{enquiry.guestName}</td>
                <td className="py-2 px-3">{enquiry.hotel}</td>
                <td className="py-2 px-3">{enquiry.pax}</td>
                <td className="py-2 px-3">{enquiry.roomName.doubleBed}</td>
                <td className="py-2 px-3">{enquiry.roomName.tripleBed}</td>
                <td className="py-2 px-3">{enquiry.roomName.fourBed}</td>
                <td className="py-2 px-3">{enquiry.roomName.extraBed}</td>
                <td className="py-2 px-3">{enquiry.roomName.kitchen}</td>
                <td className="py-2 px-3">{formatDate(enquiry.checkIn)}</td>
                <td className="py-2 px-3">{formatDate(enquiry.checkOut)}</td>
                <td className="py-2 px-3">{enquiry.plan || 'N/A'}</td>
                <td className="py-2 px-3">{formatCurrency(enquiry.billAmount)}</td>
                <td className="py-2 px-3">{formatCurrency(enquiry.advance)}</td>
                <td className="py-2 px-3">{formatCurrency(enquiry.cashIn)}</td>
                <td className="py-2 px-3">{formatCurrency(calculateDue(enquiry))}</td>
                <td className="py-2 px-3">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium text-center ${
                      enquiry.status === 'Confirmed'
                        ? 'bg-green-100 text-green-800'
                        : enquiry.status === 'Pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : enquiry.status === 'Hold'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {enquiry.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div className="mt-6">
        <div className="grid">
          <div>
            <p className="font-semibold text-blue-900">Total Bill:</p>
            <p className="text-blue-600">{formatCurrency(totals.totalBill)}</p>
          </div>
          <div>
            <p className="font-semibold text-blue-900">Advance:</p>
            <p className="text-green-600">{formatCurrency(totals.totalAdvance)}</p>
          </div>
          <div>
            <p className="font-semibold text-blue-900">Cash-In:</p>
            <p className="text-teal-600">{formatCurrency(totals.totalCashIn)}</p>
          </div>
          <div>
            <p className="font-semibold text-blue-900">Due:</p>
            <p className="text-red-600">{formatCurrency(totals.totalDue)}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8">
        <p>Generated on {new Date().toLocaleString('en-IN')}</p>
        <p>Thank you for choosing {enquiries.length === 1 ? enquiries[0].hotel : 'Hotel Om Shiv Shankar'}.</p>
      </div>
    </div>
  );
};

export default EnquirySummaryPreview;