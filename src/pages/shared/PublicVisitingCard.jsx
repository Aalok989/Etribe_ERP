import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiAlertCircle, FiRefreshCw, FiArrowLeft } from 'react-icons/fi';
import VisitingCard from '../../components/user/VisitingCard';
import shareService from '../../services/shareService';

/**
 * Professional Public Visiting Card Share Page
 * 
 * This component handles displaying shared visiting cards with:
 * - Clean, professional UI
 * - Error handling and loading states
 * - Download functionality
 * - Re-sharing capabilities
 * - Mobile-responsive design
 * - SEO-friendly structure
 */

const PublicVisitingCard = () => {
  const { shareId } = useParams();
  const navigate = useNavigate();

  // State management
  const [shareData, setShareData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Validate share ID format
  const isValidShareId = useMemo(() => {
    return shareService.isValidShareId(shareId);
  }, [shareId]);

  // Fetch share data
  useEffect(() => {
    const fetchShareData = async () => {
      if (!isValidShareId) {
        setError({
          type: 'invalid_id',
          title: 'Invalid Share Link',
          message: 'The visiting card link you\'re trying to access is not valid.',
          suggestion: 'Please check the link and try again.'
        });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const result = await shareService.getShare(shareId);

        if (result.success) {
          if (result.isExpired) {
            setError({
              type: 'expired',
              title: 'Link Expired',
              message: 'This visiting card link has expired and is no longer accessible.',
              suggestion: 'Please request a new link from the card owner.'
            });
          } else {
            setShareData(result);
          }
        } else {
          setError({
            type: result.notFound ? 'not_found' : 'fetch_error',
            title: result.notFound ? 'Card Not Found' : 'Unable to Load Card',
            message: result.error || 'The visiting card could not be loaded.',
            suggestion: result.notFound 
              ? 'The link may have been removed or is incorrect.'
              : 'Please try refreshing the page or check your internet connection.'
          });
        }
      } catch (err) {
        console.error('Error fetching share data:', err);
        setError({
          type: 'network_error',
          title: 'Connection Error',
          message: 'Unable to connect to the server.',
          suggestion: 'Please check your internet connection and try again.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchShareData();
  }, [shareId, isValidShareId]);

  // Handle retry
  const handleRetry = () => {
    window.location.reload();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
            <FiRefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Loading Visiting Card</h2>
          <p className="text-slate-600">Please wait while we fetch the card details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-6">
            <FiAlertCircle className="w-8 h-8 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900 mb-3">{error.title}</h1>
          <p className="text-slate-600 mb-2">{error.message}</p>
          {error.suggestion && (
            <p className="text-sm text-slate-500 mb-6">{error.suggestion}</p>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <FiRefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center justify-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <FiArrowLeft className="w-4 h-4 mr-2" />
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state - render only the visiting card
  const { templateId, cardData } = shareData;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4">
      <div id="public-visiting-card">
        <VisitingCard
          displayMode="inline"
          allowSelection={false}
          showSaveButton={false}
          selectedTemplate={templateId}
          profileData={cardData}
          isOpen={true}
        />
      </div>
    </div>
  );
};

export default PublicVisitingCard;
