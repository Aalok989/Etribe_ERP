import React, { useState, useEffect } from "react";
import { FiX, FiDownload } from "react-icons/fi";
import api from "../../api/axiosConfig";
import { getAuthHeaders } from "../../utils/apiHeaders";
import GoldenBadge from "../../assets/GoldenBadge.png";
import CompanyLogo from "../../assets/company-logo/parent.jpg";
import EtribeTree from "../../assets/Etribe-Tree.png";
import EtribeText from "../../assets/Etribe-Text.png";
import GoldLeaf from "../../assets/goldleaf.png";
import Sign1 from "../../assets/sign 1.png";
import Sign2 from "../../assets/sign 2.png";
import Sign3 from "../../assets/sign 3.png";

const DEFAULT_SIGNATORIES = [
  { name: "Parveen Garg", designation: "President", signature: Sign1 },
  { name: "Pardeep Koul", designation: "Gen. Secretary", signature: Sign2 },
  { name: "Ashok Kumar Mittal", designation: "Treasurer", signature: Sign3 },
];

const createDefaultCertificateData = () => ({
  memberName: "",
  memberRole: "",
  companyName: "",
  certificateUid: "",
  membershipId: "",
  organizationName: "",
  organizationAddress: "",
  organizationWebsite: "",
  companyLogo: "",
  issuedOn: "",
  validFrom: "",
  validUntil: "",
  signatories: [],
});

const MembershipCertificate = ({ isOpen, onClose, profileData }) => {
  const [loading, setLoading] = useState(true);
  const [certificateData, setCertificateData] = useState(createDefaultCertificateData);

  useEffect(() => {
    if (isOpen) fetchCertificateData();
  }, [isOpen, profileData]);

  const fetchCertificateData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const uid = localStorage.getItem("uid");
      if (!token || !uid) {
        throw new Error("Missing authentication details");
      }

      const userId = profileData?.id || uid;

      let certificateId =
        profileData?.certificate_id ||
        profileData?.certificateId ||
        profileData?.certificateID;
      let fallbackMemberName =
        profileData?.member_name ||
        profileData?.memberName ||
        profileData?.name ||
        "";

      let profileResponseData = null;

      if (!certificateId) {
        const profileResponse = await api.post(
          `/userDetail/get_user_profile/${userId}`,
          {},
          { headers: getAuthHeaders(), timeout: 10000 }
        );

        if (
          profileResponse?.data &&
          (profileResponse.data.status === true || profileResponse.data.status === 200)
        ) {
          profileResponseData = profileResponse.data.data || {};
          certificateId =
            profileResponseData.certificate_id ||
            profileResponseData.certificateId ||
            profileResponseData.certificateID;
          fallbackMemberName =
            profileResponseData.name ||
            profileResponseData.member_name ||
            fallbackMemberName;
        }
      }

      if (!certificateId) {
        throw new Error("Certificate ID not found for the user.");
      }

      const certificateResponse = await api.post(
        `/Certificate/view/${certificateId}`,
        {},
        { headers: getAuthHeaders(), timeout: 15000 }
      );

      const certificatePayload =
        certificateResponse?.data?.data || certificateResponse?.data;

      if (!certificatePayload || certificateResponse?.data?.status === false) {
        throw new Error("Certificate details not available.");
      }

      setCertificateData({
        memberName:
          certificatePayload.member_name ||
          certificatePayload.memberName ||
          fallbackMemberName ||
          "",
        memberRole: certificatePayload.member_role || "",
        companyName:
          certificatePayload.company_name ||
          certificatePayload.organization_name ||
          "",
        certificateUid: certificatePayload.certificate_uid || "",
        membershipId:
          certificatePayload.member_id ||
          certificatePayload.membership_id ||
          certificatePayload.membershipId ||
          userId,
        organizationName:
          certificatePayload.store_name ||
          certificatePayload.organization_name ||
          certificatePayload.company_name ||
          "Etribe (Empowering Communities)",
        organizationAddress:
          certificatePayload.company_address ||
          certificatePayload.organization_address ||
          "",
        organizationWebsite:
          certificatePayload.company_website ||
          certificatePayload.organization_website ||
          "",
        companyLogo: certificatePayload.company_logo || "",
        issuedOn: certificatePayload.issued_on || "",
        validFrom: certificatePayload.valid_from || "",
        validUntil: certificatePayload.valid_until || "",
        signatories: Array.isArray(certificatePayload.signatories)
          ? certificatePayload.signatories
          : [],
      });
    } catch (err) {
      // Set default values on error
      const userId = profileData?.id || localStorage.getItem("uid") || "";
      setCertificateData({
        ...createDefaultCertificateData(),
        memberName: "Aalok Kumar",
        companyName: "Stark Industries",
        membershipId: userId,
        organizationName: "Etribe (Empowering Communities)",
      });
    } finally {
      setLoading(false);
    }
  };

  const resolveAssetUrl = (path) => {
    if (!path) return "";
    if (
      /^https?:\/\//i.test(path) ||
      path.startsWith("data:") ||
      path.startsWith("blob:")
    ) {
      return path;
    }

    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const assetEnvBase =
      import.meta.env.VITE_ASSET_BASE_URL || import.meta.env.VITE_API_BASE_URL || "";

    const buildUrl = (baseUrl) => {
      if (!baseUrl) return null;
      const trimmed = baseUrl.endsWith("/")
        ? baseUrl.slice(0, -1)
        : baseUrl;
      return `${trimmed}${normalizedPath}`;
    };

    if (assetEnvBase) {
      return buildUrl(assetEnvBase);
    }

    const base = api.defaults?.baseURL || "";

    if (!base) {
      return normalizedPath;
    }

    if (base.startsWith("http") || base.startsWith("/")) {
      return buildUrl(base);
    }

    return normalizedPath;
  };

  const membershipIdentifier =
    (certificateData.certificateUid
      ? `${certificateData.certificateUid}`
      : null) ||
    (certificateData.membershipId
      ? `M${certificateData.membershipId.toString().padStart(4, "0")}`
      : "");

  const memberNumericId =
    certificateData.membershipId ||
    certificateData.memberId ||
    certificateData.member_id ||
    "";

  const signatoriesToDisplay = (
    certificateData.signatories && certificateData.signatories.length > 0
      ? certificateData.signatories.map((signatory, index) => ({
          name: signatory.name || `Authorized Signatory ${index + 1}`,
          designation:
            signatory.designation ||
            signatory.position ||
            signatory.title ||
            "Authorized Signatory",
          signature:
            resolveAssetUrl(signatory.signature_url || signatory.signatureUrl) ||
            DEFAULT_SIGNATORIES[index]?.signature ||
            DEFAULT_SIGNATORIES[0]?.signature,
        }))
      : DEFAULT_SIGNATORIES
  ).slice(0, 3);

  const handleDownload = async () => {
    const element = document.getElementById("membership-certificate");
    if (!element) return;

    try {
      // Wait until fonts are fully loaded
      await document.fonts.ready;
      
      // Wait for all images to load
      const images = element.querySelectorAll('img');
      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = resolve; // Continue even if image fails
            setTimeout(resolve, 3000); // Timeout after 3 seconds
          });
        })
      );
      
      // Additional wait to ensure everything is rendered
      await new Promise(resolve => setTimeout(resolve, 300));

      const [html2canvas, jsPDF] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      // Render to canvas with high resolution
      const canvas = await html2canvas.default(element, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        onclone: (clonedDoc) => {
          // Ensure fonts are loaded in cloned document
          const clonedElement = clonedDoc.getElementById("membership-certificate");
          if (clonedElement) {
            // Add font imports to cloned document
            const style = clonedDoc.createElement('style');
            style.textContent = `
              @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Dancing+Script:wght@400;600&family=Great+Vibes&display=swap');
            `;
            clonedDoc.head.appendChild(style);
            
            // Apply spacing adjustments for PDF only
            // Shift "Certificate of Membership" text up - PDF only (not gold leaf)
            const titleSection = clonedElement.querySelector('div.text-center.relative.z-10');
            if (titleSection) {
              titleSection.style.marginBottom = '1.5rem'; // Increased gap for PDF
              
              // Only shift the h2 text element, not the gold leaf images
              const titleText = titleSection.querySelector('h2');
              if (titleText) {
                titleText.style.marginTop = '-3rem'; // Shift up only the text in PDF
              }
            }
            
            // Increase gap between title and certificate text for PDF
            const certificateTextSection = clonedElement.querySelector('div.text-center.mt-2');
            if (certificateTextSection) {
              certificateTextSection.style.marginTop = '1rem';
            }
            
            // Fix "Aalok Kumar" and separator line spacing for PDF
            const aalokKumarContainer = clonedElement.querySelector('div.mb-2');
            if (aalokKumarContainer && aalokKumarContainer.querySelector('p[style*="Dancing Script"]')) {
              aalokKumarContainer.style.marginTop = '-0.5rem'; // Shift up in PDF only
              
              // Fix separator line to be below text, not overlapping - PDF only
              const nameText = aalokKumarContainer.querySelector('p[style*="Dancing Script"]');
              if (nameText) {
                nameText.style.marginBottom = '2rem'; // More space below name for PDF
              }
              
              const separatorLine = aalokKumarContainer.querySelector('div[style*="linear-gradient"]');
              if (separatorLine && separatorLine.parentElement) {
                separatorLine.parentElement.style.marginTop = '2rem'; // More space above separator for PDF
              }
            }
            
            // Shift "Stark Industries" up - PDF only (not "Director of")
            const starkIndustriesText = clonedElement.querySelector('p[style*="Great Vibes"]');
            if (starkIndustriesText && starkIndustriesText.textContent.includes('Stark Industries')) {
              starkIndustriesText.style.marginTop = '-1rem'; // Shift up more in PDF only
            }
            
            // Wait a bit for fonts to apply
            return new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      });

      const imgData = canvas.toDataURL("image/png", 1.0);

      // Create PDF with exact canvas dimensions
      const pdf = new jsPDF.default({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`Membership-Certificate-${certificateData.membershipId || "Member"}.pdf`);
    } catch (error) {
      alert('Failed to download certificate as PDF. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[96vw] max-h-[96vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            Membership Certificate
          </h2>
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
              title="Download Certificate as PDF"
            >
              <FiDownload size={24} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX size={24} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Certificate */}
        <div className="flex justify-center items-center py-6">
          {loading ? (
            <div className="animate-spin w-12 h-12 border-b-2 border-amber-600 rounded-full" />
          ) : (
            <div
              id="membership-certificate"
              className="relative bg-white rounded-xl shadow-lg overflow-hidden"
              style={{
                width: "1120px",
                height: "790px",
                fontFamily: "serif",
              }}
            >
              {/* Outer gold border */}
              <div className="absolute inset-4 border-[6px] border-amber-600 rounded-xl"></div>
              <div className="absolute inset-8 border-2 border-amber-300 rounded-lg"></div>

              {/* Watermark - ETribe Tree */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0 opacity-10">
                <img
                  src={EtribeTree}
                  alt="ETribe Tree Watermark"
                  className="w-96 h-auto"
                />
              </div>

              {/* Logo in top left corner */}
              <div className="absolute top-12 left-12 z-10">
                <img
                  src={
                    resolveAssetUrl(certificateData.companyLogo) || CompanyLogo
                  }
                  alt="Organization Logo"
                  className="h-12 w-auto"
                />
              </div>

              {/* Logo in top right corner */}
              <div className="absolute top-12 right-4 z-10">
                <img
                  src={EtribeText}
                  alt="ETribe Text"
                  className="h-14 w-auto"
                />
              </div>

              {/* Divider */}
              <div className="relative z-10 flex justify-center pt-24 pb-4">
                <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent w-[50%]"></div>
              </div>

              {/* Title */}
              <div className="text-center relative z-10 py-2 mb-4">
                <div className="flex items-center justify-center gap-0 -mb-2">
                  {/* Gold Leaf Left */}
                  <img
                    src={GoldLeaf}
                    alt="Gold Leaf"
                    className="h-40 w-auto -scale-x-100 -mr-28 -mt-4"
                  />
                  
                  <h2 
                    className="text-8xl whitespace-nowrap"
                    style={{ 
                      fontFamily: "'Great Vibes', cursive", 
                      textTransform: 'none', 
                      fontWeight: 400, 
                      lineHeight: '1.2', 
                      paddingTop: '0.5rem', 
                      paddingBottom: '0.5rem', 
                      paddingRight: '0.5rem', 
                      paddingLeft: '0.25rem',
                      color: '#d97706'
                    }}
                  >
                    Certificate of Membership
                  </h2>
                  
                  {/* Gold Leaf Right */}
                  <img
                    src={GoldLeaf}
                    alt="Gold Leaf"
                    className="h-40 w-auto -ml-28 -mt-4"
                  />
                </div>
              </div>

              {/* Certificate Text */}
              <div className="text-center mt-2 max-w-4xl mx-auto px-8">
                <div
                  className="text-gray-800 text-2xl leading-relaxed"
                  style={{ 
                    fontFamily: "'Playfair Display', serif",
                    lineHeight: '1.8',
                    textAlign: 'center'
                  }}
                >
                  <p className="mb-2" style={{ fontFamily: "'Playfair Display', serif", color: '#1f2937', fontSize: '1.5rem', fontWeight: 400 }}>
                    This is to certify that
                  </p>
                  <div className="mb-2">
                    <p className="mb-0 text-5xl" style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 600, color: '#dc2626', marginBottom: '0.75rem' }}>
                      {certificateData.memberName || "Aalok Kumar"}
                    </p>
                    <div className="flex justify-center" style={{ marginTop: '0.75rem' }}>
                      <div 
                        className="h-[2px] w-[40%]"
                        style={{
                          background: 'linear-gradient(to right, transparent, #f59e0b, transparent)',
                          minWidth: '200px',
                          display: 'block',
                          position: 'relative',
                          top: '0',
                          left: '0'
                        }}
                      ></div>
                    </div>
                  </div>
                  <p className="mb-2 text-gray-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Director of
                  </p>
                  <p className="mb-2 text-5xl" style={{ fontFamily: "'Great Vibes', cursive", fontWeight: 400, color: '#b91c1c' }}>
                    {certificateData.companyName || "Stark Industries"}
                  </p>
                  <p className="-mb-1">
                    is a recognized Member of{" "}
                    <span className="font-semibold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {certificateData.organizationName || "Etribe (Empowering Communities)"}
                    </span>
                  </p>
                  <p className="-mb-1">
                    and have signed a pledge to abide by the
                  </p>
                  <p>
                    rules and regulations of the society.
                  </p>
                </div>
                </div>

              {/* Footer */}
              <div className="absolute bottom-10 left-0 right-0 px-16 flex justify-between items-end">
                {/* Member ID and Golden Badge */}
                <div className="flex flex-col items-center">
                  <img
                    src={GoldenBadge}
                    alt="Golden Badge"
                    className="w-32 h-32"
                  />
                  <div className="text-center leading-tight">
                    <p className="text-lg font-semibold text-amber-700">
                      {memberNumericId ? `Member ID: ${memberNumericId}` : "Member"}
                    </p>
                    {membershipIdentifier && (
                      <p className="text-sm font-semibold text-amber-700 mt-1">
                        {membershipIdentifier}
                      </p>
                    )}
                  </div>
                </div>

                {/* Signatures */}
                <div className="flex gap-10">
                  {signatoriesToDisplay.map(({ name, designation, signature }) => (
                    <div key={name} className="text-center" style={{ minWidth: '140px' }}>
                      <div className="w-full mb-0.5 h-16 flex items-center justify-center">
                        <img
                          src={signature}
                          alt={`${name} Signature`}
                          className="h-16 w-auto object-contain"
                        />
                      </div>
                      <p className="font-bold text-gray-900 text-sm uppercase break-words">
                        {name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {designation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MembershipCertificate;
