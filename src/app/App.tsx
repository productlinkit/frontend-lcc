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

export type { Lang } from "./i18n";

// Tabs that require login. Service & Wallet are browsable without login (Wallet
// shows an empty state); applying for a service or using a wallet action sends
// the user to login first, then back to the intended destination.
const PROTECTED_TABS = new Set([
  "history",
  "account",
  "resident-certificate",
  "birth-declaration",
  "death-declaration",
  "marriage-certificate",
  "divorce-certificate",
  "family-book",
]);

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);

  // Send the user to login, remembering where they wanted to go.
  function requireAuth(intended: string) {
    setPendingTab(intended);
    setActiveTab("auth");
  }

  function handleTabChange(tab: string) {
    if (PROTECTED_TABS.has(tab) && !isAuthenticated) {
      requireAuth(tab);
    } else {
      setActiveTab(tab);
    }
  }

  function handleAuthSuccess() {
    setIsAuthenticated(true);
    const dest = pendingTab ?? "account";
    setPendingTab(null);
    setActiveTab(dest);
  }

  // Auth renders fullscreen — no navbar
  if (activeTab === "auth") {
    return (
      <AuthPage
        onSuccess={handleAuthSuccess}
        onBack={() => { setPendingTab(null); setActiveTab("home"); }}
      />
    );
  }

  const renderPage = () => {
    switch (activeTab) {
      case "home":
        return <HomePage onTabChange={handleTabChange} isAuthenticated={isAuthenticated} />;
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
        return (
          <WalletPage
            isAuthenticated={isAuthenticated}
            onRequireAuth={() => requireAuth("wallet")}
          />
        );
      case "account":
        return <AccountPage />;
      default:
        return <HomePage onTabChange={handleTabChange} isAuthenticated={isAuthenticated} />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={handleTabChange}>
      {renderPage()}
    </Layout>
  );
}
