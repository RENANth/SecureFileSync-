import { useState } from "react";
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
import { Share2, Lock, Copy, Check } from "lucide-react";
import { EncryptedFile } from "@shared/schema";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: EncryptedFile;
}

const formSchema = z.object({
  expiration: z.string(),
  addPassword: z.boolean().default(false),
  password: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

export default function ShareModal({ isOpen, onClose, file }: ShareModalProps) {
  const [shareLink, setShareLink] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      expiration: "7days",
      addPassword: false,
      password: "",
      email: "",
    }
  });

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Link copied",
        description: "Share link has been copied to your clipboard",
      });
    });
  };

  const onSubmit = async (data: FormValues) => {
    try {
      setIsCreatingLink(true);
      
      const payload = {
        fileId: file.id,
        expiration: data.expiration,
        password: data.addPassword ? data.password : undefined,
        email: data.email || undefined,
      };
      
      const response = await apiRequest('POST', '/api/files/share', payload);
      const result = await response.json();
      
      // Construct the share link with the token
      const shareUrl = window.location.origin + '/share/' + result.shareToken;
      setShareLink(shareUrl);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      queryClient.invalidateQueries({ queryKey: ['/api/logs'] });
      
      toast({
        title: "Share link created",
        description: "Your secure share link has been created",
      });
    } catch (error) {
      console.error("Error creating share link:", error);
      toast({
        title: "Failed to create share link",
        description: "There was an error creating your share link",
        variant: "destructive",
      });
    } finally {
      setIsCreatingLink(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <div className="mr-2 p-2 rounded-full bg-secondary-100">
              <Share2 className="h-5 w-5 text-secondary-600" />
            </div>
            Share "{file.name}"
          </DialogTitle>
          <DialogDescription>
            Create a secure sharing link with optional expiration date and password protection.
          </DialogDescription>
        </DialogHeader>
        
        {shareLink ? (
          <>
            <div className="p-4 bg-dark-50 rounded-lg border border-dark-200">
              <div className="flex items-center">
                <div className="flex-1 min-w-0">
                  <Input value={shareLink} readOnly className="bg-white" />
                </div>
                <div className="ml-3 flex-shrink-0">
                  <Button 
                    onClick={copyToClipboard}
                    variant="outline"
                    className="text-primary-700 bg-primary-100 hover:bg-primary-200 border-primary-200"
                  >
                    {copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex items-center text-sm text-dark-600">
                <Lock className="h-3 w-3 text-dark-400 mr-1" />
                <span>End-to-end encrypted and secured</span>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Close</Button>
              <Button 
                onClick={() => setShareLink("")}
                variant="secondary"
              >
                Create Another Link
              </Button>
            </DialogFooter>
          </>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        Require a password to access this file
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
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Share via email (optional)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="recipient@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-secondary-600 hover:bg-secondary-700" disabled={isCreatingLink}>
                  {isCreatingLink ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    "Create Link"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
