import Sidebar from "./Sidebar";
import OnboardingModal from "./OnboardingModal";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex">
      {/* First-Time User Profile Completion Modal */}
      <OnboardingModal />
      
      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Page Content (each page renders its own PageHeader + content) */}
        <main className="flex-1 flex flex-col">
          {children}
        </main>

      </div>
    </div>
  );
}