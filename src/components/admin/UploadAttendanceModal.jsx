import React, { useState } from "react";
import { FiX, FiUpload, FiFileText, FiAlertCircle } from "react-icons/fi";
import api from "../../api/axiosConfig";
import { getAuthHeaders } from "../../utils/apiHeaders";
import { toast } from "react-toastify";

export default function UploadAttendanceModal({ 
  isOpen, 
  onClose, 
  eventId, 
  eventName,
  onSuccess 
}) {
  const [uploadForm, setUploadForm] = useState({
    event_id: eventId || "",
    file: null
  });
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState({});

  // Update event_id when eventId prop changes
  React.useEffect(() => {
    if (eventId) {
      setUploadForm(prev => ({ ...prev, event_id: eventId }));
    }
  }, [eventId]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'application/csv',
        'application/pdf'
      ];
      
      if (!allowedTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv') && !file.name.endsWith('.pdf')) {
        toast.error("Please select a valid Excel, CSV, or PDF file");
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      
      setUploadForm(prev => ({ ...prev, file }));
      setUploadErrors(prev => ({ ...prev, file: undefined }));
    }
  };

  const validateUploadForm = () => {
    const errors = {};
    if (!uploadForm.event_id) {
      errors.event_id = "Event ID is required";
    }
    if (!uploadForm.file) {
      errors.file = "Please select a file to upload";
    }
    return errors;
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    const errors = validateUploadForm();
    if (Object.keys(errors).length > 0) {
      setUploadErrors(errors);
      toast.error(Object.values(errors).join("\n"));
      return;
    }

    setUploadLoading(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('event_id', uploadForm.event_id);
      formData.append('file', uploadForm.file);

      // Get auth headers from localStorage
      const uid = localStorage.getItem('uid');
      const token = localStorage.getItem('token');
      
      if (!uid || !token) {
        toast.error("Authentication required");
        return;
      }

      // Upload attendance sheet
      const response = await api.post('/attendance/uploadsheet', formData, {
        headers: {
          ...getAuthHeaders(),
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const data = response.data;

      if (data.status === true) {
        toast.success("Attendance sheet uploaded successfully!");
        onClose();
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(data.message || "Failed to upload attendance sheet");
      }
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(`API Error: ${error.response.data.message}`);
      } else if (error.response?.status) {
        toast.error(`HTTP Error: ${error.response.status}`);
      } else {
        toast.error("Failed to upload attendance sheet. Please try again.");
      }
    } finally {
      setUploadLoading(false);
    }
  };

  const handleClose = () => {
    setUploadForm({ event_id: eventId || "", file: null });
    setUploadErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-xl p-8 w-full max-w-2xl mx-4 relative max-h-[90vh] overflow-y-auto">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
          onClick={handleClose}
          title="Close"
        >
          <FiX size={24} />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
            <FiUpload className="text-indigo-600 dark:text-indigo-300" />
            Upload Attendance Sheet
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
            {eventName ? `Upload attendance sheet for: ${eventName}` : "Upload attendance sheet for the selected event"}
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleUploadSubmit}>
          <div className="space-y-4">
            {/* Event ID (hidden if provided) */}
            {!eventId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Event ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="event_id"
                  value={uploadForm.event_id}
                  onChange={(e) => {
                    setUploadForm({ ...uploadForm, event_id: e.target.value });
                    setUploadErrors({ ...uploadErrors, event_id: undefined });
                  }}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-300 focus:border-transparent transition-colors ${
                    uploadErrors.event_id
                      ? "border-red-500"
                      : "border-gray-200 dark:border-gray-600"
                  }`}
                  placeholder="Enter Event ID"
                />
                {uploadErrors.event_id && (
                  <div className="text-red-600 text-xs mt-1">
                    {uploadErrors.event_id}
                  </div>
                )}
              </div>
            )}

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Attendance Sheet File <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors">
                <div className="space-y-1 text-center">
                  <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600 dark:text-gray-400">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept=".xlsx,.xls,.csv,.pdf"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Excel (.xlsx, .xls), CSV, or PDF files up to 5MB
                  </p>
                  {uploadForm.file && (
                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                        Selected: {uploadForm.file.name}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-300">
                        Size: {(uploadForm.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
              {uploadErrors.file && (
                <div className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <FiAlertCircle size={12} />
                  {uploadErrors.file}
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                File Format Requirements:
              </h3>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <li>• File should contain member information (ID, Name, Email, etc.)</li>
                <li>• Supported formats: Excel (.xlsx, .xls), CSV, or PDF</li>
                <li>• Maximum file size: 5MB</li>
                <li>• First row should contain column headers</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="button"
              className="px-6 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              onClick={handleClose}
              disabled={uploadLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadLoading}
              className={`flex items-center gap-2 px-8 py-2 rounded-lg font-medium transition-colors text-white ${
                uploadLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {uploadLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <FiUpload />
                  Upload Sheet
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
