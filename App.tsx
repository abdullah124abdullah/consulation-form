import React, { useState, useEffect, useCallback } from 'react';
import { AppStatus, PrefillData, SubmissionPayload } from './types';
import { ENDPOINTS } from './constants';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.LOADING);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [prefillData, setPrefillData] = useState<PrefillData | null>(null);
  
  // Form State
  const [company, setCompany] = useState('');
  const [profession, setProfession] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async (targetId?: string) => {
    setStatus(AppStatus.LOADING);
    setErrorMessage('');
    
    const params = new URLSearchParams(window.location.search);
    const id = targetId || params.get('id');

    if (!id) {
      setStatus(AppStatus.MISSING_ID);
      return;
    }

    try {
      const response = await fetch(`${ENDPOINTS.GET_DATA}?id=${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`ID "${id}" not found. Please check your personalized link.`);
        }
        throw new Error(`Server returned error ${response.status}: ${response.statusText}`);
      }

      const data: PrefillData = await response.json();
      
      if (data.Submitted === 'Yes') {
        setStatus(AppStatus.ALREADY_SUBMITTED);
      } else {
        setPrefillData(data);
        setStatus(AppStatus.IDLE);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to connect to the server. Please check your internet connection.');
      setStatus(AppStatus.ERROR);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prefillData) return;

    setIsSubmitting(true);
    setErrorMessage('');

    const currentId = prefillData.Link || new URLSearchParams(window.location.search).get('id') || '';

    const payload: SubmissionPayload = {
      id: currentId,
      Company: company.trim(),
      Profession: profession.trim(),
      Description: description.trim(),
    };

    try {
      const response = await fetch(ENDPOINTS.SUBMIT_FORM, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Submission failed. The server might be temporarily busy.');
      }

      setStatus(AppStatus.SUCCESS);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not submit your form. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleTestLink = () => {
    const testId = 'rsjk3i';
    // Update URL without reloading to avoid platform 404s
    const url = new URL(window.location.href);
    url.searchParams.set('id', testId);
    window.history.pushState({}, '', url.toString());
    
    // Manually trigger the load with the test ID
    loadData(testId);
  };

  const renderContent = () => {
    switch (status) {
      case AppStatus.LOADING:
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 font-medium">Retrieving your profile...</p>
          </div>
        );

      case AppStatus.MISSING_ID:
        return (
          <div className="bg-amber-50 border border-amber-200 p-8 rounded-2xl text-center">
            <div className="text-5xl mb-4">🔑</div>
            <h2 className="text-xl font-bold text-amber-800 mb-2">Access ID Required</h2>
            <p className="text-amber-700 mb-8 leading-relaxed">
              This is a private form. To load your details, please click the unique link provided in your invitation email.
            </p>
            <div className="pt-6 border-t border-amber-200/50">
              <p className="text-xs text-amber-600 mb-4 font-bold uppercase tracking-widest">Sandbox Testing Only</p>
              <button 
                onClick={handleTestLink}
                className="px-8 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-all font-bold shadow-lg hover:shadow-amber-200 active:scale-95"
              >
                Launch with Sample ID (rsjk3i)
              </button>
            </div>
          </div>
        );

      case AppStatus.ERROR:
        return (
          <div className="bg-red-50 border border-red-200 p-8 rounded-2xl text-center">
            <div className="text-5xl mb-4">🚫</div>
            <h2 className="text-xl font-bold text-red-700 mb-2">Connection Error</h2>
            <p className="text-red-600 mb-8 leading-relaxed font-medium">{errorMessage}</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button 
                onClick={() => loadData()}
                className="px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-bold shadow-md"
              >
                Retry Connection
              </button>
              <button 
                onClick={handleTestLink}
                className="px-6 py-2.5 bg-white text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition font-bold"
              >
                Switch to Sample ID
              </button>
            </div>
          </div>
        );

      case AppStatus.ALREADY_SUBMITTED:
        return (
          <div className="bg-blue-50 border border-blue-200 p-12 rounded-2xl text-center shadow-inner">
            <div className="text-6xl mb-6">📝</div>
            <h2 className="text-2xl font-bold text-blue-800 mb-3">Already Completed</h2>
            <p className="text-blue-700 text-lg opacity-80 leading-relaxed">
              Records indicate you have already submitted this consultation form. We look forward to our session!
            </p>
          </div>
        );

      case AppStatus.SUCCESS:
        return (
          <div className="bg-emerald-50 border border-emerald-200 p-12 rounded-2xl text-center shadow-lg animate-in fade-in zoom-in duration-500">
            <div className="text-7xl mb-6">🚀</div>
            <h2 className="text-2xl font-bold text-emerald-800 mb-3">Submission Success</h2>
            <p className="text-emerald-700 text-lg font-medium opacity-90 leading-relaxed">
              Great! Your details have been transmitted to our strategy team. We will review them shortly.
            </p>
          </div>
        );

      case AppStatus.IDLE:
        return (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Verified Contact</h3>
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded-full uppercase border border-green-100">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  Active Session
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2 ml-1 transition-colors group-focus-within:text-blue-500">Full Name</label>
                  <input
                    type="text"
                    readOnly
                    value={prefillData?.Name || ''}
                    className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-500 cursor-not-allowed outline-none font-semibold transition-all hover:bg-gray-100"
                  />
                </div>
                <div className="group">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2 ml-1 transition-colors group-focus-within:text-blue-500">Primary Email</label>
                  <input
                    type="email"
                    readOnly
                    value={prefillData?.Email || ''}
                    className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-500 cursor-not-allowed outline-none font-semibold transition-all hover:bg-gray-100"
                  />
                </div>
                <div className="group md:col-span-2">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2 ml-1 transition-colors group-focus-within:text-blue-500">Transaction Detail</label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={`Pre-paid Consultation: $${prefillData?.Payment || 0}.00`}
                      className="w-full px-5 py-3.5 bg-blue-50/30 border border-blue-100 rounded-2xl text-blue-700/70 cursor-not-allowed outline-none font-bold italic"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Consultation Input</h3>
                <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded">Action Required</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="company" className="block text-xs font-black text-gray-700 uppercase mb-2.5 ml-1">
                    Organization Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="company"
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Acme Innovations"
                    className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none placeholder:text-gray-300 shadow-sm font-medium"
                  />
                </div>
                <div>
                  <label htmlFor="profession" className="block text-xs font-black text-gray-700 uppercase mb-2.5 ml-1">
                    Your Title/Role <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="profession"
                    type="text"
                    required
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    placeholder="e.g. Project Lead"
                    className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none placeholder:text-gray-300 shadow-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-xs font-black text-gray-700 uppercase mb-2.5 ml-1">
                  Scope of Work & Objectives <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us about the challenges you're facing and what a successful consultation looks like to you..."
                  className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none resize-none placeholder:text-gray-300 shadow-sm font-medium min-h-[140px]"
                ></textarea>
              </div>
            </div>

            {errorMessage && (
              <div className="p-4 bg-red-50 text-red-700 text-sm rounded-2xl border border-red-100 flex items-center gap-3 animate-in slide-in-from-top-2">
                <span className="text-xl">⚠️</span>
                <span className="font-semibold">{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`group relative w-full py-5 px-6 text-white font-black rounded-2xl shadow-2xl transition-all duration-300 flex items-center justify-center text-xl tracking-tight overflow-hidden ${
                isSubmitting 
                  ? 'bg-blue-400 cursor-not-allowed scale-[0.98]' 
                  : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-1 active:scale-[0.97]'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-7 w-7 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Confirm Consultation Details'
              )}
            </button>
          </form>
        );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 md:py-24 bg-slate-50 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

      <div className="w-full max-w-2xl bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[2.5rem] overflow-hidden border border-white/50 relative z-10">
        <div className="bg-blue-600 px-8 py-12 md:px-14 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white"></path>
            </svg>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter relative z-10 leading-tight">Project Intake</h1>
          <p className="mt-4 text-blue-100 opacity-90 font-bold text-lg md:text-xl relative z-10 max-w-md mx-auto">Help us prepare for a high-impact strategy session.</p>
        </div>
        
        <div className="p-8 md:p-14">
          {renderContent()}
        </div>

        <div className="bg-gray-50/50 px-8 py-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">TLS 1.3 Encryption Active</p>
          </div>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">© 2024 Abdullah Ahmed Systems</p>
        </div>
      </div>
    </div>
  );
};

export default App;