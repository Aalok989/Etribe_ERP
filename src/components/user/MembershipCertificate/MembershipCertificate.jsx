import React, { useState, useEffect } from "react";
import { FiX, FiDownload } from "react-icons/fi";
import api from "../../../api/axiosConfig";
import { getAuthHeaders } from "../../../utils/apiHeaders";
import { useDashboard } from "../../../context/DashboardContext";
import GoldenBadge from "../../../assets/GoldenBadge.png";

const MembershipCertificate = ({ isOpen, onClose, profileData }) => {
  const { data: dashboardData } = useDashboard();
  const [loading, setLoading] = useState(true);
  const [certificateData, setCertificateData] = useState({
    memberName: "",
    companyName: "",
    membershipId: "",
    organizationName: "",
    organizationAddress: "",
    organizationWebsite: "",
    organizationLogo: null,
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

      let userId = profileData?.id || uid;

      try {
        const profileRes = await api.post(
          "/userDetail/get_profile",
          {},
          { headers: getAuthHeaders(), timeout: 10000 }
        );
        if (profileRes.data.status && profileRes.data.data?.id)
          userId = profileRes.data.data.id;
      } catch {}

      const idCardRes = await api.post(
        "/IdCard/get_member_card",
        { user_id: parseInt(userId) },
        { headers: getAuthHeaders(), timeout: 10000 }
      );

      if (idCardRes.data.status === 200 && idCardRes.data.data?.member_details) {
        const m = idCardRes.data.data.member_details;
        const orgData = dashboardData?.groupData || {};
        setCertificateData({
          memberName: m.member_name || "Member Name",
          companyName: m.company_name || "",
          membershipId: m.user_id || userId,
          organizationName: orgData.name || "Organization Name",
          organizationAddress: orgData.address || "",
          organizationWebsite: orgData.website || "",
          organizationLogo:
            orgData.signature || m.company_logo_url || null,
        });
      }
    } catch (err) {
      console.error(err);
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

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
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
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
            >
              <FiDownload size={18} />
              Download PDF
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

              {/* Top Section */}
              <div className="relative z-10 flex justify-between items-center px-16 pt-10">
                <div className="flex flex-col">
                  {certificateData.organizationLogo ? (
                    <img
                      src={
                        certificateData.organizationLogo.startsWith("http")
                          ? certificateData.organizationLogo
                          : `${API_BASE_URL}/${certificateData.organizationLogo}`
                      }
                      alt="Organization Logo"
                      className="h-20 w-auto mb-2"
                    />
                  ) : null}
                  <h1 className="text-4xl font-bold text-amber-700 uppercase tracking-wider">
                    {certificateData.organizationName || "Organization Name"}
                  </h1>
                  {certificateData.organizationWebsite && (
                    <p className="text-gray-600 text-sm">
                      {certificateData.organizationWebsite}
                    </p>
                  )}
                </div>

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
              </div>

              {/* Divider */}
              <div className="flex justify-center mt-6 mb-4">
                <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent w-[80%]"></div>
              </div>

              {/* Title */}
              <div className="text-center">
                <h2 className="text-6xl font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent mb-3 leading-tight">
                  <div className="block">CERTIFICATE</div>
                  <div className="block">OF</div>
                  <div className="block">MEMBERSHIP</div>
                </h2>
                <p className="italic text-gray-700 text-xl">
                  This is to certify that
                </p>
              </div>

              {/* Member Info */}
              <div className="text-center mt-6">
                <h3 className="text-5xl font-bold text-gray-900">
                  {certificateData.memberName.toUpperCase()}
                </h3>
                {certificateData.companyName && (
                  <p className="text-2xl font-semibold text-gray-700 mt-2">
                    {certificateData.companyName.toUpperCase()}
                  </p>
                )}
                <p className="mt-4 text-gray-700 text-lg max-w-3xl mx-auto leading-relaxed">
                  is a valued member of{" "}
                  <span className="text-amber-700 font-semibold">
                    {certificateData.organizationName}
                  </span>{" "}
                  and upholds the values and integrity of our institution.
                </p>
              </div>

              {/* Footer */}
              <div className="absolute bottom-10 left-0 right-0 px-16 flex justify-between items-end">
                {/* Date */}
                <div>
                  <p className="text-sm text-gray-600 mb-1">Issued on</p>
                  <p className="font-semibold text-gray-800 text-base">
                    {new Date().toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>

                {/* Signatures */}
                <div className="flex gap-10">
                  {[
                    ["Parveen Garg", "President"],
                    ["Pardeep Koul", "Gen. Secretary"],
                    ["Ashok Kumar Mittal", "Treasurer"],
                  ].map(([name, role]) => (
                    <div key={name} className="text-center">
                      <div className="w-32 border-b-2 border-gray-400 mb-2 h-16"></div>
                      <p className="font-bold text-gray-900 text-sm uppercase">
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
