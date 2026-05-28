import React, { useState } from "react";
import { Sparkles, Loader2, Plus, Cake, Heart, Check, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product } from "../types";

interface AIPastryAdvisorProps {
  onAddCustomProductToCart: (product: Product) => void;
  triggerNotification: (message: string, type?: "success" | "error" | "info") => void;
}

export default function AIPastryAdvisor({
  onAddCustomProductToCart,
  triggerNotification,
}: AIPastryAdvisorProps) {
  const [occasion, setOccasion] = useState("Birthday Celebration");
  const [preferences, setPreferences] = useState("");
  const [layers, setLayers] = useState("Single Layer");
  const [customText, setCustomText] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any | null>(null);

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAiResult(null);

    try {
      const response = await fetch("/api/ai/customize-cake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ occasion, preferences, layers, customText }),
      });

      if (!response.ok) {
        throw new Error("Unable to obtain custom cake design.");
      }

      const data = await response.json();
      setAiResult(data);
      triggerNotification("Camille's AI Assistant has sculpted your draft dessert!", "success");
    } catch (error) {
      console.error(error);
      triggerNotification("Baking connection is currently busy. Brioche bread rising in backup state.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReserveCake = () => {
    if (!aiResult) return;

    // Create a dynamic custom product item
    const customCake: Product = {
      id: `custom-cake-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      name: aiResult.name,
      category: "Cakes",
      description: `${aiResult.culinaryStory} (Hand-crafted for your ${occasion} - Message: "${customText || "Plain"}")`,
      price: aiResult.recommendedPrice || 60.00,
      image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80",
      available: true,
      isFeatured: false,
    };

    onAddCustomProductToCart(customCake);
    triggerNotification(`"${aiResult.name}" has been reserved and placed in your Pre-Order basket!`, "success");
  };

  return (
    <div className="bg-white rounded-3xl border border-putty shadow-md overflow-hidden">
      {/* Decorative Top Accent */}
      <div className="bg-burgundy px-6 py-5 text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="bg-white/10 p-2 rounded-full backdrop-blur-md">
            <Sparkles className="w-5 h-5 text-amber-200 animate-spin" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg leading-tight">Camille’s AI Pastry Customizer</h3>
            <p className="text-[10px] text-cream/80 tracking-wider uppercase font-medium">Co-Design with our Master Baker via Gemini</p>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        <p className="text-xs text-clay leading-relaxed font-sans">
          Tell us about your celebration. Our server-side neural assistant simulates Master Baker Camille’s expertise to formulate flavor pairings, texture layers, and specialized pricing instantly.
        </p>

        <form onSubmit={handleAskAI} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-clay uppercase tracking-wider mb-1.5">Occasion or Theme</label>
              <select
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-putty focus:outline-none focus:ring-2 focus:ring-burgundy bg-white text-charcoal transition cursor-pointer"
              >
                <option value="Birthday Celebration">Birthday Celebration</option>
                <option value="Wedding Celebration">Wedding Anniversary</option>
                <option value="Corporate Gala Banquet">Corporate Gala Banquet</option>
                <option value="High Tea Party">High Tea Afternoon Party</option>
                <option value="Romantic Proposal">Romantic Proposal</option>
                <option value="Folk Festival / Holidays">Folk Festival / Holiday Reunion</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-clay uppercase tracking-wider mb-1.5">Tiers & Layers</label>
              <select
                value={layers}
                onChange={(e) => setLayers(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-putty focus:outline-none focus:ring-2 focus:ring-burgundy bg-white text-charcoal transition cursor-pointer"
              >
                <option value="Single Layer">Single Tier Delicate (Feeds 6-8)</option>
                <option value="Double Layer Stack">Double Tier Elegant Stack (Feeds 12-16)</option>
                <option value="Triple Layer Grand">Triple Tier Grand Ceremony (Feeds 24-30)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-clay uppercase tracking-wider mb-1.5">Flavor Preferences & Secret Cravings</label>
            <input
              type="text"
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder="e.g., Zesty lemon, organic dark ganache, lavender buds, salty pistachios"
              className="w-full text-xs px-3.5 py-3 rounded-xl border border-putty focus:outline-none focus:ring-2 focus:ring-burgundy bg-white text-charcoal transition placeholder-clay/55"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-clay uppercase tracking-wider mb-1.5">Custom Text on Cake (Optional)</label>
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="e.g., Happy 30th Gwendolyn!"
              maxLength={40}
              className="w-full text-xs px-3.5 py-3 rounded-xl border border-putty focus:outline-none focus:ring-2 focus:ring-burgundy bg-white text-charcoal transition placeholder-clay/55"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4.5 bg-burgundy hover:bg-burgundy/90 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-80 font-sans"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                Sculpting and pairing ingredients...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-200" />
                Generate My Custom Masterpiece
              </>
            )}
          </button>
        </form>

        <AnimatePresence mode="wait">
          {aiResult && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="pt-6 border-t border-cream space-y-5"
            >
              <div className="bg-cream/15 rounded-2xl p-5 border border-putty space-y-4">
                
                {/* Header block with cake name & recommendation cost */}
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-burgundy bg-cream px-2.5 py-1 rounded-full border border-putty">
                      Celebration cake design
                    </span>
                    <h4 className="font-serif font-black text-xl text-charcoal mt-2 leading-tight">
                      {aiResult.name}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="block text-[9px] font-extrabold uppercase text-clay">EST. PRICE</span>
                    <span className="font-serif font-black text-xl text-burgundy block mt-0.5">
                      ₱{aiResult.recommendedPrice?.toFixed(2) || "1500.00"}
                    </span>
                  </div>
                </div>

                {/* Culinary Story */}
                <p className="text-xs text-charcoal leading-relaxed italic border-l-2 border-burgundy/40 pl-3 font-sans">
                  "{aiResult.culinaryStory}"
                </p>

                {/* Key Premium Ingredients */}
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-extrabold uppercase text-clay tracking-wide font-sans">
                    Artisan Ingredients Selected
                  </span>
                  <div className="flex flex-wrap gap-1.5 font-sans">
                    {aiResult.ingredientsList?.map((ing: string, i: number) => (
                      <span
                        key={i}
                        className="text-[10px] font-medium text-charcoal bg-white border border-putty px-2.5 py-1 rounded-lg"
                      >
                        {ing}
                      </span>
                    )) || <span className="text-xs text-clay">Brioche bread starters</span>}
                  </div>
                </div>

                {/* Camille's Baking Tips */}
                {aiResult.bakingTips && aiResult.bakingTips.length > 0 && (
                  <div className="pt-3 border-t border-dashed border-putty space-y-2">
                    <span className="text-[10px] uppercase font-bold text-clay block tracking-wider font-sans">
                      Camille’s Serving Guidelines
                    </span>
                    <div className="space-y-1.5 font-sans">
                      {aiResult.bakingTips.map((tip: string, idx: number) => (
                        <div key={idx} className="flex gap-2 items-start text-xs text-clay">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <p className="leading-tight">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Reserve action button */}
              <button
                onClick={handleReserveCake}
                className="w-full py-4 bg-burgundy hover:bg-burgundy/90 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer font-sans"
              >
                <Cake className="w-4 h-4 text-white" />
                Approve Recipe & Add Custom Cake to Basket
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
