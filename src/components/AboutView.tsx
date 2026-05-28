import React from "react";
import { Target, Compass, TrendingUp, Sparkles } from "lucide-react";
import { BakeryStory, AdminProfile } from "../types";

interface AboutViewProps {
  story: BakeryStory;
  profile: AdminProfile;
}

export default function AboutView({ story, profile }: AboutViewProps) {
  return (
    <div className="py-12 bg-alabaster">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        
        {/* Story Intro */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-burgundy">{story.tagline}</span>
            <h1 className="font-serif text-4xl font-extrabold text-charcoal leading-tight">{story.title}</h1>
            {story.mainText && (
              <p className="text-clay text-sm sm:text-base leading-relaxed font-sans">
                {story.mainText}
              </p>
            )}
            {story.secondaryText && (
              <p className="text-clay text-sm sm:text-base leading-relaxed font-sans mt-3">
                {story.secondaryText}
              </p>
            )}
            <div className="pt-4 flex items-center gap-6">
              <div>
                <p className="font-serif font-black text-2xl text-burgundy">100%</p>
                <p className="text-[10px] text-clay font-bold uppercase tracking-widest mt-1">Organic Flour</p>
              </div>
              <div className="h-8 w-px bg-putty"></div>
              <div>
                <p className="font-serif font-black text-2xl text-burgundy">10+</p>
                <p className="text-[10px] text-clay font-bold uppercase tracking-widest mt-1">Pastries Menu</p>
              </div>
              <div className="h-8 w-px bg-putty"></div>
              <div>
                <p className="font-serif font-black text-2xl text-burgundy">1k+</p>
                <p className="text-[10px] text-clay font-bold uppercase tracking-widest mt-1">Happy Customers</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <img 
              src="https://scontent-mnl3-3.xx.fbcdn.net/v/t39.30808-6/682698973_1278789731117678_2502947156397186744_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=833d8c&_nc_eui2=AeGYsf5QSjzDGl3aeUB73YfMITURJvq6xfMhNREm-rrF89OtTd6M2zNh9EIxj5N4uQkwTWRtwBpJMi0Rp2yCU6iA&_nc_ohc=HTNb5jUf6ykQ7kNvwHiz2_J&_nc_oc=AdrW3Em7IBKy8bd1UuCtXgznTAYGhwWQ6k5pcJT0CoQGrMzh-EKsLWNvVaoY8iw5FSA&_nc_zt=23&_nc_ht=scontent-mnl3-3.xx&_nc_gid=vPE8TL6DZEjcoV5HE_BOWg&_nc_ss=7a2a8&oh=00_Af5AH3xDPDOo13Vt4VRfCprMUe76Eif9MTCxl3GCdf8wUQ&oe=6A1C9E37 " 
              alt="Freshly baked chocolate crinkle cookies dusted in snowy powdered sugar" 
              className="rounded-3xl shadow-xl w-full h-[360px] sm:h-[420px] object-cover border border-putty"
            />
            <div className="absolute -bottom-6 right-6 bg-white border border-putty p-5 rounded-2xl shadow-md max-w-xs">
              <p className="font-serif font-bold text-charcoal text-sm mb-1">{story.ecoTitle}</p>
              <p className="text-[11px] text-clay leading-relaxed">{story.ecoText}</p>
            </div>
          </div>
        </div>

        {/* Vision & Mission Split Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Vision card */}
          <div className="bg-white rounded-3xl p-8 border border-putty shadow-sm space-y-4 hover:border-burgundy/30 transition-all">
            <div className="p-3 bg-burgundy/10 text-burgundy rounded-2xl w-fit">
              <Compass className="w-8 h-8" />
            </div>
            <h3 className="font-serif font-black text-2xl text-charcoal">Our Vision</h3>
            <p className="text-sm text-clay leading-relaxed font-sans">
              To become a trusted home based bakery known for delicious, affordable, and high quality baked goods that bring joy to every home.
            </p>
          </div>

          {/* Mission card */}
          <div className="bg-white rounded-3xl p-8 border border-putty shadow-sm space-y-4 hover:border-burgundy/30 transition-all">
            <div className="p-3 bg-burgundy/10 text-burgundy rounded-2xl w-fit">
              <Target className="w-8 h-8" />
            </div>
            <h3 className="font-serif font-black text-2xl text-charcoal">Our Mission</h3>
            <p className="text-sm text-clay leading-relaxed font-sans">
              To turn a home based baking dream into a meaningful business by offering quality products, building strong customer relationships, and inspiring others to pursue their passion. Continuously improve baking skills, expand our products offerings, and serve the community with dedication and integrity.
            </p>
          </div>
        </div>

        {/* Core Goal & Opportunities */}
        <div className="bg-cream/20 rounded-3xl p-8 sm:p-10 border border-putty grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-burgundy">
              <TrendingUp className="w-5 h-5 font-bold" />
              <span className="text-xs font-bold uppercase tracking-wider font-sans">The Ultimate Growth Objective</span>
            </div>
            <h3 className="font-serif text-2xl font-bold text-charcoal">Our Core Goal</h3>
            <p className="text-xs sm:text-sm text-clay leading-relaxed font-sans">
              To grow the business and build a larger production space dedicated to making premium chocolate, matcha, and red velvet crinkle products.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-burgundy">
              <Sparkles className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider font-sans">Strategic Milestones</span>
            </div>
            <h3 className="font-serif text-2xl font-bold text-charcoal">Market Opportunities</h3>
            <p className="text-xs sm:text-sm text-clay leading-relaxed font-sans">
              We will maximize online, offline channels, and local event bazaars to expand our reach, increase sales, and attract more customers. These platforms help promote our unique, less-sweet recipes and support continuous, scalable growth.
            </p>
          </div>
        </div>

        {/* Business Model Channels (Plans A, B, C) */}
        <div className="space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold text-burgundy uppercase tracking-widest">Avenues of Commerce</span>
            <h2 className="font-serif text-3xl font-bold text-charcoal">Our Strategic Business Model</h2>
            <p className="text-xs text-clay font-sans">How we operationalize distribution to reach more homes and support local communities.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Plan A Channel */}
            <div className="bg-white rounded-3xl p-6 border border-putty shadow-xs space-y-4 hover:shadow-md transition duration-200">
              <div className="text-xs font-black uppercase text-burgundy tracking-widest flex items-center justify-between">
                <span>Plan A</span>
                <span className="bg-burgundy/10 text-burgundy px-2.5 py-0.5 rounded-full text-[10px]">Active</span>
              </div>
              <h3 className="font-serif font-extrabold text-charcoal text-base">Partnership Network (Resellers)</h3>
              <p className="text-xs text-clay leading-relaxed font-sans mt-2">
                We will market our products through resellers to help grow the business and increase sales. By finding more resellers, we can reach a wider market and attract more customers. The more resellers we have, the broader our sales network becomes, allowing more clients to discover and recognize our brand.
              </p>
            </div>

            {/* Plan B Channel */}
            <div className="bg-white rounded-3xl p-6 border border-putty shadow-xs space-y-4 hover:shadow-md transition duration-200">
              <div className="text-xs font-black uppercase text-burgundy tracking-widest flex items-center justify-between">
                <span>Plan B</span>
                <span className="bg-burgundy/10 text-burgundy px-2.5 py-0.5 rounded-full text-[10px]">Active</span>
              </div>
              <h3 className="font-serif font-extrabold text-charcoal text-base">Strategic Event Bazaars</h3>
              <p className="text-xs text-clay leading-relaxed font-sans mt-2">
                We will also explore marketing through bazaars by joining and starting in local events to introduce our crinkle products. We will create effective marketing strategies to make our booth eye-catching and attract more customers.
              </p>
            </div>

            {/* Plan C Channel */}
            <div className="bg-white rounded-3xl p-6 border border-putty shadow-xs space-y-4 hover:shadow-md transition duration-200">
              <div className="text-xs font-black uppercase text-burgundy tracking-widest flex items-center justify-between">
                <span>Plan C</span>
                <span className="bg-burgundy/10 text-burgundy px-2.5 py-0.5 rounded-full text-[10px]">Active</span>
              </div>
              <h3 className="font-serif font-extrabold text-charcoal text-base">Digital Commerce Integrations</h3>
              <p className="text-xs text-clay leading-relaxed font-sans mt-2">
                We will also use platforms like Shopee and TikTok to market our products. Through Shopee, we can reach more customers and make ordering more convenient. On TikTok, our crinkles attract viewers and turn them into potential loyal buyers.
              </p>
            </div>
          </div>
        </div>

        {/* Sole Founder & Manager Bio */}
        <div className="space-y-12">
          <div className="text-center max-w-lg mx-auto">
            <span className="text-xs font-bold text-burgundy uppercase tracking-widest">Sole Visionary</span>
            <h2 className="font-serif text-3xl font-extrabold text-charcoal mt-2">Founder & Manager</h2>
            <p className="text-xs text-clay mt-2 font-sans">Personally overseeing all operations, recipe developments, and daily baking schedules.</p>
          </div>

          <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 border border-putty flex flex-col md:flex-row items-center gap-8 shadow-sm">
            <img 
              src={profile.avatar} 
              alt={profile.name} 
              className="w-40 h-40 rounded-3xl object-cover border border-putty shadow-md shrink-0"
            />
            <div className="space-y-4 text-center md:text-left font-sans">
              <div>
                <h3 className="font-serif font-bold text-charcoal text-2xl">{profile.name}</h3>
                <p className="text-xs text-burgundy font-semibold tracking-wider uppercase mt-1">Master Baker</p>
              </div>
              <p className="text-xs text-clay leading-relaxed font-light">
                {profile.bio}
              </p>
              <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-4 text-[10px] font-bold uppercase tracking-wider text-clay">
                <span className="bg-cream/40 px-3 py-1.5 rounded-lg border border-putty text-burgundy">🥖 100% Owner Operated</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
