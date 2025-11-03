
'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PersonalInfoStep } from './steps/personal-info-step';
import { BusinessInfoStep } from './steps/business-info-step';
import { DocumentUploadStep } from './steps/document-upload-step';
import { ReviewStep } from './steps/review-step';
import { CompletionStep } from './steps/completion-step';
import { KycProgress } from './kyc-progress';
import { useAuth } from '@/context/auth-context';
import { fetchWithAuth } from '@/lib/api';

interface KYCPageProps {
  onNavigate: (page: string) => void;
}

export type KYCStep = 'personal' | 'business' | 'documents' | 'review' | 'complete';
export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'incomplete';

export interface DocumentUpload {
  id: string;
  name: string;
  file: File | null;
  required: boolean;
  uploaded: boolean;
  status: 'pending' | 'approved' | 'rejected';
  url?: string; // download URL after upload
}

export interface KYCData {
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  idNumber: string;
  idType: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  businessName: string;
  businessType: string;
  businessRegistrationNumber: string;
  taxId: string;
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessPostalCode: string;
  businessDescription: string;
  estimatedMonthlyVolume: string;
  primaryPhone: string;
  secondaryPhone: string;
  businessEmail: string;
  website: string;
}

export function KycFlow({ onNavigate }: KYCPageProps) {
  const [currentStep, setCurrentStep] = useState<KYCStep>('personal');
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>('incomplete');
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [isSubmitting, setIsSubmitting] = useState(false); // Separate state for submission
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user, updateUser } = useAuth();

  const [kycData, setKycData] = useState<KYCData>({
    fullName: user?.fullName || '',
    dateOfBirth: '',
    nationality: '',
    idNumber: '',
    idType: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    businessName: '',
    businessType: '',
    businessRegistrationNumber: '',
    taxId: '',
    businessAddress: '',
    businessCity: '',
    businessState: '',
    businessPostalCode: '',
    businessDescription: '',
    estimatedMonthlyVolume: '',
    primaryPhone: '',
    secondaryPhone: '',
    businessEmail: user?.email || '',
    website: '',
  });

  const [documents, setDocuments] = useState<DocumentUpload[]>([
    { id: 'id_document', name: 'Identity Document', file: null, required: true, uploaded: false, status: 'pending' },
    { id: 'proof_of_address', name: 'Proof of Address', file: null, required: true, uploaded: false, status: 'pending' },
  ]);

  const handleInputChange = (field: keyof KYCData, value: string) => {
    setKycData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  // On mount, check if there is an existing submission and reflect state
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    // Safety timeout - if loading takes more than 5 seconds, show the form
    timeoutId = setTimeout(() => {
      console.warn('KYC status check timed out');
      setIsLoading(false);
    }, 5000);

    // First check user context directly
    if (user?.verification_status === 'verified') {
      setVerificationStatus('approved');
      setCurrentStep('complete');
      setSuccess('Your KYC is verified. You can now upgrade your account to start selling.');
      setIsLoading(false);
      clearTimeout(timeoutId);
      return;
    }

    // Then make API call for more detailed status
    (async () => {
      try {
        const res = await fetchWithAuth('/api/kyc/status');
        if (!res.ok) {
          throw new Error('Failed to fetch KYC status');
        }
        const data = await res.json();
        if (data?.status === 'pending') {
          setVerificationStatus('pending');
          setCurrentStep('complete');
          setSuccess('Your KYC submission is pending review. We will notify you by email when it is approved.');
        } else if (data?.status === 'verified') {
          setVerificationStatus('approved');
          setCurrentStep('complete');
          setSuccess('Your KYC is verified. You can now upgrade your account to start selling.');
        }
      } catch (err) {
        console.error('Failed to check KYC status:', err);
        // On error, allow user to proceed with form
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false); // Stop loading after check
      }
    })();

    return () => clearTimeout(timeoutId);
  }, [user?.verification_status]);

  const validateStep = (step: KYCStep) => {
    switch (step) {
      case 'personal':
        const requiredPersonal = ['fullName', 'dateOfBirth', 'nationality', 'idNumber', 'idType', 'address', 'city', 'primaryPhone'];
        const missingPersonal = requiredPersonal.filter(field => !kycData[field as keyof KYCData]);
        if (missingPersonal.length > 0) {
            setError(`Please fill in all required fields: ${missingPersonal.join(', ')}`);
            return false;
        }
        return true;
      case 'business':
         const requiredBusiness = ['businessName', 'businessType', 'businessAddress', 'businessCity', 'businessDescription'];
        const missingBusiness = requiredBusiness.filter(field => !kycData[field as keyof KYCData]);
        if (missingBusiness.length > 0) {
            setError(`Please fill in all required fields: ${missingBusiness.join(', ')}`);
            return false;
        }
        return true;
      case 'documents':
        const requiredDocs = documents.filter(doc => doc.required && !doc.url);
        if (requiredDocs.length > 0) {
            setError(`Please upload all required documents: ${requiredDocs.map(doc => doc.name).join(', ')}`);
            return false;
        }
        return true;
      default:
        return true;
    }
  }

  const nextStep = () => {
    setError('');
    if (validateStep(currentStep)) {
      const steps: KYCStep[] = ['personal', 'business', 'documents', 'review', 'complete'];
      const currentIndex = steps.indexOf(currentStep);
      if (currentIndex < steps.length - 1) {
        if (currentStep === 'review') {
          submitKYC();
        } else {
          setCurrentStep(steps[currentIndex + 1]);
        }
      }
    }
  };

  const previousStep = () => {
    const steps: KYCStep[] = ['personal', 'business', 'documents', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };
  
  const submitKYC = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      // Build payload for server submission
      const idDoc = documents.find(d => d.id === 'id_document');
      const poaDoc = documents.find(d => d.id === 'proof_of_address');
      const payload = {
        personal: {
          fullName: kycData.fullName,
          dateOfBirth: kycData.dateOfBirth,
          nationality: kycData.nationality,
          idType: kycData.idType,
          idNumber: kycData.idNumber,
          address: kycData.address,
          city: kycData.city,
          state: kycData.state,
          postalCode: kycData.postalCode,
          primaryPhone: kycData.primaryPhone,
        },
        documents: {
          idDocumentUrl: idDoc?.url || null,
          proofOfAddressUrl: poaDoc?.url || null,
        }
      };

      const res = await fetchWithAuth('/api/kyc/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg?.error || 'Failed to submit KYC');
      }

      setVerificationStatus('pending');
      setCurrentStep('complete');
      setSuccess('KYC application submitted successfully! We will review your information within 2-3 business days.');
    } catch (err: any) {
      setError('Failed to submit KYC application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  const renderStepContent = () => {
    switch(currentStep) {
        case 'personal':
            return <PersonalInfoStep kycData={kycData} onInputChange={handleInputChange} />;
        case 'business':
            return <BusinessInfoStep kycData={kycData} onInputChange={handleInputChange} />;
        case 'documents':
            // Show a clearer label for the required ID based on the user's chosen ID type
            const displayDocs = documents.map(doc =>
              doc.id === 'id_document'
                ? { ...doc, name: kycData.idType === 'drivers_license' ? "Driver's License" : 'International Passport' }
                : doc
            );
            return <DocumentUploadStep documents={displayDocs} setDocuments={setDocuments} setError={setError} />;
        case 'review':
            return <ReviewStep kycData={kycData} documents={documents} />;
        case 'complete':
            return <CompletionStep verificationStatus={verificationStatus} onNavigate={onNavigate} />;
        default:
            return null;
    }
  }

  return (
    <div className="container max-w-6xl mx-auto px-0 sm:px-4">
      {/* Show loader while checking KYC status */}
      {isLoading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Checking verification status...</p>
          </div>
        </div>
      )}

      {/* Show KYC content once loaded */}
      {!isLoading && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => onNavigate('/profile')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Profile
              </Button>
              <div>
                <h1 className="text-xl font-bold">KYC Verification</h1>
                <p className="text-sm text-muted-foreground">Complete verification to unlock selling</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left: Sticky Stepper */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit">
              <KycProgress currentStep={currentStep} />
            </div>

            {/* Right: Step content */}
            <div className="lg:col-span-8 space-y-4">
              {error && (
                <Alert className="mb-2" variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && currentStep === 'complete' && (
                <Alert className="mb-2">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div>{renderStepContent()}</div>

              {currentStep !== 'complete' && (
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={previousStep}
                    disabled={currentStep === 'personal' || isSubmitting}
                  >
                    Previous
                  </Button>
                  <Button onClick={nextStep} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {currentStep === 'review' ? 'Submit Application' : 'Next'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
