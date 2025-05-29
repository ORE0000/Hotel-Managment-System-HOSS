import React from 'react';
import { ExtendedBookingDetail } from '../../types';
import '../BillingSystem/Billing.css'; // Reuse Billing.css for consistent styling

interface HOSSPreviewProps {
  bookingData: ExtendedBookingDetail;
  index?: number;
}

const HOSSPreview: React.FC<HOSSPreviewProps> = ({ bookingData, index }) => {
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number | undefined): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount ?? 0);
  };

  // Helper function to safely parse string to number
  const parseNumber = (value: string | number | undefined): number => {
    if (value === undefined || value === '') return 0;
    const parsed = parseInt(value.toString(), 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Default roomName if undefined
  const roomName = bookingData.roomName ?? {
    doubleBed: '0',
    tripleBed: '0',
    fourBed: '0',
    extraBed: '0',
    kitchen: '0',
  };

  // Default roomRent if undefined
  const roomRent = bookingData.roomRent ?? {
    doubleBed: 0,
    tripleBed: 0,
    fourBed: 0,
    extraBed: 0,
    kitchen: 0,
  };

  // Use dateBooked instead of date, with fallback
  const bookingDate = bookingData.dateBooked ?? bookingData.date ?? 'N/A';

  return (
    <div className="card print:shadow-none" id={`hoss-preview${index !== undefined ? `-${index}` : ''}`}>
      <div className="text-center mb-6 border-b border-gray-200 pb-4">
        <h2 className="text-3xl font-bold text-blue-900">{bookingData.hotel ?? 'N/A'}</h2>
        <p className="text-gray-600">Gangotri Rishikesh Road Nh 34 Matli (Uttarkashi) -249193 Uttarakhand</p>
        <h3 className="text-xl font-semibold mt-4">Guest Booking</h3>
      </div>

      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-xl font-semibold">Guest Information</h3>
            <table className="w-full mt-2">
              <tbody>
                <tr>
                  <td className="py-1 text-gray-600">Guest Name:</td>
                  <td className="py-1 font-medium">{bookingData.guestName ?? 'N/A'}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Contact:</td>
                  <td className="py-1">{bookingData.contact ?? 'N/A'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="text-xl font-semibold">Stay Details</h3>
            <table className="w-full mt-2">
              <tbody>
                <tr>
                  <td className="py-1 text-gray-600">Check-In:</td>
                  <td className="py-1">{formatDate(bookingData.checkIn)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Check-Out:</td>
                  <td className="py-1">{formatDate(bookingData.checkOut)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Number of Days:</td>
                  <td className="py-1">{bookingData.day ?? 'N/A'}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">PAX:</td>
                  <td className="py-1">{bookingData.pax ?? 'N/A'}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Booking Date:</td>
                  <td className="py-1">{formatDate(bookingDate)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold border-b border-gray-200 pb-2 mb-3">Room Details & Charges</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-blue-50">
                <th className="py-2 px-3 text-left">Room Type</th>
                <th className="py-2 px-3 text-left">Quantity</th>
                <th className="py-2 px-3 text-left">Rate per Day</th>
                <th className="py-2 px-3 text-left">Days</th>
                <th className="py-2 px-3 text-left">Amount</th>
              </tr>
            </thead>
            <tbody>
              {parseNumber(roomName.doubleBed) > 0 && (
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-3">Double Bed Room</td>
                  <td className="py-2 px-3">{roomName.doubleBed}</td>
                  <td className="py-2 px-3">{formatCurrency(roomRent.doubleBed)}</td>
                  <td className="py-2 px-3">{bookingData.day ?? '0'}</td>
                  <td className="py-2 px-3">
                    {formatCurrency(
                      parseNumber(roomName.doubleBed) *
                        (roomRent.doubleBed ?? 0) *
                        parseNumber(bookingData.day)
                    )}
                  </td>
                </tr>
              )}
              {parseNumber(roomName.tripleBed) > 0 && (
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-3">Triple Bed Room</td>
                  <td className="py-2 px-3">{roomName.tripleBed}</td>
                  <td className="py-2 px-3">{formatCurrency(roomRent.tripleBed)}</td>
                  <td className="py-2 px-3">{bookingData.day ?? '0'}</td>
                  <td className="py-2 px-3">
                    {formatCurrency(
                      parseNumber(roomName.tripleBed) *
                        (roomRent.tripleBed ?? 0) *
                        parseNumber(bookingData.day)
                    )}
                  </td>
                </tr>
              )}
              {parseNumber(roomName.fourBed) > 0 && (
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-3">Four Bed Room</td>
                  <td className="py-2 px-3">{roomName.fourBed}</td>
                  <td className="py-2 px-3">{formatCurrency(roomRent.fourBed)}</td>
                  <td className="py-2 px-3">{bookingData.day ?? '0'}</td>
                  <td className="py-2 px-3">
                    {formatCurrency(
                      parseNumber(roomName.fourBed) *
                        (roomRent.fourBed ?? 0) *
                        parseNumber(bookingData.day)
                    )}
                  </td>
                </tr>
              )}
              {parseNumber(roomName.extraBed) > 0 && (
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-3">Extra Bed</td>
                  <td className="py-2 px-3">{roomName.extraBed}</td>
                  <td className="py-2 px-3">{formatCurrency(roomRent.extraBed)}</td>
                  <td className="py-2 px-3">{bookingData.day ?? '0'}</td>
                  <td className="py-2 px-3">
                    {formatCurrency(
                      parseNumber(roomName.extraBed) *
                        (roomRent.extraBed ?? 0) *
                        parseNumber(bookingData.day)
                    )}
                  </td>
                </tr>
              )}
              {parseNumber(roomName.kitchen) > 0 && (
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-3">Kitchen</td>
                  <td className="py-2 px-3">{roomName.kitchen}</td>
                  <td className="py-2 px-3">{formatCurrency(roomRent.kitchen)}</td>
                  <td className="py-2 px-3">{bookingData.day ?? '0'}</td>
                  <td className="py-2 px-3">
                    {formatCurrency(
                      parseNumber(roomName.kitchen) *
                        (roomRent.kitchen ?? 0) *
                        parseNumber(bookingData.day)
                    )}
                  </td>
                </tr>
              )}
              <tr className="bg-blue-50 font-medium">
                <td className="py-2 px-3" colSpan={4}>Total Amount</td>
                <td className="py-2 px-3">{formatCurrency(bookingData.billAmount)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-xl font-semibold border-b border-gray-200 pb-2 mb-3">Payment Details</h3>
          <table className="w-full">
            <tbody>
              <tr>
                <td className="py-1 text-gray-600">Total Amount:</td>
                <td className="py-1 font-medium">{formatCurrency(bookingData.billAmount)}</td>
              </tr>
              <tr>
                <td className="py-1 text-gray-600">Advance Paid:</td>
                <td className="py-1">{formatCurrency(parseNumber(bookingData.advance))}</td>
              </tr>
              <tr className="font-medium">
                <td className="py-1 text-gray-600">Balance Due:</td>
                <td className="py-1">{formatCurrency(bookingData.due ?? 0)}</td>
              </tr>
              <tr>
                <td className="py-1 text-gray-600">Status:</td>
                <td className="py-1">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      bookingData.status === 'Confirmed'
                        ? 'bg-green-100 text-green-800'
                        : bookingData.status === 'Pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : bookingData.status === 'Hold'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {bookingData.status ?? 'N/A'}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-1 text-gray-600">Mode of Payment:</td>
                <td className="py-1">{bookingData.modeOfPayment ?? 'N/A'}</td>
              </tr>
              {(bookingData.cashIn ?? 0) > 0 && (
                <tr>
                  <td className="py-1 text-gray-600">Cash-In:</td>
                  <td className="py-1">{formatCurrency(bookingData.cashIn)}</td>
                </tr>
              )}
              {(bookingData.cashOut ?? 0) > 0 && (
                <tr>
                  <td className="py-1 text-gray-600">Cash-Out:</td>
                  <td className="py-1">{formatCurrency(bookingData.cashOut)}</td>
                </tr>
              )}
              <tr>
                <td className="py-1 text-gray-600">To Account:</td>
                <td className="py-1">{bookingData.toAccount ?? 'N/A'}</td>
              </tr>
              <tr>
                <td className="py-1 text-gray-600">Scheme:</td>
                <td className="py-1">{bookingData.scheme ?? 'N/A'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h3 className="text-xl font-semibold border-b border-gray-200 pb-2 mb-3">Hotel Policies</h3>
          <ol className="list-decimal pl-5 text-sm space-y-2">
            <li>Check out time 10:00AM</li>
            <li>Cheques are not accepted.</li>
            <li>Bill must be paid on presentation</li>
            <li>Disputes are subject to Uttarkashi jurisdiction only.</li>
            <li>Tourists are requested to ensure safety of their belongings</li>
          </ol>
        </div>
      </div>

      <div className="mt-8 border-t border-gray-200 pt-4 text-center text-sm text-gray-500">
        <p>Thank you for choosing {bookingData.hotel ?? 'our hotel'}. We hope to see you again!</p>
      </div>
    </div>
  );
};

export default HOSSPreview;