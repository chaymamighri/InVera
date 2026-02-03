import { useState } from "react";

export const useReports = () => {
  const STORAGE_KEY = "reports-storage";

  const initReports = () => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          salesReports: [],
          purchaseReports: [],
        })
      );
    }
  };

  const getReports = () => {
    initReports();
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  };

  const addReport = (type, report) => {
    // type = "sales" ou "purchase"
    const reports = getReports();
    if (type === "sales") {
      reports.salesReports.push({ id: Date.now(), ...report });
    } else if (type === "purchase") {
      reports.purchaseReports.push({ id: Date.now(), ...report });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  };

  return { getReports, addReport };
};
