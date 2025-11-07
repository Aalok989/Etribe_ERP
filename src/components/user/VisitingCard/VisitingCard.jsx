import React, { useEffect, useMemo, useState } from 'react';
import { FiX, FiSave, FiRefreshCw, FiCheck } from 'react-icons/fi';
import parentLogo from '../../../assets/logos/parent.jpg';
import memberPhoto from '../../../assets/Aashish.png';
import { templates } from './templates';
import { getAssignmentForUser, saveUserTemplateSelection } from '../../../data/mockVisitingCardConfig';

const VisitingCard = ({
  isOpen = false,
  onClose,
  profileData,
  selectedTemplate = 1,
  allowSelection = true,
  displayMode = 'modal',
  showSaveButton = true,
  useMockData = false,
  renderHeaderActions,
}) => {

  const isInline = displayMode === 'inline';

  // Hardcoded data for visiting card (can be replaced with profileData prop)
  const baseMockData = useMemo(() => ({
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
  }), []);

  const visitingCardData = useMemo(() => {
    if (useMockData || !profileData) {
      return baseMockData;
    }

    const sanitizedProfile = {
      ...baseMockData,
      ...Object.fromEntries(
        Object.entries(profileData).filter(([, value]) => value !== undefined && value !== null && value !== '')
      ),
    };

    return sanitizedProfile;
  }, [baseMockData, profileData, useMockData]);

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

  const [currentTemplate, setCurrentTemplate] = useState(initialTemplateId);

  useEffect(() => {
    setCurrentTemplate(initialTemplateId);
  }, [initialTemplateId]);

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
      saveUserTemplateSelection(currentUserId, String(currentTemplate));
      setSaveMessage({ type: 'success', text: 'Template preference saved locally.' });
    } catch (error) {
      console.error('Failed to save visiting card preference:', error);
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
            ? renderHeaderActions?.() || null
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
          <div className="grid gap-6 justify-items-center sm:grid-cols-2 xl:grid-cols-3">
            {assignedTemplates.map((templateNum) => {
              const TemplateComponent = templates[templateNum];
              const isSelected = currentTemplate === templateNum;

              return (
                <div key={templateNum} className="flex flex-col items-center gap-3">
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
                    className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-3xl"
                  >
                    <TemplateComponent
                      cardData={visitingCardData}
                      cardWidth={255}
                      cardHeight={405}
                      cardId={`template-preview-${templateNum}`}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-200">
                    <input
                      type="radio"
                      name="template-selection"
                      value={templateNum}
                      checked={isSelected}
                      onChange={() => setCurrentTemplate(templateNum)}
                      className="h-4 w-4 cursor-pointer text-indigo-600"
                    />
                    <span className={isSelected ? 'text-indigo-600 dark:text-indigo-300' : ''}>
                      Template {templateNum}
                    </span>
                  </label>
                </div>
              );
            })}
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
