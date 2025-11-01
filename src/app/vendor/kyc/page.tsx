'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { CloudUpload, CheckCircle, Warning, Info } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type IDType = 'passport' | 'drivers_license' | 'national_id';
type KYCStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export default function KYCVerificationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState<KYCStatus>('unverified');
  const [rejectionReason, setRejectionReason] = useState('');
  
  const [formData, setFormData] = useState({
    id_type: 'passport' as IDType,
    id_number: '',
    date_of_birth: '',
    nationality: 'United Kingdom',
    id_front: null as File | null,
    id_back: null as File | null,
    selfie: null as File | null,
  });

  const [previews, setPreviews] = useState({
    id_front: '',
    id_back: '',
    selfie: '',
  });

  useEffect(() => {
    checkKYCStatus();
  }, []);

  const checkKYCStatus = async () => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/kyc/status', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      const data = await res.json();
      if (data.success) {
        setKycStatus(data.status);
        if (data.rejection_reason) {
          setRejectionReason(data.rejection_reason);
        }
      }
    } catch (error) {
      console.error('Failed to check KYC status:', error);
    }
  };

  const handleFileChange = (field: 'id_front' | 'id_back' | 'selfie', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setFormData(prev => ({ ...prev, [field]: file }));

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviews(prev => ({ ...prev, [field]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.id_number || !formData.date_of_birth) {
      alert('Please fill in all required fields');
      return;
    }

    if (!formData.id_front || !formData.selfie) {
      alert('Please upload ID photo and selfie');
      return;
    }

    if (formData.id_type !== 'passport' && !formData.id_back) {
      alert('Please upload back of ID document');
      return;
    }

    setLoading(true);

    try {
      const token = await user?.getIdToken();
      
      // Upload files
      const uploadFile = async (file: File, type: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        const res = await fetch('/api/kyc/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        });

        const data = await res.json();
        return data.url;
      };

      const id_front_url = await uploadFile(formData.id_front, 'id_front');
      const selfie_url = await uploadFile(formData.selfie, 'selfie');
      const id_back_url = formData.id_back ? await uploadFile(formData.id_back, 'id_back') : null;

      // Submit KYC
      const res = await fetch('/api/kyc/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id_type: formData.id_type,
          id_number: formData.id_number,
          date_of_birth: formData.date_of_birth,
          nationality: formData.nationality,
          id_front_url,
          id_back_url,
          selfie_url,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setKycStatus('pending');
        alert('KYC documents submitted successfully! We will review within 24-48 hours.');
      } else {
        alert(data.error || 'Failed to submit KYC');
      }
    } catch (error) {
      console.error('KYC submission error:', error);
      alert('An error occurred while submitting');
    } finally {
      setLoading(false);
    }
  };

  // Status display
  if (kycStatus === 'verified') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <CardTitle className="text-green-900">Identity Verified</CardTitle>
                <CardDescription>Your account has been successfully verified</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-800 mb-4">
              You can now create product listings and start selling on AfriConnect.
            </p>
            <Button onClick={() => router.push('/vendor/add-product')} className="bg-green-600 hover:bg-green-700">
              Create Your First Listing
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (kycStatus === 'pending') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Info className="h-8 w-8 text-yellow-600" />
              <div>
                <CardTitle className="text-yellow-900">Verification Pending</CardTitle>
                <CardDescription>Your documents are being reviewed</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-800 mb-2">
              We're reviewing your KYC documents. This typically takes 24-48 hours.
            </p>
            <p className="text-sm text-yellow-800">
              You'll receive an email notification once your verification is complete.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (kycStatus === 'rejected') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Warning className="h-8 w-8 text-red-600" />
              <div>
                <CardTitle className="text-red-900">Verification Rejected</CardTitle>
                <CardDescription>Your submission needs attention</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-800 mb-2 font-medium">Reason:</p>
            <p className="text-sm text-red-700 mb-4">{rejectionReason || 'Documents were unclear or invalid'}</p>
            <Button onClick={() => setKycStatus('unverified')} variant="outline" className="border-red-300">
              Resubmit Documents
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // KYC Form
  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Identity Verification (KYC)</h1>
        <p className="text-gray-600 mt-1">
          Verify your identity to start selling on AfriConnect
        </p>
      </div>

      <Card className="border-orange-200 bg-orange-50 mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-orange-900">
              <p className="font-medium mb-1">Why do we need this?</p>
              <p>
                Identity verification is required for all sellers to ensure a safe marketplace and prevent fraud.
                Your information is securely encrypted and will only be used for verification purposes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>Please provide clear photos of your identification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* ID Type */}
          <div>
            <Label htmlFor="id_type">ID Document Type *</Label>
            <Select value={formData.id_type} onValueChange={(value: IDType) => setFormData({ ...formData, id_type: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="passport">Passport</SelectItem>
                <SelectItem value="drivers_license">Driver's License</SelectItem>
                <SelectItem value="national_id">National ID Card</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ID Number */}
          <div>
            <Label htmlFor="id_number">ID Number *</Label>
            <Input
              id="id_number"
              value={formData.id_number}
              onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
              placeholder="Enter your ID number"
              className="mt-1"
            />
          </div>

          {/* Date of Birth */}
          <div>
            <Label htmlFor="dob">Date of Birth *</Label>
            <Input
              id="dob"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              className="mt-1"
            />
          </div>

          {/* Nationality */}
          <div>
            <Label htmlFor="nationality">Nationality</Label>
            <Input
              id="nationality"
              value={formData.nationality}
              onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
              className="mt-1"
            />
          </div>

          {/* ID Front */}
          <div>
            <Label>ID Front Photo *</Label>
            <div className="mt-2 border-2 border-dashed rounded-lg p-4">
              {previews.id_front ? (
                <div className="relative">
                  <img src={previews.id_front} alt="ID Front" className="w-full h-48 object-contain rounded" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, id_front: null }));
                      setPreviews(prev => ({ ...prev, id_front: '' }));
                    }}
                    className="mt-2"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer block text-center">
                  <CloudUpload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Click to upload front of ID</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('id_front', e)}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* ID Back (not for passport) */}
          {formData.id_type !== 'passport' && (
            <div>
              <Label>ID Back Photo *</Label>
              <div className="mt-2 border-2 border-dashed rounded-lg p-4">
                {previews.id_back ? (
                  <div className="relative">
                    <img src={previews.id_back} alt="ID Back" className="w-full h-48 object-contain rounded" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, id_back: null }));
                        setPreviews(prev => ({ ...prev, id_back: '' }));
                      }}
                      className="mt-2"
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer block text-center">
                    <CloudUpload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Click to upload back of ID</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange('id_back', e)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Selfie */}
          <div>
            <Label>Selfie with ID *</Label>
            <p className="text-xs text-gray-600 mb-2">
              Take a clear selfie holding your ID next to your face
            </p>
            <div className="mt-2 border-2 border-dashed rounded-lg p-4">
              {previews.selfie ? (
                <div className="relative">
                  <img src={previews.selfie} alt="Selfie" className="w-full h-48 object-contain rounded" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, selfie: null }));
                      setPreviews(prev => ({ ...prev, selfie: '' }));
                    }}
                    className="mt-2"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer block text-center">
                  <CloudUpload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Click to upload selfie</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('selfie', e)}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSubmit} disabled={loading} className="bg-black text-white">
              {loading ? 'Submitting...' : 'Submit for Verification'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
