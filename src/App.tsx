import React, { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
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
  const { activeTab } = useApp();
  const [isOAuthModalOpen, setIsOAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            {activeTab === "overview" && (
              <OverviewTab onOpenOAuthModal={() => setIsOAuthModalOpen(true)} />
            )}
            {activeTab === "accounts" && (
              <AccountsTab onOpenOAuthModal={() => setIsOAuthModalOpen(true)} />
            )}
            {activeTab === "routing" && <RoutingTab />}
            {activeTab === "keys" && <ApiKeysTab />}
            {activeTab === "playground" && <PlaygroundTab />}
            {activeTab === "config" && <ConfigTab />}
          </div>
        </main>
      </div>

      <ConnectionModal />
      <OAuthModal
        isOpen={isOAuthModalOpen}
        onClose={() => setIsOAuthModalOpen(false)}
      />
      <ToastContainer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
};

export default App;
