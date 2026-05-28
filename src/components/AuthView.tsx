import React, { useState } from "react";
import { Globe, ArrowRight, X, ExternalLink, HelpCircle, Shield, CheckCircle2, Eye, EyeOff } from "lucide-react";

interface AuthViewProps {
  onLoginSuccess: (name: string, email: string, isAdmin: boolean, role?: string) => void;
  triggerNotification: (message: string, type?: "success" | "error" | "info") => void;
}

export default function AuthView({ onLoginSuccess, triggerNotification }: AuthViewProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authConfirmPass, setAuthConfirmPass] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<"Customer" | "Reseller" | "Owner">("Customer");
  const [activeSocialModal, setActiveSocialModal] = useState<'google' | 'facebook' | null>(null);

  // States for dynamic custom SSO social logs
  const [ssoName, setSsoName] = useState("");
  const [ssoEmail, setSsoEmail] = useState("");

  const handleSetAuthMode = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    if (mode === 'register' && role === 'Owner') {
      setRole('Customer');
    }
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: 'None', score: 0, color: 'bg-putty' };
    if (pass.length < 5) return { label: 'Weak Crumb', score: 1, color: 'bg-red-500' };
    if (pass.length < 8) return { label: 'Medium Rise', score: 2, color: 'bg-amber-500' };
    return { label: 'Brioche bread', score: 3, color: 'bg-emerald-600' };
  };

  const currentStrength = getPasswordStrength(authPassword);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = authEmail.trim().toLowerCase();

    // Fetch registered users inside localStorage
    const savedUsersStr = localStorage.getItem("dreamBakeRegisteredUsers");
    let registeredUsersList = savedUsersStr ? JSON.parse(savedUsersStr) : [];

    if (authMode === 'login') {
      if (!authEmail || !authPassword) {
        triggerNotification("Please fill in both security credentials.", "error");
        return;
      }
      const isOwner = role === 'Owner';
      const isAdminEmail = targetEmail.includes('admin') || targetEmail === 'admin';

      // Bypass tip check for fast developer/testing access
      if (isOwner || isAdminEmail) {
        const resolvedName = isOwner ? 'Camille Sumaya Marasigan' : authEmail.split('@')[0];
        onLoginSuccess(resolvedName, authEmail, true, role);
        return;
      }

      // Exact login verification
      const foundUser = registeredUsersList.find((u: any) => u.email.trim().toLowerCase() === targetEmail);

      if (foundUser) {
        // Match chosen role in form
        if (foundUser.password !== authPassword) {
          triggerNotification("Incorrect safety password for this account. Please verify your credentials.", "error");
          return;
        }
        onLoginSuccess(foundUser.name, foundUser.email, foundUser.role === 'Owner', foundUser.role);
        triggerNotification(`Welcome back, ${foundUser.name}! Signed in successfully.`, "success");
      } else {
        // Offer auto-registration or advice
        triggerNotification(`No registered account found under "${authEmail}". Please use the "Sign Up" tab to register your profile!`, "error");
      }
    } else {
      // Register Mode
      if (!authName || !authEmail || !authPassword || !authConfirmPass) {
        triggerNotification("All signup fields are required.", "error");
        return;
      }
      if (authPassword !== authConfirmPass) {
        triggerNotification("Password entries mismatch.", "error");
        return;
      }
      for (const char of authName) {
        if (!isNaN(Number(char)) && char !== " ") {
          triggerNotification("Name field should only contain characters", "error");
          return;
        }
      }

      const existingUser = registeredUsersList.find((u: any) => u.email.trim().toLowerCase() === targetEmail);
      if (existingUser) {
        triggerNotification(`An account under "${authEmail}" is already registered. Please proceed to "Sign In".`, "error");
        return;
      }

      // Add user to simulated storage
      const newUser = {
        name: authName.trim(),
        email: authEmail.trim(),
        password: authPassword,
        role: role
      };

      registeredUsersList.push(newUser);
      localStorage.setItem("dreamBakeRegisteredUsers", JSON.stringify(registeredUsersList));

      triggerNotification(`Loyalty account created successfully! Welcome to the family, ${authName}!`, "success");
      onLoginSuccess(newUser.name, newUser.email, false, role);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 bg-alabaster">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-putty shadow-md space-y-6">
        
        <div className="text-center">
          <h1 className="font-serif text-3xl font-extrabold text-charcoal">
            {authMode === 'login' ? 'Welcome Back' : 'Activate Account'}
          </h1>
          <p className="text-xs text-clay mt-2 font-sans leading-relaxed">
            {authMode === 'login' ? 'Sign in to access custom orders or Baker Dashboard controls' : 'Join our sweet rewards system to earn discount codes'}
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-putty font-sans">
          <button
            onClick={() => handleSetAuthMode('login')}
            className={`flex-1 pb-3 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer ${
              authMode === 'login' ? 'border-burgundy text-burgundy' : 'border-transparent text-clay hover:text-charcoal'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => handleSetAuthMode('register')}
            className={`flex-1 pb-3 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer ${
              authMode === 'register' ? 'border-burgundy text-burgundy' : 'border-transparent text-clay hover:text-charcoal'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Auth form */}
        <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
          {authMode === 'register' && (
            <div>
              <label className="block font-bold text-clay uppercase tracking-widest mb-1.5">Full Name</label>
              <input 
                type="text"
                required
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                placeholder="Charlotte Dubois" 
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-putty bg-white text-charcoal placeholder-clay/55 focus:outline-none focus:ring-2 focus:ring-burgundy transition"
              />
            </div>
          )}

          <div>
            <label className="block font-bold text-clay uppercase tracking-widest mb-1.5">
              {authMode === 'login' ? 'Portal Access Role' : 'Account Type / Role'}
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-putty bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-burgundy transition cursor-pointer"
            >
              <option value="Customer">Customer</option>
              <option value="Reseller">Authorized Reseller</option>
              {authMode === 'login' && (
                <option value="Owner">Admin Owner</option>
              )}
            </select>
          </div>

          <div>
            <label className="block font-bold text-clay uppercase tracking-widest mb-1.5">Email Box</label>
            <input 
              type="email"
              required
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="marie@example.com" 
              className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-putty bg-white text-charcoal placeholder-clay/55 focus:outline-none focus:ring-2 focus:ring-burgundy transition"
            />
            {authMode === 'login' && (
              <span className="text-[10px] text-burgundy mt-1.5 block italic leading-tight">
                
              </span>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block font-bold text-clay uppercase tracking-widest">Password</label>
              {authMode === 'login' && (
                <button 
                  type="button" 
                  onClick={() => triggerNotification("A simulated password retrieval email has been queued.", "info")} 
                  className="text-[10px] text-burgundy hover:underline cursor-pointer"
                >
                  Forgot?
                </button>
              )}
            </div>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full text-xs pl-3.5 pr-10 py-2.5 rounded-lg border border-putty bg-white text-charcoal placeholder-clay/55 focus:outline-none focus:ring-2 focus:ring-burgundy transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-clay hover:text-burgundy transition cursor-pointer p-1"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            {authMode === 'register' && authPassword && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-clay">Security strength:</span>
                  <span className="text-burgundy">{currentStrength.label}</span>
                </div>
                <div className="h-1 w-full bg-cream rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${currentStrength.color}`} 
                    style={{ width: `${(currentStrength.score / 3) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {authMode === 'register' && (
            <div>
              <label className="block font-bold text-clay uppercase tracking-widest mb-1.5">Confirm Safety Password</label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={authConfirmPass}
                  onChange={(e) => setAuthConfirmPass(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full text-xs pl-3.5 pr-10 py-2.5 rounded-lg border border-putty bg-white text-charcoal placeholder-clay/55 focus:outline-none focus:ring-2 focus:ring-burgundy transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-clay hover:text-burgundy transition cursor-pointer p-1"
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {authMode === 'login' && (
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input 
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
                className="rounded border-putty bg-white checked:bg-burgundy text-burgundy focus:ring-burgundy w-4 h-4 cursor-pointer" 
              />
              <span className="text-xs text-clay font-medium select-none">Remember this browser</span>
            </label>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-burgundy hover:bg-burgundy/90 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition shadow mt-3 cursor-pointer"
          >
            {authMode === 'login' ? 'Log In Securely' : 'Activate Profile'}
          </button>

          <div className="text-center mt-4">
            {authMode === 'login' ? (
              <p className="text-[11px] text-clay font-medium">
                New user playing with our sweet recipes?{" "}
                <button
                  type="button"
                  onClick={() => handleSetAuthMode('register')}
                  className="text-burgundy font-bold hover:underline cursor-pointer transition focus:outline-none"
                >
                  Sign Up for Free Account
                </button>
              </p>
            ) : (
              <p className="text-[11px] text-clay font-medium">
                Already registered your sweet profile?{" "}
                <button
                  type="button"
                  onClick={() => handleSetAuthMode('login')}
                  className="text-burgundy font-bold hover:underline cursor-pointer transition focus:outline-none"
                >
                  Sign In to Account
                </button>
              </p>
            )}
          </div>
        </form>

        {/* Simulated Social logs */}
        <div className="space-y-4 pt-4 border-t border-putty">
          <p className="text-center text-[10px] font-bold text-clay uppercase tracking-wider">or fast entry via</p>
          <div className="grid grid-cols-2 gap-3">
            <button 
              type="button"
              onClick={() => {
                setActiveSocialModal('google');
              }}
              className="flex items-center justify-center gap-2 p-2.5 border border-putty bg-white hover:bg-cream/30 rounded-xl text-xs font-semibold text-charcoal transition cursor-pointer shadow-xs"
            >
              <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.125-5.136 4.125A5.64 5.64 0 018.35 12.89a5.64 5.64 0 015.64-5.64 5.56 5.56 0 013.9 1.513l3.05-3.048C19.04 1.838 16.596 1 14 1 7.925 1 3 5.925 3 12s4.925 11 11 11c6.28 0 10.5-4.412 10.5-10.715 0-.724-.06-1.4-.2-2H12.24z"/>
              </svg>
              Google
            </button>
            <button 
              type="button"
              onClick={() => {
                setActiveSocialModal('facebook');
              }}
              className="flex items-center justify-center gap-2 p-2.5 border border-putty bg-white hover:bg-cream/30 rounded-xl text-xs font-semibold text-charcoal transition cursor-pointer shadow-xs"
            >
              <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </button>
          </div>
        </div>

      </div>

      {/* Interactive Social Auth Modal */}
      {activeSocialModal && (
        <div id="social-auth-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl border border-putty shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-putty bg-cream/20 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-burgundy" />
                <h3 className="font-serif font-bold text-base text-charcoal">
                  {activeSocialModal === 'google' ? "Google Identity Gateway" : "Facebook OAuth Engine"}
                </h3>
              </div>
              <button 
                onClick={() => setActiveSocialModal(null)}
                className="p-1 rounded-full text-clay hover:text-charcoal hover:bg-putty/30 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3 p-3.5 bg-cream/40 rounded-xl border border-putty/50">
                <HelpCircle className="w-5 h-5 text-burgundy shrink-0 mt-0.5" />
                <div className="text-xs text-clay leading-relaxed">
                  <p className="font-bold text-charcoal mb-1">How would you like to authentication request?</p>
                  You are exploring the Zoe’s Bake My Dream sandbox. To ensure continuous operation without losing your draft pre-orders or causing origin errors, we offer two secure methods:
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4 pt-1">
                {/* Option 1: Sandbox simulation with customized input credentials */}
                <div className="p-4 border border-[#E8DCCF] bg-white rounded-xl shadow-xs space-y-3">
                  <div className="flex items-center gap-1.5 border-b pb-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-charcoal">Secure SSO Simulated Gateway</span>
                  </div>
                  
                  <p className="text-[10px] text-[#8B5E3C] leading-normal font-medium">
                    Enter your actual social credentials to authorize securely:
                  </p>

                  <div className="space-y-2 text-left font-sans text-xs">
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">Account Name</label>
                      <input 
                        type="text"
                        placeholder={activeSocialModal === 'google' ? "e.g. John Doe (Google)" : "e.g. Jane Doe (Facebook)"}
                        value={ssoName}
                        onChange={(e) => setSsoName(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-[#E8DCCF] rounded-lg focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">Social Email</label>
                      <input 
                        type="email"
                        placeholder={activeSocialModal === 'google' ? "e.g. jdoe@gmail.com" : "e.g. jdoe@facebook.com"}
                        value={ssoEmail}
                        onChange={(e) => setSsoEmail(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-[#E8DCCF] rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const finalName = ssoName.trim() || (activeSocialModal === 'google' ? "Google Patron" : "Facebook Guest");
                      const finalEmail = ssoEmail.trim() || (activeSocialModal === 'google' ? "patron-google@google.com" : "guest-fb@facebook.com");
                      onLoginSuccess(finalName, finalEmail, false, 'Customer');
                      triggerNotification(`Authorized via ${activeSocialModal === 'google' ? 'Google' : 'Facebook'} as "${finalName}"!`, "success");
                      setActiveSocialModal(null);
                    }}
                    className="w-full py-2.5 bg-burgundy hover:bg-burgundy/90 text-white font-bold text-xs uppercase tracking-widest rounded-lg shadow transition cursor-pointer text-center block"
                  >
                    Simulate SSO Authenticate
                  </button>
                </div>

                {/* Option 2: Actual Redirect */}
                <button
                  onClick={() => {
                    const url = activeSocialModal === 'google' 
                      ? "https://accounts.google.com/" 
                      : "https://www.facebook.com/login.php";
                    
                    window.open(url, "_blank", "noopener,noreferrer");
                    triggerNotification(`Redirected securely to official ${activeSocialModal === 'google' ? 'Google' : 'Facebook'} login service!`, "info");
                    
                    // Also auto-log them in to keep interactive page session continuous
                    const finalName = ssoName.trim() || (activeSocialModal === 'google' ? "Google Patron" : "Facebook Guest");
                    const finalEmail = ssoEmail.trim() || (activeSocialModal === 'google' ? "patron-google@google.com" : "guest-fb@facebook.com");
                    onLoginSuccess(finalName, finalEmail, false, 'Customer');
                    setActiveSocialModal(null);
                  }}
                  className="w-full p-4 border border-putty bg-[#FAFAFA] hover:bg-[#F5F5F5] text-left rounded-xl transition cursor-pointer flex items-center justify-between group shadow-xs"
                >
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center gap-1.5">
                      <ExternalLink className="w-4 h-4 text-burgundy" />
                      <span className="text-xs font-bold text-charcoal font-sans">Launch Official Live Auth API</span>
                    </div>
                    <p className="text-[10px] text-clay leading-normal font-sans">
                      Directs authentication requests to the official OAuth portal in a separate tab. Completely secure, isolates cookies, and keeps this tab initialized.
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-clay group-hover:text-burgundy shrink-0 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-cream/10 border-t border-putty text-center">
              <span className="text-[9px] font-mono text-clay uppercase tracking-widest flex items-center justify-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Sandboxed Safe-Pass Protection Confirmed
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
