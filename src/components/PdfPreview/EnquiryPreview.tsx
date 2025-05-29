import React from 'react';
import { Enquiry } from 'src/types';
import '../BillingSystem/Billing.css'; // Reuse Billing.css for consistent styling

interface EnquiryPreviewProps {
  enquiryData: Enquiry;
  index?: number;
}

const EnquiryPreview: React.FC<EnquiryPreviewProps> = ({ enquiryData, index }) => {
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

  return (
    <div className="card print:shadow-none" id={`enquiry-preview${index !== undefined ? `-${index}` : ''}`}>
      <div className="text-center mb-6 border-b border-gray-200 pb-4">
        <h2 className="text-3xl font-bold text-blue-900">{enquiryData.hotel}</h2>
        <p className="text-gray-600">Gangotri Rishikesh Road Nh 34 Matli (Uttarkashi) -249193 Uttarakhand</p>
        <h3 className="text-xl font-semibold mt-4">Guest Enquiry</h3>
      </div>

      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-xl font-semibold">Guest Information</h3>
            <table className="w-full mt-2">
              <tbody>
                <tr>
                  <td className="py-1 text-gray-600">Guest Name:</td>
                  <td className="py-1 font-medium">{enquiryData.guestName}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Contact:</td>
                  <td className="py-1">{enquiryData.contact}</td>
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
                  <td className="py-1">{formatDate(enquiryData.checkIn)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Check-Out:</td>
                  <td className="py-1">{formatDate(enquiryData.checkOut)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Number of Days:</td>
                  <td className="py-1">{enquiryData.day}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">PAX:</td>
                  <td className="py-1">{enquiryData.pax}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Enquiry Date:</td>
                  <td className="py-1">{formatDate(enquiryData.date)}</td>
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
              {parseNumber(enquiryData.roomName.doubleBed) > 0 && (
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-3">Double Bed Room</td>
                  <td className="py-2 px-3">{enquiryData.roomName.doubleBed}</td>
                  <td className="py-2 px-3">{formatCurrency(enquiryData.roomRent.doubleBed)}</td>
                  <td className="py-2 px-3">{enquiryData.day}</td>
                  <td className="py-2 px-3">
                    {formatCurrency(
                      parseNumber(enquiryData.roomName.doubleBed) *
                        enquiryData.roomRent.doubleBed *
                        parseNumber(enquiryData.day)
                    )}
                  </td>
                </tr>
              )}
              {parseNumber(enquiryData.roomName.tripleBed) > 0 && (
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-3">Triple Bed Room</td>
                  <td className="py-2 px-3">{enquiryData.roomName.tripleBed}</td>
                  <td className="py-2 px-3">{formatCurrency(enquiryData.roomRent.tripleBed)}</td>
                  <td className="py-2 px-3">{enquiryData.day}</td>
                  <td className="py-2 px-3">
                    {formatCurrency(
                      parseNumber(enquiryData.roomName.tripleBed) *
                        enquiryData.roomRent.tripleBed *
                        parseNumber(enquiryData.day)
                    )}
                  </td>
                </tr>
              )}
              {parseNumber(enquiryData.roomName.fourBed) > 0 && (
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-3">Four Bed Room</td>
                  <td className="py-2 px-3">{enquiryData.roomName.fourBed}</td>
                  <td className="py-2 px-3">{formatCurrency(enquiryData.roomRent.fourBed)}</td>
                  <td className="py-2 px-3">{enquiryData.day}</td>
                  <td className="py-2 px-3">
                    {formatCurrency(
                      parseNumber(enquiryData.roomName.fourBed) *
                        enquiryData.roomRent.fourBed *
                        parseNumber(enquiryData.day)
                    )}
                  </td>
                </tr>
              )}
              {parseNumber(enquiryData.roomName.extraBed) > 0 && (
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-3">Extra Bed</td>
                  <td className="py-2 px-3">{enquiryData.roomName.extraBed}</td>
                  <td className="py-2 px-3">{formatCurrency(enquiryData.roomRent.extraBed)}</td>
                  <td className="py-2 px-3">{enquiryData.day}</td>
                  <td className="py-2 px-3">
                    {formatCurrency(
                      parseNumber(enquiryData.roomName.extraBed) *
                        enquiryData.roomRent.extraBed *
                        parseNumber(enquiryData.day)
                    )}
                  </td>
                </tr>
              )}
              {parseNumber(enquiryData.roomName.kitchen) > 0 && (
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-3">Kitchen</td>
                  <td className="py-2 px-3">{enquiryData.roomName.kitchen}</td>
                  <td className="py-2 px-3">{formatCurrency(enquiryData.roomRent.kitchen)}</td>
                  <td className="py-2 px-3">{enquiryData.day}</td>
                  <td className="py-2 px-3">
                    {formatCurrency(
                      parseNumber(enquiryData.roomName.kitchen) *
                        enquiryData.roomRent.kitchen *
                        parseNumber(enquiryData.day)
                    )}
                  </td>
                </tr>
              )}
              <tr className="bg-blue-50 font-medium">
                <td className="py-2 px-3" colSpan={4}>Total Amount</td>
                <td className="py-2 px-3">{formatCurrency(enquiryData.billAmount)}</td>
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
                <td className="py-1 font-medium">{formatCurrency(enquiryData.billAmount)}</td>
              </tr>
              <tr>
                <td className="py-1 text-gray-600">Advance Paid:</td>
                <td className="py-1">{formatCurrency(enquiryData.advance)}</td>
              </tr>
              <tr className="font-medium">
                <td className="py-1 text-gray-600">Balance Due:</td>
                <td className="py-1">{formatCurrency(enquiryData.due)}</td>
              </tr>
              <tr>
                <td className="py-1 text-gray-600">Status:</td>
                <td className="py-1">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      enquiryData.status === 'Confirmed'
                        ? 'bg-green-100 text-green-800'
                        : enquiryData.status === 'Pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : enquiryData.status === 'Hold'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {enquiryData.status}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-1 text-gray-600">Mode of Payment:</td>
                <td className="py-1">{enquiryData.modeOfPayment}</td>
              </tr>
              {enquiryData.cashIn > 0 && (
                <tr>
                  <td className="py-1 text-gray-600">Cash-In:</td>
                  <td className="py-1">{formatCurrency(enquiryData.cashIn)}</td>
                </tr>
              )}
              {enquiryData.cashOut > 0 && (
                <tr>
                  <td className="py-1 text-gray-600">Cash-Out:</td>
                  <td className="py-1">{formatCurrency(enquiryData.cashOut)}</td>
                </tr>
              )}
              <tr>
                <td className="py-1 text-gray-600">To Account:</td>
                <td className="py-1">{enquiryData.toAccount}</td>
              </tr>
              <tr>
                <td className="py-1 text-gray-600">Scheme:</td>
                <td className="py-1">{enquiryData.scheme}</td>
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
            <li>Disputes are subject to uttarkashi jurisdiction only.</li>
            <li>Tourists are requested to ensure safety of their belongings</li>
          </ol>
        </div>
      </div>

      <div className="mt-8 border-t border-gray-200 pt-4 text-center text-sm text-gray-500">
        <p>Thank you for choosing {enquiryData.hotel}. We hope to see you again!</p>
      </div>
    </div>
  );
};

export default EnquiryPreview;