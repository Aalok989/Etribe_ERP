import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import pako from "pako";
import VisitingCard from "../../components/user/VisitingCard";

const decodeSharePayload = (encoded) => {
  if (!encoded) return { error: "No share data provided." };

  const normalized = (() => {
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padding = base64.length % 4;
    if (padding === 2) base64 += "==";
    else if (padding === 3) base64 += "=";
    else if (padding !== 0) base64 += "==";
    return base64;
  })();

  try {
    const jsonString = pako.inflate(atob(normalized), { to: "string" });
    const payload = JSON.parse(jsonString);

    if (!payload || typeof payload !== "object") {
      return { error: "Invalid share data." };
    }

    const templateId = Number(payload.templateId) || 1;
    const cardData = payload.cardData && typeof payload.cardData === "object"
      ? payload.cardData
      : {};

    return { templateId, cardData };
  } catch (error) {
    return { error: "Unable to open this visiting card. The share link may be invalid or expired." };
  }
};

export default function VisitingCardShare() {
  const { encodedData } = useParams();

  const { templateId, cardData, error } = useMemo(
    () => decodeSharePayload(encodedData),
    [encodedData]
  );

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 px-4">
        <div className="max-w-lg w-full bg-white shadow-xl rounded-3xl border border-gray-200 p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Unable to Load Visiting Card</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 px-4 py-10">
      <div className="w-full max-w-5xl">
        <VisitingCard
          displayMode="inline"
          allowSelection={false}
          showSaveButton={false}
          selectedTemplate={templateId}
          profileData={cardData}
        />
      </div>
    </div>
  );
}

