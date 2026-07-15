"use client";

import { useEffect, useState } from "react";
import AdminConsole from "./components/admin-console";
import UserAssessment from "./components/user-assessment";

type Surface = "assessment" | "admin";

export default function Home() {
  const [surface, setSurface] = useState<Surface>("assessment");

  useEffect(() => {
    const syncSurface = () => {
      setSurface(window.location.hash.startsWith("#/admin") ? "admin" : "assessment");
    };
    syncSurface();
    window.addEventListener("hashchange", syncSurface);
    return () => window.removeEventListener("hashchange", syncSurface);
  }, []);

  function openConsole() {
    window.location.hash = "#/admin/overview";
    setSurface("admin");
  }

  function openAssessment() {
    window.location.hash = "#/assessment";
    setSurface("assessment");
  }

  return surface === "admin" ? (
    <AdminConsole onBackToAssessment={openAssessment} />
  ) : (
    <UserAssessment onOpenConsole={openConsole} />
  );
}
