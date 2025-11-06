import React from 'react';
import { FaFacebook, FaInstagram, FaLinkedin, FaYoutube } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

// Template 2 - Different design (placeholder for now - can be customized)
const Template2 = ({ cardData, cardWidth, cardHeight, cardId = 'visiting-card' }) => {
  const visitingCardData = cardData || {};

  return (
    <div
      id={cardId}
      className="relative overflow-hidden"
      style={{
        width: `${cardWidth}px`,
        height: `${cardHeight}px`,
        fontFamily: 'Lora, serif',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      {/* Template 2 - Placeholder design */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold mb-2">
            {visitingCardData.companyName || visitingCardData.memberName || 'Name'}
          </h2>
          <p className="text-lg opacity-90">
            {visitingCardData.title || 'Title'}
          </p>
        </div>

        {visitingCardData.memberPhoto && (
          <div className="mb-4">
            <img
              src={visitingCardData.memberPhoto}
              alt="Member Photo"
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                border: '3px solid white',
                objectFit: 'cover'
              }}
            />
          </div>
        )}

        <div className="text-center space-y-2 text-sm">
          {visitingCardData.phone && (
            <div>📞 {visitingCardData.phone}</div>
          )}
          {visitingCardData.email && (
            <div>✉️ {visitingCardData.email}</div>
          )}
          {visitingCardData.address && (
            <div>📍 {visitingCardData.address}</div>
          )}
        </div>

        <div className="mt-6 flex gap-4">
          <FaFacebook size={20} color="#FFFFFF" style={{ cursor: 'pointer' }} />
          <FaInstagram size={20} color="#FFFFFF" style={{ cursor: 'pointer' }} />
          <FaLinkedin size={20} color="#FFFFFF" style={{ cursor: 'pointer' }} />
          <FaYoutube size={20} color="#FFFFFF" style={{ cursor: 'pointer' }} />
          <FaXTwitter size={20} color="#FFFFFF" style={{ cursor: 'pointer' }} />
        </div>

        <div className="mt-4 text-xs opacity-75">
          ID: {visitingCardData.membershipId || '140'}
        </div>
      </div>
    </div>
  );
};

export default Template2;

