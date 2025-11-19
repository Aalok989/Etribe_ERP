import React from 'react';
import { FaFacebook, FaInstagram, FaLinkedin, FaYoutube, FaPinterest } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import etribeTree from '../../../../assets/Etribe-Tree.png';

const Template1 = ({ cardData, cardWidth, cardHeight, cardId = 'visiting-card' }) => {
  const visitingCardData = cardData || {};
  
  const socialIconsData = [
    { Icon: FaFacebook, url: visitingCardData.facebookUrl },
    { Icon: FaInstagram, url: visitingCardData.instagramUrl },
    { Icon: FaLinkedin, url: visitingCardData.linkedinUrl },
    { Icon: FaYoutube, url: visitingCardData.youtubeUrl },
    { Icon: FaXTwitter, url: visitingCardData.twitterUrl || visitingCardData.xUrl },
    { Icon: FaPinterest, url: visitingCardData.pinterestUrl },
  ].filter(({ url }) => url && url.trim() !== ''); // Only show icons with valid URLs

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
        border: '1px solid #E5E7EB'
      }}
    >
      {/* Top Section - White Background */}
      <div 
        className="absolute top-0 left-0 right-0"
        style={{
          height: '180px',
          backgroundColor: '#FFFFFF',
          padding: '5px'
        }}
      >
        {/* Company Logo - Top Left Corner */}
        {visitingCardData.companyLogo && (
          <div 
            style={{
              position: 'absolute',
              top: '-8px',
              left: '5px',
              width: '60px',
              height: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <img
              src={visitingCardData.companyLogo}
              alt="Company Logo"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Arrow-like Background - Top Right (facing downward) */}
        <div 
          style={{
            position: 'absolute',
            top: '0px',
            right: '-3px',
            width: '110px',
            height: '50px',
            overflow: 'visible'
          }}
        >
          <svg 
            width="110" 
            height="50" 
            viewBox="0 0 110 50" 
            preserveAspectRatio="none"
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0,
              width: '100%',
              height: '100%'
            }}
          >
            {/* Arrow shape facing downward - less sharp */}
            <path 
              d="M 55 50 L 25 30 L 25 0 L 85 0 L 85 30 Z" 
              fill="#E60023"
            />
            {/* Member text inside arrow */}
            <text 
              x="55" 
              y="25" 
              textAnchor="middle" 
              fill="white" 
              fontSize="14" 
              fontWeight="600"
              style={{ 
                fontFamily: 'Lora, serif'
              }}
            >
              Member
            </text>
          </svg>
        </div>

        {/* Member Photo - Circular - Centered between top and red line */}
        {visitingCardData.memberPhoto && (
          <div 
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '110px',
              height: '110px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid #E60023',
              backgroundColor: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              aspectRatio: '1 / 1',
              flexShrink: 0,
              zIndex: 10
            }}
          >
            <img
              src={visitingCardData.memberPhoto}
              alt="Member Photo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                aspectRatio: '1 / 1'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Etribe Tree Watermark - Above Red Line */}
        <div 
          style={{
            position: 'absolute',
            bottom: '-40px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '200px',
            height: '200px',
            opacity: 0.15,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 0
          }}
        >
          <img
            src={etribeTree}
            alt="Etribe Tree Watermark"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
          />
        </div>

      </div>

      {/* Company Name - Above Red Separator Line */}
      <div 
        style={{
          position: 'absolute',
          top: '150px',
          left: '10px',
          fontSize: '16px',
          fontWeight: 700,
          color: '#000000',
          textAlign: 'left',
          letterSpacing: '0.5px',
          whiteSpace: 'nowrap',
          fontFamily: 'Lora, serif'
        }}
      >
        {visitingCardData.companyName || visitingCardData.memberName || 'Aashish Jangra'}
      </div>

      {/* ID - Right Side Above Red Separator Line */}
      <div 
        style={{
          position: 'absolute',
          top: '150px',
          right: '10px',
          fontSize: '16px',
          fontWeight: 700,
          color: '#000000',
          textAlign: 'right',
          letterSpacing: '0.5px',
          whiteSpace: 'nowrap',
          fontFamily: 'Lora, serif'
        }}
      >
        Id: {visitingCardData.membershipId || '140'}
      </div>

      {/* Separator Stripe - Red and White */}
      <div 
        className="absolute left-0 right-0"
        style={{
          top: '180px',
          height: '8px'
        }}
      >
        {/* Red stripe */}
        <div 
          style={{
            height: '5px',
            backgroundColor: '#E60023'
          }}
        />
        {/* White stripe */}
        <div 
          style={{
            height: '3px',
            backgroundColor: '#FFFFFF'
          }}
        />
      </div>

      {/* Bottom Section - Dark Gray Background */}
      <div 
        className="absolute left-0 right-0 bottom-0"
        style={{
          top: '188px',
          backgroundColor: '#333333',
          padding: '12px 10px 30px 10px',
          color: '#CCCCCC'
        }}
      >
        {/* Contact Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {/* Phone Numbers */}
          {visitingCardData.phone && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <div 
                style={{
                  fontSize: '14px',
                  fontWeight: 400,
                  color: '#FFFFFF',
                  lineHeight: '1.6',
                  fontFamily: 'Lora, serif',
                  textAlign: 'left'
                }}
              >
                Phn no:
              </div>
              <div 
                style={{
                  fontSize: '14px',
                  fontWeight: 400,
                  color: '#FFFFFF',
                  lineHeight: '1.6',
                  fontFamily: 'Lora, serif',
                  textAlign: 'left'
                }}
              >
                {visitingCardData.phone}
              </div>
            </div>
          )}

          {/* Email */}
          {visitingCardData.email && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <div 
                style={{
                  fontSize: '14px',
                  fontWeight: 400,
                  color: '#FFFFFF',
                  lineHeight: '1.6',
                  fontFamily: 'Lora, serif',
                  textAlign: 'left'
                }}
              >
                Email:
              </div>
              <div 
                style={{
                  fontSize: '14px',
                  fontWeight: 400,
                  color: '#FFFFFF',
                  lineHeight: '1.6',
                  fontFamily: 'Lora, serif',
                  textAlign: 'left'
                }}
              >
                {visitingCardData.email}
              </div>
            </div>
          )}

          {/* Address */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <div 
              style={{
                fontSize: '14px',
                fontWeight: 400,
                color: '#FFFFFF',
                lineHeight: '1.6',
                fontFamily: 'Lora, serif',
                textAlign: 'left'
              }}
            >
              Add:
            </div>
            <div 
              style={{
                fontSize: '14px',
                fontWeight: 400,
                color: '#FFFFFF',
                lineHeight: '1.6',
                fontFamily: 'Lora, serif',
                textAlign: 'left'
              }}
            >
              {visitingCardData.address || 'Street Location, City, Country'}
            </div>
          </div>
        </div>

        {/* Issued Upto */}
        <div style={{ 
          position: 'absolute',
          bottom: '50px',
          left: '10px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '4px'
        }}>
          <div 
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#FFFFFF',
              fontFamily: 'Lora, serif'
            }}
          >
            Issued upto:
          </div>
          <div 
            style={{
              fontSize: '14px',
              fontWeight: 400,
              color: '#FFFFFF',
              fontFamily: 'Lora, serif'
            }}
          >
            {visitingCardData.issuedUpto || 'Dec 2025'}
          </div>
        </div>

        {/* Thin Red Line at Bottom */}
        <div 
          style={{
            position: 'absolute',
            bottom: '40px',
            left: '0px',
            right: '0px',
            height: '2px',
            backgroundColor: '#E60023'
          }}
        />

        {/* Social Media Icons */}
        <div 
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}
        >
          {socialIconsData.map(({ Icon, url }, index) => (
            <a
              key={index}
              href={url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (!url) {
                  e.preventDefault();
                }
              }}
              style={{ display: 'inline-flex', alignItems: 'center' }}
            >
              <Icon 
                size={20} 
                color="#FFFFFF"
                style={{ cursor: url ? 'pointer' : 'not-allowed', opacity: url ? 1 : 0.6 }}
              />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Template1;

