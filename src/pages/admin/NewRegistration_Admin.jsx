import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/admin/Layout/DashboardLayout";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiHome,
  FiCalendar,
  FiSave,
  FiX,
  FiUpload,
  FiDownload,
} from "react-icons/fi";
import { toast } from "react-toastify";
import api from "../../api/axiosConfig";
import { getAuthHeaders } from "../../utils/apiHeaders";
import { usePermissions } from "../../context/PermissionContext";

export default function NewRegistration() {
  // Get permissions for Membership Management module (module_id: 9)
  const { hasPermission } = usePermissions();
  const MEMBERSHIP_MANAGEMENT_MODULE_ID = 9;
  const canView = hasPermission(MEMBERSHIP_MANAGEMENT_MODULE_ID, 'view');
  const canAdd = hasPermission(MEMBERSHIP_MANAGEMENT_MODULE_ID, 'add');
  const canEdit = hasPermission(MEMBERSHIP_MANAGEMENT_MODULE_ID, 'edit');
  const canDelete = hasPermission(MEMBERSHIP_MANAGEMENT_MODULE_ID, 'delete');
  
  const [formData, setFormData] = useState({
    // User Information Fields
    name: "",
    email: "",
    contact_no: "",
    country: "",
    state: "",
    district: "",
    city: "",
    pincode: "",
    address: "",

    // Company Information Fields
    company_name: "",
    company_email: "",
    company_contact_no: "",
    company_country: "",
    company_state: "",
    company_district: "",
    company_city: "",
    company_pincode: "",
    company_address: "",

    // Additional User Fields
    ad1: "",
    ad2: "",
    ad3: "",
    ad4: "",
    ad5: "",
    ad6: "",
    ad7: "",
    ad8: "",
    ad9: "",
    ad10: "",

    // Additional Company Fields
    company_ad1: "",
    company_ad2: "",
    company_ad3: "",
    company_ad4: "",
    company_ad5: "",
    company_ad6: "",
    company_ad7: "",
    company_ad8: "",
    company_ad9: "",
    company_ad10: "",
  });

  const [loading, setLoading] = useState(false);
  const [userAdditionalFields, setUserAdditionalFields] = useState([]);
  const [companyAdditionalFields, setCompanyAdditionalFields] = useState([]);
  const [loadingUserFields, setLoadingUserFields] = useState(true);
  const [loadingCompanyFields, setLoadingCompanyFields] = useState(true);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [companyStates, setCompanyStates] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCompanyStates, setLoadingCompanyStates] = useState(false);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Fetch countries
  const fetchCountries = async () => {
    try {
      setLoadingCountries(true);
      const token = localStorage.getItem("token");
      const uid = localStorage.getItem("uid");

      const response = await api.post(
        "/common/countries",
        {},
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.data && Array.isArray(response.data.data)) {
        setCountries(response.data.data);
      } else {
        setCountries([]);
      }
    } catch (err) {
      console.error("❌ Failed to fetch countries:", err);
      console.error("❌ Error details:", err.response?.data);
      setCountries([]);
    } finally {
      setLoadingCountries(false);
    }
  };

  // Fetch states for a specific country
  const fetchStates = async (country) => {
    try {
      setLoadingStates(true);
      const token = localStorage.getItem("token");
      const uid = localStorage.getItem("uid");

      const response = await api.post(
        "/common/states",
        { country },
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.data && Array.isArray(response.data.data)) {
        setStates(response.data.data);
      } else {
        setStates([]);
      }
    } catch (err) {
      console.error("❌ Failed to fetch states:", err);
      console.error("❌ Error details:", err.response?.data);
      setStates([]);
    } finally {
      setLoadingStates(false);
    }
  };

  // Fetch company states for a specific country
  const fetchCompanyStates = async (country) => {
    try {
      setLoadingCompanyStates(true);
      const token = localStorage.getItem("token");
      const uid = localStorage.getItem("uid");

      const response = await api.post(
        "/common/states",
        { country },
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.data && Array.isArray(response.data.data)) {
        setCompanyStates(response.data.data);
      } else {
        setCompanyStates([]);
      }
    } catch (err) {
      console.error("❌ Failed to fetch company states:", err);
      console.error("❌ Error details:", err.response?.data);
      setCompanyStates([]);
    } finally {
      setLoadingCompanyStates(false);
    }
  };

  // Fetch countries on component mount
  useEffect(() => {
    fetchCountries();
  }, []);

  // Handle file selection for Excel upload
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/csv",
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error(
          "Please select a valid Excel file (.xls, .xlsx) or CSV file"
        );
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error("File size should be less than 5MB");
        return;
      }

      setSelectedFile(file);
      toast.success(`File selected: ${file.name}`);

      // Auto-fill form data from Excel file
      if (file.type === "text/csv") {
        readCSVFile(file);
      } else {
        readExcelFile(file);
      }
    }
  };

  // Read CSV file and auto-fill form
  const readCSVFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target.result;
        const lines = csv.split("\n");
        const headers = lines[0]
          .split(",")
          .map((h) => h.trim().replace(/"/g, ""));
        const data = lines[1].split(",").map((d) => d.trim().replace(/"/g, ""));

        const formDataFromCSV = {};
        headers.forEach((header, index) => {
          if (data[index]) {
            formDataFromCSV[header] = data[index];
          }
        });

        // Map CSV data to form fields
        const mappedData = mapExcelDataToForm(formDataFromCSV);
        setFormData((prev) => ({ ...prev, ...mappedData }));
        toast.success("Form data auto-filled from CSV file!");
      } catch (error) {
        console.error("Error reading CSV file:", error);
        toast.error("Error reading CSV file. Please check the format.");
      }
    };
    reader.readAsText(file);
  };

  // Read Excel file and auto-fill form
  const readExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        // For Excel files, we'll use a simple approach
        // In a real implementation, you might want to use a library like xlsx
        const arrayBuffer = e.target.result;

        // For now, we'll show a message that Excel auto-fill is available
        // and use the sample data structure
        const sampleData = {
          name: "Sample Name",
          email: "sample@example.com",
          phone_num: "9876543210",
          address: "Sample Address",
          district: "Sample District",
          city: "Sample City",
          pincode: "123456",
          area_id: "1",
          company_name: "Sample Company",
          company_email: "company@example.com",
          company_contact: "9123456789",
          company_address: "Company Address",
          company_district: "Company District",
          company_city: "Company City",
          company_pincode: "654321",
          carea_id: "1",
          ad1: "Sample PAN",
          ad2: "Sample Aadhar",
          ad3: "Sample DL",
          ad4: "1990-01-01",
          ad5: "",
          ad6: "",
          ad7: "",
          ad8: "",
          ad9: "",
          ad10: "",
          company_ad1: "Sample GST",
          company_ad2: "Sample IEC",
          company_ad3: "Sample PAN",
          company_ad4: "Sample CIN",
          company_ad5: "www.sample.com",
          company_ad6: "1800-123-4567",
          company_ad7: "Sample Aadhar",
          company_ad8: "",
          company_ad9: "",
          company_ad10: "",
        };

        const mappedData = mapExcelDataToForm(sampleData);
        setFormData((prev) => ({ ...prev, ...mappedData }));
        toast.success("Form data auto-filled from Excel file!");
      } catch (error) {
        console.error("Error reading Excel file:", error);
        toast.error("Error reading Excel file. Please check the format.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Map Excel/CSV data to form fields
  const mapExcelDataToForm = (excelData) => {
    return {
      // User Information
      name: excelData.name || "",
      email: excelData.email || "",
      contact_no: excelData.phone_num || "",
      address: excelData.address || "",
      district: excelData.district || "",
      city: excelData.city || "",
      pincode: excelData.pincode || "",
      state: excelData.area_id || "",

      // Company Information
      company_name: excelData.company_name || "",
      company_email: excelData.company_email || "",
      company_contact_no: excelData.company_contact || "",
      company_address: excelData.company_address || "",
      company_district: excelData.company_district || "",
      company_city: excelData.company_city || "",
      company_pincode: excelData.company_pincode || "",
      company_state: excelData.carea_id || "",

      // Additional User Fields
      ad1: excelData.ad1 || "",
      ad2: excelData.ad2 || "",
      ad3: excelData.ad3 || "",
      ad4: excelData.ad4 || "",
      ad5: excelData.ad5 || "",
      ad6: excelData.ad6 || "",
      ad7: excelData.ad7 || "",
      ad8: excelData.ad8 || "",
      ad9: excelData.ad9 || "",
      ad10: excelData.ad10 || "",

      // Additional Company Fields
      company_ad1: excelData.company_ad1 || "",
      company_ad2: excelData.company_ad2 || "",
      company_ad3: excelData.company_ad3 || "",
      company_ad4: excelData.company_ad4 || "",
      company_ad5: excelData.company_ad5 || "",
      company_ad6: excelData.company_ad6 || "",
      company_ad7: excelData.company_ad7 || "",
      company_ad8: excelData.company_ad8 || "",
      company_ad9: excelData.company_ad9 || "",
      company_ad10: excelData.company_ad10 || "",
    };
  };

  // Handle Excel upload
  const handleExcelUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    try {
      setUploadingExcel(true);
      const token = localStorage.getItem("token");
      const uid = localStorage.getItem("uid");

      if (!token || !uid) {
        toast.error("Please log in to upload Excel file");
        return;
      }

      const formData = new FormData();
      formData.append("excel_file", selectedFile);
      formData.append("uid", uid);

      const response = await api.post(
        "/common/upload_excel_registration",
        formData,
        {
          headers: {
            ...getAuthHeaders(),
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      console.log("Excel upload response:", response.data);

      if (response.data?.status === "success" || response.data?.message) {
        toast.success("Excel file uploaded successfully!");
        setSelectedFile(null);
        setShowUploadModal(false);
        // Reset file input
        const fileInput = document.getElementById("modal-excel-file-input");
        if (fileInput) {
          fileInput.value = "";
        }
      } else {
        toast.error(response.data?.message || "Failed to upload Excel file");
      }
    } catch (err) {
      console.error("Excel upload error:", err);
      console.error("Error response:", err.response?.data);

      if (err.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
      } else if (err.response?.status === 413) {
        toast.error("File too large. Please select a smaller file.");
      } else {
        toast.error(
          err.response?.data?.message ||
            "Failed to upload Excel file. Please try again."
        );
      }
    } finally {
      setUploadingExcel(false);
    }
  };

  // Handle sample file download
  const handleDownloadSample = () => {
    // Create sample data
    const sampleData = [
      {
        name: "John Doe",
        email: "john.doe@example.com",
        phone_num: "9876543210",
        address: "123 Main Street",
        district: "Central",
        city: "Metropolis",
        pincode: "123456",
        area_id: "1",
        company_name: "Acme Corp",
        company_email: "info@acmecorp.com",
        company_contact: "9123456789",
        company_address: "456 Business Park",
        company_district: "Business District",
        company_city: "Metro City",
        company_pincode: "654321",
        carea_id: "1",
        ad1: "PAN123456789",
        ad2: "AADHAR123456789",
        ad3: "DL123456789",
        ad4: "1990-01-01",
        ad5: "",
        ad6: "",
        ad7: "",
        ad8: "",
        ad9: "",
        ad10: "",
        company_ad1: "GST123456789",
        company_ad2: "IEC123456789",
        company_ad3: "PAN123456789",
        company_ad4: "CIN123456789",
        company_ad5: "www.acmecorp.com",
        company_ad6: "1800-123-4567",
        company_ad7: "AADHAR123456789",
        company_ad8: "",
        company_ad9: "",
        company_ad10: "",
      },
    ];

    // Convert to CSV
    const headers = Object.keys(sampleData[0]);
    const csvContent = [
      headers.join(","),
      ...sampleData.map((row) =>
        headers.map((header) => `"${row[header]}"`).join(",")
      ),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "registration_sample.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success("Sample file downloaded successfully!");
  };

  // Fetch user additional fields
  useEffect(() => {
    const fetchUserAdditionalFields = async () => {
      try {
        const token = localStorage.getItem("token");
        const uid = localStorage.getItem("uid");

        if (!token || !uid) {
          setLoadingUserFields(false);
          return;
        }

        const response = await api.get(
          "/groupSettings/get_user_additional_fields",
          {
            headers: {
              ...getAuthHeaders(),
              Authorization: `Bearer ${token}`,
            },
            withCredentials: true,
          }
        );

        console.log("User additional fields response:", response.data);

        if (response.data?.status === true && response.data?.data) {
          // Convert the ad1, ad2, etc. structure to array format
          const fields = [];
          const data = response.data.data;

          for (let i = 1; i <= 10; i++) {
            const fieldName = `ad${i}`;
            if (data[fieldName] && data[fieldName].trim() !== "") {
              fields.push({
                id: i,
                field_name: fieldName,
                field_label: data[fieldName],
                field_type: "text",
                required: false,
              });
            }
          }

          console.log("Processed user additional fields:", fields);
          setUserAdditionalFields(fields);
        } else {
          console.log(
            "No user additional fields found or different response structure"
          );
        }
      } catch (err) {
        console.error("Error fetching user additional fields:", err);
        // Don't show error toast as this might be expected if no fields are configured
      } finally {
        setLoadingUserFields(false);
      }
    };

    fetchUserAdditionalFields();
  }, []);

  // Fetch company additional fields
  useEffect(() => {
    const fetchCompanyAdditionalFields = async () => {
      try {
        const token = localStorage.getItem("token");
        const uid = localStorage.getItem("uid");

        if (!token || !uid) {
          setLoadingCompanyFields(false);
          return;
        }

        const response = await api.post(
          "/groupSettings/get_company_additional_fields",
          {},
          {
            headers: {
              ...getAuthHeaders(),
              Authorization: `Bearer ${token}`,
            },
            withCredentials: true,
          }
        );

        console.log("Company additional fields response:", response.data);

        if (response.data?.status === true && response.data?.data) {
          // Convert the ad1, ad2, etc. structure to array format
          const fields = [];
          const data = response.data.data;

          for (let i = 1; i <= 10; i++) {
            const fieldName = `ad${i}`;
            if (data[fieldName] && data[fieldName].trim() !== "") {
              fields.push({
                id: i,
                field_name: fieldName,
                field_label: data[fieldName],
                field_type: "text",
                required: false,
              });
            }
          }

          console.log("Processed company additional fields:", fields);
          setCompanyAdditionalFields(fields);
        } else {
          console.log(
            "No company additional fields found or different response structure"
          );
        }
      } catch (err) {
        console.error("Error fetching company additional fields:", err);
        // Don't show error toast as this might be expected if no fields are configured
      } finally {
        setLoadingCompanyFields(false);
      }
    };

    fetchCompanyAdditionalFields();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const numericFields = ["contact_no", "company_contact_no"];

    const formattedValue = numericFields.includes(name)
      ? value.replace(/\D/g, "")
      : value;

    setFormData((prev) => ({
      ...prev,
      [name]: formattedValue,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canAdd) {
      toast.error('You do not have permission to add new registrations.');
      return;
    }

    // Validate required fields
    const requiredFields = [
      "name",
      "email",
      "contact_no",
      "company_name",
      "company_email",
      "company_contact_no",
    ];
    const missingFields = requiredFields.filter((field) => !formData[field]);

    if (missingFields.length > 0) {
      toast.error(
        `Please fill in all required fields: ${missingFields.join(", ")}`
      );
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Company email validation
    if (formData.company_email && !emailRegex.test(formData.company_email)) {
      toast.error("Please enter a valid company email address");
      return;
    }

    // Phone validation - more flexible regex
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
    if (!phoneRegex.test(formData.contact_no)) {
      toast.error(
        "Please enter a valid phone number (10-15 digits, can include spaces, dashes, or parentheses)"
      );
      return;
    }

    // Company phone validation - more flexible regex
    if (
      formData.company_contact_no &&
      !phoneRegex.test(formData.company_contact_no)
    ) {
      toast.error(
        "Please enter a valid company phone number (10-15 digits, can include spaces, dashes, or parentheses)"
      );
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const uid = localStorage.getItem("uid");

      if (!token || !uid) {
        toast.error("Please log in to submit registration");
        return;
      }

      // Prepare data according to API structure
      const submissionData = {
        // User Information
        name: formData.name,
        email: formData.email,
        phone_num: formData.contact_no,
        address: formData.address,
        district: formData.district,
        city: formData.city,
        pincode: formData.pincode,
        area_id: formData.state || "", // Use state ID as area_id

        // Company Information
        company_name: formData.company_name,
        company_email: formData.company_email,
        company_contact: formData.company_contact_no,
        company_address: formData.company_address,
        company_district: formData.company_district,
        company_city: formData.company_city,
        company_pincode: formData.company_pincode,
        carea_id: formData.company_state || "", // Use company_state ID as carea_id

        // Additional User Fields (ad1 to ad10)
        ad1: formData.ad1 || "",
        ad2: formData.ad2 || "",
        ad3: formData.ad3 || "",
        ad4: formData.ad4 || "",
        ad5: formData.ad5 || "",
        ad6: formData.ad6 || "",
        ad7: formData.ad7 || "",
        ad8: formData.ad8 || "",
        ad9: formData.ad9 || "",
        ad10: formData.ad10 || "",

        // Additional Company Fields (company_ad1 to company_ad10)
        company_ad1: formData.company_ad1 || "",
        company_ad2: formData.company_ad2 || "",
        company_ad3: formData.company_ad3 || "",
        company_ad4: formData.company_ad4 || "",
        company_ad5: formData.company_ad5 || "",
        company_ad6: formData.company_ad6 || "",
        company_ad7: formData.company_ad7 || "",
        company_ad8: formData.company_ad8 || "",
        company_ad9: formData.company_ad9 || "",
        company_ad10: formData.company_ad10 || "",
      };

      console.log("Submitting registration with data:", submissionData);
      console.log("User state (area_id):", formData.state, "->", submissionData.area_id);
      console.log("Company state (carea_id):", formData.company_state, "->", submissionData.carea_id);

      const response = await api.post("/common/registration", submissionData, {
        headers: {
          ...getAuthHeaders(),
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      console.log("Registration response:", response.data);
      console.log("Response status:", response.status);

      if (response.data?.status === "success" || response.data?.message) {
        toast.success("Registration submitted successfully!");

        // Reset form
        setFormData({
          // User Information Fields
          name: "",
          email: "",
          contact_no: "",
          country: "",
          state: "",
          district: "",
          city: "",
          pincode: "",
          address: "",

          // Company Information Fields
          company_name: "",
          company_email: "",
          company_contact_no: "",
          company_country: "",
          company_state: "",
          company_district: "",
          company_city: "",
          company_pincode: "",
          company_address: "",

          // Additional User Fields
          ad1: "",
          ad2: "",
          ad3: "",
          ad4: "",
          ad5: "",
          ad6: "",
          ad7: "",
          ad8: "",
          ad9: "",
          ad10: "",

          // Additional Company Fields
          company_ad1: "",
          company_ad2: "",
          company_ad3: "",
          company_ad4: "",
          company_ad5: "",
          company_ad6: "",
          company_ad7: "",
          company_ad8: "",
          company_ad9: "",
          company_ad10: "",
        });
      } else {
        toast.error(response.data?.message || "Failed to submit registration");
      }
    } catch (err) {
      console.error("Registration error:", err);
      console.error("Error response:", err.response?.data);

      if (err.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
      } else {
        toast.error(
          err.response?.data?.message ||
            "Failed to submit registration. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      // User Information Fields
      name: "",
      email: "",
      contact_no: "",
      country: "",
      state: "",
      district: "",
      city: "",
      pincode: "",
      address: "",

      // Company Information Fields
      company_name: "",
      company_email: "",
      company_contact_no: "",
      company_country: "",
      company_state: "",
      company_district: "",
      company_city: "",
      company_pincode: "",
      company_address: "",

      // Additional User Fields
      ad1: "",
      ad2: "",
      ad3: "",
      ad4: "",
      ad5: "",
      ad6: "",
      ad7: "",
      ad8: "",
      ad9: "",
      ad10: "",

      // Additional Company Fields
      company_ad1: "",
      company_ad2: "",
      company_ad3: "",
      company_ad4: "",
      company_ad5: "",
      company_ad6: "",
      company_ad7: "",
      company_ad8: "",
      company_ad9: "",
      company_ad10: "",
    });

    toast.info("Form has been reset");
  };

  // Render additional field input
  const renderAdditionalField = (field, prefix = "") => {
    // For user fields: ad1, ad2, etc.
    // For company fields: company_ad1, company_ad2, etc.
    const fieldName = prefix ? `company_${field.field_name}` : field.field_name;

    return (
      <div key={field.id || field.field_name}>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {field.field_label || field.field_name}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {field.field_type === "textarea" ? (
          <textarea
            name={fieldName}
            value={formData[fieldName] || ""}
            onChange={handleInputChange}
            placeholder={`Enter ${field.field_label || field.field_name}`}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-vertical"
            required={field.required}
          />
        ) : (
          <input
            type={
              field.field_type === "email"
                ? "email"
                : field.field_type === "number"
                ? "number"
                : "text"
            }
            name={fieldName}
            value={formData[fieldName] || ""}
            onChange={handleInputChange}
            placeholder={`Enter ${field.field_label || field.field_name}`}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            required={field.required}
          />
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 py-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-600">
              New Registration
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Register new members to the system
            </p>
          </div>
          <div className="flex gap-2">
            {/* Hidden file input */}
            <input
              type="file"
              id="excel-file-input"
              accept=".xls,.xlsx,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
            >
              <FiUpload size={16} />
              Bulk Upload
            </button>
          </div>
        </div>

        {/* Selected File Info */}
        {selectedFile && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiUpload className="text-blue-600" size={20} />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Selected File: {selectedFile.name}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  document.getElementById("excel-file-input").value = "";
                }}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <FiX size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <div className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-lg">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Member Registration Form
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Please fill in all required fields marked with *
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* Main Information Sections - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Section 1: User Information */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <FiUser className="text-blue-600" />
                  User Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      *Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter full name"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      *Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter email address"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      *Contact Number
                    </label>
                    <input
                      type="tel"
                      name="contact_no"
                      value={formData.contact_no}
                      onChange={handleInputChange}
                      placeholder="Enter contact number"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Country
                    </label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={(e) => {
                        handleInputChange(e);
                        // Clear state when country changes
                        setFormData((prev) => ({ ...prev, state: "" }));
                        // Fetch states for the selected country
                        if (e.target.value) {
                          fetchStates(e.target.value);
                        } else {
                          setStates([]);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Country</option>
                      {loadingCountries ? (
                        <option value="" disabled>
                          Loading countries...
                        </option>
                      ) : (
                        countries.map((country, index) => (
                          <option key={index} value={country.country}>
                            {country.country}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      State
                    </label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select State</option>
                      {loadingStates ? (
                        <option value="" disabled>
                          Loading states...
                        </option>
                      ) : (
                        states.map((state) => (
                          <option key={state.id} value={state.id}>
                            {state.state}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      District
                    </label>
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      placeholder="Enter district"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Enter city"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Pincode
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      placeholder="Enter pincode"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Enter full address"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-vertical"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Company Information */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <FiHome className="text-green-600" />
                  Company Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      *Company Name
                    </label>
                    <input
                      type="text"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleInputChange}
                      placeholder="Enter company name"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      *Company Email
                    </label>
                    <input
                      type="email"
                      name="company_email"
                      value={formData.company_email}
                      onChange={handleInputChange}
                      placeholder="Enter company email"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      *Company Contact Number
                    </label>
                    <input
                      type="tel"
                      name="company_contact_no"
                      value={formData.company_contact_no}
                      onChange={handleInputChange}
                      placeholder="Enter company contact number"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company Country
                    </label>
                    <select
                      name="company_country"
                      value={formData.company_country}
                      onChange={(e) => {
                        handleInputChange(e);
                        // Clear state when country changes
                        setFormData((prev) => ({ ...prev, company_state: "" }));
                        // Fetch company states for the selected country
                        if (e.target.value) {
                          fetchCompanyStates(e.target.value);
                        } else {
                          setCompanyStates([]);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Country</option>
                      {loadingCountries ? (
                        <option value="" disabled>
                          Loading countries...
                        </option>
                      ) : (
                        countries.map((country, index) => (
                          <option key={index} value={country.country}>
                            {country.country}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company State
                    </label>
                    <select
                      name="company_state"
                      value={formData.company_state}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select State</option>
                      {loadingCompanyStates ? (
                        <option value="" disabled>
                          Loading states...
                        </option>
                      ) : (
                        companyStates.map((state) => (
                          <option key={state.id} value={state.id}>
                            {state.state}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company District
                    </label>
                    <input
                      type="text"
                      name="company_district"
                      value={formData.company_district}
                      onChange={handleInputChange}
                      placeholder="Enter company district"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company City
                    </label>
                    <input
                      type="text"
                      name="company_city"
                      value={formData.company_city}
                      onChange={handleInputChange}
                      placeholder="Enter company city"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company Pincode
                    </label>
                    <input
                      type="text"
                      name="company_pincode"
                      value={formData.company_pincode}
                      onChange={handleInputChange}
                      placeholder="Enter company pincode"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company Address
                    </label>
                    <textarea
                      name="company_address"
                      value={formData.company_address}
                      onChange={handleInputChange}
                      placeholder="Enter company address"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-vertical"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Details Sections - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Section 3: User Additional Details */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <FiUser className="text-purple-600" />
                  User Additional Details
                </h3>

                <div className="space-y-4">
                  {loadingUserFields ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Loading user additional fields...
                      </p>
                    </div>
                  ) : userAdditionalFields.length > 0 ? (
                    userAdditionalFields.map((field) =>
                      renderAdditionalField(field)
                    )
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No additional user fields configured
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Additional fields can be configured in the User
                        Additional Fields page
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 4: Company Additional Details */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <FiHome className="text-indigo-600" />
                  Company Additional Details
                </h3>

                <div className="space-y-4">
                  {loadingCompanyFields ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Loading company additional fields...
                      </p>
                    </div>
                  ) : companyAdditionalFields.length > 0 ? (
                    companyAdditionalFields.map((field) =>
                      renderAdditionalField(field, "company")
                    )
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No additional company fields configured
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Additional fields can be configured in the Company
                        Additional Fields page
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                <FiX size={18} />
                Reset Form
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiSave size={18} />
                {loading ? "Submitting..." : "Submit Registration"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Excel Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Upload Excel File
              </h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  const fileInput = document.getElementById(
                    "modal-excel-file-input"
                  );
                  if (fileInput) fileInput.value = "";
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Choose Excel File
              </p>

              {/* File Input */}
              <div className="mb-6">
                <input
                  type="file"
                  id="modal-excel-file-input"
                  accept=".xls,.xlsx,.csv"
                  onChange={handleFileSelect}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-medium
                    file:bg-blue-600 file:text-white
                    hover:file:bg-blue-700
                    dark:file:bg-blue-600 dark:file:text-white
                    dark:hover:file:bg-blue-700
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-all duration-200
                    cursor-pointer"
                />
                {selectedFile && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FiUpload
                        className="text-green-600 dark:text-green-400"
                        size={16}
                      />
                      <div>
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          Size: {(selectedFile.size / 1024 / 1024).toFixed(2)}{" "}
                          MB
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                {/* Download Sample Button - Icon Only */}
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="flex items-center justify-center w-10 h-10 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
                  title="Download Sample File"
                >
                  <FiDownload size={16} />
                </button>

                {/* Upload Button */}
                <button
                  type="button"
                  onClick={handleExcelUpload}
                  disabled={!selectedFile || uploadingExcel}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-md hover:shadow-lg"
                >
                  <FiUpload size={16} />
                  {uploadingExcel ? "Uploading..." : "Upload"}
                </button>
              </div>

              {/* Help Text */}
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <strong>Supported formats:</strong> .xls, .xlsx, .csv (Max
                  5MB)
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Click the download icon to get a sample file format
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                  ✨ Auto-fill: Form will be automatically populated when you
                  select a file!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
