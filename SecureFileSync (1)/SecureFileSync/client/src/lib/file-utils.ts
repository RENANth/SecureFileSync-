import { FileText, FileImage, FileArchive, FileSpreadsheet, FileCode, File } from 'lucide-react';

/**
 * Format bytes to human-readable format
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Get a file icon based on file extension
 */
export function getFileIcon(filename: string): typeof FileText {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
  const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'];
  const documentExtensions = ['pdf', 'doc', 'docx', 'rtf', 'txt', 'odt'];
  const spreadsheetExtensions = ['csv', 'xls', 'xlsx', 'ods'];
  const codeExtensions = ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'xml', 'py', 'rb', 'php', 'java', 'c', 'cpp'];
  
  if (imageExtensions.includes(extension)) {
    return FileImage;
  } else if (archiveExtensions.includes(extension)) {
    return FileArchive;
  } else if (documentExtensions.includes(extension)) {
    return FileText;
  } else if (spreadsheetExtensions.includes(extension)) {
    return FileSpreadsheet;
  } else if (codeExtensions.includes(extension)) {
    return FileCode;
  } else {
    return File;
  }
}

/**
 * Format a date to a relative time ago string
 */
export function formatTimeAgo(dateInput: string | Date, futureFormat = false): string {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const diffInDays = Math.floor(diffInSeconds / 86400);
  
  // For future dates
  if (date > now && futureFormat) {
    const diffInFutureSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);
    const diffInFutureDays = Math.floor(diffInFutureSeconds / 86400);
    
    if (diffInFutureDays === 0) {
      const diffInFutureHours = Math.floor(diffInFutureSeconds / 3600);
      if (diffInFutureHours === 0) {
        const diffInFutureMinutes = Math.floor(diffInFutureSeconds / 60);
        return diffInFutureMinutes <= 1 ? 'Em um minuto' : `Em ${diffInFutureMinutes} minutos`;
      }
      return diffInFutureHours === 1 ? 'Em uma hora' : `Em ${diffInFutureHours} horas`;
    } else if (diffInFutureDays === 1) {
      return 'Amanhã';
    } else if (diffInFutureDays < 7) {
      return `Em ${diffInFutureDays} dias`;
    } else if (diffInFutureDays < 30) {
      const weeks = Math.floor(diffInFutureDays / 7);
      return weeks === 1 ? 'Em uma semana' : `Em ${weeks} semanas`;
    } else if (diffInFutureDays < 365) {
      const months = Math.floor(diffInFutureDays / 30);
      return months === 1 ? 'Em um mês' : `Em ${months} meses`;
    } else {
      const years = Math.floor(diffInFutureDays / 365);
      return years === 1 ? 'Em um ano' : `Em ${years} anos`;
    }
  }
  
  // For past dates
  if (diffInSeconds < 60) {
    return 'Agora mesmo';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return minutes === 1 ? 'há 1 minuto' : `há ${minutes} minutos`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return hours === 1 ? 'há 1 hora' : `há ${hours} horas`;
  } else if (diffInDays === 1) {
    return 'Ontem';
  } else if (diffInDays < 7) {
    return `há ${diffInDays} dias`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return weeks === 1 ? 'há 1 semana' : `há ${weeks} semanas`;
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return months === 1 ? 'há 1 mês' : `há ${months} meses`;
  } else {
    const years = Math.floor(diffInDays / 365);
    return years === 1 ? 'há 1 ano' : `há ${years} anos`;
  }
}

/**
 * Generate a shortened version of a filename if it's too long
 */
export function shortenFilename(filename: string, maxLength = 20): string {
  if (filename.length <= maxLength) return filename;
  
  const extension = filename.includes('.') 
    ? filename.substring(filename.lastIndexOf('.')) 
    : '';
    
  const nameWithoutExtension = filename.substring(0, filename.length - extension.length);
  
  if (nameWithoutExtension.length <= maxLength - 3 - extension.length) {
    return filename;
  }
  
  const shortenedName = nameWithoutExtension.substring(0, maxLength - 3 - extension.length) + '...';
  return shortenedName + extension;
}
