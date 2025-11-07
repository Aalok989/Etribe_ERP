import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { FiTag, FiSave, FiUsers } from "react-icons/fi";

import DashboardLayout from "../../components/admin/Layout/DashboardLayout";
import { templates } from "../../components/user/VisitingCard/templates";
import parentLogo from "../../assets/logos/parent.jpg";
import memberPhoto from "../../assets/Aashish.png";

const mockUsers = [
  { id: "u1", name: "Aashish Jangra" },
  { id: "u2", name: "Parveen Kumar" },
  { id: "u3", name: "Rohit Sharma" },
];

const categoryOptions = [
  { value: "basic", label: "Basic" },
  { value: "standard", label: "Standard" },
  { value: "premium", label: "Premium" },
];

const defaultCardData = {
  fullName: "Aashish Jangra",
  profileImage: memberPhoto,
  email: "aashish@example.com",
  phone: "+91 98174 36147",
  address: "Street Location, City, Country",
  issuedUpto: "Dec 2025",
  membershipId: "12345",
  companyLogo: parentLogo,
};

const CARD_WIDTH = 255;
const CARD_HEIGHT = 405;

export default function EVisitingCard_Admin() {
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("basic");
  const [selectedTemplate, setSelectedTemplate] = useState("1");
  const [isSaving, setIsSaving] = useState(false);

  const templateEntries = useMemo(() => {
    return Object.entries(templates).map(([key, Component]) => ({
      key,
      Component,
    }));
  }, []);

  const handleSave = async () => {
    if (!selectedUser) {
      toast.error("Please select a user before saving.");
      return;
    }

    setIsSaving(true);
    try {
      // TODO: Replace with actual API call once endpoint is ready
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.success("Visiting card template preference saved successfully.");
    } catch (error) {
      toast.error("Failed to save template preference. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-orange-600">E-Visiting Card</h1>
            <p className="text-sm text-gray-500">
              Assign visiting card templates to members based on category.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-lg px-3 py-2">
              <FiUsers className="text-blue-600" />
              <select
                className="bg-transparent text-sm outline-none"
                value={selectedUser}
                onChange={(event) => setSelectedUser(event.target.value)}
              >
                <option value="">Select user</option>
                {mockUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-lg px-3 py-2">
              <FiTag className="text-indigo-600" />
              <select
                className="bg-transparent text-sm outline-none"
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
              >
                {categoryOptions.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
            >
              <FiSave />
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        <div className="bg-transparent">
          <div className="px-2 sm:px-6 py-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Available Templates</h2>
              <p className="text-sm text-gray-500">
                Choose a template to preview and assign.
              </p>
            </div>
            <span className="text-sm text-gray-400">
              Showing {templateEntries.length} templates
            </span>
          </div>

          <div className="p-2 sm:p-6 grid grid-cols-1 md:grid-cols-3 2xl:grid-cols-4 gap-x-4 gap-y-6 justify-items-center">
            {templateEntries.map(({ key, Component }) => {
              const isSelected = selectedTemplate === key;
              return (
                <div
                  key={key}
                  className="flex flex-col items-center gap-4 transition duration-150 cursor-pointer"
                  onClick={() => setSelectedTemplate(key)}
                >
                  <div className="pt-6 pb-3">
                    <Component
                      cardData={defaultCardData}
                      cardWidth={CARD_WIDTH}
                      cardHeight={CARD_HEIGHT}
                      cardId={`admin-evisitingcard-${key}`}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="radio"
                      name="template"
                      value={key}
                      checked={isSelected}
                      onChange={(event) => {
                        event.stopPropagation();
                        setSelectedTemplate(key);
                      }}
                      className="w-5 h-5 text-indigo-600"
                      onClick={(event) => event.stopPropagation()}
                    />
                    Template {key}
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


