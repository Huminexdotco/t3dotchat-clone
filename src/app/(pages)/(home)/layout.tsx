import * as React from "react";
import { IoMdClose } from "react-icons/io";
import { FaGithub } from "react-icons/fa";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import SidebarLogo from "@/components/global-cmp/sidebar-logo";
import { FiPlus, FiSidebar } from "react-icons/fi";
import DevInput from "@/components/global-cmp/dev-input";
import { FiSearch } from "react-icons/fi";
import ChatHeader from "@/components/chat-cmp/chat-header";
import { LuLogIn, LuPin, LuPinOff, LuSettings2 } from "react-icons/lu";
import ThemeToggle from "@/components/global-cmp/theme-toggle";
import Link from "next/link";
import ChatInput from "@/components/chat-cmp/chat-input";
import SearchThreads from "@/components/chat-cmp/search-threads";
import SidebarThreads from "@/components/global-cmp/sidebar-threads";
import { getUser } from "@/action/user.action";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import DevTooltip from "@/components/global-cmp/dev-tooltip";

async function ChatLayoutContent({ children }: { children: React.ReactNode }) {
  const session = await auth();
  console.log(session, "user session");
  return (
    <div className={` h-dvh w-full flex flex-col overflow-hidden `}>
      <ChatHeader />
      <main
        className={`
         flex-1 overflow-hidden z-20  border-chat-border bg-chat-background 
         transition-[margin-top,height,rounded] md:mt-3.5 h-full md:border md:rounded-tl-xl duration-100 ease-snappy has-[.sidebar-check:checked]:mt-0 has-[.sidebar-check:checked]:h-dvh has-[.sidebar-check:checked]:rounded-none
        
      `}
      >
        <input
          className="hidden sidebar-check"
          type="checkbox"
          name="sidebar-check"
        />
        <div className=" h-full overflow-y-auto pt-5 md:pt-0">{children}</div>
        <div className="max-w-3xl relative mx-auto w-full">
          <ChatInput />
        </div>
      </main>

      <div className="pointer-events-auto t3-header-search fixed h-fit left-2 top-2 z-50 flex flex-row gap-0.5 p-1 inset-0 right-auto text-muted-foreground rounded-md backdrop-blur-sm transition-[width] delay-125 duration-100  bg-sidebar blur-fallback:bg-sidebar max-sm:delay-125 max-sm:duration-100 max-sm:w-[6.75rem] max-sm:bg-sidebar">
        <SidebarTrigger />
        <div
          className={`transition-[opacity, translate-x] md:has-[.sidebar-check:not(:checked)]:pointer-events-none  flex flex-nowrap duration-200 ease-snappy gap-0.5 md:has-[.sidebar-check:not(:checked)]:-translate-x-[20px] md:has-[.sidebar-check:not(:checked)]:opacity-0 md:has-[.sidebar-check:not(:checked)]:w-0 md:has-[.sidebar-check:not(:checked)]:-z-50 md:has-[.sidebar-check:not(:checked)]:h-0 `}
        >
          <input
            className="hidden sidebar-check"
            type="checkbox"
            name="sidebar-check"
          />
          <SearchThreads />
          <Button variant="ghost" className="p-0" size="icon">
            <Link href="/" className="w-full h-full grid place-items-center">
              <FiPlus />
            </Link>
          </Button>
        </div>
      </div>
      <div
        className={`fixed pointer-events-auto  right-2  top-2 z-50 flex flex-row p-1 items-center justify-center bg-sidebar rounded-md duration-100   transition-[translate-x] ease-snappy   gap-1  text-muted-foreground md:has-[.sidebar-check:checked]:bg-sidebar md:has-[.sidebar-check:checked]:backdrop-blur-sm md:has-[.sidebar-check:not(:checked)]:bg-transparent`}
      >
        <input
          className="hidden sidebar-check"
          type="checkbox"
          name="sidebar-check"
        />
        <Link href="/settings/subscription">
          <DevTooltip tipData="Settings">
            <Button variant="ghost" size="icon">
              <LuSettings2 />
            </Button>
          </DevTooltip>
        </Link>
        <ThemeToggle />
        <Link target="_blank" href="https://github.com/Huminexdotco/t3dotchat-clone">
          <DevTooltip tipData="GitHub">
            <Button variant="ghost" size="icon">
              <FaGithub/>
            </Button>
          </DevTooltip>
        </Link>
      </div>
    </div>
  );
}

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, user] = await Promise.all([auth(), getUser()]);
  // if (!session?.user) {
  //   redirect("/auth");
  // }
  // // if (!user?.data?.openRouterApiKey || user?.data?.openRouterApiKey == "") {
  // //   redirect("/connect");
  // // }
  return (
    <>
      <SidebarProvider>
        <Sidebar className="!bg-transparent" collapsible="offcanvas">
          <SidebarHeader>
            <SidebarMenu className="space-y-2">
              <SidebarMenuItem>
                <div className="flex items-center justify-center h-8 mt-2 flex-1 *:!text-wordmark-color">
                  <Link href="/">
                    <SidebarLogo />
                  </Link>
                </div>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Button className="w-full p-0" variant="t3">
                  <Link
                    href="/"
                    className="w-full h-full grid place-items-center"
                  >
                    New Chat
                  </Link>
                </Button>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SearchThreads isSidebar />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarThreads />
          <SidebarFooter>
            <SidebarMenu>
              {session ? (
                <SidebarMenuItem>
                  <Link
                    href="/settings/subscription"
                    className="flex rounded-lg  p-2.5 mb-2 w-full hover:bg-sidebar-accent min-w-0 flex-row items-center gap-3"
                  >
                    <img
                      src={session.user?.image || ""}
                      alt={session.user?.name || ""}
                      className="h-8 w-8 bg-accent rounded-full ring-1 ring-muted-foreground/20"
                    />
                    <div className="flex min-w-0 flex-col text-foreground">
                      <span className="truncate text-sm font-medium">
                        {session.user?.name}
                      </span>
                      <span className="text-xs">Free</span>
                    </div>
                  </Link>
                </SidebarMenuItem>
              ) : (
                <SidebarMenuItem className="p-1">
                  <Link
                    href="/auth"
                    className="flex rounded-lg p-2.5 py-4 mb-1 w-full hover:bg-sidebar-accent min-w-0 flex-row items-center gap-4 text-[16px]"
                  >
                    <LuLogIn size={18} /> Login
                  </Link>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarFooter>
          <SidebarRail />
          <span className="text-xs bg-accent p-0.5 pl-5 *:underline *:text-muted-foreground">
            Built by{" "}
            <a target="_blank" href="https://devyanshyadav.com">
              Devyansh{" "}
            </a>{" "}
            and{" "}
            <a target="_blank" href="https://aasuyadav.com">
              Aasu
            </a>
          </span>
        </Sidebar>

        <ChatLayoutContent>{children}</ChatLayoutContent>
      </SidebarProvider>
    </>
  );
}
