import React, { useState, useEffect } from 'react';
import { FiX, FiDownload } from 'react-icons/fi';
import api from '../../api/axiosConfig';
import { getAuthHeaders } from '../../utils/apiHeaders';

const MemberIDCard = ({ isOpen, onClose, profileData }) => {
  const [groupData, setGroupData] = useState({ signature: "", name: "" });
  const [memberData, setMemberData] = useState({
    profilePhoto: "",
    memberName: "",
    membershipId: "",
    address: "",
    email: "",
    phone: "",
    validUpto: ""
  });

  useEffect(() => {
    if (isOpen) {
      fetchGroupSettings();
      fetchMemberData();
    }
  }, [isOpen, profileData]);

  const fetchGroupSettings = async () => {
    try {
      const response = await api.post(
        '/groupSettings',
        {},
        { headers: getAuthHeaders(), timeout: 10000 }
      );

      const backendData = response.data?.data || response.data || {};
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || api.defaults?.baseURL || "";

      setGroupData({
        name: backendData.name || "",
        signature: backendData.signature
          ? backendData.signature.startsWith('http')
            ? backendData.signature
            : `${API_BASE_URL}/${backendData.signature}`
          : "",
      });
    } catch (err) {
      // Silently fail - use empty values if group settings can't be fetched
      setGroupData({ signature: "", name: "" });
    }
  };

  const fetchMemberData = async () => {
    const storedUid =
      typeof window !== "undefined" ? window.localStorage.getItem("uid") : null;
    const userId =
      profileData?.uid ||
      profileData?.id ||
      profileData?.userId ||
      profileData?.membershipId ||
      storedUid;

    const fallbackMemberData = {
      profilePhoto: "",
      memberName: profileData?.name || "",
      membershipId: profileData?.membershipId || profileData?.id || userId || "",
      address: profileData?.address || "",
      email: profileData?.email || "",
      phone: profileData?.phone || profileData?.phone_num || "",
      validUpto: ""
    };

    if (!userId) {
      setMemberData(fallbackMemberData);
          return;
        }

    try {
      const headers = getAuthHeaders();
      const response = await api.post(
        `/userDetail/get_user_profile/${userId}`,
        {},
        { headers, timeout: 10000 }
      );

      const success =
        response?.data?.status === true ||
        response?.data?.status === 200 ||
        response?.status === 200;
      const profile = response?.data?.data || response?.data;

      if (success && profile) {
        const API_BASE_URL =
          import.meta.env.VITE_API_BASE_URL || api.defaults?.baseURL || "";

        let memberPhotoUrl = "";
        const photoPath =
          profile.profile_image ||
          profile.photo ||
          profile.member_photo ||
          profile.image;
        if (photoPath) {
          if (photoPath.startsWith("http")) {
            memberPhotoUrl = photoPath;
          } else {
            const normalizedPath = photoPath.startsWith("/")
              ? photoPath
              : `/${photoPath}`;
            memberPhotoUrl = `${API_BASE_URL}${normalizedPath}`;
          }
        }

        const addressParts = [
          profile.address,
          profile.city,
          profile.state,
          profile.country,
          profile.pincode
        ].filter(Boolean);

        let validUntil =
          profile.valid_until || profile.valid_upto || profile.valid_to || "";

        try {
          const activeResponse = await api.post(
            "/userDetail/active_members/",
            {},
            { headers, timeout: 10000 }
          );

          if (activeResponse?.data) {
            const activeMembers = Array.isArray(activeResponse.data)
              ? activeResponse.data
              : activeResponse.data.data || activeResponse.data || [];

            const foundMember = activeMembers.find((m) => {
              const idMatch = String(m.id) === String(userId);
              const companyMatch = String(m.company_detail_id) === String(userId);
              const userDetailMatch = String(m.user_detail_id) === String(userId);
              const userIdMatch = String(m.user_id) === String(userId);
              return idMatch || companyMatch || userDetailMatch || userIdMatch;
            });

            if (foundMember) {
              validUntil =
                foundMember.valid_upto ||
                foundMember.valid_until ||
                foundMember.valid_to ||
                validUntil;
            }
          }
        } catch (_) {
          // ignore errors from active_members fallback
        }

        setMemberData({
          profilePhoto: memberPhotoUrl,
          memberName:
            profile.name ||
            profile.member_name ||
            profileData?.name ||
            "",
          membershipId:
            profile.membership_id ||
            profile.member_id ||
            profile.id ||
            profileData?.membershipId ||
            profileData?.id ||
            userId ||
            "",
          address:
            (addressParts.length > 0
              ? addressParts.join(", ")
              : profile.full_address) ||
            profileData?.address ||
            "",
          email: profile.email || profileData?.email || "",
          phone: profile.phone_num || profile.phone || profileData?.phone || profileData?.phone_num || "",
          validUpto: validUntil || ""
        });
      } else {
        setMemberData(fallbackMemberData);
      }
    } catch (error) {
      setMemberData(fallbackMemberData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Member ID Card</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {}}
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
            <div className="flex flex-col items-center py-8">
            {/* Card Container - Standard US ID Card Size (3.375" × 2.125" = 525px × 331px at 155 DPI) */}
              <div
                id="member-id-card"
              className="relative w-[525px] h-[331px] bg-white rounded-lg shadow-2xl overflow-hidden border border-gray-200"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
              {/* Background Design Elements */}
              
              {/* Dark Gray Circle - Complete Circle - Upper Left */}
              <div
                className="absolute"
                style={{
                  top: '-85px',
                  left: '-50px',
                  width: '400px',
                  height: '400px',
                  borderRadius: '50%',
                  backgroundColor: '#373B3C',
                  zIndex: 1
                }}
              />
              {/* Contact Info Block - Between Ribbon and Red Box */}
              <div
                className="absolute"
                style={{
                  top: '90px',
                  left: '-10px',
                  width: '240px',
                  color: '#FFFFFF',
                  padding: '12px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontFamily: "'Lora', serif",
                  zIndex: 2
                }}
              >
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-white/60 mb-1">
                    Email
                  </p>
                  <p className="text-sm font-semibold break-words">
                    {memberData.email || profileData?.email || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-white/60 mb-1">
                    Phone
                  </p>
                  <p className="text-sm font-semibold">
                    {memberData.phone || profileData?.phone || profileData?.phone_num || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-white/60 mb-1">
                    Valid Upto
                  </p>
                  <p className="text-sm font-semibold">
                    {memberData.validUpto || '—'}
                  </p>
                    </div>
                  </div>
              {/* White Ribbon Accent on Gray Circle */}
              <div
                className="absolute"
                style={{
                  top: '30px',
                  left: '-30px',
                  backgroundColor: '#FFFFFF',
                  zIndex: 2,
                  borderTopLeftRadius: '20px',
                  borderBottomLeftRadius: '20px',
                  borderTopRightRadius: '20px',
                  borderBottomRightRadius: '20px',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.25), 0 0 20px rgba(0,0,0,0.15)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px 24px 12px 40px',
                  minHeight: '50px',
                  whiteSpace: 'nowrap'
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    letterSpacing: '0.2em',
                    color: '#AC262D',
                    textTransform: 'uppercase'
                  }}
                >
                  {(groupData.name?.split(' ')[0] || 'Elite')} Member
                      </span>
                    </div>

              {/* Red Rounded Rectangle - Bottom Left - Only top-right corner rounded */}
              <div
                className="absolute"
                style={{
                  bottom: '-110px',
                  left: '-30px',
                  width: '300px',
                  height: '200px',
                  backgroundColor: '#AC262D',
                  borderTopRightRadius: '100px',
                  zIndex: 1,
                  padding: '24px',
                  color: '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ paddingLeft: '20px', paddingRight: '10px', transform: 'translateY(-25px)' }}>
                  <p className="text-xs uppercase tracking-[0.4em] text-white/70 mb-1">
                    Address
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-line mt-0">
                    {memberData.address || profileData?.address || '—'}
                  </p>
                  </div>
                <div className="text-xs text-white/70 italic">
                  Please keep this card handy at all times.
                    </div>
                  </div>

              {/* Signature - Top Right */}
              {groupData.signature && (
                <div className="absolute top-4 right-4 z-20">
                  <img
                    src={groupData.signature}
                    alt="Organization Signature"
                    className="h-8 w-auto"
                  />
                  </div>
                )}

              {/* Profile Image - Square Box in White Area */}
              <div className="absolute top-20 right-4 z-20">
                <div
                  className="bg-gray-200"
                  style={{
                    width: '120px',
                    height: '120px',
                    border: '4px solid #AC262D',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}
                >
                  {memberData.profilePhoto ? (
                          <img
                      src={memberData.profilePhoto}
                            alt="Member Photo"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : null}
                      </div>
                    </div>
              <div
                className="absolute right-4 bottom-2 z-20 text-center flex flex-col items-center gap-1"
                style={{ minWidth: '120px', maxWidth: '200px' }}
              >
                <p className="text-xs font-semibold tracking-[0.4em] uppercase text-gray-500 whitespace-nowrap text-right w-full">
                  ID: {memberData.membershipId || profileData?.membershipId || profileData?.id || '—'}
                </p>
                <p
                  className="text-2xl font-bold tracking-wide uppercase text-black whitespace-nowrap text-right w-full"
                  style={{ fontFamily: "'Lora', serif", overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}
                >
                  {memberData.memberName || profileData?.name || 'Member Name'}
                </p>
                  </div>

              {/* Card Layout - Ready for redesign */}
              <div className="relative z-10 h-full flex flex-col justify-between p-6">
                {/* Card content goes here */}
                      </div>
                    </div>
                  </div>
        </div>
      </div>
    </div>
  );
};

export default MemberIDCard;
