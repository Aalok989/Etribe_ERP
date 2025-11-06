import React, { useState, useEffect } from "react";
import { FiX, FiDownload } from "react-icons/fi";
import api from "../../../api/axiosConfig";
import { getAuthHeaders } from "../../../utils/apiHeaders";
import GoldenBadge from "../../../assets/GoldenBadge.png";
import CompanyLogo from "../../../assets/company-logo/parent.jpg";
import CompanyLogoPNG from "../../../assets/logos/company-logo.png";
import EtribeTree from "../../../assets/Etribe-Tree.png";
import EtribeText from "../../../assets/Etribe-Text.png";
import GoldLeaf from "../../../assets/goldleaf.png";
import Sign1 from "../../../assets/sign 1.png";
import Sign2 from "../../../assets/sign 2.png";
import Sign3 from "../../../assets/sign 3.png";

const MembershipCertificate = ({ isOpen, onClose, profileData }) => {
  const [loading, setLoading] = useState(true);
  const [certificateData, setCertificateData] = useState({
    memberName: "",
    companyName: "",
    membershipId: "",
    organizationName: "",
    organizationAddress: "",
    organizationWebsite: "",
  });

  useEffect(() => {
    if (isOpen) fetchCertificateData();
  }, [isOpen, profileData]);

  const fetchCertificateData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const uid = localStorage.getItem("uid");
      if (!token || !uid) return;

      const userId = profileData?.id || uid;

      const response = await api.post(
        "/membershipCertificate/get_certificate",
        { user_id: parseInt(userId) },
        { headers: getAuthHeaders(), timeout: 10000 }
      );

      if (response.data && (response.data.status === true || response.data.success === true || response.data.data)) {
        const data = response.data.data || response.data;
        setCertificateData({
          memberName: data.member_name || data.memberName || "Member Name",
          companyName: data.company_name || data.companyName || "",
          membershipId: data.membership_id || data.membershipId || data.user_id || userId,
          organizationName: data.organization_name || data.organizationName || "Organization Name",
          organizationAddress: data.organization_address || data.organizationAddress || "",
          organizationWebsite: data.organization_website || data.organizationWebsite || "",
        });
      }
    } catch (err) {
      console.error("Error fetching certificate data:", err);
      // Set default values on error
      const userId = profileData?.id || localStorage.getItem("uid") || "";
      setCertificateData({
        memberName: "Aalok Kumar",
        companyName: "Stark Industries",
        membershipId: userId,
        organizationName: "Etribe (Empowering Communities)",
        organizationAddress: "",
        organizationWebsite: "",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    const element = document.getElementById("membership-certificate");
    if (!element) return;

    const [html2canvas, jsPDF] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);

    const canvas = await html2canvas.default(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF.default("landscape", "mm", "a4");

    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    const yOffset = (pdf.internal.pageSize.getHeight() - height) / 2;

    pdf.addImage(imgData, "PNG", 0, yOffset, width, height);
    pdf.save(
      `Membership-Certificate-${certificateData.membershipId || "Member"}.pdf`
    );
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
                  src={CompanyLogo}
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
              <div className="text-center relative z-10 py-2">
                <div className="flex items-center justify-center gap-0 -mb-2">
                  {/* Gold Leaf Left */}
                  <img
                    src={GoldLeaf}
                    alt="Gold Leaf"
                    className="h-40 w-auto -scale-x-100 -mr-28 -mt-4"
                  />
                  
                  <h2 
                    className="text-8xl bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent whitespace-nowrap"
                    style={{ fontFamily: "'Great Vibes', cursive", textTransform: 'none', fontWeight: 400, lineHeight: '1.2', paddingTop: '0.5rem', paddingBottom: '0.5rem', paddingRight: '0.5rem', paddingLeft: '0.25rem' }}
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
              <div className="text-center -mt-2 max-w-4xl mx-auto px-8">
                <div
                  className="text-gray-800 text-2xl leading-relaxed"
                  style={{ 
                    fontFamily: "'Playfair Display', serif",
                    lineHeight: '1.8',
                    textAlign: 'center'
                  }}
                >
                  <p className="mb-2">
                    This is to certify that
                  </p>
                  <p className="mb-2 text-5xl" style={{ fontFamily: "'Dancing Script', cursive", fontWeight: 600, color: '#dc2626' }}>
                    {certificateData.memberName || "Aalok Kumar"}
                  </p>
                  <div className="flex justify-center mb-2">
                    <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent w-[40%]"></div>
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
                  <p className="text-sm text-gray-600 mt-1">Member ID</p>
                  <p className="text-lg font-semibold text-amber-700">
                    M{certificateData.membershipId?.toString().padStart(4, "0")}
                  </p>
                </div>

                {/* Signatures */}
                <div className="flex gap-10">
                  {[
                    ["Parveen Garg", "President", Sign1],
                    ["Pardeep Koul", "Gen. Secretary", Sign2],
                    ["Ashok Kumar Mittal", "Treasurer", Sign3],
                  ].map(([name, role, signature]) => (
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
                      <p className="text-xs text-gray-600">{role}</p>
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
