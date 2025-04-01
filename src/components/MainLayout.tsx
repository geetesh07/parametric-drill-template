import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Menu, X } from 'lucide-react';
import ToolSelector from './ToolSelector';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
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
              <div className={`${location.pathname.includes('generator') ? 'text-primary font-semibold' : ''}`}>
                <ToolSelector />
              </div>
              <Link 
                to="/terms" 
                className={`text-sm font-medium transition-colors ${location.pathname === '/terms' ? 'text-primary font-semibold' : 'hover:text-primary'}`}
              >
                Terms
              </Link>
              <Link 
                to="/privacy" 
                className={`text-sm font-medium transition-colors ${location.pathname === '/privacy' ? 'text-primary font-semibold' : 'hover:text-primary'}`}
              >
                Privacy
              </Link>
            </nav>
            
            {/* Action Buttons */}
            <div className="hidden md:flex items-center space-x-2">
              <ThemeToggle />
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/signup">Get Started</Link>
              </Button>
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
              <div className="py-2">
                <ToolSelector />
              </div>
              <Link 
                to="/terms" 
                className={`block text-sm font-medium hover:text-primary py-2 ${location.pathname === '/terms' ? 'text-primary font-semibold' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Terms
              </Link>
              <Link 
                to="/privacy" 
                className={`block text-sm font-medium hover:text-primary py-2 ${location.pathname === '/privacy' ? 'text-primary font-semibold' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Privacy
              </Link>
              
              <div className="flex flex-col space-y-2 pt-2 border-t border-border/40">
                <Button variant="ghost" size="sm" asChild className="justify-start">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                    Get Started
                  </Link>
                </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
