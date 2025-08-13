import { ReactNode } from "react";

import { getInitials } from "@/lib/utils";
import { DayRangePicker } from "./_components/topbar/day-range-picker";
import { ThemeSwitcher } from "./_components/topbar/theme-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemePresets } from "./_components/topbar/theme-presets";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
const demoUser = {
  id: "1",
  name: "Racional User",
  username: "jacky",
  email: "jacky.com",
  avatar: "/avatars/jack.png",
};
export default async function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 flex h-12 shrink-0 items-center gap-2 border-b backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex w-full items-center justify-between px-4 lg:px-6">
          <DayRangePicker />

          {/* Desktop view - show all components */}
          <div className="hidden items-center gap-2 md:flex">
            <ThemePresets />
            <ThemeSwitcher />
            <Avatar className="size-9 rounded-lg">
              <AvatarImage src={demoUser.avatar || undefined} alt={demoUser.name} />
              <AvatarFallback className="rounded-lg">{getInitials(demoUser.name)}</AvatarFallback>
            </Avatar>
          </div>

          {/* Mobile view - dropdown menu */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-9">
                  <Avatar className="size-8 rounded-lg">
                    <AvatarImage src={demoUser.avatar || undefined} alt={demoUser.name} />
                    <AvatarFallback className="rounded-lg text-xs">{getInitials(demoUser.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="size-8 rounded-lg">
                    <AvatarImage src={demoUser.avatar || undefined} alt={demoUser.name} />
                    <AvatarFallback className="rounded-lg text-xs">{getInitials(demoUser.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{demoUser.name}</span>
                    <span className="text-muted-foreground text-xs">@{demoUser.username}</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <div className="text-muted-foreground text-sm">Select theme</div>
                <div className="flex gap-2">
                  <ThemePresets />
                  <ThemeSwitcher />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <div className="h-full p-3 md:p-6">{children}</div>
    </>
  );
}
