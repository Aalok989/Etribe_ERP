const STORAGE_KEY = 'mock-visiting-card-config';

export const templateCatalog = [
  { id: '1', category: 'basic', label: 'Template 1' },
  { id: '2', category: 'standard', label: 'Template 2' },
  { id: '3', category: 'premium', label: 'Template 3' },
  { id: '4', category: 'premium', label: 'Template 4' }
];

const defaultAssignments = {
  '140': { category: 'basic', templateIds: ['1'], selectedTemplateId: '1' },
  '150': { category: 'standard', templateIds: ['2'], selectedTemplateId: '2' },
  '154': { category: 'premium', templateIds: ['3'], selectedTemplateId: '3' }
};

const readFromStorage = () => {
  if (typeof window === 'undefined') return { ...defaultAssignments };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultAssignments };
    const parsed = JSON.parse(raw);
    return { ...defaultAssignments, ...parsed };
  } catch (error) {
    return { ...defaultAssignments };
  }
};

const writeToStorage = (data) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
  }
};

export const getAllAssignments = () => readFromStorage();

export const getAssignmentForUser = (uid) => {
  if (!uid) return null;
  const assignments = readFromStorage();
  return assignments[String(uid)] || null;
};

export const saveAssignmentForUser = (uid, config) => {
  if (!uid || !config) return;
  const assignments = readFromStorage();
  const current = assignments[String(uid)] || {};
  const templateIds = Array.isArray(config.templateIds)
    ? config.templateIds
    : config.templateId
      ? [config.templateId]
      : current.templateIds || [];

  assignments[String(uid)] = {
    category: config.category || current.category || 'all',
    templateIds,
    selectedTemplateId: config.selectedTemplateId || current.selectedTemplateId || templateIds[0],
  };
  writeToStorage(assignments);
};

export const saveUserTemplateSelection = (uid, templateId) => {
  if (!uid || !templateId) return;
  const assignments = readFromStorage();
  const current = assignments[String(uid)] || {};
  const templateIds = current.templateIds || [String(templateId)];
  assignments[String(uid)] = {
    ...current,
    templateIds,
    selectedTemplateId: String(templateId),
  };
  writeToStorage(assignments);
};

export const clearAssignments = () => {
  writeToStorage({ ...defaultAssignments });
};

export const getCategories = () => {
  const categories = new Map();
  templateCatalog.forEach(({ category, id, label }) => {
    if (!categories.has(category)) {
      categories.set(category, []);
    }
    categories.get(category).push({ id, label });
  });
  return categories;
};


