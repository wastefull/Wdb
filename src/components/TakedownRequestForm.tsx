import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useNavigationContext } from '../contexts/NavigationContext';
import { PageTemplate } from './PageTemplate';

interface TakedownRequestFormProps {
  onSubmitSuccess?: () => void;
}

export function TakedownRequestForm({ onSubmitSuccess }: TakedownRequestFormProps) {
  const { navigateToTakedownStatus, navigateToHome } = useNavigationContext();

  const [formData, setFormData] = useState({
    // Contact Information
    fullName: '',
    email: '',
    phone: '',
    organization: '',
    
    // Copyrighted Work
    workTitle: '',
    workDOI: '',
    copyrightRegistration: '',
    relationship: '',
    
    // Infringing Content
    wastedbURL: '',
    miuID: '',
    contentDescription: '',
    
    // Legal Statements
    goodFaithBelief: false,
    accuracyStatement: false,
    misrepresentationWarning: false,
    
    // Signature
    signature: '',
    signatureDate: new Date().toISOString().split('T')[0],
    
    // Anti-bot honeypot (should remain empty)
    honeypot: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [requestID, setRequestID] = useState<string>('');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.email.includes('@')) newErrors.email = 'Valid email is required';
    if (!formData.workTitle.trim()) newErrors.workTitle = 'Work title is required';
    if (!formData.relationship.trim()) newErrors.relationship = 'Relationship to copyright is required';
    if (!formData.wastedbURL.trim()) newErrors.wastedbURL = 'WasteDB URL is required';
    if (!formData.contentDescription.trim()) newErrors.contentDescription = 'Content description is required';
    
    // Legal statements
    if (!formData.goodFaithBelief) newErrors.goodFaithBelief = 'This statement is required';
    if (!formData.accuracyStatement) newErrors.accuracyStatement = 'This statement is required';
    if (!formData.misrepresentationWarning) newErrors.misrepresentationWarning = 'You must acknowledge this warning';
    
    // Signature
    if (!formData.signature.trim()) newErrors.signature = 'Electronic signature is required';
    if (formData.signature.toLowerCase() !== formData.fullName.toLowerCase().trim()) {
      newErrors.signature = 'Signature must match your full name exactly';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/legal/takedown`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setRequestID(data.requestID);
        setSubmitSuccess(true);
        
        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit takedown request');
      }
    } catch (error) {
      console.error('Takedown request submission error:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to submit request. Please try again or email legal@wastedb.org' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (submitSuccess) {
    return (
      <PageTemplate 
        title="Takedown Request Submitted"
        description="Your request has been received and is under review"
        hideBackButton={true}
        maxWidth="2xl"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-8 text-green-600 flex-shrink-0" />
              <div>
                <CardTitle>Request Confirmed</CardTitle>
                <CardDescription>We've received your copyright takedown request</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <FileText className="size-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p><strong>Request ID:</strong> {requestID}</p>
                  <p>A confirmation email has been sent to <strong>{formData.email}</strong></p>
                  <p>We will respond within <strong>72 hours</strong> with an initial review.</p>
                </div>
              </AlertDescription>
            </Alert>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h3 className="font-semibold">What Happens Next?</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Within 24 hours: Confirmation email sent (check spam folder)</li>
                <li>Within 72 hours: Legal team reviews your request</li>
                <li>Within 7 days: Decision communicated and resolution implemented</li>
              </ol>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                onClick={() => navigateToTakedownStatus(requestID)}
                className="w-full sm:w-auto"
              >
                Track Request Status
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => window.location.href = '/'}
                className="w-full sm:w-auto"
              >
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Copyright Takedown Request"
      description="Submit a DMCA takedown request for content you believe infringes your copyright. All fields marked with * are required."
      onBack={navigateToHome}
      maxWidth="3xl"
    >
      <Alert>
        <AlertCircle className="size-4" />
        <AlertDescription>
          <strong>Before submitting:</strong> Please review our{' '}
          <a href="/legal/MIU_LICENSING_POLICY.md" className="underline">MIU Licensing Policy</a> and{' '}
          <a href="/legal/TAKEDOWN_PROCESS.md" className="underline">Takedown Process</a> to understand what content
          is subject to removal. Consider contacting us informally at hello@wastedb.org for faster resolution.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">1. Your Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  placeholder="Jane Doe"
                  className={errors.fullName ? 'border-red-500' : ''}
                />
                {errors.fullName && (
                  <p className="text-sm text-red-600">{errors.fullName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="jane@example.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization">Organization (Optional)</Label>
                <Input
                  id="organization"
                  value={formData.organization}
                  onChange={(e) => handleChange('organization', e.target.value)}
                  placeholder="Acme Publishing Inc."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Copyrighted Work */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">2. Your Copyrighted Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workTitle">Title of Copyrighted Work *</Label>
              <Input
                id="workTitle"
                value={formData.workTitle}
                onChange={(e) => handleChange('workTitle', e.target.value)}
                placeholder="Life Cycle Assessment of PET Recycling"
                className={errors.workTitle ? 'border-red-500' : ''}
              />
              {errors.workTitle && (
                <p className="text-sm text-red-600">{errors.workTitle}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workDOI">DOI or URL of Original Work</Label>
                <Input
                  id="workDOI"
                  value={formData.workDOI}
                  onChange={(e) => handleChange('workDOI', e.target.value)}
                  placeholder="10.1234/example.doi"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="copyrightRegistration">Copyright Registration # (Optional)</Label>
                <Input
                  id="copyrightRegistration"
                  value={formData.copyrightRegistration}
                  onChange={(e) => handleChange('copyrightRegistration', e.target.value)}
                  placeholder="TX 1-234-567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="relationship">Your Relationship to Copyright *</Label>
              <Input
                id="relationship"
                value={formData.relationship}
                onChange={(e) => handleChange('relationship', e.target.value)}
                placeholder="Author / Publisher / Authorized Agent"
                className={errors.relationship ? 'border-red-500' : ''}
              />
              {errors.relationship && (
                <p className="text-sm text-red-600">{errors.relationship}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Example: "I am the first author" or "I am legal counsel for Publisher X"
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Infringing Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">3. Infringing Content on WasteDB</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wastedbURL">WasteDB URL of Infringing Content *</Label>
              <Input
                id="wastedbURL"
                value={formData.wastedbURL}
                onChange={(e) => handleChange('wastedbURL', e.target.value)}
                placeholder="https://wastedb.org/materials/aluminum/evidence"
                className={errors.wastedbURL ? 'border-red-500' : ''}
              />
              {errors.wastedbURL && (
                <p className="text-sm text-red-600">{errors.wastedbURL}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="miuID">MIU ID (If Known)</Label>
              <Input
                id="miuID"
                value={formData.miuID}
                onChange={(e) => handleChange('miuID', e.target.value)}
                placeholder="miu_abc123xyz"
              />
              <p className="text-sm text-muted-foreground">
                Found on the Evidence tab of material pages
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contentDescription">Description of Infringing Content *</Label>
              <Textarea
                id="contentDescription"
                value={formData.contentDescription}
                onChange={(e) => handleChange('contentDescription', e.target.value)}
                placeholder="Describe what content from your work appears on WasteDB (snippet text, screenshot of figure, etc.)"
                rows={4}
                className={errors.contentDescription ? 'border-red-500' : ''}
              />
              {errors.contentDescription && (
                <p className="text-sm text-red-600">{errors.contentDescription}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Legal Statements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">4. Legal Statements</CardTitle>
            <CardDescription>
              These statements are required under DMCA and must be made in good faith
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="goodFaithBelief"
                checked={formData.goodFaithBelief}
                onCheckedChange={(checked) => handleChange('goodFaithBelief', checked as boolean)}
                className={errors.goodFaithBelief ? 'border-red-500' : ''}
              />
              <div className="space-y-1">
                <Label htmlFor="goodFaithBelief" className="cursor-pointer">
                  I have a good faith belief that use of the material is not authorized by the copyright owner,
                  its agent, or the law. *
                </Label>
                {errors.goodFaithBelief && (
                  <p className="text-sm text-red-600">{errors.goodFaithBelief}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="accuracyStatement"
                checked={formData.accuracyStatement}
                onCheckedChange={(checked) => handleChange('accuracyStatement', checked as boolean)}
                className={errors.accuracyStatement ? 'border-red-500' : ''}
              />
              <div className="space-y-1">
                <Label htmlFor="accuracyStatement" className="cursor-pointer">
                  The information in this notification is accurate, and I am authorized to act on behalf of
                  the copyright owner. *
                </Label>
                {errors.accuracyStatement && (
                  <p className="text-sm text-red-600">{errors.accuracyStatement}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="misrepresentationWarning"
                checked={formData.misrepresentationWarning}
                onCheckedChange={(checked) => handleChange('misrepresentationWarning', checked as boolean)}
                className={errors.misrepresentationWarning ? 'border-red-500' : ''}
              />
              <div className="space-y-1">
                <Label htmlFor="misrepresentationWarning" className="cursor-pointer">
                  I understand that under 17 U.S.C. § 512(f), I may be liable for damages if I knowingly
                  misrepresent that material is infringing. *
                </Label>
                {errors.misrepresentationWarning && (
                  <p className="text-sm text-red-600">{errors.misrepresentationWarning}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signature */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">5. Electronic Signature</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="signature">Type Your Full Name to Sign *</Label>
                <Input
                  id="signature"
                  value={formData.signature}
                  onChange={(e) => handleChange('signature', e.target.value)}
                  placeholder="Jane Doe"
                  className={errors.signature ? 'border-red-500' : ''}
                />
                {errors.signature && (
                  <p className="text-sm text-red-600">{errors.signature}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Must match your full name exactly
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signatureDate">Date</Label>
                <Input
                  id="signatureDate"
                  type="date"
                  value={formData.signatureDate}
                  onChange={(e) => handleChange('signatureDate', e.target.value)}
                  disabled
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Honeypot field - hidden from users, catches bots */}
        <input
          type="text"
          name="website"
          value={formData.honeypot}
          onChange={(e) => handleChange('honeypot', e.target.value)}
          style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />

        {/* Submit */}
        {errors.submit && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{errors.submit}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-sm text-muted-foreground">
            By submitting, you agree to our{' '}
            <a href="/legal/TAKEDOWN_PROCESS.md" className="underline">
              Takedown Process
            </a>
          </p>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? 'Submitting...' : 'Submit Takedown Request'}
          </Button>
        </div>
      </form>
    </PageTemplate>
  );
}