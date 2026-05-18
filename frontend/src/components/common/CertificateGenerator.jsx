import React, { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { FaDownload, FaTint, FaAward, FaHospital, FaUsers, FaHeartbeat, FaRegHeart } from "react-icons/fa";

const CertificateGenerator = ({ donorName, date, locationName, bloodGroup, donationType }) => {
  const certificateRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Theme configuration based on donation type
  const getTheme = () => {
    switch (donationType?.toLowerCase()) {
      case "hospital":
        return {
          border: "border-blue-900",
          textMain: "text-blue-900",
          textAccent: "text-blue-700",
          bgOverlay: "bg-blue-50/20",
          title: "Certificate of Bravery",
          badgeLabel: "Medical Hero",
          WatermarkIcon: FaHospital,
        };
      case "camp":
        return {
          border: "border-emerald-900",
          textMain: "text-emerald-900",
          textAccent: "text-emerald-700",
          bgOverlay: "bg-emerald-50/20",
          title: "Community Service Award",
          badgeLabel: "Community Champion",
          WatermarkIcon: FaUsers,
        };
      case "bank":
      default:
        return {
          border: "border-red-900",
          textMain: "text-red-900",
          textAccent: "text-red-700",
          bgOverlay: "bg-red-50/15",
          title: "Certificate of Appreciation",
          badgeLabel: "Life Saver",
          WatermarkIcon: FaTint,
        };
    }
  };

  const theme = getTheme();

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const element = certificateRef.current;
      const canvas = await html2canvas(element, {
        scale: 4,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("landscape", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`BloodConnect_${theme.badgeLabel.replace(" ", "_")}_${date}.pdf`);
      
    } catch (error) {
      console.error("Error generating certificate:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Generate a random certificate number
  const certificateNumber = Math.random().toString(36).substring(2, 10).toUpperCase();

  return (
    <div className="flex flex-col items-center gap-6 p-6 mb-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
      
      {/* Certificate Viewer */}
      <div className="w-full overflow-x-auto pb-4 flex justify-center">
        {/* Fixed aspect ratio container for perfect PDF generation */}
        <div 
          ref={certificateRef} 
          className={`relative bg-white dark:bg-gray-800 border-[12px] border-double ${theme.border} p-8 text-center shadow-2xl flex flex-col items-center justify-center`}
          style={{ width: "900px", height: "650px", minWidth: "900px" }}
        >
          {/* Subtle Background Overlay */}
          <div className={`absolute inset-0 ${theme.bgOverlay} pointer-events-none`}></div>

          {/* Decorative Corner Borders - Top Left */}
          <div className="absolute top-8 left-8 w-16 h-16 border-t-4 border-l-4 border-amber-700/40 rounded-tl-xl"></div>
          <div className="absolute top-8 left-8 w-8 h-8 border-t-4 border-l-4 border-amber-600/60 rounded-tl-md"></div>
          
          {/* Decorative Corner Borders - Top Right */}
          <div className="absolute top-8 right-8 w-16 h-16 border-t-4 border-r-4 border-amber-700/40 rounded-tr-xl"></div>
          <div className="absolute top-8 right-8 w-8 h-8 border-t-4 border-r-4 border-amber-600/60 rounded-tr-md"></div>
          
          {/* Decorative Corner Borders - Bottom Left */}
          <div className="absolute bottom-8 left-8 w-16 h-16 border-b-4 border-l-4 border-amber-700/40 rounded-bl-xl"></div>
          <div className="absolute bottom-8 left-8 w-8 h-8 border-b-4 border-l-4 border-amber-600/60 rounded-bl-md"></div>
          
          {/* Decorative Corner Borders - Bottom Right */}
          <div className="absolute bottom-8 right-8 w-16 h-16 border-b-4 border-r-4 border-amber-700/40 rounded-br-xl"></div>
          <div className="absolute bottom-8 right-8 w-8 h-8 border-b-4 border-r-4 border-amber-600/60 rounded-br-md"></div>

          {/* Ornamental Border Lines */}
          <div className="absolute top-16 left-16 right-16 h-px bg-gradient-to-r from-transparent via-amber-700/30 to-transparent"></div>
          <div className="absolute bottom-16 left-16 right-16 h-px bg-gradient-to-r from-transparent via-amber-700/30 to-transparent"></div>
          <div className="absolute top-16 left-16 bottom-16 w-px bg-gradient-to-b from-transparent via-amber-700/30 to-transparent"></div>
          <div className="absolute top-16 right-16 bottom-16 w-px bg-gradient-to-b from-transparent via-amber-700/30 to-transparent"></div>

          {/* Background Watermark Icon */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
            <theme.WatermarkIcon className={`text-[400px] ${theme.textMain}`} />
          </div>

          {/* Inner Border Content */}
          <div className={`relative z-10 w-full h-full border-2 ${theme.border} p-10 flex flex-col justify-between bg-white dark:bg-gray-800/95 backdrop-blur-sm rounded-sm`}>
            
            {/* Top Header Section */}
            <div>
              {/* Ornamental Top Decoration */}
              <div className="flex justify-center items-center gap-2 mb-3">
                <div className="w-12 h-px bg-gradient-to-r from-transparent to-amber-700/40"></div>
                <span className="text-amber-700/40 text-xl">✦</span>
                <div className="w-12 h-px bg-gradient-to-l from-transparent to-amber-700/40"></div>
              </div>
              
              {/* Organization Name */}
              <div className="flex justify-center items-center gap-3 mb-2">
                <FaHeartbeat className={`text-2xl ${theme.textAccent}`} />
                <h1 className="text-2xl font-serif font-bold text-gray-800 dark:text-gray-200 tracking-wide uppercase">
                  Blood<span className={theme.textAccent}>Connect</span> Foundation
                </h1>
                <FaRegHeart className={`text-xl ${theme.textAccent}`} />
              </div>
              
              {/* Official Seal Text */}
              <p className="text-[9px] text-gray-400 tracking-[3px] uppercase mb-3">Official Recognition Document</p>
              
              {/* Main Title with Ornamental Bars */}
              <div className="flex items-center justify-center gap-4 mb-2">
                <div className="w-20 h-px bg-gradient-to-r from-transparent to-amber-700/50"></div>
                <h2 className={`text-3xl font-serif font-bold ${theme.textMain} uppercase tracking-widest`}>
                  {theme.title}
                </h2>
                <div className="w-20 h-px bg-gradient-to-l from-transparent to-amber-700/50"></div>
              </div>
              
              <p className="text-gray-500 dark:text-gray-400 font-serif text-sm tracking-wider uppercase mb-1">
                This Certificate Is Proudly Presented To
              </p>
              
              {/* Ornamental Divider */}
              <div className="flex justify-center gap-1 mt-1">
                <div className="w-2 h-2 rounded-full bg-amber-700/30"></div>
                <div className="w-4 h-px bg-amber-700/30 self-center"></div>
                <div className="w-2 h-2 rounded-full bg-amber-700/30"></div>
                <div className="w-8 h-px bg-amber-700/30 self-center"></div>
                <div className="w-2 h-2 rounded-full bg-amber-700/30"></div>
                <div className="w-4 h-px bg-amber-700/30 self-center"></div>
                <div className="w-2 h-2 rounded-full bg-amber-700/30"></div>
              </div>
            </div>

            {/* Donor Name - Prominent Display */}
            <div className="my-4">
              <h3 className="text-5xl font-serif font-bold text-gray-900 dark:text-gray-100 border-b-2 border-amber-700/40 inline-block px-20 pb-3 tracking-wide">
                {donorName || "Hero Donor"}
              </h3>
            </div>

            {/* Body Text - Official Language */}
            <div className="px-12">
              <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed font-serif">
                In recognition of extraordinary compassion and selfless dedication to humanity,<br/>
                for voluntarily donating <span className={`font-bold text-xl ${theme.textAccent}`}>{bloodGroup}</span> blood, 
                a precious gift that saves lives.<br/><br/>
                This donation was made at <span className="font-semibold text-gray-800 dark:text-gray-200">{locationName}</span><br/>
                on the <span className="font-semibold text-gray-800 dark:text-gray-200">{formattedDate}</span>, 
                contributing to the well-being of our community.
              </p>
            </div>

            {/* Footer Signatures Section */}
            <div className="flex justify-between items-end mt-6 px-8">
              {/* Organization Signature */}
              <div className="text-center">
                <div className="w-44 border-b border-gray-400 mb-2 mx-auto">
                  <div className="flex justify-center gap-1 mb-1">
                    <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                    <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                    <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                  </div>
                </div>
                <p className="text-[9px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Authorized Signatory</p>
                <p className="text-[8px] text-gray-400">BloodConnect Foundation</p>
              </div>

              {/* Center Official Seal */}
              <div className="relative">
                <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-full border-2 ${theme.border} bg-white dark:bg-gray-800 shadow-md`}>
                  <div className={`w-16 h-16 rounded-full border ${theme.border} flex flex-col items-center justify-center`}>
                    <FaAward className={`text-3xl ${theme.textAccent} mb-0.5`} />
                    <div className="w-8 h-px bg-amber-700/40 my-0.5"></div>
                    <span className="text-[7px] font-bold uppercase tracking-tighter text-gray-700 dark:text-gray-300">Seal</span>
                  </div>
                </div>
                {/* Certificate Number */}
                <p className="text-[7px] text-gray-400 absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  Cert. #: {certificateNumber}
                </p>
              </div>

              {/* Badge and Date Combined */}
              <div className="text-center">
                <div className={`flex items-center justify-center gap-2 mb-2 px-3 py-1 rounded-full bg-white dark:bg-gray-800 border ${theme.border} shadow-sm`}>
                  <FaTint className={`text-xs ${theme.textAccent}`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{theme.badgeLabel}</span>
                </div>
                <div className="mt-2">
                  <p className="text-[11px] font-serif italic text-gray-700 dark:text-gray-300">{formattedDate}</p>
                  <div className="w-32 h-px bg-amber-700/30 mt-1 mx-auto"></div>
                  <p className="text-[8px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">Date of Donation</p>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="text-center mt-2">
              <p className="text-[7px] text-gray-400 tracking-wider">
                "Every drop counts — your contribution brings life and hope to those in need."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownloadPdf}
        disabled={isDownloading}
        className={`flex items-center gap-3 px-10 py-3.5 text-white font-bold rounded-xl shadow-xl transition-all transform hover:scale-105 active:scale-95 ${
          isDownloading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black'
        }`}
      >
        {isDownloading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating Certificate...
          </>
        ) : (
          <>
            <FaDownload className="text-lg" />
            Download Official Certificate
          </>
        )}
      </button>

    </div>
  );
};

export default CertificateGenerator;