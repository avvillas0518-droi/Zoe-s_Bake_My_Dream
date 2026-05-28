import React, { useState, useEffect } from "react";
import { Mail, RefreshCw, MessageSquare, Inbox, Calendar, Shield, Eye, Image } from "lucide-react";
import { Inquiry } from "../types";

interface AdminInquiriesViewProps {
  triggerNotification: (message: string, type?: "success" | "error" | "info") => void;
  inquiries?: Inquiry[];
  onMarkAsRead?: (id: string) => void;
  onRefresh?: () => void;
}

export default function AdminInquiriesView({ 
  triggerNotification,
  inquiries: propInquiries,
  onMarkAsRead,
  onRefresh
}: AdminInquiriesViewProps) {
  const [localInquiries, setLocalInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fallback of local states if not passed in via props
  const displayInquiries = propInquiries || localInquiries;

  const fetchInquiries = () => {
    setIsLoading(true);
    if (onRefresh) {
      onRefresh();
      // Give a small transition simulation delay for the spinning loader
      setTimeout(() => {
        setIsLoading(false);
      }, 605);
      return;
    }

    fetch("/api/inquiries")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load inquiries.");
        }
        return res.json();
      })
      .then((data) => {
        setLocalInquiries(data);
        triggerNotification("Inquiries successfully updated!", "success");
      })
      .catch((err) => {
        console.error("Error loading inquiries:", err);
        triggerNotification("Could not retrieve inquiries. Please retry.", "error");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Run on mount only if local state retrieval is active
  useEffect(() => {
    if (!propInquiries) {
      fetchInquiries();
    }
  }, [propInquiries]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/inquiries/${id}/read`, {
        method: "PUT"
      });
      if (res.ok) {
        if (onMarkAsRead) {
          onMarkAsRead(id);
        } else {
          setLocalInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, read: true } : inq));
        }
        triggerNotification("Inquiry marked as opened.", "success");
      }
    } catch (err) {
      console.error("Error marking inquiry as read:", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-alabaster">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-putty pb-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-burgundy/10 border border-burgundy/20 text-burgundy text-[10px] font-bold uppercase tracking-wider font-sans">
            <Shield className="w-3.5 h-3.5" /> Gourmet Response HQ
          </div>
          <h1 className="font-serif text-3xl font-extrabold text-charcoal">Customer Inquiries Hub</h1>
          <p className="text-xs text-clay font-sans">
            Oversee, read, and reply to direct notes and bespoke messages submitted through the contact desk.
          </p>
        </div>

        {/* Manual Refresh Option */}
        <button
          id="refresh-inquiries-btn"
          onClick={fetchInquiries}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-3 bg-burgundy hover:bg-burgundy/90 disabled:bg-burgundy/40 text-white rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer transition shadow-sm select-none"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "Updating list..." : "Refresh List"}
        </button>
      </div>

      {/* Main List */}
      {isLoading && displayInquiries.length === 0 ? (
        <div className="flex flex-col justify-center items-center py-24 space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-burgundy"></div>
          <p className="text-xs text-clay font-sans italic">Kneading inquiry logs...</p>
        </div>
      ) : displayInquiries.length === 0 ? (
        <div id="no-inquiries-card" className="bg-white rounded-2xl border border-putty py-24 px-6 text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 bg-[#FFF8F0] border border-[#E8DCCF] text-[#8B5E3C] rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Inbox className="w-7 h-7" />
          </div>
          <p className="text-sm text-clay font-semibold font-serif">Inbox is completely clear!</p>
          <p className="text-xs text-clay leading-relaxed max-w-sm mx-auto">
            When patrons send inquiries through the public contact form, they will display at this desk instantly. Use the button in the top right to retrieve newer notes.
          </p>
        </div>
      ) : (
        <div id="inquiries-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayInquiries.map((inq) => {
            // Directly targets Gmail compose window
            const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
              inq.email
            )}&su=${encodeURIComponent("Regarding your Zoe's Bake My Dream inquiry")}`;

            return (
              <div
                key={inq.id}
                id={`inquiry-box-${inq.id}`}
                className={`rounded-3xl border p-6.5 shadow-sm flex flex-col justify-between space-y-5 hover:shadow-md transition duration-205 ${
                  inq.read 
                    ? "bg-white border-putty" 
                    : "bg-[#FFFDF9] border-[#8B5E3C]/40 ring-1 ring-[#8B5E3C]/10"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-2.5 items-center">
                      <div className="relative w-9 h-9 bg-cream/60 border border-putty/30 rounded-full flex items-center justify-center text-burgundy font-bold text-sm">
                        {inq.name ? inq.name.charAt(0).toUpperCase() : "?"}
                        {!inq.read && (
                          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-white animate-pulse" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-serif font-black text-charcoal text-base leading-tight flex items-center gap-2">
                          {inq.name}
                          {!inq.read && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 border border-amber-250 text-amber-800 text-[8px] font-bold font-sans uppercase tracking-wider">
                              Unopened
                            </span>
                          )}
                        </h4>
                        <span className="text-[11px] text-clay font-mono hover:underline break-all block select-all mt-0.5">
                          {inq.email}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 text-clay hover:text-burgundy bg-cream/30 border border-[#E8DCCF]/45 px-2.5 py-1 rounded-full text-[10px] font-bold font-sans">
                      <Calendar className="w-3 h-3 text-burgundy" /> {inq.date}
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute top-1 left-2 select-none text-cream/40 text-4xl font-serif">“</div>
                    <p className="text-xs text-zinc-700 leading-relaxed bg-[#FFF8F0]/30 p-4 rounded-2xl border border-cream/50 italic pl-6 relative">
                      {inq.message}
                    </p>
                  </div>

                  {inq.inspirationImage && (
                    <div className="space-y-1 mt-2">
                      <span className="text-[10px] font-bold text-clay uppercase tracking-wider flex items-center gap-1">
                        <Image className="w-3.5 h-3.5 text-[#8B5E3C]" /> Inspiration reference visual
                      </span>
                      <div className="rounded-2xl overflow-hidden border border-putty bg-[#FAF6F0] max-h-[220px] flex items-center justify-center p-2">
                        <img 
                          src={inq.inspirationImage} 
                          alt="Customer design inspiration" 
                          className="max-h-[200px] object-contain rounded-lg"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-dashed border-cream flex justify-between items-center text-[10px] font-sans">
                  <span className="text-zinc-450 font-bold select-none uppercase tracking-widest">
                    ID: {inq.id}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {!inq.read && (
                      <button
                        onClick={() => handleMarkAsRead(inq.id)}
                        className="flex items-center gap-1 px-3.5 py-2 bg-[#FAF6F0] hover:bg-cream border border-[#E8DCCF] text-[#8B5E3C] hover:text-[#3D2612] rounded-xl font-bold uppercase tracking-wider transition text-center cursor-pointer text-[10px]"
                      >
                        <Eye className="w-3.5 h-3.5" /> Open Note
                      </button>
                    )}
                    <a
                      id={`reply-btn-${inq.id}`}
                      href={gmailComposeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        if (!inq.read) {
                          handleMarkAsRead(inq.id);
                        }
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-burgundy/10 hover:bg-burgundy text-burgundy hover:text-white border border-burgundy/15 hover:border-transparent rounded-xl font-bold uppercase tracking-wider transition text-center cursor-pointer text-[10px] shadow-xs"
                    >
                      <Mail className="w-3.5 h-3.5" /> Reply via Gmail
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
