'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UploadCloud, User as UserIcon, Loader2 } from 'lucide-react';
import { OnboardingData } from '../onboarding-flow';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface ProfilePictureStepProps {
  data: Partial<OnboardingData>;
  onDataChange: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ProfilePictureStep({ data, onDataChange, onNext, onBack }: ProfilePictureStepProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preview, setPreview] = useState<string | null>(data.avatarUrl || user?.avatarUrl || null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Please upload an image smaller than 2MB.',
      });
      return;
    }
    
    setIsUploading(true);
    setPreview(URL.createObjectURL(file));

    try {
      const storage = getStorage();
      const storageRef = ref(storage, `profile-pictures/${user.id}/${file.name}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      onDataChange({ avatarUrl: downloadURL });
      setPreview(downloadURL);
      toast({
        title: 'Upload Successful',
        description: 'Your new profile picture has been uploaded.',
      });

    } catch (error: any) {
      console.error("Upload failed:", error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'Could not upload your profile picture. Please try again.',
      });
      setPreview(data.avatarUrl || user.avatarUrl || null); // Revert to old image on failure
    } finally {
      setIsUploading(false);
    }
  };
  
  const getInitials = () => {
    return user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || user?.email?.[0].toUpperCase() || 'U';
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload a Profile Picture</CardTitle>
        <CardDescription>A profile picture helps others recognize you on the platform.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div className="relative">
          <Avatar className="w-32 h-32 text-4xl">
            <AvatarImage src={preview || ''} alt="Profile preview" />
            <AvatarFallback className="bg-muted">
              <UserIcon className="w-12 h-12 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
           {isUploading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary"/>
              </div>
            )}
        </div>

        <input
          type="file"
          id="profile-picture-upload"
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        <label htmlFor="profile-picture-upload" className="w-full">
          <Button type="button" variant="outline" className="w-full" asChild>
            <div className="cursor-pointer">
              <UploadCloud className="mr-2 h-4 w-4" />
              {preview ? 'Change Picture' : 'Upload Picture'}
            </div>
          </Button>
        </label>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext} disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Finish'}
        </Button>
      </CardFooter>
    </Card>
  );
}
