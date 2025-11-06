import React, { useState } from 'react';
import { FiX, FiDownload } from 'react-icons/fi';
import parentLogo from '../../../assets/logos/parent.jpg';
import memberPhoto from '../../../assets/Aashish.png';
import { templates } from './templates';

const VisitingCard = ({ isOpen, onClose, profileData, selectedTemplate = 1 }) => {
  const [currentTemplate, setCurrentTemplate] = useState(selectedTemplate);

  // Hardcoded data for visiting card (can be replaced with profileData prop)
  const visitingCardData = {
    memberName: 'Aashish Jangra',
    memberPhoto: memberPhoto,
    membershipId: '12345',
    email: 'info@mail.com',
    phone: '000 1234 5678',
    companyLogo: parentLogo,
    companyName: 'Aashish Jangra',
    companyTagline: '',
    title: 'Solution Manager',
    companyId: '',
    dob: '',
    bloodGroup: '',
    address: 'Street Location, City, Country',
    issuedUpto: 'Dec 2025',
    ...profileData // Merge with provided profileData
  };

  // Get available template numbers
  const availableTemplates = Object.keys(templates).map(Number).sort((a, b) => a - b);

  // Get the selected template component
  const SelectedTemplate = templates[currentTemplate] || templates[1];

  const handleDownload = async () => {
    const cardElement = document.getElementById(`visiting-card-preview-${currentTemplate}`);
    if (!cardElement) {
      alert('Card element not found. Please try again.');
      return;
    }

    try {
      // Import html2canvas and jsPDF dynamically
      const [html2canvas, jsPDF] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ]);

      // Convert card to canvas
      const canvas = await html2canvas.default(cardElement, {
        backgroundColor: null,
        scale: 3,
        logging: false,
        useCORS: true,
        allowTaint: true
      });

      // Card dimensions in inches: 2.125" x 3.375"
      // Convert to mm: 1 inch = 25.4 mm
      const CARD_WIDTH_MM = 2.125 * 25.4;  // 53.975 mm
      const CARD_HEIGHT_MM = 3.375 * 25.4; // 85.725 mm

      // A4 dimensions in mm
      const A4_WIDTH = 210;
      const A4_HEIGHT = 297;
      const MARGIN = 10;

      // Calculate available space
      const availableWidth = A4_WIDTH - (MARGIN * 2);
      const availableHeight = A4_HEIGHT - (MARGIN * 2);

      // Scale to fit card dimensions while maintaining aspect ratio
      const scaleX = availableWidth / CARD_WIDTH_MM;
      const scaleY = availableHeight / CARD_HEIGHT_MM;
      const scale = Math.min(scaleX, scaleY);

      // Calculate final dimensions in mm
      const finalWidth = CARD_WIDTH_MM * scale;
      const finalHeight = CARD_HEIGHT_MM * scale;

      // Center the card on A4 page
      const xOffset = (A4_WIDTH - finalWidth) / 2;
      const yOffset = (A4_HEIGHT - finalHeight) / 2;

      // Create PDF with A4 portrait format
      const pdf = new jsPDF.default({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Convert canvas to image data
      const imgData = canvas.toDataURL('image/png', 1.0);

      // Add image to PDF, centered on A4 page
      pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);

      // Save PDF
      pdf.save(`Visiting-Card-${visitingCardData.membershipId}-Template-${currentTemplate}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to download visiting card as PDF. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Select Visiting Card Template</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
              title="Download Visiting Card as PDF"
            >
              <FiDownload size={24} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
            >
              <FiX size={24} />
            </button>
          </div>
        </div>

        {/* Hidden previews for PDF generation */}
        <div className="hidden">
          {availableTemplates.map((templateNum) => {
            const TemplateComponent = templates[templateNum];
            return (
              <TemplateComponent
                key={templateNum}
                cardData={visitingCardData}
                cardWidth={255}
                cardHeight={405}
                cardId={`visiting-card-preview-${templateNum}`}
              />
            );
          })}
        </div>

        {/* Template Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {availableTemplates.map((templateNum) => {
              const TemplateComponent = templates[templateNum];
              const isSelected = currentTemplate === templateNum;
              
              return (
                <div
                  key={templateNum}
                  className="flex flex-col items-center cursor-pointer"
                  onClick={() => setCurrentTemplate(templateNum)}
                >
                  {/* Template Card - Full Size */}
                  <div className="mb-4">
                    <TemplateComponent
                      cardData={visitingCardData}
                      cardWidth={255}
                      cardHeight={405}
                      cardId={`template-preview-${templateNum}`}
                    />
                  </div>

                  {/* Radio Button Below Template */}
                      <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="template-selection"
                      value={templateNum}
                      checked={isSelected}
                      onChange={() => setCurrentTemplate(templateNum)}
                      className="w-5 h-5 text-indigo-600 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Template {templateNum}
                        </span>
                  </div>
                </div>
              );
            })}
            </div>
        </div>
      </div>
    </div>
  );
};

export default VisitingCard;
