import React from 'react';
import { FaFacebook, FaInstagram, FaLinkedin, FaYoutube, FaPinterest } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

const Template2 = ({ cardData, cardWidth, cardHeight, cardId = 'visiting-card' }) => {
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
        fontFamily: 'Arial, sans-serif',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        backgroundColor: '#FFFFFF'
      }}
    >
      {/* Top Section - Dark Blue Header with Wavy Bottom */}
      <div 
        className="absolute top-0 left-0 right-0"
        style={{
          height: `${cardHeight * 0.25}px`, // ~25% of card height
          backgroundColor: '#1e3a8a', // Dark blue
          position: 'relative',
          overflow: 'visible'
        }}
      >
        {/* Parent Logo - Top Right Corner (White) */}
        {visitingCardData.companyLogo && (
          <div 
            style={{
              position: 'absolute',
              top: '-8px',
              right: '5px',
              width: '80px',
              height: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              filter: 'brightness(0) invert(1)' // Makes the logo white
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
            />
          </div>
        )}

        {/* Member Badge - Left Side with White Background */}
        <div
          style={{
            position: 'absolute',
            left: '15px',
            top: '15px',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)',
            borderRadius: '25px',
            padding: '8px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.25), 0 4px 8px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8), inset 0 -1px 0 rgba(0, 0, 0, 0.05)',
            transform: 'none',
            transition: 'box-shadow 0.3s ease, transform 0.3s ease',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}
        >
          <div
            style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#1e3a8a',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontFamily: 'Arial, sans-serif',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              lineHeight: '1'
            }}
          >
            Member
          </div>
        </div>

        {/* Main Wavy Bottom Edge - Prominent Curve */}
        <svg
          style={{
            position: 'absolute',
            bottom: '-1px',
            left: 0,
            right: 0,
            width: '100%',
            height: '80px',
            zIndex: 1
          }}
          viewBox="0 0 400 80"
          preserveAspectRatio="none"
        >
          <path
            d="M0,30 Q100,60 200,45 Q300,30 400,40 L400,80 L0,80 Z"
            fill="#FFFFFF"
          />
        </svg>
      </div>

      {/* Bottom Section - White with Contact Details */}
      <div
        className="absolute"
        style={{
          bottom: 0,
          left: 0,
          right: 0,
          height: `${cardHeight * 0.75}px`,
          backgroundColor: '#FFFFFF',
          padding: '20px 15px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          position: 'relative',
          overflow: 'visible'
        }}
      >
        {/* Profile Image - Square Box */}
        {visitingCardData.memberPhoto && (
          <div
            style={{
              position: 'absolute',
              top: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '120px',
              height: '120px',
              backgroundColor: '#FFFFFF',
              border: '3px solid #1e3a8a',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
              overflow: 'hidden'
            }}
          >
            <img
              src={visitingCardData.memberPhoto}
              alt="Member Photo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </div>
        )}

        {/* Member Name - Below Profile Image - Center Aligned */}
        <div
          style={{
            position: 'absolute',
            top: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            zIndex: 10,
            width: '100%',
            padding: '0 15px'
          }}
        >
          <div
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#374151',
              fontFamily: 'Lora, serif',
              marginBottom: '0px'
            }}
          >
            {visitingCardData.memberName || ''}
          </div>
        </div>

        {/* Contact Information - Center Aligned with Icons */}
        <div
          style={{
            position: 'absolute',
            top: '140px',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            zIndex: 10,
            width: '100%',
            padding: '0 15px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            alignItems: 'center'
          }}
        >
          {/* Phone */}
          {visitingCardData.phone && (
            <div
              style={{
                fontSize: '16px',
                color: '#374151',
                fontFamily: 'Lora, serif',
                lineHeight: '1.2',
                textAlign: 'center'
              }}
            >
              {visitingCardData.phone}
            </div>
          )}

          {/* Email */}
          {visitingCardData.email && (
            <div
              style={{
                fontSize: '16px',
                color: '#374151',
                fontFamily: 'Lora, serif',
                lineHeight: '1.2',
                textAlign: 'center'
              }}
            >
              {visitingCardData.email}
            </div>
          )}

          {/* Address */}
          {visitingCardData.address && (
            <div
              style={{
                fontSize: '16px',
                color: '#374151',
                fontFamily: 'Lora, serif',
                lineHeight: '1.2',
                textAlign: 'center'
              }}
            >
              {visitingCardData.address}
            </div>
          )}
        </div>

        {/* Issued Upto and ID - Same Row */}
        <div
          style={{
            position: 'absolute',
            top: '230px',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 15px',
            zIndex: 10
          }}
        >
          {/* Issued Upto - Left Side */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '14px',
              color: '#374151',
              fontFamily: 'Lora, serif'
            }}
          >
            <span style={{ fontWeight: 700 }}>Issued upto:</span>
            <span>{visitingCardData.issuedUpto || ''}</span>
          </div>

          {/* Member ID - Right Side */}
          <div
            style={{
              fontSize: '14px',
              fontWeight: 'normal',
              color: '#374151',
              fontFamily: 'Lora, serif'
            }}
          >
            {visitingCardData.membershipId && (
              <>
                <span style={{ fontWeight: 700 }}>Id :</span> {visitingCardData.membershipId}
              </>
            )}
          </div>
        </div>

        {/* Dark Blue Wavy Shape at Bottom - Full Width (Inverted) */}
        <svg
          style={{
            position: 'absolute',
            bottom: '0',
            left: 0,
            right: 0,
            width: '100%',
            height: '80px',
            zIndex: 1
          }}
          viewBox="0 0 400 80"
          preserveAspectRatio="none"
        >
          <path
            d="M0,50 Q100,20 200,35 Q300,50 400,40 L400,80 L0,80 Z"
            fill="#1e3a8a"
          />
        </svg>

        {/* Social Media Icons in Bottom Blue Section */}
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 10
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
                size={18} 
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

export default Template2;
