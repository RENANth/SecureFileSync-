import { useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { encryptFile } from "@/lib/crypto";
import { Upload } from "lucide-react";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  name: z.string().min(1, "Filename is required"),
  expiration: z.string(),
  password: z.string().optional(),
  addPassword: z.boolean().default(false)
});

type FormValues = z.infer<typeof formSchema>;

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      expiration: "7days",
      addPassword: false,
      password: "",
    }
  });

  const onDrop = useCallback((acceptedFiles: FileList | null) => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;
    
    const selectedFile = acceptedFiles[0];
    setFile(selectedFile);
    form.setValue("name", selectedFile.name);
  }, [form]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onDrop(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const resetForm = () => {
    form.reset();
    setFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      resetForm();
      onClose();
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(10);

      // Generate encryption key
      const encryptedData = await encryptFile(file);
      setUploadProgress(40);

      // Create FormData to send the encrypted file and metadata
      const formData = new FormData();
      formData.append("file", new Blob([encryptedData.encryptedFile], { type: "application/octet-stream" }));
      formData.append("key", encryptedData.encryptionKey);
      formData.append("name", data.name);
      formData.append("originalSize", file.size.toString());
      formData.append("expiration", data.expiration);
      
      if (data.addPassword && data.password) {
        formData.append("password", data.password);
      }

      setUploadProgress(60);

      // Upload the encrypted file
      await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.text();
          throw new Error(error);
        }
        return res.json();
      });

      setUploadProgress(100);

      // Invalidate the files query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      queryClient.invalidateQueries({ queryKey: ['/api/logs'] });

      toast({
        title: "File uploaded successfully",
        description: `${data.name} has been encrypted and uploaded.`,
      });

      handleClose();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <div className="mr-2 p-2 rounded-full bg-primary-100">
              <Upload className="h-5 w-5 text-primary-600" />
            </div>
            Upload Encrypted File
          </DialogTitle>
          <DialogDescription>
            Your file will be encrypted before uploading using end-to-end encryption.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div 
              className="border-2 border-dashed border-dark-300 rounded-lg p-6 text-center cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="space-y-1">
                <Upload className="mx-auto h-8 w-8 text-dark-400" />
                <div className="flex justify-center text-sm text-dark-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white font-medium text-primary-600 hover:text-primary-500">
                    <span>Upload a file</span>
                    <input 
                      id="file-upload" 
                      name="file-upload" 
                      type="file" 
                      className="sr-only"
                      ref={fileInputRef}
                      onChange={(e) => onDrop(e.target.files)}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-dark-500">
                  Any file type up to 100MB
                </p>
                {file && (
                  <div className="mt-2 text-sm text-primary-600 flex justify-center items-center">
                    <div className="truncate max-w-xs">{file.name}</div>
                    <span className="ml-2 text-xs text-dark-500">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>File name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link expiration</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select expiration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1day">1 day</SelectItem>
                        <SelectItem value="3days">3 days</SelectItem>
                        <SelectItem value="7days">7 days</SelectItem>
                        <SelectItem value="14days">14 days</SelectItem>
                        <SelectItem value="30days">30 days</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="addPassword"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Add password protection</FormLabel>
                      <FormDescription>
                        Require a password to download this file
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch("addPassword") && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isUploading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {uploadProgress < 50 ? "Encrypting..." : "Uploading..."}
                  </>
                ) : (
                  "Upload & Encrypt"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
