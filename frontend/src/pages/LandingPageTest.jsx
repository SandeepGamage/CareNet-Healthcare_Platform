import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { ArrowRight } from 'lucide-react';
import bg1 from '../assets/bg1.jpg';

export default function LandingPageTest() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-emerald-900 text-slate-900">
      {/* Global navbar (shared) */}
      <Navbar />

      {/* Hero: centered white card on dark green */}
      <section className="pt-0 pb-20">
        <div className="w-full">
          <div className="bg-white overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch">
            {/* Left: copy */}
            <div className="p-12 lg:p-20 flex flex-col justify-center">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
                Built for Modern
                <br />
                Living Solutions
              </h1>

              <p className="text-lg text-slate-600 max-w-xl mb-8">
                Discover modern property solutions designed to support confident decisions,
                simplify the booking process, and create lasting value for every step forward.
              </p>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/register')}
                  className="bg-slate-900 text-white px-6 py-3 rounded-md font-semibold hover:opacity-95 transition"
                >
                  Get Started
                </button>

                <button
                  onClick={() => navigate('/book-appointment')}
                  className="flex items-center gap-2 text-slate-700 px-4 py-3 rounded-md border border-slate-200 hover:bg-slate-50 transition"
                >
                  Learn More <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right: large image (visible md+) */}
            <div className="hidden md:block min-h-[360px]">
              <img
                src={bg1}
                alt="Modern building"
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://images.unsplash.com/photo-1505691723518-36a0e3d6a7d0?w=1600&h=1200&fit=crop&auto=format&ixlib=rb-4.0.3'; }}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
