
import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Drill, User, Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  
  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="w-full border-b border-border/40 bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Logo />
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link 
                to="/" 
                className={`text-sm font-medium transition-colors ${location.pathname === '/' ? 'text-primary font-semibold' : 'hover:text-primary'}`}
              >
                Home
              </Link>
              <Link 
                to="/designer" 
                className={`text-sm font-medium transition-colors ${location.pathname === '/designer' ? 'text-primary font-semibold' : 'hover:text-primary'}`}
              >
                Designer
              </Link>
              <Link 
                to="/pricing" 
                className={`text-sm font-medium transition-colors ${location.pathname === '/pricing' ? 'text-primary font-semibold' : 'hover:text-primary'}`}
              >
                Pricing
              </Link>
            </nav>
            
            {/* Action Buttons */}
            <div className="hidden md:flex items-center space-x-2">
              <ThemeToggle />
              
              {isAuthenticated ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground mr-2">
                    Hi, {user?.name}
                  </span>
                  <Button variant="ghost" size="sm" onClick={logout}>
                    <LogOut className="h-4 w-4 mr-1" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/login">Sign In</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link to="/signup">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
            
            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              <ThemeToggle />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background border-t border-border/40 py-4">
            <div className="container mx-auto px-4 space-y-3">
              <Link 
                to="/" 
                className={`block text-sm font-medium hover:text-primary py-2 ${location.pathname === '/' ? 'text-primary font-semibold' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/designer" 
                className={`block text-sm font-medium hover:text-primary py-2 ${location.pathname === '/designer' ? 'text-primary font-semibold' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Designer
              </Link>
              <Link 
                to="/pricing" 
                className={`block text-sm font-medium hover:text-primary py-2 ${location.pathname === '/pricing' ? 'text-primary font-semibold' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              
              <div className="flex flex-col space-y-2 pt-2 border-t border-border/40">
                {isAuthenticated ? (
                  <Button variant="ghost" size="sm" onClick={() => { logout(); setMobileMenuOpen(false); }} className="justify-start">
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                  </Button>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" asChild className="justify-start">
                      <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                        <User className="h-4 w-4 mr-2" /> Sign In
                      </Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                        Get Started
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
      
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-muted/30 border-t border-border/40 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Logo />
              <p className="mt-4 text-sm text-muted-foreground">
                Professional tool design software for manufacturing excellence.
              </p>
              <p className="mt-2 text-sm">
                NTS Tool Solution PRO v5.6.2
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/designer" className="text-muted-foreground hover:text-foreground">Designer</Link></li>
                <li><Link to="/pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="text-muted-foreground hover:text-foreground">Support</Link></li>
                <li><Link to="/" className="text-muted-foreground hover:text-foreground">Tutorials</Link></li>
                <li><Link to="/" className="text-muted-foreground hover:text-foreground">FAQ</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/terms" className="text-muted-foreground hover:text-foreground">Terms & Conditions</Link></li>
                <li><Link to="/privacy" className="text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
                <li><Link to="/" className="text-muted-foreground hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} NTS Tool Solutions. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0 flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-foreground">
                Twitter
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground">
                LinkedIn
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground">
                YouTube
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
