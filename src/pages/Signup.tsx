import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, ArrowLeft, Info } from 'lucide-react';
import { toast } from 'sonner';
import Logo from '@/components/Logo';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function Signup() {
  const navigate = useNavigate();

  const handleContinueAsGuest = () => {
    toast.info("You're continuing as a guest. Registration will be available in a future update.", {
      duration: 5000,
    });
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Logo size="md" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight">
            Registration Coming Soon
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We're still working on this feature
          </p>
        </div>

        <Alert className="bg-blue-50 border-blue-200 text-blue-800">
          <Info className="h-4 w-4" />
          <AlertTitle>Information</AlertTitle>
          <AlertDescription>
            Registration functionality is currently under development. You can continue as a guest to use the Drill Generator.
          </AlertDescription>
        </Alert>

        <Card className="border-2">
          <CardHeader>
            <CardTitle>Under Development</CardTitle>
            <CardDescription>
              User accounts will be available soon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center text-muted-foreground">
              <p>We're working on making user accounts available. In the meantime, you can use the Drill Generator without an account.</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button onClick={handleContinueAsGuest} className="w-full">
              <UserPlus className="mr-2 h-4 w-4" />
              Continue as Guest
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
