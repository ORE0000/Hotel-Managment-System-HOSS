import { jsPDF } from 'jspdf';
import { utils, writeFile } from 'xlsx';
import html2canvas from 'html2canvas';
import { BillData } from '../types';

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const exportToPdf = async (billData: BillData): Promise<void> => {
  const element = document.getElementById('bill-preview');
  if (!element) {
    throw new Error('Bill preview element not found');
  }

  try {
    // Force a repaint to ensure content is rendered
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get natural dimensions of BillPreview
    element.style.width = '200mm';
    element.style.height = 'auto';
    const { width: naturalWidth, height: naturalHeight } = element.getBoundingClientRect();

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: naturalWidth,
      height: naturalHeight
    });

    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const margin = 5;
    const contentWidth = imgWidth - 2 * margin;
    const contentHeight = pageHeight - 2 * margin;

    // Scale image to fit A4 content area
    const scale = Math.min(contentWidth / canvas.width, contentHeight / canvas.height);
    const scaledWidth = canvas.width * scale;
    const scaledHeight = canvas.height * scale;

    // Center the image
    const xOffset = (imgWidth - scaledWidth) / 2;
    const yOffset = (pageHeight - scaledHeight) / 2;

    pdf.addImage(imgData, 'JPEG', xOffset, yOffset, scaledWidth, scaledHeight);

    // Add page border
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(150, 150, 150);
    pdf.rect(margin, margin, contentWidth, contentHeight);

    pdf.save(`${billData.hotel}_Bill_${billData.guestName}.pdf`);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('Failed to generate PDF');
  } finally {
    element.style.width = '';
    element.style.height = '';
  }
};

export const exportMultipleBillsToPdf = async (bills: BillData[]): Promise<void> => {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const renderBill = async (index: number): Promise<void> => {
      const element = document.getElementById(`bill-preview-${index}`);
      if (!element) {
        console.warn(`Element bill-preview-${index} not found`);
        return;
      }

      // Temporarily move element to viewport
      element.style.visibility = 'visible';
      element.style.position = 'fixed';
      element.style.top = '0';
      element.style.left = '0';
      element.style.width = '200mm';
      element.style.height = 'auto';
      element.style.zIndex = '9999';

      // Force a repaint
      await new Promise(resolve => setTimeout(resolve, 2000));

      const { width: naturalWidth, height: naturalHeight } = element.getBoundingClientRect();
      console.log(`Bill ${index}: width=${naturalWidth}, height=${naturalHeight}`);

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: naturalWidth,
        height: naturalHeight
      });

      if (canvas.width === 0 || canvas.height === 0) {
        console.warn(`Canvas for bill ${index} is empty`);
        return;
      }

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const imgWidth = 210;
      const pageHeight = 297;
      const margin = 5;
      const contentWidth = imgWidth - 2 * margin;
      const contentHeight = pageHeight - 2 * margin;

      // Scale image to fit A4 content area
      const scale = Math.min(contentWidth / canvas.width, contentHeight / canvas.height);
      const scaledWidth = canvas.width * scale;
      const scaledHeight = canvas.height * scale;

      // Center the image
      const xOffset = (imgWidth - scaledWidth) / 2;
      const yOffset = (pageHeight - scaledHeight) / 2;

      if (index > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, 'JPEG', xOffset, yOffset, scaledWidth, scaledHeight);

      // Add page border
      pdf.setLineWidth(0.5);
      pdf.setDrawColor(150, 150, 150);
      pdf.rect(margin, margin, contentWidth, contentHeight);

      // Reset styles
      element.style.visibility = '';
      element.style.position = '';
      element.style.top = '';
      element.style.left = '';
      element.style.width = '';
      element.style.height = '';
      element.style.zIndex = '';
    };

    // Render bills sequentially
    for (let i = 0; i < bills.length; i++) {
      await renderBill(i);
    }

    pdf.save('Hotel_Om_Shiv_Shankar_All_Bills.pdf');
  } catch (error) {
    console.error('Multiple bills PDF generation error:', error);
    throw new Error('Failed to generate multiple bills PDF');
  }
};

export const exportToExcel = (billData: BillData): void => {
  try {
    const ws = utils.json_to_sheet([
      {
        'Guest Name': billData.guestName,
        'ADDRESS': billData.address,
        'VOTER ID/ID NUMBER': billData.idNumber,
        'Contact': billData.contact,
        'Hotel': billData.hotel,
        'Check-In': formatDate(billData.checkIn),
        'Check-Out': formatDate(billData.checkOut),
        'Days': billData.days,
        'PAX': billData.pax,
        'Double Bed Count': billData.doubleBedRoom,
        'Triple Bed Count': billData.tripleBedRoom,
        'Four Bed Count': billData.fourBedRoom,
        'Extra Bed Count': billData.extraBedRoom,
        'Kitchen Count': billData.kitchenRoom,
        'Room Number': billData.roomNumber,
        'Double Bed Rate': billData.doubleBedRate,
        'Triple Bed Rate': billData.tripleBedRate,
        'Four Bed Rate': billData.fourBedRate,
        'Extra Bed Rate': billData.extraBedRate,
        'Kitchen Rate': billData.kitchenRate,
        'Bill Amount': billData.billAmount,
        'Advance': billData.advance,
        'Due': billData.due,
        'Status': billData.status,
        'Cash-In': billData.cashIn,
        'Mode of Payment': billData.modeOfPayment,
        'Cash-Out': billData.cashOut,
        'Date': formatDate(billData.date),
        'To Account': billData.toAccount,
        'Scheme': billData.scheme
      }
    ]);

    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Bill Details');
    writeFile(wb, `Hotel_Om_Shiv_Shankar_Bill_${billData.guestName}.xlsx`);
  } catch (error) {
    console.error('Excel generation error:', error);
    throw new Error('Failed to generate Excel file');
  }
};

export const exportToJson = (billData: BillData): void => {
  try {
    const jsonData = JSON.stringify(billData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `Hotel_Om_Shiv_Shankar_Bill_${billData.guestName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('JSON generation error:', error);
    throw new Error('Failed to generate JSON file');
  }
};

export const copyToClipboard = (billData: BillData): void => {
  try {
    const text = `
HOTEL OM SHIV SHANKAR
Gangotri Rishikesh Road Nh 34 Matli (Uttarkashi) -249193 Uttarakhand

BILL DETAILS

Guest Information:
Guest Name: ${billData.guestName}
Address: ${billData.address}
ID Number: ${billData.idNumber}
Contact: ${billData.contact}
Room Number: ${billData.roomNumber}

Stay Details:
Check-In: ${formatDate(billData.checkIn)}
Check-Out: ${formatDate(billData.checkOut)}
Number of Days: ${billData.days}
PAX: ${billData.pax}

Room Details & Charges:
${billData.doubleBedRoom > 0 ? `Double Bed Room: ${billData.doubleBedRoom} x ${formatCurrency(billData.doubleBedRate)} x ${billData.days} days = ${formatCurrency(billData.doubleBedRoom * billData.doubleBedRate * billData.days)}\n` : ''}${billData.tripleBedRoom > 0 ? `Triple Bed Room: ${billData.tripleBedRoom} x ${formatCurrency(billData.tripleBedRate)} x ${billData.days} days = ${formatCurrency(billData.tripleBedRoom * billData.tripleBedRate * billData.days)}\n` : ''}${billData.fourBedRoom > 0 ? `Four Bed Room: ${billData.fourBedRoom} x ${formatCurrency(billData.fourBedRate)} x ${billData.days} days = ${formatCurrency(billData.fourBedRoom * billData.fourBedRate * billData.days)}\n` : ''}${billData.extraBedRoom > 0 ? `Extra Bed: ${billData.extraBedRoom} x ${formatCurrency(billData.extraBedRate)} x ${billData.days} days = ${formatCurrency(billData.extraBedRoom * billData.extraBedRate * billData.days)}\n` : ''}${billData.kitchenRoom > 0 ? `Kitchen: ${billData.kitchenRoom} x ${formatCurrency(billData.kitchenRate)} x ${billData.days} days = ${formatCurrency(billData.kitchenRoom * billData.kitchenRate * billData.days)}\n` : ''}

Payment Details:
Total Amount: ${formatCurrency(billData.billAmount)}
Advance Paid: ${formatCurrency(billData.advance)}
Balance Due: ${formatCurrency(billData.due)}
Payment Status: ${billData.status}
Mode of Payment: ${billData.modeOfPayment}
${billData.cashIn > 0 ? `Cash-In: ${formatCurrency(billData.cashIn)}\n` : ''}${billData.cashOut > 0 ? `Cash-Out: ${formatCurrency(billData.cashOut)}\n` : ''}

Hotel Policies:
1. Check out time 10:00AM
2. Cheques are not accepted.
3. Bill must be paid on presentation
4. Disputes are subject to uttarkashi jurisdiction only.
5. Tourists are requested to ensure safety of their belongings

Thank you for choosing Hotel Om Shiv Shankar. We hope to see you again!
    `;
    
    navigator.clipboard.writeText(text);
  } catch (error) {
    console.error('Copy to clipboard error:', error);
    throw new Error('Failed to copy to clipboard');
  }
};