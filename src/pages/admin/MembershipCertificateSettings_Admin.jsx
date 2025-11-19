import React, { useState, useEffect, useMemo } from "react";
import DashboardLayout from "../../components/admin/Layout/DashboardLayout";
import { toast } from "react-toastify";
import {
  FiEdit2,
  FiRefreshCw,
  FiSave,
  FiX,
  FiImage,
  FiUpload,
  FiLayers,
  FiUsers,
} from "react-icons/fi";

const STORAGE_KEY = "membershipCertificateSettings";

const defaultSignatories = [
  { name: "", designation: "", image: "" },
  { name: "", designation: "", image: "" },
  { name: "", designation: "", image: "" },
];

const defaultSettings = {
  mainLogo: "",
  secondaryLogo: "",
  watermarkLogo: "",
  companyName: "Etribe (Empowering Communities)",
  additionalCompanyLine: "",
  signatories: defaultSignatories,
};

const readFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultSettings;
    const parsed = JSON.parse(stored);
    const signatories = Array.isArray(parsed.signatories)
      ? [...parsed.signatories, ...defaultSignatories].slice(0, 3)
      : defaultSignatories;
    return {
      ...defaultSettings,
      ...parsed,
      signatories,
    };
  } catch (error) {
    toast.error("Unable to load saved settings. Using defaults.");
    return defaultSettings;
  }
};

const validateSettings = (settings) => {
  const errors = [];

  if (!settings.companyName?.trim()) {
    errors.push("Company name is required");
  }

  settings.signatories?.forEach((signatory, index) => {
    if (!signatory.name?.trim()) {
      errors.push(`Signatory ${index + 1} name is required`);
    }
    if (!signatory.designation?.trim()) {
      errors.push(`Signatory ${index + 1} designation is required`);
    }
  });

  return errors;
};

const MembershipCertificateSettings = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [formData, setFormData] = useState(defaultSettings);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const init = () => {
      setLoading(true);
      const storedSettings = readFromStorage();
      setSettings(storedSettings);
      setFormData(storedSettings);
      setLoading(false);
    };

    init();
  }, []);

  const hasLogosConfigured = useMemo(() => {
    return Boolean(
      settings.mainLogo || settings.secondaryLogo || settings.watermarkLogo
    );
  }, [settings.mainLogo, settings.secondaryLogo, settings.watermarkLogo]);

  const handleEdit = () => {
    setFormData(settings);
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditMode(false);
    setFormData(settings);
  };

  const handleRefresh = () => {
    setLoading(true);
    const stored = readFromStorage();
    setSettings(stored);
    setFormData(stored);
    setEditMode(false);
    setLoading(false);
    toast.success("Membership certificate settings refreshed");
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignatoryChange = (index, field, value) => {
    setFormData((prev) => {
      const signatories = prev.signatories?.length
        ? [...prev.signatories]
        : [...defaultSignatories];
      signatories[index] = {
        ...signatories[index],
        [field]: value,
      };
      return { ...prev, signatories };
    });
  };

  const handleImageChange = (field, file, index = null) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;

      if (index !== null) {
        setFormData((prev) => {
          const signatories = [...prev.signatories];
          signatories[index] = {
            ...signatories[index],
            image: base64,
          };
          return { ...prev, signatories };
        });
      } else {
        setFormData((prev) => ({ ...prev, [field]: base64 }));
      }

      toast.success("Image uploaded successfully");
    };
    reader.onerror = () => {
      toast.error("Failed to read image. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = (field, index = null) => {
    if (index !== null) {
      setFormData((prev) => {
        const signatories = [...prev.signatories];
        signatories[index] = {
          ...signatories[index],
          image: "",
        };
        return { ...prev, signatories };
      });
    } else {
      setFormData((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const validationErrors = validateSettings(formData);
      if (validationErrors.length) {
        throw new Error(validationErrors.join(", "));
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      setSettings(formData);
      setEditMode(false);
      toast.success("Membership certificate settings saved");
    } catch (error) {
      toast.error(error.message || "Unable to save settings");
    } finally {
      setSubmitting(false);
    }
  };

  const renderLogoPreview = (src, label) => (
    <div className="flex flex-col items-center gap-2">
      <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 w-44 h-32 flex items-center justify-center bg-gray-50">
        {src ? (
          <img src={src} alt={label} className="max-h-24 object-contain" />
        ) : (
          <div className="flex flex-col items-center text-gray-400 text-sm">
            <FiImage size={28} className="mb-1" />
            <span>No image</span>
          </div>
        )}
      </div>
      <p className="text-sm font-medium text-gray-600">{label}</p>
    </div>
  );

  const SectionHeader = ({ icon, title, children }) => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {icon}
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      </div>
      {children}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Membership Certification
            </h1>
            <p className="text-sm text-gray-500">
              Configure logos, organization details, and signatories used to
              generate member certificates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!editMode && (
              <>
                <button
                  onClick={handleRefresh}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
                  disabled={loading}
                >
                  <FiRefreshCw className={loading ? "animate-spin" : ""} />
                  Refresh
                </button>
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition"
                >
                  <FiEdit2 />
                  Edit
                </button>
              </>
            )}

            {editMode && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 transition"
                  disabled={submitting}
                >
                  <FiX />
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <FiRefreshCw className="animate-spin" /> Saving
                    </>
                  ) : (
                    <>
                      <FiSave /> Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
              <SectionHeader
                icon={<FiUpload size={22} className="text-orange-500" />}
                title="Logo Configuration"
              >
                <p className="text-sm text-gray-500">
                  Upload logos used in the certificate layout. We recommend PNG
                  files with transparent backgrounds.
                </p>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {renderLogoPreview(
                    editMode ? formData.mainLogo : settings.mainLogo,
                    "Main Logo (Top Left)"
                  )}
                  {renderLogoPreview(
                    editMode ? formData.secondaryLogo : settings.secondaryLogo,
                    "Additional Logo (Top Right)"
                  )}
                  {renderLogoPreview(
                    editMode ? formData.watermarkLogo : settings.watermarkLogo,
                    "Watermark Logo"
                  )}
                </div>

                {editMode && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      ["mainLogo", "Main Logo", "Recommended size: 250x120px"],
                      [
                        "secondaryLogo",
                        "Additional Logo",
                        "Recommended size: 220x120px",
                      ],
                      [
                        "watermarkLogo",
                        "Watermark Logo",
                        "Recommended size: 500x500px",
                      ],
                    ].map(([field, label, helper]) => (
                      <div key={field} className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">
                          {label}
                        </label>
                        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-4 cursor-pointer hover:border-orange-400 transition">
                          <FiUpload className="text-orange-500" />
                          <span className="text-xs text-gray-500">
                            Click to upload PNG/JPG
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) {
                                handleImageChange(field, file);
                              }
                            }}
                          />
                        </label>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{helper}</span>
                          {formData[field] && (
                            <button
                              type="button"
                              onClick={() => handleImageRemove(field)}
                              className="text-red-500 hover:text-red-600"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {hasLogosConfigured && !editMode && (
                  <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    Logos are configured. Update them anytime using the Edit
                    action.
                  </div>
                )}
              </SectionHeader>

              <SectionHeader
                icon={<FiLayers size={22} className="text-orange-500" />}
                title="Organization Details"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      Company / Organization Name
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        placeholder="Etribe (Empowering Communities)"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    ) : (
                      <p className="text-base text-gray-800 font-medium">
                        {settings.companyName || "—"}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      Additional Line (optional)
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        name="additionalCompanyLine"
                        value={formData.additionalCompanyLine}
                        onChange={handleInputChange}
                        placeholder="Empowering Communities"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    ) : (
                      <p className="text-base text-gray-600">
                        {settings.additionalCompanyLine || "—"}
                      </p>
                    )}
                  </div>
                </div>
              </SectionHeader>

              <SectionHeader
                icon={<FiUsers size={22} className="text-orange-500" />}
                title="Signatories"
              >
                <p className="text-sm text-gray-500 mb-4">
                  Provide the details of signatories displayed at the bottom of
                  the certificate. Images will appear above their names.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {formData.signatories.map((signatory, index) => {
                    const preview = editMode
                      ? signatory.image
                      : settings.signatories?.[index]?.image;
                    const savedSignatory = settings.signatories?.[index] || {};

                    return (
                      <div
                        key={index}
                        className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-700">
                            Signatory {index + 1}
                          </span>
                          {editMode && signatory.image && (
                            <button
                              type="button"
                              onClick={() => handleImageRemove("signatory", index)}
                              className="text-xs text-red-500 hover:text-red-600"
                            >
                              Remove photo
                            </button>
                          )}
                        </div>

                        <div className="flex flex-col items-center gap-2">
                          <div className="w-32 h-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center bg-gray-50">
                            {preview ? (
                              <img
                                src={preview}
                                alt={`Signatory ${index + 1}`}
                                className="max-h-20 object-contain"
                              />
                            ) : (
                              <FiImage className="text-gray-300" size={28} />
                            )}
                          </div>

                          {editMode && (
                            <label className="text-xs text-orange-500 cursor-pointer flex items-center gap-1">
                              <FiUpload size={14} /> Upload photo
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (file) {
                                    handleImageChange("signatory", file, index);
                                  }
                                }}
                              />
                            </label>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-medium text-gray-600">
                            Name
                          </label>
                          {editMode ? (
                            <input
                              type="text"
                              value={signatory.name}
                              onChange={(event) =>
                                handleSignatoryChange(index, "name", event.target.value)
                              }
                              placeholder="Parveen Garg"
                              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                            />
                          ) : (
                            <p className="text-sm font-semibold text-gray-800">
                              {savedSignatory.name || "—"}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-medium text-gray-600">
                            Designation
                          </label>
                          {editMode ? (
                            <input
                              type="text"
                              value={signatory.designation}
                              onChange={(event) =>
                                handleSignatoryChange(
                                  index,
                                  "designation",
                                  event.target.value
                                )
                              }
                              placeholder="President"
                              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                            />
                          ) : (
                            <p className="text-sm text-gray-700">
                              {savedSignatory.designation || "—"}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionHeader>

              {editMode && (
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <FiRefreshCw className="animate-spin" /> Saving
                      </>
                    ) : (
                      <>
                        <FiSave /> Save Changes
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MembershipCertificateSettings;


