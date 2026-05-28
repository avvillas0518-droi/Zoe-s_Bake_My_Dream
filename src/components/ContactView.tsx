import React, { useState, useEffect } from "react";
import { MapPin, Clock, Phone, Mail, Upload, X } from "lucide-react";
import { BakeryAddress } from "../types";

interface ContactViewProps {
  address: BakeryAddress;
  triggerNotification: (message: string, type?: "success" | "error" | "info") => void;
  user?: { loggedIn: boolean; name: string; email: string };
}

export default function ContactView({ address, triggerNotification, user }: ContactViewProps) {
  const [name, setName] = useState(user?.loggedIn ? user.name : "");
  const [email, setEmail] = useState(user?.loggedIn ? user.email : "");
  const [msg, setMsg] = useState("");
  const [inspirationImage, setInspirationImage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const userLoggedIn = user?.loggedIn;
  const userEmail = user?.email;
  const userName = user?.name;

  useEffect(() => {
    if (userLoggedIn) {
      setName(userName || "");
      setEmail(userEmail || "");
    }
  }, [userLoggedIn, userEmail, userName]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setInspirationImage(reader.result as string);
      setIsUploading(false);
      triggerNotification("Inspiration image uploaded successfully!", "success");
    };
    reader.onerror = () => {
      setIsUploading(false);
      triggerNotification("Failed to read selection image.", "error");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !msg) {
      triggerNotification("Please fill in all inquiry fields.", "error");
      return;
    }

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message: msg, inspirationImage })
      });

      if (res.ok) {
        triggerNotification(`Thank you ${name}! Your gourmet inquiry has been logged successfully!`, "success");
        setMsg("");
        setInspirationImage("");
      } else {
        triggerNotification("Failed to submit inquiry. Please try again.", "error");
      }
    } catch (err) {
      console.error(err);
      triggerNotification("Failed to submit inquiry. Please try again.", "error");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      <div className="text-center max-w-xl mx-auto mb-12">
        <h1 className="font-serif text-4xl font-extrabold text-charcoal mb-2">Visit Zoe’s Bakehouse</h1>
        <p className="text-xs sm:text-sm text-clay font-sans leading-relaxed">
          Follow the scent of bubbling wild yeast and brown butter. Drop our founder a line or stop by for hot baked treats.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Email Form */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-putty shadow-sm space-y-6">
          <div>
            <h2 className="font-serif text-2xl font-bold text-charcoal mb-1">Send Camille a Note</h2>
            <p className="text-xs text-clay">Our administrative support coordinates weddings and custom caterings.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 font-sans">
            <div>
              <label className="block text-xs font-bold text-clay uppercase tracking-wider mb-1">Your Good Name</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Marie Antoinette" 
                className="w-full text-xs px-3.5 py-3 rounded-xl bg-white text-charcoal border border-putty focus:outline-none focus:ring-2 focus:ring-burgundy transition placeholder-clay/55"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-clay uppercase tracking-wider mb-1">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="marie@louvre.fr" 
                className="w-full text-xs px-3.5 py-3 rounded-xl bg-white text-charcoal border border-putty focus:outline-none focus:ring-2 focus:ring-burgundy transition placeholder-clay/55"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-clay uppercase tracking-wider mb-1">How can we sweeten your day?</label>
              <textarea 
                rows={4} 
                required
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                placeholder="Details of your catering scale, preferred flavors, allergy configurations..." 
                className="w-full text-xs px-3.5 py-3 rounded-xl bg-white text-charcoal border border-putty focus:outline-none focus:ring-2 focus:ring-burgundy resize-none transition placeholder-clay/55"
              />
            </div>

            {/* Custom Order Inspiration Uploader */}
            <div className="space-y-2 border border-dashed border-putty/80 p-4 rounded-2xl bg-cream/5 font-sans">
              <label className="block text-xs font-bold text-clay uppercase tracking-wider mb-1">
                Have design inspiration? (Optional)
              </label>
              <p className="text-[10px] text-gray-400 font-medium select-none mb-2">
                If you have custom cake drawings, pastry references or color palettes, upload them here.
              </p>
              
              {!inspirationImage ? (
                <div className="relative border border-dashed border-putty hover:border-burgundy rounded-xl p-4 transition bg-white text-center cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    title="Upload Order design inspiration image"
                  />
                  <div className="flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4 text-burgundy" />
                    <span className="text-xs font-bold text-[#8B5E3C]">
                      {isUploading ? "Reading design image..." : "Add Inspiration Image"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-putty flex items-center justify-center bg-gray-50 p-2 max-h-[160px]">
                  <img 
                    src={inspirationImage} 
                    alt="Uploaded Inspiration Visual reference" 
                    className="max-h-[140px] object-contain rounded-lg shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setInspirationImage("")}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-red-100 hover:bg-red-200 text-red-700 shadow-sm transition cursor-pointer"
                    title="Remove illustration"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="px-6 py-3.5 bg-burgundy hover:bg-burgundy/90 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow cursor-pointer"
            >
              Submit Inquiry
            </button>
          </form>
        </div>

        {/* Location / Meta details */}
        <div className="lg:col-span-12 lg:lg:col-span-5 space-y-6">
          <div className="bg-white border border-putty p-8 rounded-3xl space-y-6 shadow-sm">
            <h3 className="font-serif font-extrabold text-charcoal text-xl">Address & Hours</h3>
            
            <div className="space-y-4.5 font-sans">
              <div className="flex gap-3 items-start">
                <MapPin className="w-5 h-5 text-burgundy shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-xs text-charcoal">{address.street}</p>
                  <p className="text-[11px] text-clay">{address.suite}, {address.city}</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <Clock className="w-5 h-5 text-burgundy shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-xs text-charcoal">Operational Schedules</p>
                  <p className="text-[11px] text-clay">{address.hours}</p>
                  <p className="text-[11px] text-clay">{address.hoursClosed}</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <Phone className="w-5 h-5 text-burgundy shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-xs text-charcoal font-sans">Phone Number</p>
                  <p className="text-[11px] text-clay">{address.phone} (Main Kitchen)</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <Mail className="w-5 h-5 text-burgundy shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-xs text-charcoal font-sans">Mail Hub</p>
                  <p className="text-[11px] text-clay">{address.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Map box */}
          <div className="bg-[#FAF3EE] rounded-3xl overflow-hidden border border-putty aspect-[16/10] relative shadow-sm group">
            <iframe
              title="Zoe's Bake My Dream Location Map"
              width="100%"
              height="100%"
              style={{ border: 0, filter: "contrast(1.05)" }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src="https://maps.google.com/maps?q=Tranca,%20Bay,%20Laguna&t=&z=15&ie=UTF8&iwloc=&output=embed"
              className="w-full h-full min-h-[220px]"
            ></iframe>
            
            {/* Elegant overlay action button to launch directly in Google Maps */}
            <div className="absolute top-4 right-4 z-10">
              <a 
                href="https://www.google.com/maps/search/?api=1&query=Brgy.+Tranca%2C+Bay%2C+Laguna"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => triggerNotification("Opening route directions to Brgy. Tranca, Bay, Laguna on Google Maps...")}
                className="px-4 py-2.5 bg-burgundy hover:bg-burgundy/95 text-[#FAF3EE] transition-all duration-250 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.03] active:scale-95 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-white shrink-0 animate-bounce" />
                Launch Direct to Google Map
              </a>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
