import React from 'react';
import { UserProfile, RiskLevel } from '../types';
import { TrafficLight } from './TrafficLight';

interface DashboardProps {
  profile: UserProfile;
  onClose: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ profile, onClose }) => {
  return (
    <div className="w-full h-full bg-gray-50 min-h-screen font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-lg">E</div>
          <h1 className="text-xl font-bold text-gray-800">Echo Dashboard</h1>
        </div>
        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            Close Dashboard
        </button>
      </header>

      <main className="max-w-5xl mx-auto p-8 space-y-8">
        
        {/* Intro Section */}
        <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Digital Identity</h2>
            <p className="text-gray-500 mt-1">This is how advertisers and trackers see you based on your recent browsing history.</p>
        </div>

        {/* Persona Card (The "Tech Savvy Foodie") */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8 text-white shadow-xl flex items-center gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10 bg-white/20 p-4 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
            </div>

            <div className="relative z-10">
                <div className="text-indigo-200 text-sm font-semibold tracking-wider uppercase mb-2">Primary Persona</div>
                <h3 className="text-4xl font-bold mb-2">{profile.persona}</h3>
                <p className="text-indigo-100 max-w-lg">
                    You frequently visit technology news outlets and e-commerce stores for kitchen appliances. 
                    Algorithms likely classify you as a high-value target for consumer electronics and meal kit services.
                </p>
            </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Interests Box */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                 <div className="flex items-center gap-2 mb-4">
                    <span className="text-pink-500">❤️</span>
                    <h3 className="font-bold text-gray-800">Lifestyle & Interests</h3>
                </div>
                <p className="text-xs text-gray-500 mb-4">Inferred from content you read and videos you watch.</p>
                <div className="flex flex-wrap gap-2">
                    {profile.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-pink-50 text-pink-700 rounded-full text-sm font-medium">
                            {tag}
                        </span>
                    ))}
                    <span className="px-3 py-1 bg-gray-50 text-gray-400 rounded-full text-sm border border-dashed border-gray-300">
                        +2 more
                    </span>
                </div>
            </div>

            {/* Shopping Behavior */}
             <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                 <div className="flex items-center gap-2 mb-4">
                    <span className="text-blue-500">🛍️</span>
                    <h3 className="font-bold text-gray-800">Shopping Behavior</h3>
                </div>
                <p className="text-xs text-gray-500 mb-4">Derived from "Add to Cart" actions and wishlist usage.</p>
                 <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">Premium Electronics</span>
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">Home Appliances</span>
                </div>
            </div>
        </div>

        {/* Recent Activity List (WF5 - "Dashboard Listing") */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-800">Recent Activity</h3>
                <span className="text-xs text-gray-500">Trackers blocked today: <span className="font-bold text-gray-900">{profile.trackersBlockedToday}</span></span>
            </div>
            <div className="divide-y divide-gray-100">
                {[
                    { site: 'homechef-shop.com', status: RiskLevel.WARNING, trackers: 3, time: 'Just now' },
                    { site: 'dailynews.co.uk', status: RiskLevel.SAFE, trackers: 0, time: '2 hours ago' },
                    { site: 'socialnet.com', status: RiskLevel.CRITICAL, trackers: 12, time: '5 hours ago' },
                ].map((item, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                                {item.site[0].toUpperCase()}
                            </div>
                            <div>
                                <div className="font-medium text-gray-900">{item.site}</div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <TrafficLight level={item.status} size="sm" />
                                    {item.status === RiskLevel.SAFE ? 'Tracking Allowed' : `${item.trackers} Trackers Blocked`}
                                </div>
                            </div>
                        </div>
                        <div className="text-xs text-gray-400">{item.time}</div>
                    </div>
                ))}
            </div>
            <div className="bg-gray-50 p-3 text-center">
                <button className="text-indigo-600 text-sm font-medium hover:text-indigo-800">View Full History &rarr;</button>
            </div>
        </div>

      </main>
    </div>
  );
};