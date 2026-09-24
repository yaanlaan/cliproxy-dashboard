import { UpdateModal } from "./components/UpdateModal";
import { AccountModal } from "./components/AccountModal";
import React, { useState } from "react";
import { I18nProvider } from "./i18n";
import { AppProvider, useApp } from "./context/AppContext";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { LoginPage } from "./components/LoginPage";
import { ConnectionModal } from "./components/ConnectionModal";
import { ToastContainer } from "./components/ToastContainer";
import { OverviewTab } from "./components/tabs/OverviewTab";
import { AccountsTab } from "./components/tabs/AccountsTab";
import { OAuthModal } from "./components/tabs/OAuthModal";
import { RoutingTab } from "./components/tabs/RoutingTab";
import { ApiKeysTab } from "./components/tabs/ApiKeysTab";
import { PlaygroundTab } from "./components/tabs/PlaygroundTab";
import { ConfigTab } from "./components/tabs/ConfigTab";

const MainLayout: React.FC = () => {
  const { activeTab, isUpdateModalOpen, setIsUpdateModalOpen } = useApp();
  const [isOAuthModalOpen, setIsOAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            {/* Keep all tabs mounted in DOM to preserve inputs, streams, and state */}
            <div className={activeTab === "overview" ? "block" : "hidden"}>
              <OverviewTab onOpenOAuthModal={() => setIsOAuthModalOpen(true)} />
            </div>

            <div className={activeTab === "accounts" ? "block" : "hidden"}>
              <AccountsTab onOpenOAuthModal={() => setIsOAuthModalOpen(true)} />
            </div>

            <div className={activeTab === "routing" ? "block" : "hidden"}>
              <RoutingTab />
            </div>

            <div className={activeTab === "keys" ? "block" : "hidden"}>
              <ApiKeysTab />
            </div>

            <div className={activeTab === "playground" ? "block" : "hidden"}>
              <PlaygroundTab />
            </div>

            <div className={activeTab === "config" ? "block" : "hidden"}>
              <ConfigTab />
            </div>
          </div>
        </main>
      </div>

      <ConnectionModal />
      <AccountModal />
      <UpdateModal isOpen={isUpdateModalOpen} onClose={() => setIsUpdateModalOpen(false)} />
      <OAuthModal
        isOpen={isOAuthModalOpen}
        onClose={() => setIsOAuthModalOpen(false)}
      />
      <ToastContainer />
    </div>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <ToastContainer />
      </>
    );
  }

  return <MainLayout />;
};

export const App: React.FC = () => {
  return (
    <I18nProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </I18nProvider>
  );
};

export default App;


