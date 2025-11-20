import React, { useEffect, useMemo, useState } from 'react';
import pako from 'pako';
import { FiX, FiSave, FiRefreshCw, FiCheck, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { templates } from './VisitingCard/templates';
import { getAssignmentForUser, saveUserTemplateSelection } from '../../data/mockVisitingCardConfig';
import api from '../../api/axiosConfig';
import { getAuthHeaders } from '../../utils/apiHeaders';

// Helper function to normalize URLs (add protocol if missing)
const normalizeUrl = (url) => {
  if (!url || url.trim() === '') return null;
  const trimmedUrl = url.trim();
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }
  return `https://${trimmedUrl}`;
};

const SHAREABLE_FIELDS = [
  'memberName',
  'membershipId',
  'email',
  'phone',
  'companyName',
  'companyTagline',
  'title',
  'companyId',
  'dob',
  'bloodGroup',
  'address',
  'issuedUpto',
  'memberPhoto',
  'companyLogo',
];

const VisitingCard = ({
  isOpen = false,
  onClose,
  profileData,
  selectedTemplate = 1,
  allowSelection = true,
  displayMode = 'modal',
  showSaveButton = true,
  renderHeaderActions,
  onShare,
}) => {

  const isInline = displayMode === 'inline';

  const [socialMediaData, setSocialMediaData] = useState(null);
  const [loadingSocials, setLoadingSocials] = useState(false);
  const [memberData, setMemberData] = useState(null);
  const [loadingMemberData, setLoadingMemberData] = useState(false);

  // Fetch member data from active_members API
  useEffect(() => {
    const fetchMemberData = async () => {
      const storedUid = typeof window !== 'undefined' ? window.localStorage.getItem('uid') : null;
      const userId = profileData?.uid
        || profileData?.id
        || profileData?.userId
        || profileData?.membershipId
        || storedUid;

      if (!userId) {
        setMemberData(null);
        return;
      }

      try {
        setLoadingMemberData(true);
        const headers = getAuthHeaders();
        const response = await api.post('/userDetail/active_members/', {}, { headers });
        
        if (response.data) {
          const activeMembers = Array.isArray(response.data) 
            ? response.data 
            : response.data.data || response.data || [];
          
          // Find the current user in the active members list
          const foundMember = activeMembers.find(m => {
            const idMatch = String(m.id) === String(userId);
            const companyMatch = String(m.company_detail_id) === String(userId);
            const userDetailMatch = String(m.user_detail_id) === String(userId);
            const userIdMatch = String(m.user_id) === String(userId);
            
            return idMatch || companyMatch || userDetailMatch || userIdMatch;
          });

          if (foundMember) {
            // Format valid_upto to month year only
            let validUpto = '';
            if (foundMember.valid_upto || foundMember.valid_until || foundMember.valid_to) {
              const dateStr = foundMember.valid_upto || foundMember.valid_until || foundMember.valid_to;
              try {
                const date = new Date(dateStr);
                if (!isNaN(date.getTime())) {
                  const month = date.toLocaleString('en-US', { month: 'short' });
                  const year = date.getFullYear();
                  validUpto = `${month} ${year}`;
                }
              } catch (e) {
                validUpto = dateStr;
              }
            }

            // Get company logo URL
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || api.defaults?.baseURL || '';
            let companyLogoUrl = '';
            const logoPath = foundMember.company_logo || foundMember.logo || foundMember.business_logo || foundMember.company_logo_image || foundMember.company_logo_path;
            if (logoPath) {
              if (logoPath.startsWith('http')) {
                companyLogoUrl = logoPath;
              } else {
                const normalizedPath = logoPath.startsWith('/') ? logoPath : `/${logoPath}`;
                companyLogoUrl = `${API_BASE_URL}${normalizedPath}`;
              }
            }

            // Get member photo URL
            let memberPhotoUrl = '';
            const photoPath = foundMember.member_photo || foundMember.photo || foundMember.profile_image || foundMember.profile_photo || foundMember.image;
            if (photoPath) {
              if (photoPath.startsWith('http')) {
                memberPhotoUrl = photoPath;
              } else {
                const normalizedPath = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
                memberPhotoUrl = `${API_BASE_URL}${normalizedPath}`;
              }
            }

            setMemberData({
              memberName: foundMember.name || foundMember.member_name || foundMember.full_name || '',
              email: foundMember.email || '',
              phone: foundMember.phone || foundMember.phone_num || foundMember.contact || '',
              membershipId: foundMember.id || foundMember.member_id || foundMember.membership_id || '',
              issuedUpto: validUpto,
              companyLogo: companyLogoUrl,
              memberPhoto: memberPhotoUrl,
              address: foundMember.address || '',
            });
          } else {
            setMemberData(null);
          }
        } else {
          setMemberData(null);
        }
      } catch (error) {
        setMemberData(null);
      } finally {
        setLoadingMemberData(false);
      }
    };

    fetchMemberData();
  }, [profileData]);

  // Fetch social media data from API
  useEffect(() => {
    const fetchSocialMediaData = async () => {
      // Always try to get userId from localStorage first (real user ID), even if using mock data
      const storedUid = typeof window !== 'undefined' ? window.localStorage.getItem('uid') : null;
      
      // Get userId from profileData or localStorage
      const userId = profileData?.uid
        || profileData?.id
        || profileData?.userId
        || profileData?.membershipId
        || storedUid;

      if (!userId) {
        setSocialMediaData(null);
        return;
      }

      try {
        setLoadingSocials(true);
        const headers = getAuthHeaders();
        const response = await api.get('Socials/index/', { headers });
        
        if (response.data?.status && response.data?.data?.contact) {
          // Find the contact data for the current user
          const userSocialData = response.data.data.contact.find(
            (contact) => String(contact.user_id) === String(userId)
          );
          
          if (userSocialData) {
            setSocialMediaData({
              facebookUrl: normalizeUrl(userSocialData.fb),
              instagramUrl: normalizeUrl(userSocialData.instagram),
              linkedinUrl: normalizeUrl(userSocialData.linkedin),
              youtubeUrl: normalizeUrl(userSocialData.youtube),
              twitterUrl: normalizeUrl(userSocialData.twitter),
              xUrl: normalizeUrl(userSocialData.twitter), // Support both twitterUrl and xUrl
              pinterestUrl: normalizeUrl(userSocialData.pinterest),
            });
          } else {
            setSocialMediaData(null);
          }
        } else {
          setSocialMediaData(null);
        }
      } catch (error) {
        setSocialMediaData(null);
      } finally {
        setLoadingSocials(false);
      }
    };

    fetchSocialMediaData();
  }, [profileData]);

  const visitingCardData = useMemo(() => {
    let cardData = {};
    
    // Use real-time member data from API
    if (memberData) {
      cardData = {
        memberName: memberData.memberName || '',
        email: memberData.email || '',
        phone: memberData.phone || '',
        membershipId: memberData.membershipId || '',
        issuedUpto: memberData.issuedUpto || '',
        companyLogo: memberData.companyLogo || '',
        memberPhoto: memberData.memberPhoto || '',
        address: memberData.address || '',
      };
    } else if (profileData) {
      // Fallback to profileData if API data not available
      cardData = {
        ...Object.fromEntries(
          Object.entries(profileData).filter(([, value]) => value !== undefined && value !== null && value !== '')
        ),
      };
    }

    // Merge social media data if available
    if (socialMediaData) {
      Object.keys(socialMediaData).forEach((key) => {
        if (socialMediaData[key]) {
          cardData[key] = socialMediaData[key];
        }
      });
    }

    return cardData;
  }, [profileData, socialMediaData, memberData]);

  const templateKeys = useMemo(() => Object.keys(templates).sort(), []);

  const storedUid = typeof window !== 'undefined' ? window.localStorage.getItem('uid') : null;

  const currentUserId = profileData?.uid
    || profileData?.id
    || profileData?.userId
    || profileData?.membershipId
    || storedUid
    || visitingCardData.membershipId;

  const assignment = getAssignmentForUser(currentUserId);
  const isAdmin = String(currentUserId) === '1';

  const initialTemplateId = useMemo(() => {
    if (assignment?.selectedTemplateId && templates[assignment.selectedTemplateId]) {
      return Number(assignment.selectedTemplateId);
    }
    if (assignment && Array.isArray(assignment.templateIds)) {
      const valid = assignment.templateIds.find((id) => templates[id]);
      if (valid) {
        return Number(valid);
      }
    }
    return Number(selectedTemplate) || Number(templateKeys[0]) || 1;
  }, [assignment, selectedTemplate, templateKeys]);

  const defaultTemplateId = useMemo(() => {
    return (assignment?.defaultTemplateId && templates[assignment.defaultTemplateId])
      ? Number(assignment.defaultTemplateId)
      : initialTemplateId;
  }, [assignment, initialTemplateId]);

  const [currentTemplate, setCurrentTemplate] = useState(initialTemplateId);
  const [markedDefaultTemplate, setMarkedDefaultTemplate] = useState(defaultTemplateId ?? null);

  useEffect(() => {
    setCurrentTemplate(initialTemplateId);
  }, [initialTemplateId]);

  useEffect(() => {
    setMarkedDefaultTemplate(defaultTemplateId ?? null);
  }, [defaultTemplateId]);

  const assignedTemplates = useMemo(() => {
    if (isAdmin || !assignment) {
      return templateKeys.map(Number);
    }
    if (assignment && Array.isArray(assignment.templateIds)) {
      const valid = assignment.templateIds.filter((id) => templates[id]).map(Number);
      if (valid.length > 0) {
        return valid;
      }
    }
    return templateKeys.map(Number);
  }, [assignment, isAdmin, templateKeys]);

  const availableTemplates = useMemo(() => {
    if (allowSelection) {
      return assignedTemplates;
    }
    return [Number(initialTemplateId)];
  }, [allowSelection, assignedTemplates, initialTemplateId]);

  const isSingleTemplate = assignedTemplates.length <= 1;

  useEffect(() => {
    if (availableTemplates.length === 0) return;
    if (!availableTemplates.includes(currentTemplate)) {
      setCurrentTemplate(availableTemplates[0]);
    }
  }, [availableTemplates, currentTemplate]);

  // Get the selected template component
  const SelectedTemplate = templates[currentTemplate] || templates[1];

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  const sharePayload = useMemo(() => {
    const minimalCardData = SHAREABLE_FIELDS.reduce((acc, key) => {
      const value = visitingCardData?.[key];
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});

    return {
      templateId: markedDefaultTemplate || currentTemplate,
      cardData: minimalCardData,
    };
  }, [currentTemplate, markedDefaultTemplate, visitingCardData]);

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      const json = JSON.stringify(sharePayload);
      const compressed = pako.deflate(json, { to: 'string' });
      const encoded = btoa(compressed)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      return `${window.location.origin}/share/visiting-card/${encoded}`;
    } catch (error) {
      return null;
    }
  }, [sharePayload]);

  const handleShareRequest = async () => {
    if (!shareUrl) {
      onShare?.({ url: null, status: 'error', error: new Error('Share link not available') });
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: visitingCardData?.memberName || 'Visiting Card',
          url: shareUrl,
        });
        onShare?.({ url: shareUrl, status: 'shared' });
        return;
      } catch (error) {
        if (error?.name === 'AbortError') {
          onShare?.({ url: shareUrl, status: 'cancelled' });
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      onShare?.({ url: shareUrl, status: 'copied' });
    } catch (error) {
      onShare?.({ url: shareUrl, status: 'error', error });
    }
  };

  const shouldRender = isInline || isOpen;
  if (!shouldRender) return null;

  const handleSave = () => {
    if (!allowSelection) return;
    if (!currentUserId) {
      setSaveMessage({ type: 'error', text: 'Unable to determine user. Please log in again.' });
      return;
    }

    try {
      setSaving(true);
      const templateToPersist = markedDefaultTemplate || currentTemplate;
      saveUserTemplateSelection(currentUserId, String(templateToPersist));
      setSaveMessage({ type: 'success', text: `Template ${templateToPersist} saved as default.` });
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to save template selection.' });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 2500);
    }
  };

  const handleOverlayClick = (event) => {
    if (isInline) return;
    if (event.target === event.currentTarget && onClose) {
      onClose();
    }
  };

  const previewWidth = allowSelection ? 320 : 360;
  const previewHeight = Math.round((405 / 255) * previewWidth);

  const headerTitle = allowSelection ? 'Choose Your Visiting Card' : 'Your Visiting Card';
  const headerSubtitle = allowSelection
    ? 'Select the design you prefer and save it for quick access later.'
    : 'Here is the visiting card currently assigned to you.';

  const inlineTitle = 'Available Templates';

  if (!allowSelection) {
    const assignedCard = (
      <SelectedTemplate
        cardData={visitingCardData}
        cardWidth={255}
        cardHeight={405}
        cardId="assigned-visiting-card"
      />
    );

    if (isInline) {
      return (
        <div className="w-full flex justify-center">
          {assignedCard}
        </div>
      );
    }

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm px-4 py-6"
        onClick={handleOverlayClick}
      >
        {assignedCard}
      </div>
    );
  }

  const cardContainerClass = isInline
    ? 'relative w-full'
    : 'relative w-full max-w-5xl overflow-hidden rounded-3xl bg-white/95 shadow-2xl dark:bg-slate-900/95';

  const wrapperClass = isInline
    ? 'w-full'
    : 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 py-6';

  const inlinePadding = 'px-2 sm:px-4';

  const headerClass = isInline
    ? `flex items-start justify-between gap-4 pb-4 ${inlinePadding}`
    : 'flex items-start justify-between gap-4 border-b border-slate-200 px-6 pt-6 pb-4 shadow-sm dark:border-slate-800 sm:px-8 sm:pt-8';

  const bodyClass = isInline
    ? `flex flex-col gap-6 ${inlinePadding}`
    : 'flex flex-col gap-6 px-6 py-6 sm:px-8';

  const footerClass = isInline
    ? `flex justify-end gap-3 pt-4 ${inlinePadding}`
    : 'flex justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/80';

  const headerActions = isInline
    ? renderHeaderActions?.({
        currentTemplate,
        defaultTemplate: markedDefaultTemplate || currentTemplate,
        shareUrl,
        triggerShare: handleShareRequest,
      }) || null
    : null;

  useEffect(() => {
    if (!assignedTemplates.includes(currentTemplate) && assignedTemplates.length > 0) {
      setCurrentTemplate(assignedTemplates[0]);
    }
  }, [assignedTemplates, currentTemplate]);

  useEffect(() => {
    if (isSingleTemplate && assignedTemplates[0] !== undefined) {
      setMarkedDefaultTemplate(assignedTemplates[0]);
    }
  }, [isSingleTemplate, assignedTemplates]);

  const activeIndex = assignedTemplates.findIndex((template) => template === currentTemplate);

  const navigateTemplates = (direction) => {
    if (assignedTemplates.length <= 1) return;
    const currentIdx = activeIndex === -1 ? 0 : activeIndex;

    if (direction === 'prev') {
      if (currentIdx <= 0) return;
      setCurrentTemplate(assignedTemplates[currentIdx - 1]);
      return;
    }

    if (direction === 'next') {
      if (currentIdx >= assignedTemplates.length - 1) return;
      setCurrentTemplate(assignedTemplates[currentIdx + 1]);
    }
  };

  const canGoPrev = assignedTemplates.length > 1 && activeIndex > 0;
  const canGoNext =
    assignedTemplates.length > 1 && activeIndex < assignedTemplates.length - 1;

  const isCurrentMarkedDefault = markedDefaultTemplate === currentTemplate;

  const toggleDefaultTemplate = (checked) => {
    if (checked) {
      setMarkedDefaultTemplate(currentTemplate);
    } else if (isCurrentMarkedDefault) {
      setMarkedDefaultTemplate(null);
    }
  };

  return (
    <div
      className={wrapperClass}
      onClick={handleOverlayClick}
    >
      <div className={cardContainerClass}>
        <div className={headerClass}>
          <div>
            {!isInline && (
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-400">Visiting Card</p>
            )}
            <h2 className={`font-bold text-slate-900 dark:text-white ${isInline ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'}`}>
              {isInline ? inlineTitle : headerTitle}
            </h2>
            {!isInline && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300 max-w-2xl">{headerSubtitle}</p>
            )}
          </div>
          {isInline
            ? headerActions
            : (
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <FiX size={18} />
              </button>
            )}
        </div>

        <div className={bodyClass}>
          <div className="relative flex w-full flex-col items-center justify-center">
            <div className="relative flex h-[470px] w-full items-center justify-center overflow-visible">
              {assignedTemplates.length > 1 && (
                <>
                  <button
                    type="button"
                    disabled={!canGoPrev}
                    onClick={() => navigateTemplates('prev')}
                    className={`absolute left-6 z-20 flex h-11 w-11 items-center justify-center rounded-full ring-1 transition ${
                      canGoPrev
                        ? 'bg-white shadow-lg ring-slate-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-xl dark:bg-slate-800 dark:ring-slate-700'
                        : 'bg-white/70 shadow-md ring-slate-200/70 opacity-40 cursor-not-allowed pointer-events-none dark:bg-slate-800/60 dark:ring-slate-700/40'
                    }`}
                    aria-label="Previous template"
                  >
                    <FiChevronLeft size={22} className="text-slate-700 dark:text-slate-200" />
                  </button>
                  <button
                    type="button"
                    disabled={!canGoNext}
                    onClick={() => navigateTemplates('next')}
                    className={`absolute right-6 z-20 flex h-11 w-11 items-center justify-center rounded-full ring-1 transition ${
                      canGoNext
                        ? 'bg-white shadow-lg ring-slate-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-xl dark:bg-slate-800 dark:ring-slate-700'
                        : 'bg-white/70 shadow-md ring-slate-200/70 opacity-40 cursor-not-allowed pointer-events-none dark:bg-slate-800/60 dark:ring-slate-700/40'
                    }`}
                    aria-label="Next template"
                  >
                    <FiChevronRight size={22} className="text-slate-700 dark:text-slate-200" />
                  </button>
                </>
              )}

              {assignedTemplates.map((templateNum, index) => {
                const TemplateComponent = templates[templateNum];
                const offset = index - (activeIndex === -1 ? 0 : activeIndex);
                const isActive = offset === 0;
                if (Math.abs(offset) > 1) return null;

                const baseWidth = 255;
                const baseHeight = Math.round((405 / 255) * baseWidth);
                const translateX = offset * 280;
                const scale = isActive ? 1.18 : 0.78;
                const opacity = isActive ? 1 : 0.5;

                return (
                  <div
                    key={templateNum}
                    className="absolute flex items-center justify-center"
                    style={{
                      transform: `translateX(${translateX}px) scale(${scale})`,
                      transition: 'transform 300ms ease, opacity 300ms ease',
                      opacity,
                      zIndex: isActive ? 30 : 20 - Math.abs(offset),
                    }}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setCurrentTemplate(templateNum)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setCurrentTemplate(templateNum);
                        }
                      }}
                      className="group relative cursor-pointer rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                      style={{
                        width: baseWidth,
                        height: baseHeight,
                      }}
                    >
                      <TemplateComponent
                        cardData={visitingCardData}
                        cardWidth={baseWidth}
                        cardHeight={baseHeight}
                        cardId={`template-preview-${templateNum}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {!isSingleTemplate && (
              <div className="mt-6 flex flex-col items-center justify-center gap-3">
                <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={isCurrentMarkedDefault}
                    onChange={(event) => toggleDefaultTemplate(event.target.checked)}
                    className="h-4 w-4 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Mark this template as default</span>
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-300">
                  Default template for preview/share:&nbsp;
                  <span className="font-semibold text-slate-700 dark:text-slate-100">
                    {markedDefaultTemplate ? `Template ${markedDefaultTemplate}` : 'None selected'}
                  </span>
                </p>
              </div>
            )}

            {assignedTemplates.length > 0 && (
              <div className="mt-2 flex items-center justify-center gap-2">
                {assignedTemplates.map((templateNum) => {
                  const isSelected = templateNum === currentTemplate;
                  return (
                    <button
                      key={`indicator-${templateNum}`}
                      type="button"
                      onClick={() => setCurrentTemplate(templateNum)}
                      aria-label={`Select template ${templateNum}`}
                      className={`h-2.5 w-2.5 rounded-full transition ${
                        isSelected
                          ? 'bg-indigo-500 scale-110'
                          : templateNum === markedDefaultTemplate
                            ? 'bg-indigo-300 hover:bg-indigo-400 dark:bg-indigo-500/70 dark:hover:bg-indigo-400'
                            : 'bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500'
                      }`}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {saveMessage && (
            <div
              className={`rounded-2xl px-4 py-3 text-sm font-medium shadow-sm ${
                saveMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {saveMessage.text}
            </div>
          )}
        </div>

        {allowSelection && showSaveButton && (
          <div className={footerClass}>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-full bg-green-500 p-3 text-white shadow-lg transition hover:bg-green-600 disabled:opacity-50"
            >
              {saving ? <FiRefreshCw className="animate-spin" size={18} /> : <FiCheck size={18} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisitingCard;
