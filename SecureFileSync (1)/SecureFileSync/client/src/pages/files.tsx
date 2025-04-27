import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import StorageStats from "@/components/files/storage-stats";
import FileList from "@/components/files/file-list";
import ActivityLogs from "@/components/files/activity-logs";
import UploadModal from "@/components/modals/upload-modal";
import ShareModal from "@/components/modals/share-modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Filter, Upload, ShieldCheck } from "lucide-react";
import { EncryptedFile } from "@shared/schema";

export default function FilesPage() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<EncryptedFile | null>(null);
  const { toast } = useToast();

  const { data: files = [], isLoading: isLoadingFiles } = useQuery<EncryptedFile[]>({
    queryKey: ['/api/files'],
  });

  const { data: logs = [], isLoading: isLoadingLogs } = useQuery<any[]>({
    queryKey: ['/api/logs'],
  });

  const handleShare = (file: EncryptedFile) => {
    setSelectedFile(file);
    setIsShareModalOpen(true);
  };

  const handleStorageSummary = () => {
    const usedBytes = files.reduce((acc, file) => acc + file.size, 0);
    const maxBytes = 5 * 1024 * 1024 * 1024; // 5GB
    const usedPercentage = Math.min((usedBytes / maxBytes) * 100, 100);
    
    return {
      usedBytes,
      maxBytes,
      usedPercentage,
      totalFiles: files.length,
      sharedFiles: files.filter(file => file.shared).length,
      activeLinks: files.filter(file => {
        if (!file.shared || !file.expiresAt) return false;
        return new Date(file.expiresAt) > new Date();
      }).length,
      expiringSoon: files.filter(file => {
        if (!file.shared || !file.expiresAt) return false;
        const expireDate = new Date(file.expiresAt);
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        return expireDate <= threeDaysFromNow && expireDate > new Date();
      }).length
    };
  };

  return (
    <>
      {/* Page header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-dark-900 flex items-center">
              <span className="bg-gradient-to-r from-primary-700 to-primary-500 text-transparent bg-clip-text">Meus Arquivos</span>
              <div className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                <ShieldCheck className="h-3 w-3 mr-1" />
                Criptografados
              </div>
            </h1>
            <p className="mt-1 text-sm text-dark-500">Gerencie seus arquivos criptografados e compartilhe com segurança</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white shadow-md"
            >
              <Upload className="mr-2 h-4 w-4" />
              Enviar Arquivo
            </Button>
            <Button variant="outline" className="text-dark-700 border-dark-200">
              <Filter className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-dark-50 to-white p-0.5 rounded-lg mb-6">
        <div className="bg-white rounded-md shadow-sm">
          <StorageStats 
            stats={handleStorageSummary()}
            isLoading={isLoadingFiles}
          />
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-dark-100 mb-6">
        <div className="p-4 border-b border-dark-100">
          <h2 className="text-lg font-semibold text-dark-800">Arquivos</h2>
        </div>
        <FileList 
          files={files} 
          onShare={handleShare}
          isLoading={isLoadingFiles}
        />
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-dark-100">
        <div className="p-4 border-b border-dark-100">
          <h2 className="text-lg font-semibold text-dark-800">Atividades Recentes</h2>
        </div>
        <ActivityLogs 
          logs={logs.slice(0, 3)} 
          isLoading={isLoadingLogs}
          showViewAll={true}
        />
      </div>

      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
      />
      
      {selectedFile && (
        <ShareModal 
          isOpen={isShareModalOpen} 
          onClose={() => setIsShareModalOpen(false)}
          file={selectedFile}
        />
      )}
    </>
  );
}
