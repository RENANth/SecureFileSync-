import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Share, Download, MoreVertical, Trash2, AlertTriangle, Copy, Pencil } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { formatBytes, formatTimeAgo, getFileIcon } from "@/lib/file-utils";
import { EncryptedFile } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface FileListProps {
  files: EncryptedFile[];
  onShare: (file: EncryptedFile) => void;
  isLoading?: boolean;
}

export default function FileList({ files, onShare, isLoading = false }: FileListProps) {
  const { toast } = useToast();
  const [fileToDelete, setFileToDelete] = useState<EncryptedFile | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDownload = async (fileId: number) => {
    try {
      const res = await apiRequest('GET', `/api/files/${fileId}/download`, undefined);
      const blob = await res.blob();
      
      // Create a link to download the file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Find the file to get its name
      const file = files.find(f => f.id === fileId);
      a.download = file?.name || `file-${fileId}`;
      
      // Trigger download
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Invalidate to refresh logs
      queryClient.invalidateQueries({ queryKey: ['/api/logs'] });
      
      toast({
        title: "Download iniciado",
        description: "Seu arquivo está sendo baixado...",
      });
    } catch (error) {
      toast({
        title: "Falha no download",
        description: "Ocorreu um erro ao baixar seu arquivo. Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteClick = (file: EncryptedFile) => {
    setFileToDelete(file);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;
    
    setIsDeleting(true);
    try {
      await apiRequest('DELETE', `/api/files/${fileToDelete.id}`, undefined);
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      queryClient.invalidateQueries({ queryKey: ['/api/logs'] });
      
      toast({
        title: "Arquivo excluído",
        description: `${fileToDelete.name} foi excluído com sucesso.`,
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Falha na exclusão",
        description: "Ocorreu um erro ao excluir o arquivo. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setFileToDelete(null);
    }
  };
  
  const handleCopyLink = (file: EncryptedFile) => {
    // Implementação básica - em um cenário real seria obter o link real de compartilhamento
    const dummyLink = `${window.location.origin}/share/${file.id}`;
    navigator.clipboard.writeText(dummyLink).then(() => {
      toast({
        title: "Link copiado",
        description: "Link de compartilhamento copiado para a área de transferência.",
      });
    });
  };

  if (isLoading) {
    return <FileListSkeleton />;
  }

  return (
    <Card className="bg-white rounded-lg shadow overflow-hidden mb-8">
      <CardHeader className="px-4 py-5 sm:px-6 border-b border-dark-200">
        <CardTitle className="text-lg leading-6 font-medium text-dark-900">
          {files.length === 0 ? "Nenhum Arquivo" : "Arquivos Recentes"}
        </CardTitle>
        <CardDescription className="mt-1 max-w-2xl text-sm text-dark-500">
          {files.length === 0 
            ? "Você ainda não enviou nenhum arquivo" 
            : "Seus arquivos enviados e acessados recentemente"}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="px-0 py-0">
        {files.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-dark-500">Envie arquivos para começar a compartilhar com segurança</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-dark-50">
                <TableRow>
                  <TableHead className="w-[300px]">Arquivo</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Enviado</TableHead>
                  <TableHead>Expira</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => {
                  const isExpired = file.expiresAt && new Date(file.expiresAt) < new Date();
                  const isExpiringSoon = file.expiresAt && 
                    new Date(file.expiresAt) > new Date() && 
                    new Date(file.expiresAt) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
                  
                  const FileIcon = getFileIcon(file.name);
                  
                  return (
                    <TableRow key={file.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-dark-100 rounded-lg flex items-center justify-center">
                            <FileIcon className="h-5 w-5 text-dark-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-dark-900">{file.name}</div>
                            <div className="text-sm text-dark-500 mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-accent-100 text-accent-800">
                                <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="3" y="11" width="18" height="11" rx="2" />
                                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                Criptografia ponta a ponta
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-dark-500">
                        {formatBytes(file.size)}
                      </TableCell>
                      <TableCell className="text-sm text-dark-500">
                        {formatTimeAgo(file.createdAt.toString())}
                      </TableCell>
                      <TableCell className="text-sm">
                        {file.expiresAt ? (
                          <span className={isExpired ? "text-danger" : (isExpiringSoon ? "text-warning" : "text-dark-500")}>
                            {isExpired ? "Expirado" : formatTimeAgo(file.expiresAt.toString(), true)}
                          </span>
                        ) : (
                          <span className="text-dark-500">Nunca</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isExpired ? (
                          <Badge variant="outline" className="bg-dark-100 text-dark-800">
                            Expirado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-secondary-100 text-secondary-800">
                            Ativo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-3">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-primary-600 hover:text-primary-900"
                            onClick={() => onShare(file)}
                          >
                            <Share className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-primary-600 hover:text-primary-900"
                            onClick={() => handleDownload(file.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="text-dark-400 hover:text-dark-600"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => {}} className="flex items-center gap-2">
                                <Pencil className="h-4 w-4" />
                                <span>Renomear</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => handleCopyLink(file)} className="flex items-center gap-2">
                                <Copy className="h-4 w-4" />
                                <span>Copiar link</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onSelect={() => handleDeleteClick(file)}
                                className="text-red-600 flex items-center gap-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Excluir</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      
      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {fileToDelete ? (
                <>
                  <div className="flex items-center mb-4 text-red-600">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    <span>Esta ação não pode ser desfeita.</span>
                  </div>
                  <p>
                    Tem certeza de que deseja excluir permanentemente o arquivo <strong>{fileToDelete.name}</strong>?
                  </p>
                  <p className="mt-2 text-sm text-dark-500">
                    Todos os links de compartilhamento associados a este arquivo também serão removidos.
                  </p>
                </>
              ) : (
                <p>Tem certeza de que deseja excluir este arquivo?</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function FileListSkeleton() {
  return (
    <Card className="bg-white rounded-lg shadow overflow-hidden mb-8">
      <CardHeader className="px-4 py-5 sm:px-6 border-b border-dark-200">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-60 mt-1" />
      </CardHeader>
      <CardContent className="px-0 py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-dark-50">
              <TableRow>
                <TableHead className="w-[300px]">Arquivo</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Enviado</TableHead>
                <TableHead>Expira</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(3)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="ml-4">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24 mt-2" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}