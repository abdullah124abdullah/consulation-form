
import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchInitialData = async () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');

      if (!id) {
        setStatus(AppStatus.MISSING_ID);
        return;
      }

      try {
        const response = await fetch(`${ENDPOINTS.GET_DATA}?id=${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user data. This ID might not exist in the system.');
        }

        const data: PrefillData = await response.json();
        
        if (data.Submitted === 'Yes') {
          setStatus(AppStatus.ALREADY_SUBMITTED);
        } else {
          setPrefillData(data);
          setStatus(AppStatus.IDLE);
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
        setStatus(AppStatus.ERROR);
      }
    };

    fetchInitialData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prefillData) return;

    setIsSubmitting(true);
    setErrorMessage('');

    // Dynamically identify the id from the Link field or URL param as fallback
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
        throw new Error('Could not submit the form. Please try again later.');
      }

      setStatus(AppStatus.SUCCESS);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Submission failed. Please check your connection.');
      setIsSubmitting(false);
    }
  };

  const handleTestLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('id', 'rsjk3i');
    window.location.href = url.toString();
  };

  const renderContent = () => {
    switch (status) {
      case AppStatus.LOADING:
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 font-medium">Fetching consultation details...</p>
          </div>
        );

      case AppStatus.MISSING_ID:
        return (
          <div className="bg-amber-50 border border-amber-200 p-8 rounded-xl text-center">
            <div className="text-4xl mb-4">🔗</div>
            <h2 className="text-xl font-bold text-amber-800 mb-2">Invalid or Missing Link</h2>
            <p className="text-amber-700 mb-6">
              This form requires a personalized ID to load your details. Please use the full link sent to your email.
            </p>
            <div className="pt-4 border-t border-amber-200">
              <p className="text-sm text-amber-600 mb-4 font-medium italic">Developer / Testing Mode:</p>
              <button 
                onClick={handleTestLink}
                className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-medium shadow-sm"
              >
                Try with Sample ID (rsjk3i)
              </button>
            </div>
          </div>
        );

      case AppStatus.ERROR:
        return (
          <div className="bg-red-50 border border-red-200 p-8 rounded-xl text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-red-700 mb-2">Something went wrong</h2>
            <p className="text-red-600 mb-6">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Refresh Page
            </button>
          </div>
        );

      case AppStatus.ALREADY_SUBMITTED:
        return (
          <div className="bg-blue-50 border border-blue-200 p-10 rounded-xl text-center">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-blue-800 mb-2">Form Already Submitted</h2>
            <p className="text-blue-700 text-lg">You have already completed this consultation form. No further action is needed.</p>
          </div>
        );

      case AppStatus.SUCCESS:
        return (
          <div className="bg-green-50 border border-green-200 p-10 rounded-xl text-center shadow-sm">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Thank You!</h2>
            <p className="text-green-700 text-lg font-medium">Your consultation form has been submitted successfully.</p>
          </div>
        );

      case AppStatus.IDLE:
        return (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Personal Information</h3>
                <span className="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold rounded uppercase">Verified</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 ml-1">Full Name</label>
                  <input
                    type="text"
                    readOnly
                    value={prefillData?.Name || ''}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 cursor-not-allowed outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 ml-1">Email Address</label>
                  <input
                    type="email"
                    readOnly
                    value={prefillData?.Email || ''}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 cursor-not-allowed outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 ml-1">Payment Status</label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={`Amount: $${prefillData?.Payment || 0}`}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 cursor-not-allowed outline-none font-medium"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                       <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Consultation Details</h3>
                <span className="text-[10px] font-bold text-blue-600 uppercase">Required Fields</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="company" className="block text-xs font-bold text-gray-700 uppercase mb-1.5 ml-1">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="company"
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none placeholder:text-gray-300 shadow-sm"
                  />
                </div>
                <div>
                  <label htmlFor="profession" className="block text-xs font-bold text-gray-700 uppercase mb-1.5 ml-1">
                    Your Profession <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="profession"
                    type="text"
                    required
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    placeholder="e.g. Lead Designer"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none placeholder:text-gray-300 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-xs font-bold text-gray-700 uppercase mb-1.5 ml-1">
                  Project Goals & Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us about what you want to achieve in this consultation..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none resize-none placeholder:text-gray-300 shadow-sm"
                ></textarea>
              </div>
            </div>

            {errorMessage && (
              <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 flex items-center gap-3 animate-pulse">
                <span>⚠️</span>
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 px-6 text-white font-bold rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center text-lg ${
                isSubmitting 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-200 active:scale-[0.99]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Submit Application'
              )}
            </button>
          </form>
        );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-10 md:py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="w-full max-w-2xl bg-white shadow-2xl rounded-3xl overflow-hidden border border-white">
        <div className="bg-blue-600 px-6 py-10 md:px-12 text-white text-center relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full"></div>
            <div className="absolute top-20 -left-10 w-24 h-24 bg-white rounded-full"></div>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight relative z-10">Consultation Form</h1>
          <p className="mt-3 text-blue-100 opacity-90 font-medium relative z-10">Help us prepare for our upcoming strategy session.</p>
        </div>
        
        <div className="p-8 md:p-12">
          {renderContent()}
        </div>

        <div className="bg-gray-50 px-8 py-5 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Secure Transmission Active</p>
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">© 2024 Abdullah Ahmed</p>
        </div>
      </div>
    </div>
  );
};

export default App;
