import { useEffect, useRef, useState } from "react";
import { tabFromHash, navigateTo, newsIdFromHash } from "./routes";
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
import { HelpCenterPage } from "./components/HelpCenterPage";
import { NewsPage } from "./components/NewsPage";
import { NewsDetailPage } from "./components/NewsDetailPage";

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
  // The URL hash is the source of truth for navigation; state mirrors it.
  const [activeTab, setActiveTab] = useState(tabFromHash);
  // Full hash too, so a param-only change (e.g. #/news/1 → #/news/2, same tab)
  // still re-renders; keyed on the page below to remount the detail view.
  const [hash, setHash] = useState(() => window.location.hash);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);

  // hashchange can fire before a re-render publishes new auth state, so read it
  // through a ref to avoid gating on a stale closure value.
  const authRef = useRef(isAuthenticated);
  authRef.current = isAuthenticated;
  const pendingRef = useRef(pendingTab);
  pendingRef.current = pendingTab;

  // Send the user to login, remembering where they wanted to go.
  function requireAuth(intended: string) {
    setPendingTab(intended);
    navigateTo("auth");
  }

  // Apply whatever the URL currently says, enforcing auth gates.
  useEffect(() => {
    function applyHash() {
      const tab = tabFromHash();
      if (PROTECTED_TABS.has(tab) && !authRef.current) {
        setPendingTab(tab);
        navigateTo("auth");
        return;
      }
      setActiveTab(tab);
      setHash(window.location.hash);
    }
    applyHash(); // handles a deep link on first load
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  function handleTabChange(tab: string) {
    if (PROTECTED_TABS.has(tab) && !isAuthenticated) {
      requireAuth(tab);
    } else {
      navigateTo(tab);
    }
  }

  function handleAuthSuccess() {
    setIsAuthenticated(true);
    authRef.current = true; // let the hashchange below pass the auth gate
    const dest = pendingRef.current ?? "account";
    setPendingTab(null);
    navigateTo(dest);
  }

  // Auth renders fullscreen — no navbar
  if (activeTab === "auth") {
    return (
      <AuthPage
        onSuccess={handleAuthSuccess}
        onBack={() => { setPendingTab(null); navigateTo("home"); }}
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
        return <ResidentCertificatePage onBack={() => navigateTo("home")} />;
      case "birth-declaration":
        return <BirthDeclarationPage onBack={() => navigateTo("home")} />;
      case "death-declaration":
        return <DeathDeclarationPage onBack={() => navigateTo("home")} />;
      case "marriage-certificate":
        return <MarriageCertificatePage onBack={() => navigateTo("home")} />;
      case "divorce-certificate":
        return <DivorceCertificatePage onBack={() => navigateTo("home")} />;
      case "family-book":
        return <FamilyBookPage onBack={() => navigateTo("home")} />;
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
      case "help":
        return <HelpCenterPage onTabChange={handleTabChange} />;
      case "news":
        return <NewsPage onBack={() => navigateTo("home")} />;
      case "news-detail":
        return (
          <NewsDetailPage
            key={hash}
            id={newsIdFromHash()}
            onBack={() => navigateTo("news")}
            onOpenTab={handleTabChange}
          />
        );
      default:
        return <HomePage onTabChange={handleTabChange} isAuthenticated={isAuthenticated} />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={handleTabChange} isAuthenticated={isAuthenticated}>
      {renderPage()}
    </Layout>
  );
}
