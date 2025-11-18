import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/admin/Layout/DashboardLayout";
import { FiFileText, FiRefreshCw, FiSearch, FiUser, FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import api from "../../api/axiosConfig";
import { getAuthHeaders } from "../../utils/apiHeaders";

const STATUS_OPTIONS = [
  "Applied",
  "Shortlisted",
  "Interview Scheduled",
  "Selected",
  "Rejected",
  "On Hold",
];

const formatDate = (value) => {
  if (!value) return "N/A";
  const parsed = new Date(value.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) {
    return value.split(" ")[0] || value;
  }
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function JobApplicantsAdminPage() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [noteForm, setNoteForm] = useState({ status: "", recruiter_notes: "" });
  const [updating, setUpdating] = useState(false);

  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const response = await api.post(
        "/Job_post/job_applicants/",
        {},
        { headers: getAuthHeaders() }
      );
      let list =
        response.data?.data?.applicants ||
        response.data?.data ||
        response.data ||
        [];
      if (!Array.isArray(list)) {
        list = Object.values(list || {});
      }
      setApplicants(list.filter(Boolean));
    } catch (err) {
      console.error("Failed to fetch job applicants:", err);
      toast.error(
        "Failed to fetch job applicants: " +
          (err.response?.data?.message || err.message)
      );
      setApplicants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, []);

  const filteredApplicants = useMemo(() => {
    if (!search.trim()) return applicants;
    const term = search.trim().toLowerCase();
    return applicants.filter((a) =>
      [
        a.job_type,
        a.applicant_name,
        a.applicant_email,
        a.applicant_phone,
        a.application_status,
      ]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(term))
    );
  }, [applicants, search]);

  const totalEntries = filteredApplicants.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / entriesPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * entriesPerPage;
  const paginatedApplicants = filteredApplicants.slice(
    startIdx,
    startIdx + entriesPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, entriesPerPage]);

  useEffect(() => {
    if (currentPage !== safePage) {
      setCurrentPage(safePage);
    }
  }, [safePage, currentPage]);

  const openNoteModal = (applicant) => {
    setSelectedApplicant(applicant);
    setNoteForm({
      status: applicant?.application_status || "",
      recruiter_notes: applicant?.recruiter_notes || "",
    });
    setShowNoteModal(true);
  };

  const closeNoteModal = () => {
    setShowNoteModal(false);
    setSelectedApplicant(null);
    setNoteForm({ status: "", recruiter_notes: "" });
  };

  const handleNoteChange = (e) => {
    const { name, value } = e.target;
    setNoteForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateApplicant = async () => {
    if (!selectedApplicant) return;
    setUpdating(true);
    try {
      await api.post(
        `/Job_post/update_applicant_status/${selectedApplicant.id}`,
        {
          status: noteForm.status,
          recruiter_notes: noteForm.recruiter_notes,
        },
        { headers: getAuthHeaders() }
      );
      toast.success("Applicant status updated");
      closeNoteModal();
      fetchApplicants();
    } catch (err) {
      console.error("Failed to update applicant:", err);
      toast.error(
        "Failed to update applicant: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading && applicants.length === 0) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#1E1E1E]">
          <div className="flex items-center gap-3">
            <FiRefreshCw className="animate-spin text-indigo-600 text-2xl" />
            <p className="text-indigo-700 dark:text-indigo-300">
              Loading job applicants...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-orange-600">
            Job Applicants
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <FiUser className="text-indigo-600" />
            <span>Total Applicants: {applicants.length}</span>
          </div>
        </div>

        <div className="rounded-2xl shadow-lg bg-white dark:bg-[#1E1E1E] w-full">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by job type, applicant name, email, phone..."
                className="pl-10 pr-4 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 transition-colors"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {totalEntries === 0 ? 0 : startIdx + 1} to{" "}
                {Math.min(startIdx + entriesPerPage, totalEntries)} of{" "}
                {totalEntries} entries
              </div>
              <button
                className="flex items-center gap-1 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition"
                onClick={fetchApplicants}
              >
                <FiRefreshCw />
                Refresh
              </button>
            </div>
          </div>

          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 text-gray-700 dark:text-gray-200 sticky top-0 z-10 shadow-sm">
                <tr className="border-b-2 border-indigo-200 dark:border-indigo-800">
                  <th className="p-3 text-center font-semibold border-r border-indigo-200 dark:border-indigo-800">
                    Sr No
                  </th>
                  <th className="p-3 text-left font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap">
                    Job Type
                  </th>
                  <th className="p-3 text-left font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap">
                    Applicant Name
                  </th>
                  <th className="p-3 text-left font-semibold border-r border-indigo-200 dark:border-indigo-800">
                    Email
                  </th>
                  <th className="p-3 text-left font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap">
                    Phone
                  </th>
                  <th className="p-3 text-left font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap">
                    Applied At
                  </th>
                  <th className="p-3 text-left font-semibold border-r border-indigo-200 dark:border-indigo-800 whitespace-nowrap">
                    Application Status
                  </th>
                  <th className="p-3 text-center font-semibold">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedApplicants.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-6 text-center text-gray-600 dark:text-gray-300"
                    >
                      No job applicants available.
                    </td>
                  </tr>
                ) : (
                  paginatedApplicants.map((applicant, idx) => (
                    <tr
                      key={applicant.id || idx}
                      className={`border-b border-gray-200 dark:border-gray-700 ${
                        idx % 2 === 0
                          ? "bg-white dark:bg-[#1E1E1E]"
                          : "bg-gray-50 dark:bg-[#202123]/50"
                      }`}
                    >
                      <td className="p-3 text-center font-semibold text-indigo-700 dark:text-indigo-300 border-r border-gray-200 dark:border-gray-700">
                        {startIdx + idx + 1}
                      </td>
                      <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">
                        {applicant.job_type || "N/A"}
                      </td>
                      <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 whitespace-nowrap">
                        {applicant.applicant_name || "N/A"}
                      </td>
                      <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">
                        {applicant.applicant_email || "—"}
                      </td>
                      <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">
                        {applicant.applicant_phone || "—"}
                      </td>
                      <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">
                        {formatDate(applicant.applied_at)}
                      </td>
                      <td className="p-3 text-left border-r border-gray-200 dark:border-gray-700">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">
                          {applicant.application_status || "N/A"}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-semibold border border-indigo-200 hover:bg-indigo-100 transition dark:bg-indigo-900/30 dark:text-indigo-200 dark:border-indigo-700"
                          onClick={() => openNoteModal(applicant)}
                        >
                          <FiFileText />
                          Note
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="lg:hidden p-4 space-y-4">
            {paginatedApplicants.length === 0 ? (
              <div className="text-center text-gray-600 dark:text-gray-300 py-8 bg-white dark:bg-[#1E1E1E] rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                No job applicants available.
              </div>
            ) : (
              paginatedApplicants.map((applicant, idx) => (
                <div
                  key={applicant.id || idx}
                  className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        #{startIdx + idx + 1}
                      </p>
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {applicant.applicant_name || "N/A"}
                      </p>
                      <p className="text-sm text-indigo-600 dark:text-indigo-300">
                        {applicant.job_type || "N/A"}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">
                      {applicant.application_status || "N/A"}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <p>Email: {applicant.applicant_email || "—"}</p>
                    <p>Phone: {applicant.applicant_phone || "—"}</p>
                    <p>Applied: {formatDate(applicant.applied_at)}</p>
                  </div>
                  <button
                    className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-600 text-sm font-semibold border border-indigo-200 hover:bg-indigo-100 transition dark:bg-indigo-900/30 dark:text-indigo-200 dark:border-indigo-700"
                    onClick={() => openNoteModal(applicant)}
                  >
                    <FiFileText />
                    View / Add Note
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 dark:text-gray-400">
                Show
              </span>
              <select
                className="border rounded-lg px-3 py-1 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 transition-colors"
                value={entriesPerPage}
                onChange={(e) => setEntriesPerPage(Number(e.target.value))}
              >
                {[5, 10, 25, 50, 100].map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                entries
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className={`px-3 py-1 rounded-lg text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-gray-700 transition ${
                  safePage === 1 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                &lt;
              </button>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Page {safePage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={safePage === totalPages}
                className={`px-3 py-1 rounded-lg text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-gray-700 transition ${
                  safePage === totalPages ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                &gt;
              </button>
            </div>
          </div>
        </div>

        {showNoteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-4">
            <div className="bg-white dark:bg-[#202123] rounded-2xl shadow-2xl w-full max-w-lg relative p-6">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition"
                onClick={closeNoteModal}
              >
                <FiX size={22} />
              </button>
              <h2 className="text-xl font-bold text-indigo-700 dark:text-indigo-200 mb-4">
                Update Applicant
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Application Status
                  </label>
                  <select
                    name="status"
                    value={noteForm.status}
                    onChange={handleNoteChange}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="">Select status</option>
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Recruiter Notes
                  </label>
                  <textarea
                    name="recruiter_notes"
                    rows={4}
                    value={noteForm.recruiter_notes}
                    onChange={handleNoteChange}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400"
                    placeholder="Add your notes here..."
                  />
                </div>
              </div>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  className="px-6 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                  onClick={closeNoteModal}
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleUpdateApplicant}
                  disabled={updating || !noteForm.status}
                >
                  {updating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

