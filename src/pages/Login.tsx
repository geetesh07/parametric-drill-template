import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/Logo';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon, ArrowLeft } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();

  const handleContinueAsGuest = () => {
    toast.info("You're continuing as a guest. Login will be available in a future update.", {
      duration: 5000,
    });
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Logo size="md" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">
            Authentication Coming Soon
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            We're still working on this feature
          </p>
        </div>

        <Alert className="bg-blue-950 border-blue-900 text-white">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Information</AlertTitle>
          <AlertDescription>
            Login functionality is currently under development. You can continue as a guest to use the Drill Generator.
          </AlertDescription>
        </Alert>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Under Development</CardTitle>
            <CardDescription className="text-gray-400">
              User accounts will be available soon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center text-gray-400">
              <p>We're working on making user accounts available. In the meantime, you can use the Drill Generator without an account.</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              onClick={handleContinueAsGuest}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Continue as Guest
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full border-gray-600 text-gray-400 hover:text-white"
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
