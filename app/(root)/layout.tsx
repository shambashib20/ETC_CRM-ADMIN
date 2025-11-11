import Chat from "@/components/chat";
import { MobileHeader } from "@/components/dashboard/mobile-header";
import Notifications from "@/components/dashboard/notifications";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import Widget from "@/components/dashboard/widget";
import { SidebarProvider } from "@/components/ui/sidebar";
import { MockData } from "@/types/dashboard";
import mockDataJson from "@/mock.json";
import { MobileChat } from "@/components/chat/mobile-chat";
import { V0Provider } from "@/lib/v0-context";

const mockData = mockDataJson as MockData;

export default function Applayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="appLayout">
      <V0Provider isV0={false}>
        <SidebarProvider>
          {/* Mobile Header - only visible on mobile */}
          <MobileHeader mockData={mockData} />

          {/* Desktop Layout */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-gap lg:px-sides">
            <div className="hidden lg:block col-span-2 top-0 relative">
              <DashboardSidebar />
            </div>
            <div className="col-span-1 lg:col-span-7">{children}</div>
            <div className="col-span-3 hidden lg:block">
              <div className="space-y-gap py-sides min-h-screen max-h-screen sticky top-0 overflow-clip">
                <Widget widgetData={mockData.widgetData} />
                {/* <Notifications initialNotifications={mockData.notifications} /> */}
                {/* <Chat /> */}
              </div>
            </div>
          </div>

          {/* Mobile Chat - floating CTA with drawer */}
          {/* <MobileChat /> */}
        </SidebarProvider>
      </V0Provider>
    </div>
  );
}
