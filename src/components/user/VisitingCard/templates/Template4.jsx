import React from 'react';
import parentLogo from '../../../../assets/logos/parent.jpg';
import memberPhoto from '../../../../assets/Aashish.png';
import { FaFacebook, FaInstagram, FaLinkedin, FaYoutube, FaPinterest } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

const Template4 = ({ cardData, cardWidth, cardHeight, cardId = 'visiting-card' }) => {
  const visitingCardData = cardData || {};
  const logoSrc = visitingCardData.companyLogo || parentLogo;
  const leftStripWidth = Math.max(cardWidth * 0.22, 50);
  const availableRightWidth = cardWidth - leftStripWidth;
  const barTop = cardHeight * 0.10;
  const barHeight = cardHeight * 0.16;
  const halfBarHeight = barHeight / 2;
  const triangleWidth = cardWidth * 0.12;
  const socialIconsData = [
    { Icon: FaFacebook, url: visitingCardData.facebookUrl },
    { Icon: FaInstagram, url: visitingCardData.instagramUrl },
    { Icon: FaLinkedin, url: visitingCardData.linkedinUrl },
    { Icon: FaYoutube, url: visitingCardData.youtubeUrl },
    { Icon: FaXTwitter, url: visitingCardData.twitterUrl || visitingCardData.xUrl },
    { Icon: FaPinterest, url: visitingCardData.pinterestUrl },
  ].filter(({ url }) => url && url.trim() !== ''); // Only show icons with valid URLs
  const photoSrc = visitingCardData.profileImage || memberPhoto;
  const photoSize = Math.min(cardWidth * 0.38, availableRightWidth * 0.8);
  const photoLeft = leftStripWidth + (availableRightWidth - photoSize) / 2;
  const infoTop = barTop + barHeight + cardHeight * 0.04 + photoSize + cardHeight * 0.04;
  const infoPadding = Math.max(cardWidth * 0.05, 16);
  const issuedBottom = cardHeight * 0.03;

  return (
    <div
      id={cardId}
      className="relative overflow-hidden"
      style={{
        width: `${cardWidth}px`,
        height: `${cardHeight}px`,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        fontFamily: 'Arial, sans-serif',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        backgroundColor: '#FFFFFF'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: `${leftStripWidth}px`,
          backgroundColor: '#3B3B3B'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '18px',
          left: 0,
          width: `${leftStripWidth}px`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          zIndex: 4
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
      {photoSrc && (
        <div
          style={{
            position: 'absolute',
            top: `${barTop + barHeight + cardHeight * 0.04}px`,
            left: `${photoLeft}px`,
            width: `${photoSize}px`,
            height: `${photoSize}px`,
            backgroundColor: '#FFFFFF',
            border: '3px solid #E57D26',
            borderRadius: '12px',
            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.18)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img
            src={photoSrc}
            alt={visitingCardData.fullName || 'Member'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          top: `${infoTop}px`,
          left: `${leftStripWidth + infoPadding}px`,
          right: `${infoPadding}px`,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          color: '#1F2937',
          fontFamily: 'Lora, serif',
          fontSize: '14px',
          lineHeight: 1.4
        }}
      >
        <div style={{ display: 'flex', gap: '6px' }}>
          <strong style={{ color: '#0F172A', whiteSpace: 'nowrap' }}>Phn no:</strong>
          <span style={{ wordBreak: 'break-word' }}>{visitingCardData.phone || '9817436147'}</span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <strong style={{ color: '#0F172A', whiteSpace: 'nowrap' }}>Email:</strong>
          <span style={{ wordBreak: 'break-word' }}>{visitingCardData.email || 'aalok1390@gmail.com'}</span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <strong style={{ color: '#0F172A', whiteSpace: 'nowrap' }}>Add:</strong>
          <span style={{ wordBreak: 'break-word' }}>{visitingCardData.address || 'Street Location, City, Country'}</span>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: `${leftStripWidth + infoPadding}px`,
          right: `${infoPadding}px`,
          bottom: `${issuedBottom}px`,
          display: 'flex',
          gap: '6px',
          color: '#1F2937',
          fontFamily: 'Lora, serif',
          fontSize: '14px'
        }}
      >
        <strong style={{ color: '#0F172A', whiteSpace: 'nowrap' }}>Issued upto:</strong>
        <span>{visitingCardData.issuedUpto || 'Dec 2025'}</span>
      </div>
      {logoSrc && (
        <div
          style={{
            position: 'absolute',
            top: '-16px',
            right: '10px',
            width: '74px',
            height: '74px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5
          }}
        >
          <img
            src={logoSrc}
            alt="Parent Logo"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }}
          />
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          top: `${barTop}px`,
          left: `${leftStripWidth}px`,
          width: 0,
          height: 0,
          borderTop: `${halfBarHeight}px solid transparent`,
          borderBottom: `${halfBarHeight}px solid transparent`,
          borderLeft: `${triangleWidth}px solid #3B3B3B`,
          zIndex: 3
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: `${barTop}px`,
          left: leftStripWidth,
          right: 0,
          height: `${barHeight}px`,
          zIndex: 2
        }}
      >
        <div
          style={{
            width: '100%',
            height: `${halfBarHeight}px`,
            backgroundColor: '#E57D26',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: 700,
            letterSpacing: '0.5px',
            fontFamily: 'Lora, serif'
          }}
        >
          {visitingCardData.fullName || 'Aashish Jangra'}
        </div>
        <div
          style={{
            width: '100%',
            height: `${barHeight - halfBarHeight}px`,
            backgroundColor: '#F4AD41',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#3B3B3B',
            fontWeight: 600,
            letterSpacing: '0.5px',
            fontFamily: 'Lora, serif'
          }}
        >
          {`Id : ${visitingCardData.membershipId || '12345'}`}
        </div>
      </div>
    </div>
  );
};

export default Template4;


