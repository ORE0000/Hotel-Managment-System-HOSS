import React from 'react';
import { BillData } from 'src/types';
import './Billing.css';

interface BillPreviewProps {
  billData: BillData;
  index?: number;
}

const BillPreview: React.FC<BillPreviewProps> = ({ billData, index }) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getBillTitle = () => {
    switch (billData.formType) {
      case 'restaurant':
        return 'Restaurant Billing';
      case 'hotel':
        return 'Hotel Payment';
      case 'travel':
        return 'Travel Agent Billing';
      default:
        return 'Customer Billing';
    }
  };

  const getNameLabel = () => {
    switch (billData.formType) {
      case 'restaurant':
        return 'Restaurant Name';
      case 'hotel':
        return 'Guest Name';
      case 'travel':
        return 'Agent/Agency Name';
      default:
        return 'Guest Name';
    }
  };

  return (
    <div className="card print:shadow-none" id={`bill-preview${index !== undefined ? `-${index}` : ''}`}>
      <div className="text-center mb-6 border-b border-gray-200 pb-4">
        <h2 className="text-3xl font-bold text-blue-900">{billData.hotel}</h2>
        <p className="text-gray-600">Gangotri Rishikesh Road Nh 34 Matli (Uttarkashi) -249193 Uttarakhand</p>
        <h3 className="text-xl font-semibold mt-4">{getBillTitle()}</h3>
      </div>

      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-xl font-semibold">
              {billData.formType === 'restaurant' ? 'Restaurant Information' :
              billData.formType === 'hotel' ? 'Guest Information' :
              billData.formType === 'travel' ? 'Agent Information' :
              'Guest Information'}
            </h3>
            <table className="w-full mt-2">
              <tbody>
                <tr>
                  <td className="py-1 text-gray-600">{getNameLabel()}:</td>
                  <td className="py-1 font-medium">{billData.guestName}</td>
                </tr>
                {billData.address && (
                  <tr>
                    <td className="py-1 text-gray-600">Address:</td>
                    <td className="py-1">{billData.address}</td>
                  </tr>
                )}
                {billData.idNumber && billData.formType !== 'restaurant' && (
                  <tr>
                    <td className="py-1 text-gray-600">
                      {billData.formType === 'travel' ? 'Agent ID/License:' : 'ID Number:'}
                    </td>
                    <td className="py-1">{billData.idNumber}</td>
                  </tr>
                )}
                {billData.contact && (
                  <tr>
                    <td className="py-1 text-gray-600">Contact:</td>
                    <td className="py-1">{billData.contact}</td>
                  </tr>
                )}
                {billData.roomNumber && (
                  <tr>
                    <td className="py-1 text-gray-600">
                      {billData.formType === 'restaurant' ? 'Table Number:' : 'Room Number:'}
                    </td>
                    <td className="py-1">{billData.roomNumber}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="text-xl font-semibold">Stay Details</h3>
            <table className="w-full mt-2">
              <tbody>
                <tr>
                  <td className="py-1 text-gray-600">Check-In:</td>
                  <td className="py-1">{formatDate(billData.checkIn)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Check-Out:</td>
                  <td className="py-1">{formatDate(billData.checkOut)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Number of Days:</td>
                  <td className="py-1">{billData.days}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">
                    {billData.formType === 'restaurant' ? 'Number of Guests:' : 'PAX:'}
                  </td>
                  <td className="py-1">{billData.pax}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">Bill Date:</td>
                  <td className="py-1">{formatDate(billData.date)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {billData.formType !== 'restaurant' && (
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
                {billData.doubleBedRoom > 0 && (
                  <tr className="border-b border-gray-100">
                    <td className="py-2 px-3">Double Bed Room</td>
                    <td className="py-2 px-3">{billData.doubleBedRoom}</td>
                    <td className="py-2 px-3">{formatCurrency(billData.doubleBedRate)}</td>
                    <td className="py-2 px-3">{billData.days}</td>
                    <td className="py-2 px-3">{formatCurrency(billData.doubleBedRoom * billData.doubleBedRate * billData.days)}</td>
                  </tr>
                )}
                {billData.tripleBedRoom > 0 && (
                  <tr className="border-b border-gray-100">
                    <td className="py-2 px-3">Triple Bed Room</td>
                    <td className="py-2 px-3">{billData.tripleBedRoom}</td>
                    <td className="py-2 px-3">{formatCurrency(billData.tripleBedRate)}</td>
                    <td className="py-2 px-3">{billData.days}</td>
                    <td className="py-2 px-3">{formatCurrency(billData.tripleBedRoom * billData.tripleBedRate * billData.days)}</td>
                  </tr>
                )}
                {billData.fourBedRoom > 0 && (
                  <tr className="border-b border-gray-100">
                    <td className="py-2 px-3">Four Bed Room</td>
                    <td className="py-2 px-3">{billData.fourBedRoom}</td>
                    <td className="py-2 px-3">{formatCurrency(billData.fourBedRate)}</td>
                    <td className="py-2 px-3">{billData.days}</td>
                    <td className="py-2 px-3">{formatCurrency(billData.fourBedRoom * billData.fourBedRate * billData.days)}</td>
                  </tr>
                )}
                {billData.extraBedRoom > 0 && (
                  <tr className="border-b border-gray-100">
                    <td className="py-2 px-3">Extra Bed</td>
                    <td className="py-2 px-3">{billData.extraBedRoom}</td>
                    <td className="py-2 px-3">{formatCurrency(billData.extraBedRate)}</td>
                    <td className="py-2 px-3">{billData.days}</td>
                    <td className="py-2 px-3">{formatCurrency(billData.extraBedRoom * billData.extraBedRate * billData.days)}</td>
                  </tr>
                )}
                {billData.kitchenRoom > 0 && (
                  <tr className="border-b border-gray-100">
                    <td className="py-2 px-3">Kitchen</td>
                    <td className="py-2 px-3">{billData.kitchenRoom}</td>
                    <td className="py-2 px-3">{formatCurrency(billData.kitchenRate)}</td>
                    <td className="py-2 px-3">{billData.days}</td>
                    <td className="py-2 px-3">{formatCurrency(billData.kitchenRoom * billData.kitchenRate * billData.days)}</td>
                  </tr>
                )}
                <tr className="bg-blue-50 font-medium">
                  <td className="py-2 px-3" colSpan={4}>Total Amount</td>
                  <td className="py-2 px-3">{formatCurrency(billData.billAmount)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-xl font-semibold border-b border-gray-200 pb-2 mb-3">Payment Details</h3>
          <table className="w-full">
            <tbody>
              <tr>
                <td className="py-1 text-gray-600">Total Amount:</td>
                <td className="py-1 font-medium">{formatCurrency(billData.billAmount)}</td>
              </tr>
              <tr>
                <td className="py-1 text-gray-600">
                  {billData.formType === 'travel' ? 'Advance:' : 'Advance Paid:'}
                </td>
                <td className="py-1">{formatCurrency(billData.advance)}</td>
              </tr>
              <tr className="font-medium">
                <td className="py-1 text-gray-600">Balance Due:</td>
                <td className="py-1">{formatCurrency(billData.due)}</td>
              </tr>
              <tr>
                <td className="py-1 text-gray-600">Status:</td>
                <td className="py-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    billData.status === 'Paid' 
                      ? 'bg-green-100 text-green-800' 
                      : billData.status === 'Pending' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-red-100 text-red-800'
                  }`}>
                    {billData.status}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-1 text-gray-600">Mode of Payment:</td>
                <td className="py-1">{billData.modeOfPayment}</td>
              </tr>
              {billData.cashIn > 0 && (
                <tr>
                  <td className="py-1 text-gray-600">Cash-In:</td>
                  <td className="py-1">{formatCurrency(billData.cashIn)}</td>
                </tr>
              )}
              {billData.cashOut > 0 && (
                <tr>
                  <td className="py-1 text-gray-600">Cash-Out:</td>
                  <td className="py-1">{formatCurrency(billData.cashOut)}</td>
                </tr>
              )}
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
        <p>Thank you for choosing {billData.hotel}. We hope to see you again!</p>
      </div>
    </div>
  );
};

export default BillPreview;