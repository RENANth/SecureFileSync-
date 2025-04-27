import { useState } from "react";
import { Menu, Bell, Search, User, Upload, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck } from "lucide-react";

export default function Navbar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    
    // This would typically use a ref or state in a parent component
    // Here we're using document queries for simplicity
    const sidebar = document.querySelector('.md\\:flex.md\\:w-64');
    if (sidebar) {
      sidebar.classList.toggle('hidden', !isSidebarOpen);
    }
  };

  return (
    <div className="bg-white shadow-lg z-10 border-b border-dark-100">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center md:hidden">
            <Button 
              variant="ghost" 
              className="text-dark-600 hover:text-dark-800" 
              onClick={toggleSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="ml-3">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-tr from-primary-600 to-primary-400 rounded-md flex items-center justify-center shadow-sm">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <span className="ml-2 text-lg font-bold bg-gradient-to-r from-primary-700 to-primary-500 text-transparent bg-clip-text">SafeShare</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-1 justify-center px-2 lg:ml-6 lg:justify-end">
            <div className="max-w-lg w-full lg:max-w-xs">
              <label htmlFor="search" className="sr-only">Buscar arquivos</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-dark-400" />
                </div>
                <Input 
                  id="search" 
                  name="search" 
                  className="block w-full pl-10 pr-3 py-2 border border-dark-200 rounded-md leading-5 bg-dark-50 placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" 
                  placeholder="Buscar arquivos" 
                  type="search"
                />
              </div>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6 gap-2">
              <Button 
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border border-primary-300 text-primary-700 hover:bg-primary-50"
              >
                <Upload className="h-4 w-4" />
                <span>Enviar</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon"
                className="rounded-full text-dark-400 hover:text-dark-600 hover:bg-dark-100" 
              >
                <span className="sr-only">Ver notificações</span>
                <Bell className="h-5 w-5" />
              </Button>
              
              <div className="ml-2 relative">
                <div>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 hover:bg-dark-100 px-3"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-dark-300 to-dark-200 rounded-full flex items-center justify-center shadow-sm">
                      <User className="h-4 w-4 text-dark-600" />
                    </div>
                    <span className="text-sm font-medium text-dark-700">João Silva</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
