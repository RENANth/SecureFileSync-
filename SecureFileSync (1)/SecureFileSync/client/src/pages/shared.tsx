import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import FileList from "@/components/files/file-list";
import ShareModal from "@/components/modals/share-modal";
import { EncryptedFile } from "@shared/schema";

export default function SharedPage() {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<EncryptedFile | null>(null);

  const { data: sharedFiles = [], isLoading } = useQuery<EncryptedFile[]>({
    queryKey: ['/api/files/shared'],
  });

  const handleShare = (file: EncryptedFile) => {
    setSelectedFile(file);
    setIsShareModalOpen(true);
  };

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-dark-900">Shared Files</h1>
        </div>
        <p className="mt-1 text-sm text-dark-500">Files you've shared with others or that have been shared with you</p>
      </div>

      <FileList 
        files={sharedFiles} 
        onShare={handleShare}
        isLoading={isLoading}
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
