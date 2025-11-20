import React from 'react';
import { FaFacebook, FaInstagram, FaLinkedin, FaYoutube, FaPinterest } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

const Template3 = ({ cardData, cardWidth, cardHeight, cardId = 'visiting-card' }) => {
  const visitingCardData = cardData || {};
  const topSectionHeight = cardHeight * 0.45;
  const upperDarkLeftY = cardHeight * 0.4;
  const upperDarkRightY = cardHeight * 0.25;
  const ribbonLeft = 25;
  const ribbonWidth = 45;
  const ribbonRight = ribbonLeft + ribbonWidth;
  const diagonalY = (x) => upperDarkLeftY - (x / cardWidth) * (upperDarkLeftY - upperDarkRightY);
  const ribbonTopLeftY = diagonalY(ribbonLeft);
  const ribbonTopRightY = diagonalY(ribbonLeft + ribbonWidth);
  const ribbonTop = Math.min(ribbonTopLeftY, ribbonTopRightY);
  const ribbonHeight = cardHeight - ribbonTop;
  const ribbonTopOffsetLeft = ribbonTopLeftY - ribbonTop;
  const ribbonTopOffsetRight = ribbonTopRightY - ribbonTop;
  const socialIconsData = [
    { Icon: FaFacebook, url: visitingCardData.facebookUrl },
    { Icon: FaInstagram, url: visitingCardData.instagramUrl },
    { Icon: FaLinkedin, url: visitingCardData.linkedinUrl },
    { Icon: FaYoutube, url: visitingCardData.youtubeUrl },
    { Icon: FaXTwitter, url: visitingCardData.twitterUrl || visitingCardData.xUrl },
    { Icon: FaPinterest, url: visitingCardData.pinterestUrl },
  ].filter(({ url }) => url && url.trim() !== ''); // Only show icons with valid URLs
  const availableRightWidth = Math.max(cardWidth - ribbonRight, 0);
  const profileSize = cardHeight * 0.28;
  const profileBorderWidth = 6;
  const profileCenterX = ribbonRight + availableRightWidth / 2;
  const profileCenterY = diagonalY(profileCenterX);
  const profileLeft = profileCenterX - profileSize / 2;
  const profileTop = profileCenterY - profileSize / 2;
  const whiteAreaTop = upperDarkRightY + 20;
  const contactTop = Math.max(whiteAreaTop, profileTop + profileSize + 20);
  const contactRowStyle = {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    columnGap: '6px',
    rowGap: '2px',
    alignItems: 'baseline'
  };
  const contactValueStyle = {
    wordBreak: 'break-word'
  };

  return (
    <div
      id={cardId}
      className="relative overflow-hidden"
      style={{
        width: `${cardWidth}px`,
        height: `${cardHeight}px`,
        fontFamily: 'Arial, sans-serif',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        backgroundColor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Upper Background Section - Dark Teal/Blue-Green with Diagonal Bottom */}
      <div 
        className="absolute top-0 left-0 right-0"
        style={{
          height: `${topSectionHeight}px`,
          position: 'relative',
          overflow: 'hidden',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          zIndex: 1
        }}
      >
        {/* Diagonal Background using SVG - Straight top, diagonal bottom */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1
          }}
          viewBox={`0 0 ${cardWidth} ${topSectionHeight}`}
          preserveAspectRatio="none"
        >
          <path
            d={`M 0,0 L ${cardWidth},0 L ${cardWidth},${upperDarkRightY} L 0,${upperDarkLeftY} Z`}
            fill="#08303F"
          />
        </svg>
      </div>

      {/* Company Logo */}
      {visitingCardData.companyLogo && (
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          zIndex: 12,
          maxWidth: `${cardWidth * 0.3}px`,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <img
            src={visitingCardData.companyLogo}
            alt="Company Logo"
          style={{
            width: '100%',
            height: 'auto',
            objectFit: 'contain',
            filter: 'brightness(0) invert(1)'
          }}
        />
      </div>
      )}

      {/* Right Label */}
      <div
        style={{
          position: 'absolute',
          top: '6px',
          right: 0,
          backgroundColor: '#FFFFFF',
          padding: '6px 20px',
          borderTopLeftRadius: '16px',
          borderBottomLeftRadius: '16px',
          border: '1px solid rgba(8, 48, 63, 0.12)',
          boxShadow: '0 10px 20px rgba(0, 0, 0, 0.12)',
          zIndex: 11
        }}
      >
        <span
          style={{
            color: '#DC2626',
            fontWeight: 900,
            letterSpacing: '0.5px',
            textTransform: 'none',
            fontSize: '16px',
            fontFamily: 'Lora, serif',
            lineHeight: '1'
          }}
        >
          Member
        </span>
      </div>

      {/* Contact Information in White Area */}
      <div
        style={{
          position: 'absolute',
          top: `${contactTop - 12}px`,
          left: `${ribbonRight + 6}px`,
          right: '16px',
          bottom: '10px',
          display: 'grid',
          gridTemplateRows: 'auto auto auto 1fr',
          alignItems: 'start',
          rowGap: '4px',
          color: '#1F2937',
          fontFamily: 'Lora, serif',
          fontSize: '14px',
          zIndex: 5,
          wordBreak: 'break-word',
          overflowWrap: 'break-word'
        }}
      >
        <div
          style={{
            fontSize: '18px',
            fontWeight: 700,
            letterSpacing: '0.4px',
            color: '#0F172A',
            textAlign: 'center'
          }}
        >
          {visitingCardData.fullName || visitingCardData.memberName || ''}
        </div>
        <div style={contactRowStyle}>
          <strong style={{ color: '#0F172A', whiteSpace: 'nowrap' }}>Phn no:</strong>
          <span style={contactValueStyle}>{visitingCardData.phone || ''}</span>
        </div>
        <div style={contactRowStyle}>
          <strong style={{ color: '#0F172A', whiteSpace: 'nowrap' }}>Email:</strong>
          <span style={contactValueStyle}>{visitingCardData.email || ''}</span>
        </div>
        <div style={contactRowStyle}>
          <strong style={{ color: '#0F172A', whiteSpace: 'nowrap' }}>Add:</strong>
          <span style={contactValueStyle}>{visitingCardData.address || 'Street Location, City, Country'}</span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginTop: '8px'
          }}
        >
          <strong style={{ color: '#0F172A', whiteSpace: 'nowrap' }}>Issued upto:</strong>
          <strong style={{ color: '#0F172A', whiteSpace: 'nowrap' }}>Id:</strong>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline'
          }}
        >
          <span style={{ wordBreak: 'break-word' }}>{visitingCardData.issuedUpto || ''}</span>
          <span style={{ wordBreak: 'break-word' }}>{visitingCardData.membershipId || ''}</span>
        </div>
      </div>

      {/* Profile Image - Centered between ribbon and right edge, half in top/bottom sections */}
      <div
        style={{
          position: 'absolute',
          left: `${profileLeft}px`,
          top: `${profileTop}px`,
          width: `${profileSize}px`,
          height: `${profileSize}px`,
          borderRadius: '50%',
          padding: `${profileBorderWidth}px`,
          boxSizing: 'border-box',
          background: '#FFFFFF',
          boxShadow: '0 12px 24px rgba(0, 0, 0, 0.28), 0 18px 36px rgba(0, 0, 0, 0.18)',
          zIndex: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            overflow: 'hidden',
            backgroundColor: '#FFFFFF'
          }}
        >
          <img
            src={visitingCardData.profileImage || visitingCardData.memberPhoto || ''}
            alt={visitingCardData.fullName || 'Member'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </div>
      </div>

      {/* Red Ribbon on Left Side - Aligned to Diagonal */}
      <div
        style={{
          position: 'absolute',
          left: `${ribbonLeft}px`,
          top: `${ribbonTop}px`,
          width: `${ribbonWidth}px`,
          height: `${ribbonHeight}px`,
          zIndex: 10
        }}
      >
        {/* Main Ribbon Strip - Diagonal Top, Straight Bottom */}
        <svg
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: `${ribbonWidth}px`,
            height: `${ribbonHeight}px`,
            zIndex: 1
          }}
          viewBox={`0 0 ${ribbonWidth} ${ribbonHeight}`}
          preserveAspectRatio="none"
        >
          {/* Ribbon with diagonal top matching upper section diagonal */}
          <path
            d={`M 0,${ribbonTopOffsetLeft} L ${ribbonWidth},${ribbonTopOffsetRight} L ${ribbonWidth},${ribbonHeight} L 0,${ribbonHeight} Z`}
            fill="#DC2626" // Bright red
          />
        </svg>

        {/* Shadow for depth - Only below diagonal line */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: `${ribbonWidth}px`,
            height: `${ribbonHeight}px`,
            boxShadow: '2px 0 4px rgba(0, 0, 0, 0.2)',
            zIndex: 0,
            pointerEvents: 'none'
          }}
        />

        {/* Social Icons */}
        <div
          style={{
            position: 'absolute',
            bottom: '18px',
            left: 0,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            zIndex: 2
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '24px'
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
    </div>
  );
};

export default Template3;

