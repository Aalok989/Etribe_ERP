import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { FiTag, FiSave, FiUsers, FiCheckSquare, FiSquare } from "react-icons/fi";

import DashboardLayout from "../../components/admin/Layout/DashboardLayout";
import { templates } from "../../components/user/VisitingCard/templates";
import parentLogo from "../../assets/logos/parent.jpg";
import memberPhoto from "../../assets/Aashish.png";
import api from "../../api/axiosConfig";
import { getAuthHeaders } from "../../utils/apiHeaders";
import {
  templateCatalog,
  getCategories,
  getAssignmentForUser,
  saveAssignmentForUser,
} from "../../data/mockVisitingCardConfig";

const categoryMap = getCategories();
const categoryOptions = [
  { value: 'all', label: 'All Categories' },
  ...Array.from(categoryMap.keys()).map((key) => ({
    value: key,
    label: key.replace(/\b\w/g, (char) => char.toUpperCase()),
  })),
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
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTemplates, setSelectedTemplates] = useState(() => {
    const firstTemplate = templateCatalog[0];
    return firstTemplate ? [firstTemplate.id] : [];
  });
  const [isSaving, setIsSaving] = useState(false);

  const templatesForCategory = useMemo(() => {
    if (selectedCategory === 'all') {
      return templateCatalog;
    }
    return templateCatalog.filter((tpl) => tpl.category === selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const response = await api.get(
          "/userDetail/active_members",
          { headers: getAuthHeaders() }
        );

        const list = response.data?.data ?? [];
        const currentUid = localStorage.getItem("uid");
        const formatted = list
          .filter((item) => item?.name)
          .map((item) => ({
            id: item.id || item.user_id || item.uid || item.name,
            name: item.name,
          }))
          .filter((item) => {
            if (!currentUid) return true;
            return String(item.id) !== String(currentUid);
          });

        setUsers(formatted);
      } catch (error) {
        console.error("Failed to load users:", error);
        toast.error("Unable to load users. Please try again.");
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (!selectedUser) {
      if (templateCatalog[0]) {
        setSelectedTemplates([templateCatalog[0].id]);
      }
      return;
    }

    const assignment = getAssignmentForUser(selectedUser);
    if (assignment && Array.isArray(assignment.templateIds) && assignment.templateIds.length > 0) {
      const valid = assignment.templateIds.filter((id) => templates[id]);
      if (valid.length > 0) {
        setSelectedTemplates(valid);
        return;
      }
    }

    if (templateCatalog[0]) {
      setSelectedTemplates([templateCatalog[0].id]);
    }
  }, [selectedUser]);

  useEffect(() => {
    const templatesInCategory = templatesForCategory.map((tpl) => tpl.id);
    const filtered = selectedTemplates.filter((id) => templatesInCategory.includes(id));
    if (filtered.length === 0 && templatesInCategory[0]) {
      setSelectedTemplates([templatesInCategory[0]]);
    } else if (filtered.length !== selectedTemplates.length) {
      setSelectedTemplates(filtered);
    }
  }, [selectedCategory, templatesForCategory, selectedTemplates]);

  const handleSave = async () => {
    if (!selectedUser) {
      toast.error("Please select a user before saving.");
      return;
    }

    setIsSaving(true);
    try {
      // TODO: Replace with actual API call once endpoint is ready
      if (selectedTemplates.length === 0) {
        toast.error("Select at least one template.");
        setIsSaving(false);
        return;
      }

      saveAssignmentForUser(selectedUser, {
        category: selectedCategory,
        templateIds: selectedTemplates,
      });
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
                disabled={loadingUsers}
              >
                <option value="">{loadingUsers ? "Loading users..." : "Select user"}</option>
                {users.map((user) => (
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
              Showing {templatesForCategory.length} templates in {selectedCategory}
            </span>
          </div>

          <div className="p-2 sm:p-6 grid grid-cols-1 md:grid-cols-3 2xl:grid-cols-4 gap-x-4 gap-y-6 justify-items-center">
            {templatesForCategory.map(({ id, label }) => {
              const Component = templates[id];
              if (!Component) return null;
              const isSelected = selectedTemplates.includes(id);
              return (
                <div
                  key={id}
                  className="flex flex-col items-center gap-4 transition duration-150 cursor-pointer"
                  onClick={() => {
                    setSelectedTemplates((prev) => {
                      if (prev.includes(id)) {
                        return prev.filter((value) => value !== id);
                      }
                      return [...prev, id];
                    });
                  }}
                >
                  <div className="pt-6 pb-3">
                    <Component
                      cardData={defaultCardData}
                      cardWidth={CARD_WIDTH}
                      cardHeight={CARD_HEIGHT}
                      cardId={`admin-evisitingcard-${id}`}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 select-none">
                    {isSelected ? (
                      <FiCheckSquare className="text-indigo-600" />
                    ) : (
                      <FiSquare className="text-gray-400" />
                    )}
                    {label}
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


