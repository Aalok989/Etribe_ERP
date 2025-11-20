import React, { useState, useEffect } from 'react';
import { FiX, FiDownload } from 'react-icons/fi';
import api from '../../../api/axiosConfig';
import { getAuthHeaders } from '../../../utils/apiHeaders';
import { useDashboard } from '../../../context/DashboardContext';

const MemberIDCard = ({ isOpen, onClose, profileData }) => {
  const { data: dashboardData } = useDashboard();
  const [loading, setLoading] = useState(true);
  const [idCardData, setIdCardData] = useState({
    memberName: '',
    memberPhoto: null,
    membershipId: '',
    validUpto: '',
    companyLogo: null,
    companyName: '',
    companyId: '',
    email: '',
    phone: '',
    address: '',
    isActive: false
  });

  useEffect(() => {
    if (isOpen) {
      fetchIDCardData();
    }
  }, [isOpen, profileData]);

  const fetchIDCardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const uid = localStorage.getItem('uid');

      if (!token || !uid) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      // Get user_id - use from profile data if available, otherwise use uid
      let userId = profileData?.id || uid;

      // Try to fetch from get_profile endpoint first to get the correct user_id
      try {
        const profileResponse = await api.post('/userDetail/get_profile', {}, {
          headers: getAuthHeaders(),
          timeout: 10000
        });

        if (profileResponse.data.status === true && profileResponse.data.data?.id) {
          userId = profileResponse.data.data.id;
        }
      } catch (error) {
      }

      // Fetch ID card data from the new API endpoint
      try {
        const idCardResponse = await api.post('/IdCard/get_member_card', {
          user_id: parseInt(userId)
        }, {
          headers: getAuthHeaders(),
          timeout: 10000
        });

        if (idCardResponse.data.status === 200 && idCardResponse.data.data?.member_details) {
          const memberDetails = idCardResponse.data.data.member_details;
          const membership = idCardResponse.data.data?.membership || {};
          
          // Map API response to our state structure
          setIdCardData({
            memberName: memberDetails.member_name || 'Member',
            memberPhoto: memberDetails.member_photo_url || null,
            membershipId: memberDetails.user_id || userId,
            validUpto: membership.valid_until || '',
            companyLogo: memberDetails.company_logo_url || null,
            companyName: memberDetails.company_name || '',
            companyId: memberDetails.company_id || idCardResponse.data.data?.organization_id || '',
            email: memberDetails.email || '',
            phone: memberDetails.phone_num || '',
            address: '', // Address not provided in API response
            isActive: membership.is_active === true || membership.is_active === 'true' || membership.is_active === 1
          });
          return;
        }
      } catch (error) {
      }

      // Fallback to old method if new API fails
      let memberData = null;
      
      try {
        const profileResponse = await api.post('/userDetail/get_profile', {}, {
          headers: getAuthHeaders(),
          timeout: 10000
        });

        if (profileResponse.data.status === true && profileResponse.data.data) {
          memberData = profileResponse.data.data;
        }
      } catch (error) {
      }

      if (!memberData && profileData) {
        memberData = profileData;
      }

      // Get membership ID
      let membershipId = memberData?.id || profileData?.id || uid;

      // Get company logo from dashboard context (same as sidebar)
      let companyLogo = null;
      let companyName = '';

      if (dashboardData?.groupData?.signature) {
        companyLogo = dashboardData.groupData.signature;
        companyName = dashboardData.groupData.name || '';
      } else if (dashboardData?.groupData?.logo) {
        companyLogo = dashboardData.groupData.logo;
        companyName = dashboardData.groupData.name || '';
      }

      // Get member photo, name, email, phone, and address
      const memberPhoto = memberData?.profile_image || profileData?.photo || profileData?.profile_image || null;
      const memberName = memberData?.name || profileData?.name || 'Member';
      const email = memberData?.email || profileData?.email || '';
      const phone = memberData?.phone_num || memberData?.phone || profileData?.phone || profileData?.phone_num || '';
      const address = memberData?.address || profileData?.address || '';

      setIdCardData({
        memberName: memberName,
        memberPhoto: memberPhoto,
        membershipId: membershipId,
        validUpto: '',
        companyLogo: companyLogo,
        companyName: companyName,
        companyId: '',
        email: email,
        phone: phone,
        address: address,
        isActive: false
      });
    } catch (error) {
      setError('Failed to load ID card data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    const cardElement = document.getElementById('member-id-card');
    if (!cardElement) return;

    try {
      // Import html2pdf dynamically
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule.html2pdf || html2pdfModule;

      // Configure options for PDF generation
      const opt = {
        margin: 10,
        filename: `Member-ID-Card-${idCardData.membershipId}.pdf`,
        image: { type: 'png', quality: 1.0 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'landscape' 
        }
      };

      // Generate and save PDF
      await html2pdf().set(opt).from(cardElement).save();
    } catch (error) {
      alert('Failed to download ID card as PDF. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Member ID Card</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
              title="Download ID Card as PDF"
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

        {/* ID Card Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-8">
              {/* Active Status Indicator - Above the card */}
              {idCardData.isActive && (
                <div className="mb-3 flex items-center gap-2">
                  <div className="relative">
                    <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg animate-pulse"></div>
                    <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping opacity-75"></div>
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Active Member</span>
                </div>
              )}
              
              <div
                id="member-id-card"
                className="relative w-[450px] h-[320px] bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-700 rounded-xl shadow-2xl overflow-hidden"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                {/* Simple Curved Bubble Shapes Background */}
                <div className="absolute inset-0 opacity-30">
                  {/* Simple curved shape */}
                  <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 450 320" preserveAspectRatio="none">
                    <path d="M0,100 Q225,50 450,100 T450,200 Q225,250 0,200 Z" fill="#a78bfa" opacity="0.6"/>
                  </svg>
                  
                  {/* Simple circular bubble */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-purple-300 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>
                  <div className="absolute bottom-0 left-0 w-56 h-56 bg-indigo-300 rounded-full blur-3xl -ml-28 -mb-28 opacity-40"></div>
                </div>

                {/* L-Shaped Design - Top Left Corner */}
                <div className="absolute top-0 left-0 z-15">
                  <svg width="450" height="320" viewBox="0 0 450 320" preserveAspectRatio="none">
                    {/* Single path for seamless connection at junction - extends to top edge */}
                    <path 
                      d="M 0 40 L 150 40 L 200 0" 
                      stroke="rgba(255, 255, 255, 0.5)" 
                      strokeWidth="4"
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                      fill="none"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </div>

                {/* Company Logo - Centered between top and L-shape horizontal line */}
                {idCardData.companyLogo ? (
                  <div className="absolute left-2 z-20 flex items-center" style={{ top: '20px', maxWidth: '180px', maxHeight: '48px', transform: 'translateY(-50%)' }}>
                    <div className="relative" style={{ filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 4px rgba(255, 255, 255, 0.6)) drop-shadow(0 2px 4px rgba(255, 255, 255, 0.4))' }}>
                      <img
                        src={idCardData.companyLogo.startsWith('http') ? idCardData.companyLogo : `${API_BASE_URL}/${idCardData.companyLogo}`}
                        alt="Company Logo"
                        className="w-auto h-auto object-contain"
                        style={{ maxWidth: '180px', maxHeight: '48px' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    </div>
                  </div>
                ) : null}
                {!idCardData.companyLogo && (
                  <div className="absolute left-2 z-20 flex items-center" style={{ top: '20px', maxWidth: '180px', transform: 'translateY(-50%)' }}>
                    <div className="h-12 px-4 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center shadow-lg border border-white/30" style={{ filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 4px rgba(255, 255, 255, 0.6))' }}>
                      <span className="text-white font-semibold text-sm">
                        {idCardData.companyName || 'Company'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Card Content */}
                <div className="relative z-10 h-full flex flex-col justify-between p-6 text-white">
                  {/* Top Section - Member Badge */}
                  <div className="flex items-center justify-end mb-4">
                    <div className="bg-gray-200 border border-gray-400 px-4 py-1.5 rounded-full">
                      <span className="text-xs font-semibold text-gray-800 uppercase tracking-wider">Member</span>
                    </div>
                  </div>

                  {/* Main Content Section */}
                  <div className="flex-1 flex items-start gap-5 mb-4 min-h-0">
                    {/* Member Photo - Circular with double white border */}
                    <div className="flex-shrink-0 relative">
                      <div className="absolute -inset-1 bg-white rounded-full blur-sm opacity-50"></div>
                      <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl">
                        {idCardData.memberPhoto ? (
                          <img
                            src={`${API_BASE_URL}/${idCardData.memberPhoto}`}
                            alt="Member Photo"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        {!idCardData.memberPhoto && (
                          <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-5xl font-bold">
                            {idCardData.memberName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Member Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-start">
                      <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-3xl font-bold text-white leading-tight">
                          {idCardData.memberName}
                        </h3>
                        {idCardData.isActive && (
                          <div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-lg"></div>
                        )}
                      </div>
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/70 uppercase tracking-wide font-semibold w-20 flex-shrink-0">ID:</span>
                          <span className="text-sm font-mono font-bold text-white">{idCardData.membershipId}</span>
                        </div>
                        {idCardData.email && (
                          <div className="flex items-start gap-2">
                            <span className="text-xs text-white/70 uppercase tracking-wide font-semibold w-20 flex-shrink-0 pt-0.5">EMAIL:</span>
                            <span className="text-xs font-semibold text-white break-words flex-1">{idCardData.email}</span>
                          </div>
                        )}
                        {idCardData.phone && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-white/70 uppercase tracking-wide font-semibold w-20 flex-shrink-0">PHONE:</span>
                            <span className="text-xs font-semibold text-white">{idCardData.phone}</span>
                          </div>
                        )}
                        {idCardData.companyId && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-white/70 uppercase tracking-wide font-semibold w-20 flex-shrink-0">ORG ID:</span>
                            <span className="text-xs font-semibold text-white">{idCardData.companyId}</span>
                          </div>
                        )}
                        {idCardData.companyName && (
                          <div className="flex items-start gap-2">
                            <span className="text-xs text-white/70 uppercase tracking-wide font-semibold w-20 flex-shrink-0 pt-0.5">COMPANY:</span>
                            <span className="text-xs font-semibold text-white break-words flex-1">{idCardData.companyName}</span>
                          </div>
                        )}
                        {idCardData.address && (
                          <div className="flex items-start gap-2">
                            <span className="text-xs text-white/70 uppercase tracking-wide font-semibold w-20 flex-shrink-0 pt-0.5">ADDRESS:</span>
                            <span className="text-xs font-semibold text-white leading-relaxed break-words flex-1">{idCardData.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Section - Valid Upto and Year */}
                  <div className="flex items-center justify-between pt-4 pb-0">
                    <div>
                      <div className="text-xs text-white/70 uppercase tracking-wider mb-1.5 font-semibold">
                        VALID UNTIL
                      </div>
                      <div className="text-lg font-bold text-white">
                        {formatDate(idCardData.validUpto)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-white/70 uppercase tracking-wider mb-1.5 font-semibold">
                        ISSUED
                      </div>
                      <div className="text-lg font-bold text-white">
                        {new Date().getFullYear()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberIDCard;

