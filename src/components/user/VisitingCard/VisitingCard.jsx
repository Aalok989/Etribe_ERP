import React, { useEffect, useMemo, useState } from 'react';
import { FiX, FiSave, FiRefreshCw } from 'react-icons/fi';
import parentLogo from '../../../assets/logos/parent.jpg';
import memberPhoto from '../../../assets/Aashish.png';
import { templates } from './templates';
import { getAssignmentForUser, saveUserTemplateSelection } from '../../../data/mockVisitingCardConfig';

const VisitingCard = ({ isOpen, onClose, profileData, selectedTemplate = 1, allowSelection = true }) => {

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

  if (!isOpen) return null;

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
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const previewWidth = allowSelection ? 320 : 360;
  const previewHeight = Math.round((405 / 255) * previewWidth);

  const headerTitle = allowSelection ? 'Choose Your Visiting Card' : 'Your Visiting Card';
  const headerSubtitle = allowSelection
    ? 'Select the design you prefer and save it for quick access later.'
    : 'Here is the visiting card currently assigned to you.';

  if (!allowSelection) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm px-4 py-6"
        onClick={handleOverlayClick}
      >
        <SelectedTemplate
          cardData={visitingCardData}
          cardWidth={255}
          cardHeight={405}
          cardId="assigned-visiting-card"
        />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 py-6"
      onClick={handleOverlayClick}
    >
      <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl bg-white/95 shadow-2xl dark:bg-slate-900/95">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 pt-6 pb-4 shadow-sm dark:border-slate-800 sm:px-8 sm:pt-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-400">Visiting Card</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{headerTitle}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300 max-w-2xl">{headerSubtitle}</p>
          </div>
        </div>

        <div className="flex flex-col gap-6 px-6 py-6 sm:px-8">
          <div className="grid gap-6 justify-items-center sm:grid-cols-2 xl:grid-cols-3">
            {assignedTemplates.map((templateNum) => {
              const TemplateComponent = templates[templateNum];
              const isSelected = currentTemplate === templateNum;

              return (
                <button
                  key={templateNum}
                  type="button"
                  onClick={() => setCurrentTemplate(templateNum)}
                  className={`group flex w-[255px] flex-col items-center rounded-3xl border bg-white/95 p-4 shadow-sm transition-all hover:shadow-lg dark:bg-slate-900/80 ${
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-200 dark:border-indigo-400 dark:ring-indigo-900'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <TemplateComponent
                    cardData={visitingCardData}
                    cardWidth={255}
                    cardHeight={405}
                    cardId={`template-preview-${templateNum}`}
                  />
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="radio"
                      name="template-selection"
                      value={templateNum}
                      checked={isSelected}
                      onChange={() => setCurrentTemplate(templateNum)}
                      className="h-4 w-4 cursor-pointer text-indigo-600"
                    />
                    <span
                      className={`text-sm font-medium ${
                        isSelected
                          ? 'text-indigo-600 dark:text-indigo-300'
                          : 'text-slate-600 dark:text-slate-200'
                      }`}
                    >
                      Template {templateNum}
                    </span>
                  </div>
                </button>
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

        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/80">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? <FiRefreshCw className="animate-spin" size={18} /> : <FiSave size={18} />}
            {saving ? 'Saving…' : 'Save Selection'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisitingCard;
