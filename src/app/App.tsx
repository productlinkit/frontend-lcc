import { useState } from "react";
import { Layout } from "./components/Layout";
import { HomePage } from "./components/HomePage";
import { HistoryPage } from "./components/HistoryPage";
import { WalletPage } from "./components/WalletPage";
import { AccountPage } from "./components/AccountPage";
import { AuthPage } from "./components/AuthPage";
import { ResidentCertificatePage } from "./components/ResidentCertificatePage";
import { BirthDeclarationPage } from "./components/BirthDeclarationPage";
import { DeathDeclarationPage } from "./components/DeathDeclarationPage";
import { MarriageCertificatePage } from "./components/MarriageCertificatePage";
import { DivorceCertificatePage } from "./components/DivorceCertificatePage";
import { FamilyBookPage } from "./components/FamilyBookPage";
import { ServicePage } from "./components/ServicePage";

export type Lang = "en" | "lo";

const PROTECTED_TABS = new Set(["service", "history", "wallet", "account"]);

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [lang, setLang] = useState<Lang>("en");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  function handleTabChange(tab: string) {
    if (PROTECTED_TABS.has(tab) && !isAuthenticated) {
      setActiveTab("auth");
    } else {
      setActiveTab(tab);
    }
  }

  function handleAuthSuccess() {
    setIsAuthenticated(true);
    setActiveTab("account");
  }

  // Auth renders fullscreen — no navbar
  if (activeTab === "auth") {
    return (
      <AuthPage
        onSuccess={handleAuthSuccess}
        onBack={() => setActiveTab("home")}
      />
    );
  }

  const renderPage = () => {
    switch (activeTab) {
      case "home":
        return <HomePage onTabChange={handleTabChange} lang={lang} />;
      case "service":
        return <ServicePage onTabChange={handleTabChange} />;
      case "resident-certificate":
        return <ResidentCertificatePage onBack={() => setActiveTab("home")} />;
      case "birth-declaration":
        return <BirthDeclarationPage onBack={() => setActiveTab("home")} />;
      case "death-declaration":
        return <DeathDeclarationPage onBack={() => setActiveTab("home")} />;
      case "marriage-certificate":
        return <MarriageCertificatePage onBack={() => setActiveTab("home")} />;
      case "divorce-certificate":
        return <DivorceCertificatePage onBack={() => setActiveTab("home")} />;
      case "family-book":
        return <FamilyBookPage onBack={() => setActiveTab("home")} />;
      case "history":
        return <HistoryPage />;
      case "wallet":
        return <WalletPage />;
      case "account":
        return <AccountPage lang={lang} />;
      default:
        return <HomePage onTabChange={handleTabChange} lang={lang} />;
    }
  };

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      lang={lang}
      onLangChange={setLang}
    >
      {renderPage()}
    </Layout>
  );
}
