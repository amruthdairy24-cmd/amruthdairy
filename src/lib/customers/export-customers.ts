import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportCustomer {
  id: string;
  full_name: string;
  phone: string;
  area: string;
  address: string | null;
  landmark: string | null;
  floor_notes: string | null;
  subscription_status: string;
  created_at: string;
  quantity_litres: number | null;
  start_date: string | null;
  monthly_amount: number | null;
  daily_rate: number | null;
  delivery_notes: string | null;
  is_paid?: boolean;
  pending_dues?: number;
  current_month_due?: number;
  joined_days_ago?: number;
  has_billing_record?: boolean;
}

export function getSubscriptionLabel(status: string): string {
  switch (status) {
    case 'SUBSCRIBED_ACTIVE':
    case 'ACTIVE_COVERED':
      return 'Subscribed (Active)';
    case 'TRIAL_ACTIVE':
      return 'Trial Active';
    case 'PAYMENT_PENDING':
    case 'PENDING_PAYMENT':
      return 'Payment Pending';
    case 'UNRENEWED_ELIGIBLE':
    case 'UNRENEWED_LAPSED':
    case 'PENDING_RENEWAL':
      return 'Renewal Due';
    case 'PAUSED':
      return 'Paused';
    case 'CANCELLED':
      return 'Cancelled';
    case 'NOT_SUBSCRIBED':
    default:
      return 'Not Subscribed';
  }
}

export function getPaymentLabel(customer: ExportCustomer): string {
  if (customer.is_paid) return 'Paid in Full';
  if ((customer.pending_dues ?? 0) > 0) return `Pending Dues (₹${customer.pending_dues})`;
  return 'No Dues';
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function getSafeFileSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

/**
 * Exports customers to a formatted Excel (.xlsx) spreadsheet
 */
export function exportCustomersToExcel(
  customers: ExportCustomer[],
  filterTitle: string = 'All Customers'
): void {
  const rows = customers.map((c, index) => {
    return {
      'S.No': index + 1,
      'Customer ID': `#${c.id.slice(-6).toUpperCase()}`,
      'Customer Name': c.full_name || 'N/A',
      'Phone': c.phone || 'N/A',
      'Area / Route': c.area || 'N/A',
      'Full Address': c.address || 'N/A',
      'Landmark': c.landmark || '',
      'Floor / Notes': c.floor_notes || c.delivery_notes || '',
      'Daily Qty (Litres)': c.quantity_litres ? `${c.quantity_litres} L` : 'N/A',
      'Subscription Status': getSubscriptionLabel(c.subscription_status),
      'Payment Status': getPaymentLabel(c),
      'Pending Due (₹)': c.pending_dues ?? 0,
      'Monthly Plan (₹)': c.monthly_amount ?? 0,
      'Daily Rate (₹)': c.daily_rate ?? 0,
      'Start Date': formatDate(c.start_date),
      'Joined Date': formatDate(c.created_at),
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set nice column widths for Excel
  worksheet['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 14 }, // Customer ID
    { wch: 24 }, // Customer Name
    { wch: 16 }, // Phone
    { wch: 20 }, // Area
    { wch: 32 }, // Full Address
    { wch: 20 }, // Landmark
    { wch: 24 }, // Floor / Notes
    { wch: 18 }, // Daily Qty
    { wch: 22 }, // Subscription Status
    { wch: 22 }, // Payment Status
    { wch: 16 }, // Pending Due
    { wch: 16 }, // Monthly Plan
    { wch: 14 }, // Daily Rate
    { wch: 15 }, // Start Date
    { wch: 15 }, // Joined Date
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');

  const nowStr = new Date().toISOString().split('T')[0];
  const filename = `amruth_dairy_customers_${getSafeFileSlug(filterTitle)}_${nowStr}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

/**
 * Exports customers to a clean, professionally formatted PDF document
 */
export function exportCustomersToPdf(
  customers: ExportCustomer[],
  filterTitle: string = 'All Customers'
): void {
  // Use A4 landscape orientation for tables
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const now = new Date();
  const formattedDate = `${now.getDate()} ${
    ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][now.getMonth()]
  } ${now.getFullYear()}, ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;

  // Summary Metrics
  const totalCount = customers.length;
  const subscribedCount = customers.filter((c) =>
    ['SUBSCRIBED_ACTIVE', 'ACTIVE_COVERED', 'TRIAL_ACTIVE'].includes(c.subscription_status)
  ).length;
  const notSubscribedCount = customers.filter((c) =>
    ['NOT_SUBSCRIBED', 'CANCELLED', 'PAUSED'].includes(c.subscription_status)
  ).length;
  const totalPendingDues = customers.reduce((sum, c) => sum + (c.pending_dues ?? 0), 0);

  // Top Header Banner
  doc.setFillColor(15, 46, 92); // Amruth Deep Navy #0F2E5C
  doc.rect(0, 0, pageWidth, 24, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('AMRUTH DAIRY FARMS', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 220, 255);
  doc.text(`Customer Directory & Subscription Report  |  Filter: ${filterTitle}`, 14, 18);

  // Report Date (Right aligned)
  doc.setFontSize(8.5);
  doc.text(`Generated: ${formattedDate}`, pageWidth - 14, 14, { align: 'right' });

  // Summary KPI Cards Box
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.roundedRect(14, 28, pageWidth - 28, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);

  const kpiY = 37;
  const colWidth = (pageWidth - 28) / 4;

  doc.text(`Total Records: ${totalCount}`, 20, kpiY);
  doc.setTextColor(22, 101, 52); // Green
  doc.text(`Subscribed (Active): ${subscribedCount}`, 20 + colWidth, kpiY);
  doc.setTextColor(185, 28, 28); // Red
  doc.text(`Not Subscribed: ${notSubscribedCount}`, 20 + colWidth * 2, kpiY);
  doc.setTextColor(194, 65, 12); // Amber/Orange
  doc.text(`Outstanding Dues: ₹${totalPendingDues.toLocaleString('en-IN')}`, 20 + colWidth * 3, kpiY);

  // AutoTable
  const headers = [
    '#',
    'Customer Name',
    'Phone',
    'Area / Route',
    'Daily Qty',
    'Subscription Status',
    'Payment Status',
    'Pending Due (₹)',
  ];

  const body = customers.map((c, i) => [
    (i + 1).toString(),
    c.full_name || 'N/A',
    c.phone || 'N/A',
    c.area || 'N/A',
    c.quantity_litres ? `${c.quantity_litres} L` : '-',
    getSubscriptionLabel(c.subscription_status),
    getPaymentLabel(c),
    c.pending_dues ? `₹${c.pending_dues.toLocaleString('en-IN')}` : '₹0',
  ]);

  autoTable(doc, {
    startY: 46,
    head: [headers],
    body: body,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 46, 92],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 48, fontStyle: 'bold' },
      2: { cellWidth: 32 },
      3: { cellWidth: 38 },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 42 },
      6: { cellWidth: 45 },
      7: { cellWidth: 32, halign: 'right' },
    },
    didDrawCell: (data) => {
      // Color-code subscription status text
      if (data.section === 'body' && data.column.index === 5) {
        const text = String(data.cell.raw);
        if (text.includes('Subscribed') || text.includes('Active')) {
          doc.setTextColor(22, 101, 52); // green
        } else if (text.includes('Not Subscribed') || text.includes('Cancelled')) {
          doc.setTextColor(185, 28, 28); // red
        } else if (text.includes('Renewal') || text.includes('Pending')) {
          doc.setTextColor(194, 65, 12); // amber
        }
      }
    },
    didDrawPage: (data) => {
      // Footer page numbers
      const str = `Page ${data.pageNumber} of ${doc.getNumberOfPages()}  |  Amruth Dairy Farm Mangalore  |  Confidential`;
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(str, pageWidth / 2, pageHeight - 6, { align: 'center' });
    },
    margin: { left: 14, right: 14, bottom: 12 },
  });

  const nowStr = new Date().toISOString().split('T')[0];
  const filename = `amruth_dairy_customers_${getSafeFileSlug(filterTitle)}_${nowStr}.pdf`;
  doc.save(filename);
}
