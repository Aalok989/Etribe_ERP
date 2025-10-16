import React from "react";

export default function Footer() {
  return (
    <footer className="text-center text-gray-500 dark:text-gray-200 text-xs py-2 bg-white dark:bg-[#1E1E1E] rounded-xl shadow border border-gray-200 dark:border-gray-700">
      <span className="text-gray-500 dark:text-gray-200 text-sm">
        &copy; {new Date().getFullYear()} Etribe. All rights reserved.
      </span>
    </footer>
  );
}