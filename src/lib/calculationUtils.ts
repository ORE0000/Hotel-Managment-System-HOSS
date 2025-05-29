import { BillData } from '../types';

export const calculateBillAmount = (billData: BillData): number => {
  let totalAmount = 0;

  switch (billData.formType) {
    case 'customer':
    case 'hotel':
    case 'travel':
      const doubleBedTotal = billData.doubleBedRoom * billData.doubleBedRate * billData.days;
      const tripleBedTotal = billData.tripleBedRoom * billData.tripleBedRate * billData.days;
      const fourBedTotal = billData.fourBedRoom * billData.fourBedRate * billData.days;
      const extraBedTotal = billData.extraBedRoom * billData.extraBedRate * billData.days;
      const kitchenTotal = billData.kitchenRoom * billData.kitchenRate * billData.days;
      totalAmount = doubleBedTotal + tripleBedTotal + fourBedTotal + extraBedTotal + kitchenTotal;
      break;

    case 'restaurant':
      // Use ratePerGuest for restaurant bills
      const perGuestRate = billData.ratePerGuest || 500; // Fallback to 500 if unset
      totalAmount = billData.days * billData.pax * perGuestRate;
      break;

    default:
      totalAmount = 0;
  }

  return totalAmount;
};

export const calculateDue = (billData: BillData): number => {
  const totalAmount = calculateBillAmount(billData);
  return totalAmount - (billData.advance || 0);
};

export const updateBillStatus = (billData: BillData): string => {
  // Respect manually selected status
  return billData.status || 'Pending';
};