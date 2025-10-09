"use client";

import * as React from "react";
import {
  IconBriefcase,
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconDeviceIpadPin,
  IconMapPinShare,
  IconMessageCircleSearch,
  IconReport,
  IconSearch,
  IconSettings,
  IconSteam,
  IconUsers,
  IconUsersPlus,
  IconSmartHome,
  IconBuildingBank,
  IconMapSearch,
  IconLocationPin,
  IconNavigationShare,
  IconSquareRoundedPercentage,
} from "@tabler/icons-react";
import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import LocationSelector from "./location-selector";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { CalendarDays } from "lucide-react";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import ModeToggle from "@/components/mode-toggle";

const data = {
  navMain: [
    {
      title: "Home",
      url: "/workspace",
      icon: IconSmartHome,
    },
    {
      title: "City Rank",
      url: "/workspace/city-rank",
      icon: IconNavigationShare,
    },
    {
      title: "Incident Map",
      url: "/workspace/map",
      icon: IconMapSearch,
    },
    {
      title: "Meetups",
      url: "/workspace/meetups",
      icon: IconDeviceIpadPin,
    },
    {
      title: "Remote Jobs",
      url: "/workspace/jobs",
      icon: IconBriefcase,
    },
    {
      title: "Places",
      url: "/workspace/places",
      icon: IconBuildingBank,
    },
  ],
};

export function AppSidebar({ ...props }) {
  const { data: session, status } = useSession();
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/users/${session.user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data.cityName) {
            setUserLocation({
              cityName: data.data.cityName,
              latitude: data.data.cityLatitude,
              longitude: data.data.cityLongitude,
            });
          }
        });
    }
  }, [session]);

  // Create user object from session data or use default values
  const user = {
    name: session?.user?.name || 
          (session?.user?.given_name && session?.user?.family_name 
            ? `${session.user.given_name} ${session.user.family_name}` 
            : session?.user?.email || "Guest User"),
    email: session?.user?.email || "user@example.com",
    avatar: session?.user?.image || "/avatars/shadcn.jpg",
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-2  mb-3"
            >
              <a href="#">
                <span className="text-2xl font-semibold">Nomad Page</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <LocationSelector
        currentLocation={userLocation}
        onLocationSet={setUserLocation}
      />
      <SidebarFooter>
        <div className="flex items-center justify-between w-full gap-2 px-2">
          <NavUser user={user} />
          <ModeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}