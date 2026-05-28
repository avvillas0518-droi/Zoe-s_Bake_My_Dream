import React, { useState } from "react";
import { Clock, MapPin, Sparkles, CheckCircle, Star, MessageSquare } from "lucide-react";
import { BakeryAddress } from "../types";
import ZoeLogo from "./ZoeLogo";

interface FooterProps {
  address: BakeryAddress;
  setActiveTab: (tab: string) => void;
  triggerNotification: (message: string, type?: "success" | "error" | "info") => void;
  onPostReview?: (name: string, rating: number, text: string, role?: string) => Promise<boolean>;
  user?: {
    loggedIn: boolean;
    name: string;
    email: string;
    isAdmin: boolean;
  };
  customLogo?: string;
}

export default function Footer({ 
  address, 
  setActiveTab, 
  triggerNotification, 
  onPostReview, 
  user,
  customLogo
}: FooterProps) {
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewRole, setReviewRole] = useState("Sweet Tooth Critic");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onPostReview) {
      triggerNotification("Review submission is currently unavailable.", "error");
      return;
    }

    const finalName = user?.loggedIn ? user.name : reviewName.trim();
    const finalRole = reviewRole.trim() || "Verified Patron";
    const text = reviewText.trim();

    if (!finalName) {
      triggerNotification("Please specify your name or authenticate to post a review.", "error");
      return;
    }
    if (!text) {
      triggerNotification("Please enter some kind feedback details.", "error");
      return;
    }

    setIsSubmitting(true);
    const success = await onPostReview(finalName, reviewRating, text, finalRole);
    setIsSubmitting(false);

    if (success) {
      setReviewText("");
      setReviewName("");
      setReviewRating(5);
    }
  };

  return (
    <footer className="bg-[#FAF5EE] border-t border-[#E8DCCF] text-[#5C4025] text-xs pt-16 pb-12 font-sans relative overflow-hidden">
      
      {/* Decorative Swirl Baker Glows */}
      <div className="absolute right-0 bottom-0 w-64 h-64 bg-burgundy/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute left-10 top-0 w-48 h-48 bg-[#D4A373]/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
        
        {/* ─── FEEDBACK AND REVIEWS POSTING CONTAINER (Replaced Newsletter) ─── */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-[#E8DCCF] p-6 sm:p-8 flex flex-col lg:flex-row gap-8 shadow-sm">
          
          {/* Header information column */}
          <div className="space-y-3 lg:max-w-md shrink-0">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#8B5E3C] bg-[#F3EADF] px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 font-sans">
              <Sparkles className="w-3" /> Live Patron Reviews and Rating
            </span>
            <h3 className="font-serif font-black text-2xl text-[#3D2612] tracking-tight">
              Share Your Zoe’s Experience
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed font-semibold">
              Were our Fudge S'mores Crinkles melts satisfying? Or did the Classic Brioche win your heart? Share your sweet words in real-time. Approved reviews go directly into our landing hero view.
            </p>
            
            <div className="flex items-center gap-2 pt-2">
              <div className="flex text-amber-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 fill-current text-amber-400" />
                ))}
              </div>
              <span className="text-xs font-bold text-[#3D2612]">4.9 out of 5 based on genuine patrons bakes bakes!</span>
            </div>
          </div>

          {/* Interactive Posting Form */}
          <form onSubmit={handleSubmitReview} className="flex-1 space-y-4 font-sans text-[#3D2612]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Name Field */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Your Signature Name
                </label>
                {user?.loggedIn ? (
                  <div className="w-full bg-[#FAF5EE] border border-[#E8DCCF] rounded-xl px-4 py-2.5 text-xs text-[#3D2612] font-extrabold flex items-center justify-between">
                    <span>{user.name}</span>
                    <span className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-100 px-1.5 py-0.5 rounded-md uppercase font-black">Logged In</span>
                  </div>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rodel Cantuba"
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    className="w-full border border-gray-200 bg-[#FAF5EE]/30 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#8B5E3C] focus:outline-none text-xs font-bold"
                  />
                )}
              </div>

              {/* Tag Role Field */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Your Culinary Tag
                </label>
                <select
                  value={reviewRole}
                  onChange={(e) => setReviewRole(e.target.value)}
                  className="w-full border border-gray-200 bg-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#8B5E3C] focus:outline-none text-xs font-bold cursor-pointer"
                >
                  <option value="Sweet Tooth Critic">🧁 Sweet Tooth Critic</option>
                  <option value="Brioche Enthusiast">🥖 Brioche Enthusiast</option>
                  <option value="Weekend Indulger">🍪 Weekend Indulger</option>
                  <option value="First-time Diner">✨ First-time Diner</option>
                  <option value="Caffeine Lover">☕ Caffeine Lover</option>
                </select>
              </div>

            </div>

            {/* Stars rating selection and Review text block */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Detailed Bakery Experience
                </label>
                
                {/* Rating selection */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-gray-400 mr-1 uppercase">Rating:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-0.5 hover:scale-115 transition focus:outline-none cursor-pointer"
                    >
                      <Star 
                        className={`w-4 h-4 transition-colors ${
                          star <= reviewRating ? "fill-amber-400 text-amber-500" : "text-gray-200 fill-none"
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea review */}
              <div className="relative">
                <MessageSquare className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <textarea
                  required
                  rows={2}
                  maxLength={280}
                  placeholder="Share details of your experience such as fluffy textures, wonderful frosting decoration... (Limit 280 chars)"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 bg-[#FAF5EE]/30 rounded-xl focus:ring-2 focus:ring-[#8B5E3C] focus:outline-none text-xs font-medium placeholder-gray-400 resize-none min-h-[60px]"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-1.5">
              <span className="text-[9px] text-[#8B5E3C] font-semibold flex items-center gap-1 leading-none">
                <CheckCircle className="w-3 text-emerald-600 shrink-0" />
                Your avatar will be automatically matched with delicious pastry characters!
              </span>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-burgundy hover:bg-burgundy/95 disabled:bg-gray-300 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-md cursor-pointer flex items-center gap-1.5"
              >
                {isSubmitting ? "Posting review..." : "Publish Sweet Review"}
              </button>
            </div>

          </form>
        </div>

        {/* ─── FOOTER HIGHLIGHTS GRID ─── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-6">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 font-sans">
              <ZoeLogo className="w-10 h-10" customLogo={customLogo} />
              <span className="font-serif text-lg font-black text-[#3D2612]">Zoe’s Bakehouse</span>
            </div>
            <p className="text-[11px] leading-relaxed text-gray-500 font-medium font-sans">
              Co-designing your sweet dreams with gourmet cakes, hand-rolled cookies, and soft fresh-baked brioche.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-100/50 px-2.5 py-1 rounded-xl w-fit font-bold font-sans">
              <CheckCircle className="w-3.5 h-3.5" /> Order Collections Active Today
            </div>
          </div>

          <div className="space-y-3 font-sans">
            <h4 className="font-serif font-black text-[#3D2612] tracking-wider text-sm flex items-center gap-1.5">
              Delicious Oven Menus
            </h4>
            <ul className="space-y-2 text-[11px] font-semibold">
              <li>
                <button onClick={() => setActiveTab('menu')} className="hover:underline text-gray-500 hover:text-burgundy cursor-pointer text-left transition">
                  🍪 Fudge Smores Crinkles
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('menu')} className="hover:underline text-gray-500 hover:text-burgundy cursor-pointer text-left transition text-[#8B5E3C]">
                  🥖 Historic Brioche Loaf
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('menu')} className="hover:underline text-gray-500 hover:text-burgundy cursor-pointer text-left transition">
                  🎂 Chocolate Fudge Celebration
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-3 font-sans">
            <h4 className="font-serif font-black text-[#3D2612] tracking-wider text-sm flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#8B5E3C]" /> Baking & Dispatch Hours
            </h4>
            <div className="space-y-1.5 text-[11px] font-medium text-gray-500">
              <p className="font-bold text-[#3D2612]">{address.hours}</p>
              <p className="italic text-rose-700">{address.hoursClosed}</p>
              <div className="pt-2 flex items-start gap-1 text-[10px]">
                <MapPin className="w-3 h-3 text-burgundy shrink-0 mt-0.5" />
                <span>Brick-and-mortar Pickup Window collections only.</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 font-sans">
            <h4 className="font-serif font-black text-[#3D2612] tracking-wider text-sm">
              Follow Zoe’s Dream
            </h4>
            <p className="text-[11px] leading-relaxed text-gray-500 font-medium">
              Join Camille Sumaya on social handles for daily video recipe rolls and active oven livestreams.
            </p>
            <div className="flex flex-wrap gap-2.5 pt-1">
              {['Instagram', 'Facebook', 'TikTok'].map((social) => (
                <button 
                  key={social}
                  onClick={() => triggerNotification(`Opening Zoe’s Bakehouse ${social} channel...`, "info")} 
                  className="px-3 py-1.5 bg-white hover:bg-burgundy hover:text-white border border-[#E8DCCF] hover:border-transparent rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition cursor-pointer shadow-2xs"
                >
                  {social}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* ─── FOOTER BOTTOM TRADEMARK ─── */}
        <div className="pt-8 border-t border-[#E8DCCF]/50 text-center text-[10px] text-gray-400 font-medium space-y-1">
          <p>© 2026 Zoe’s Bakehouse Co. All custom menu design patents and recipes reserved. Made in continuous local sandbox.</p>
          <p className="text-[9px] tracking-wide text-gray-300">Proudly powered by local sandbox persistent memory.</p>
        </div>

      </div>
    </footer>
  );
}
