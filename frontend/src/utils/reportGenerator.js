import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// ✅ Helper to convert Address Object to String (Prevents the [object Object] error)
const renderAddress = (addr) => {
  if (typeof addr === 'string') return addr;
  if (typeof addr === 'object' && addr !== null) {
    const { street, city, state, pincode } = addr;
    return `${street || ""}, ${city || ""}, ${state || ""} - ${pincode || ""}`.replace(/^, |, $/, "");
  }
  return "N/A";
};

const monthNames = ["January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"];

const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', {
  day: '2-digit', month: 'short', year: 'numeric'
});

// ✅ Shared helper to generate period subtitle for all reports
const getPeriodSubtitle = (params) => {
  if (!params) return "";
  if (params.type === "monthly") {
    return `Monthly Report: ${monthNames[parseInt(params.month)]} ${params.year}`;
  } else if (params.type === "yearly") {
    return `Annual Report: ${params.year}`;
  } else if (params.type === "custom") {
    return `Period: ${params.startDate} to ${params.endDate}`;
  } else if (params.type === "daily") {
    return `Daily Report: ${formatDate(new Date())}`;
  }
  return "";
};

// 1. PROACTIVE DONATION PDF
export const generateProactivePDF = (data, params) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(220, 38, 38);
  doc.text("PROACTIVE DONATION REPORT", 105, 20, { align: "center" });

  // Period Subtitle
  doc.setFontSize(12);
  doc.setTextColor(80);
  doc.text(getPeriodSubtitle(params), 105, 28, { align: "center" });

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated On: ${formatDate(new Date())}`, 14, 40);
  
  const tableRows = data.map((item, i) => [
    i + 1,
    formatDate(item.updatedAt),
    item.donorId?.fullName || "N/A",
    item.bloodGroup,
    item.units || 1,
    item.donorId?.phone || "N/A"
  ]);

  autoTable(doc, {
    head: [['Sr.', 'Date', 'Donor Name', 'Group', 'Units', 'Phone']],
    body: tableRows,
    startY: 45,
    headStyles: { fillColor: [220, 38, 38], fontSize: 10 },
    theme: 'grid',
    styles: { fontSize: 9 }
  });

  const finalY = doc.lastAutoTable.finalY + 30;
  doc.text("__________________________", 14, finalY);
  doc.text("Blood Bank Authority", 14, finalY + 5);
  doc.text("__________________________", 140, finalY);
  doc.text("Official Stamp", 140, finalY + 5);

  doc.save(`Donor_Report_${params.type}.pdf`);
};

// 2. DETAILED SINGLE CAMP AUDIT PDF (Fixed Address Object)
export const generateDetailedCampPDF = (camp, stats) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(18);
  doc.setTextColor(180, 0, 0);
  doc.text("OFFICIAL CAMP COLLECTION AUDIT", 105, 20, { align: "center" });
  
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(`Camp Name: ${camp.name}`, 14, 35);
  doc.text(`Location: ${renderAddress(camp.address)}`, 14, 40);
  doc.text(`Date: ${formatDate(camp.campDate)}`, 14, 45);

  // ─────────────────────────────────────────────────────────
  // ✅ FIXED SUMMARY GRID SECTION
  // ─────────────────────────────────────────────────────────
  doc.setDrawColor(200);
  doc.rect(14, 50, 182, 35); // Increased height to 35 to fit two rows
  doc.setFont(undefined, 'bold');
  doc.text("COLLECTION SUMMARY", 16, 56);
  
  doc.setFont(undefined, 'normal');
  doc.text(`Total Registered: ${stats.totalRegistered}`, 16, 65);
  doc.text(`Total Units Collected: ${stats.actualDonations}`, 16, 75);

  // Manual Grid Logic for Blood Groups (4 groups per row)
  const bloodGroups = Object.entries(stats.inventorySummary);
  let startX = 75;
  let startY = 65;
  let spacingX = 30;

  bloodGroups.forEach(([group, count], index) => {
    // If we've printed 4 items, move to the next row
    if (index === 4) {
      startX = 75;
      startY = 75;
    }
    doc.text(`${group}: ${count}`, startX, startY);
    startX += spacingX;
  });
  // ─────────────────────────────────────────────────────────

  const tableRows = (camp.registeredDonors || []).map((d, i) => [
    i + 1,
    d.donorId?.fullName || "Unknown",
    d.donorId?.bloodGroup || "N/A",
    d.donorId?.phone || "N/A",
    d.status === "donated" ? "YES" : "NO",
    "1 Unit"
  ]);

  autoTable(doc, {
    head: [['Sr.', 'Donor Name', 'Group', 'Phone', 'Donated', 'Volume']],
    body: tableRows,
    startY: 90, // Pushed down slightly to accommodate the taller summary box
    headStyles: { fillColor: [180, 0, 0] },
    theme: 'grid'
  });

  const finalY = doc.lastAutoTable.finalY + 30;
  doc.text("__________________________", 14, finalY);
  doc.text("Medical Officer Signature", 14, finalY + 5);
  doc.text("__________________________", 140, finalY);
  doc.text("Bank Authority Stamp", 140, finalY + 5);

  doc.save(`Audit_${camp.name.replace(/\s+/g, '_')}.pdf`);
};

// 3. CAMP HISTORY PDF (Fixed Address Object)
export const generateCampPDF = (data, params) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(249, 115, 22);
  doc.text("CAMP HISTORY AUDIT REPORT", 105, 20, { align: "center" });

  // Period Subtitle
  if (params) {
    doc.setFontSize(12);
    doc.setTextColor(80);
    doc.text(getPeriodSubtitle(params), 105, 28, { align: "center" });
  }

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated On: ${formatDate(new Date())}`, 14, 40);
  
  const tableRows = data.map((camp, i) => [
    i + 1,
    formatDate(camp.campDate), 
    camp.name, 
    renderAddress(camp.address),
    camp.registeredDonors?.length || 0, 
    camp.status
  ]);

  autoTable(doc, {
    head: [['Sr.', 'Date', 'Camp Name', 'Location', 'Donors', 'Status']],
    body: tableRows,
    startY: 45,
    headStyles: { fillColor: [249, 115, 22], fontSize: 10 },
    theme: 'grid',
    styles: { fontSize: 9 }
  });

  const finalY = doc.lastAutoTable.finalY + 30;
  doc.text("__________________________", 14, finalY);
  doc.text("Blood Bank Authority", 14, finalY + 5);
  doc.text("__________________________", 140, finalY);
  doc.text("Official Stamp", 140, finalY + 5);

  doc.save("Camp_History_Report.pdf");
};

// 4. INVENTORY PDF
export const generateInventoryPDF = (fulfillments, params) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(31, 41, 55);
  doc.text("INVENTORY FULFILLMENT REPORT", 105, 20, { align: "center" });

  // Period Subtitle
  doc.setFontSize(12);
  doc.setTextColor(80);
  doc.text(getPeriodSubtitle(params), 105, 28, { align: "center" });

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated On: ${formatDate(new Date())}`, 14, 40);
  
  const tableRows = fulfillments.map((req, i) => [
    i + 1,
    formatDate(req.updatedAt), 
    req.hospitalId?.name || "N/A", 
    req.bloodGroup, 
    req.units, 
    "Fulfillment"
  ]);

  autoTable(doc, {
    head: [['Sr.', 'Date', 'Hospital', 'Group', 'Units', 'Type']],
    body: tableRows,
    startY: 45,
    headStyles: { fillColor: [31, 41, 55], fontSize: 10 },
    theme: 'grid',
    styles: { fontSize: 9 }
  });

  const finalY = doc.lastAutoTable.finalY + 30;
  doc.text("__________________________", 14, finalY);
  doc.text("Blood Bank Authority", 14, finalY + 5);
  doc.text("__________________________", 140, finalY);
  doc.text("Official Stamp", 140, finalY + 5);

  doc.save(`Inventory_Report_${params.type}.pdf`);
};

 

// 6. HOSPITAL REQUEST AUDIT PDF

// ✅ HOSPITAL REQUEST AUDIT PDF (Real-World Version)
export const generateHospitalRequestPDF = (requests, params) => {
  const doc = new jsPDF();
  
  // 1. Dynamic Header Logic
  let reportSubtitle = "";
  if (params.type === "monthly") {
    reportSubtitle = `Monthly Report: ${monthNames[params.month]} ${params.year}`;
  } else if (params.type === "yearly") {
    reportSubtitle = `Annual Report: ${params.year}`;
  } else if (params.type === "custom") {
    reportSubtitle = `Period: ${params.startDate} to ${params.endDate}`;
  } else {
    reportSubtitle = `Daily Report: ${formatDate(new Date())}`;
  }

  // 2. Official Header
  doc.setFontSize(20);
  doc.setTextColor(0, 51, 153); 
  doc.text("HOSPITAL BLOOD REQUIREMENT AUDIT", 105, 20, { align: "center" });
  
  doc.setFontSize(12);
  doc.setTextColor(80);
  doc.text(reportSubtitle, 105, 28, { align: "center" });
  
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated On: ${formatDate(new Date())}`, 14, 40);

  // 3. Data Mapping (Source Name Logic)
  const tableRows = requests.map((req, i) => {
    let sourceName = "Unfulfilled";
    if (req.respondedBy) {
      const responder = req.respondedBy.responderId;
      if (responder) {
        sourceName = responder.name || responder.fullName || "Private Source";
        sourceName += ` (${req.respondedBy.responderType === 'bloodbank' ? 'Bank' : 'Donor'})`;
      }
    }

    return [
      i + 1,
      formatDate(req.createdAt),
      req.bloodGroup,
      req.units,
      req.urgencyLevel,
      req.status.toUpperCase(),
      sourceName
    ];
  });

  // 4. Generate Table
  autoTable(doc, {
    head: [['Sr.', 'Request Date', 'Group', 'Units', 'Urgency', 'Status', 'Fulfillment Source']],
    body: tableRows,
    startY: 45,
    headStyles: { fillColor: [0, 51, 153], fontSize: 10 },
    theme: 'grid',
    styles: { fontSize: 9 }
  });

  // 5. Official Footer
  const finalY = doc.lastAutoTable.finalY + 30;
  doc.text("__________________________", 14, finalY);
  doc.text("Hospital Administrator", 14, finalY + 5);
  doc.text("__________________________", 140, finalY);
  doc.text("Official Medical Stamp", 140, finalY + 5);

  doc.save(`Hospital_Audit_${params.type}.pdf`);
};

// Excel Export
export const generateExcel = (data, fileName) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};