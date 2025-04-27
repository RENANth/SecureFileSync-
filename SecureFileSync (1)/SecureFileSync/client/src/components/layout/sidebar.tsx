import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  FileText, 
  Share, 
  BarChart, 
  Settings,
  ShieldCheck,
  User
} from "lucide-react";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  text: string;
  isActive: boolean;
}

const SidebarLink = ({ href, icon, text, isActive }: SidebarLinkProps) => {
  return (
    <div className="w-full">
      <a
        href={href}
        className={cn(
          "group flex items-center px-2 py-3 text-sm font-medium rounded-md",
          isActive 
            ? "bg-primary-50 text-primary-700" 
            : "text-dark-700 hover:bg-dark-50 hover:text-dark-900"
        )}
      >
        <div className={cn(
          "mr-3",
          isActive ? "text-primary-500" : "text-dark-400"
        )}>
          {icon}
        </div>
        {text}
      </a>
    </div>
  );
};

export default function Sidebar() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return path === "/" ? location === path : location.startsWith(path);
  };

  return (
    <div className="hidden md:flex md:w-64 md:flex-col bg-gradient-to-b from-dark-50 to-white border-r border-dark-200">
      <div className="flex flex-col flex-grow pt-5 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4 mb-5">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-tr from-primary-600 to-primary-400 rounded-md flex items-center justify-center shadow-md">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <span className="ml-2 text-xl font-bold bg-gradient-to-r from-primary-700 to-primary-500 text-transparent bg-clip-text">SafeShare</span>
          </div>
        </div>
        <nav className="flex-1 px-2 pb-4 space-y-1">
          <SidebarLink 
            href="/" 
            icon={<FileText size={18} />} 
            text="Meus Arquivos" 
            isActive={isActive("/")} 
          />
          <SidebarLink 
            href="/shared" 
            icon={<Share size={18} />} 
            text="Arquivos Compartilhados" 
            isActive={isActive("/shared")} 
          />
          <SidebarLink 
            href="/activity" 
            icon={<BarChart size={18} />} 
            text="Histórico de Atividades" 
            isActive={isActive("/activity")} 
          />
          <SidebarLink 
            href="/settings" 
            icon={<Settings size={18} />} 
            text="Configurações" 
            isActive={isActive("/settings")} 
          />
        </nav>
        <div className="px-4 py-4 border-t border-dark-200 bg-dark-50/30">
          <div className="flex items-center">
            <div className="w-9 h-9 bg-gradient-to-br from-dark-300 to-dark-200 rounded-full flex items-center justify-center shadow-sm">
              <User className="h-5 w-5 text-dark-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-dark-800">João Silva</p>
              <p className="text-xs text-dark-500 truncate">joao.silva@exemplo.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
