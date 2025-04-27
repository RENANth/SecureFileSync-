import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBytes } from "@/lib/file-utils";
import { Database, Share2, Link, Clock } from "lucide-react";

interface StorageStatsProps {
  stats: {
    usedBytes: number;
    maxBytes: number;
    usedPercentage: number;
    totalFiles: number;
    sharedFiles: number;
    activeLinks: number;
    expiringSoon: number;
  };
  isLoading?: boolean;
}

export default function StorageStats({ stats, isLoading = false }: StorageStatsProps) {
  if (isLoading) {
    return <StorageStatsSkeleton />;
  }

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-lg font-medium text-dark-900 mb-4">Resumo de Armazenamento</h2>
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex-1">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-dark-700">Espaço Utilizado</span>
            <span className="text-sm font-medium text-dark-700">
              {formatBytes(stats.usedBytes)} / {formatBytes(stats.maxBytes)}
            </span>
          </div>
          
          <div className="relative h-2 w-full bg-dark-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
              style={{ width: `${stats.usedPercentage}%` }}
            />
          </div>
          
          <p className="mt-2 text-xs text-dark-500">
            {Math.round(stats.usedPercentage)}% do seu armazenamento utilizado
          </p>
        </div>
        
        <div className="flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-dark-50 to-white p-3 rounded-lg border border-dark-100 shadow-sm">
              <div className="flex items-center mb-1">
                <Database className="h-4 w-4 mr-1 text-primary-500" />
                <div className="text-xs font-medium text-dark-600">Total de Arquivos</div>
              </div>
              <div className="text-xl font-semibold text-dark-800">{stats.totalFiles}</div>
            </div>
            
            <div className="bg-gradient-to-br from-dark-50 to-white p-3 rounded-lg border border-dark-100 shadow-sm">
              <div className="flex items-center mb-1">
                <Share2 className="h-4 w-4 mr-1 text-primary-500" />
                <div className="text-xs font-medium text-dark-600">Arquivos Compartilhados</div>
              </div>
              <div className="text-xl font-semibold text-dark-800">{stats.sharedFiles}</div>
            </div>
            
            <div className="bg-gradient-to-br from-dark-50 to-white p-3 rounded-lg border border-dark-100 shadow-sm">
              <div className="flex items-center mb-1">
                <Link className="h-4 w-4 mr-1 text-primary-500" />
                <div className="text-xs font-medium text-dark-600">Links Ativos</div>
              </div>
              <div className="text-xl font-semibold text-dark-800">{stats.activeLinks}</div>
            </div>
            
            <div className="bg-gradient-to-br from-dark-50 to-white p-3 rounded-lg border border-dark-100 shadow-sm">
              <div className="flex items-center mb-1">
                <Clock className="h-4 w-4 mr-1 text-primary-500" />
                <div className="text-xs font-medium text-dark-600">Expirando em Breve</div>
              </div>
              <div className="text-xl font-semibold text-dark-800">{stats.expiringSoon}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StorageStatsSkeleton() {
  return (
    <div className="p-4 sm:p-6">
      <Skeleton className="h-6 w-64 mb-4" />
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex-1">
          <div className="flex justify-between mb-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-3 w-48 mt-2" />
        </div>
        <div className="flex-1">
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-gradient-to-br from-dark-50 to-white p-3 rounded-lg border border-dark-100">
                <div className="flex items-center mb-1">
                  <Skeleton className="h-4 w-4 mr-1 rounded-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-12 mt-2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
