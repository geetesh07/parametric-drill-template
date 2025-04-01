import React, { Suspense, lazy } from "react";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import MainLayout from "./components/MainLayout";
import TermsPage from "./pages/TermsPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Profile from "./pages/Profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Lazy load the tool generators
const DrillGenerator = lazy(() => import("./pages/DrillGenerator"));

// Create a new QueryClient instance
const queryClient = new QueryClient();

// Loading component for suspense fallback
const Loading = () => (
  <div className="w-full h-screen flex items-center justify-center">
    Loading...
  </div>
);

// In Progress component
const InProgressTool = ({ toolName }: { toolName: string }) => (
  <div className="container py-12">
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">{toolName} - Coming Soon</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="animate-pulse rounded-full h-16 w-16 border-4 border-primary"></div>
          <p className="text-lg text-center">
            This feature is currently in development and will be available soon!
          </p>
          <p className="text-sm text-muted-foreground text-center">
            Please try our Drill Generator in the meantime.
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Profile disabled component
const ProfileDisabled = () => (
  <div className="container py-12">
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Profile - Coming Soon</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="animate-pulse rounded-full h-16 w-16 border-4 border-primary"></div>
          <p className="text-lg text-center">
            User profiles are currently in development. Account functionality will be available soon!
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
);

const App = () => (
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <TooltipProvider>
          <SonnerToaster />
          <BrowserRouter>
            <Suspense fallback={<Loading />}>
              <Routes>
                <Route 
                  path="/" 
                  element={
                    <MainLayout>
                      <Home />
                    </MainLayout>
                  } 
                />
                <Route 
                  path="/drill-generator" 
                  element={
                    <MainLayout>
                      <DrillGenerator />
                    </MainLayout>
                  } 
                />
                <Route 
                  path="/endmill-generator" 
                  element={
                    <MainLayout>
                      <InProgressTool toolName="Endmill Generator" />
                    </MainLayout>
                  } 
                />
                <Route 
                  path="/reamer-generator" 
                  element={
                    <MainLayout>
                      <InProgressTool toolName="Reamer Generator" />
                    </MainLayout>
                  } 
                />
                <Route 
                  path="/stepdrill-generator" 
                  element={
                    <MainLayout>
                      <InProgressTool toolName="Step Drill Generator" />
                    </MainLayout>
                  } 
                />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route 
                  path="/profile" 
                  element={
                    <MainLayout>
                      <ProfileDisabled />
                    </MainLayout>
                  } 
                />
                <Route 
                  path="/terms" 
                  element={
                    <MainLayout>
                      <TermsPage />
                    </MainLayout>
                  } 
                />
                <Route 
                  path="/privacy" 
                  element={
                    <MainLayout>
                      <PrivacyPolicy />
                    </MainLayout>
                  } 
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

export default App;
