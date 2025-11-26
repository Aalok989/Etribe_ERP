import api from '../api/axiosConfig';
import { getAuthHeaders } from '../utils/apiHeaders';
import mockShareService from './mockShareService';

/**
 * Professional Visiting Card Share Service
 * 
 * This service handles creating, retrieving, and managing shareable visiting cards
 * with short URLs and database persistence for better reliability and performance.
 */

class ShareService {
  constructor() {
    this.baseUrl = '/api/share/visiting-card';
    // Use mock service in development or when backend is not available
    this.useMockService = import.meta.env.VITE_USE_MOCK_SHARE_SERVICE === 'true' || 
                         import.meta.env.DEV;
  }

  /**
   * Create a shareable visiting card
   * @param {Object} cardData - The visiting card data to share
   * @param {number} templateId - The template ID to use
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Share response with short URL
   */
  async createShare(cardData, templateId, options = {}) {
    // Use mock service in development
    if (this.useMockService) {
      return await mockShareService.createShare(cardData, templateId, options);
    }

    try {
      const payload = {
        templateId: templateId || 1,
        cardData: this.sanitizeCardData(cardData),
        expiresIn: options.expiresIn || '30d', // Default 30 days
        isPublic: options.isPublic !== false, // Default to public
        allowDownload: options.allowDownload !== false, // Default allow download
        metadata: {
          sharedAt: new Date().toISOString(),
          userAgent: navigator.userAgent,
          ...options.metadata
        }
      };

      const headers = getAuthHeaders();
      const response = await api.post(`${this.baseUrl}/create`, payload, { headers });

      if (response.data?.success) {
        return {
          success: true,
          shareId: response.data.shareId,
          shortUrl: response.data.shortUrl,
          fullUrl: response.data.fullUrl,
          expiresAt: response.data.expiresAt,
          qrCode: response.data.qrCode // Optional QR code for easy sharing
        };
      }

      throw new Error(response.data?.message || 'Failed to create share');
    } catch (error) {
      console.error('ShareService.createShare error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create share'
      };
    }
  }

  /**
   * Retrieve a shared visiting card
   * @param {string} shareId - The share ID
   * @returns {Promise<Object>} Card data and template info
   */
  async getShare(shareId) {
    // Use mock service in development
    if (this.useMockService) {
      return await mockShareService.getShare(shareId);
    }

    try {
      if (!shareId || typeof shareId !== 'string') {
        throw new Error('Invalid share ID');
      }

      const response = await api.get(`${this.baseUrl}/${shareId}`);

      if (response.data?.success) {
        return {
          success: true,
          templateId: response.data.templateId,
          cardData: response.data.cardData,
          metadata: response.data.metadata,
          isExpired: response.data.isExpired,
          allowDownload: response.data.allowDownload
        };
      }

      throw new Error(response.data?.message || 'Share not found');
    } catch (error) {
      console.error('ShareService.getShare error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to retrieve share',
        notFound: error.response?.status === 404
      };
    }
  }

  /**
   * Update share settings (only by creator)
   * @param {string} shareId - The share ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Update result
   */
  async updateShare(shareId, updates) {
    // Use mock service in development
    if (this.useMockService) {
      return await mockShareService.updateShare(shareId, updates);
    }

    try {
      const headers = getAuthHeaders();
      const response = await api.patch(`${this.baseUrl}/${shareId}`, updates, { headers });

      if (response.data?.success) {
        return {
          success: true,
          message: 'Share updated successfully'
        };
      }

      throw new Error(response.data?.message || 'Failed to update share');
    } catch (error) {
      console.error('ShareService.updateShare error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update share'
      };
    }
  }

  /**
   * Delete a share (only by creator)
   * @param {string} shareId - The share ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteShare(shareId) {
    // Use mock service in development
    if (this.useMockService) {
      return await mockShareService.deleteShare(shareId);
    }

    try {
      const headers = getAuthHeaders();
      const response = await api.delete(`${this.baseUrl}/${shareId}`, { headers });

      if (response.data?.success) {
        return {
          success: true,
          message: 'Share deleted successfully'
        };
      }

      throw new Error(response.data?.message || 'Failed to delete share');
    } catch (error) {
      console.error('ShareService.deleteShare error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to delete share'
      };
    }
  }

  /**
   * Get user's shares (with pagination)
   * @param {Object} options - Query options
   * @returns {Promise<Object>} List of user's shares
   */
  async getUserShares(options = {}) {
    // Use mock service in development
    if (this.useMockService) {
      return await mockShareService.getUserShares(options);
    }

    try {
      const headers = getAuthHeaders();
      const params = {
        page: options.page || 1,
        limit: options.limit || 10,
        sortBy: options.sortBy || 'createdAt',
        sortOrder: options.sortOrder || 'desc'
      };

      const response = await api.get(`${this.baseUrl}/user/shares`, { 
        headers, 
        params 
      });

      if (response.data?.success) {
        return {
          success: true,
          shares: response.data.shares,
          pagination: response.data.pagination
        };
      }

      throw new Error(response.data?.message || 'Failed to get shares');
    } catch (error) {
      console.error('ShareService.getUserShares error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get shares'
      };
    }
  }

  /**
   * Generate share analytics
   * @param {string} shareId - The share ID
   * @returns {Promise<Object>} Analytics data
   */
  async getShareAnalytics(shareId) {
    // Use mock service in development
    if (this.useMockService) {
      return await mockShareService.getShareAnalytics(shareId);
    }

    try {
      const headers = getAuthHeaders();
      const response = await api.get(`${this.baseUrl}/${shareId}/analytics`, { headers });

      if (response.data?.success) {
        return {
          success: true,
          analytics: response.data.analytics
        };
      }

      throw new Error(response.data?.message || 'Failed to get analytics');
    } catch (error) {
      console.error('ShareService.getShareAnalytics error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get analytics'
      };
    }
  }

  /**
   * Sanitize card data for sharing (remove sensitive info)
   * @param {Object} cardData - Raw card data
   * @returns {Object} Sanitized card data
   */
  sanitizeCardData(cardData) {
    if (!cardData || typeof cardData !== 'object') {
      return {};
    }

    // Define allowed fields for sharing
    const allowedFields = [
      'memberName',
      'email',
      'phone',
      'companyName',
      'companyTagline',
      'title',
      'address',
      'memberPhoto',
      'companyLogo',
      'facebookUrl',
      'instagramUrl',
      'linkedinUrl',
      'youtubeUrl',
      'twitterUrl',
      'xUrl',
      'pinterestUrl',
      'website',
      'membershipId',
      'issuedUpto'
    ];

    const sanitized = {};
    
    allowedFields.forEach(field => {
      const value = cardData[field];
      if (value !== undefined && value !== null && value !== '') {
        sanitized[field] = value;
      }
    });

    return sanitized;
  }

  /**
   * Generate a short, user-friendly share URL
   * @param {string} shareId - The share ID
   * @returns {string} Short URL
   */
  generateShortUrl(shareId) {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/card/${shareId}`;
  }

  /**
   * Validate share ID format
   * @param {string} shareId - The share ID to validate
   * @returns {boolean} Is valid
   */
  isValidShareId(shareId) {
    if (!shareId || typeof shareId !== 'string') return false;
    // Share IDs should be alphanumeric, 8-12 characters
    return /^[a-zA-Z0-9]{8,12}$/.test(shareId);
  }

  /**
   * Handle share via native sharing or clipboard
   * @param {string} url - URL to share
   * @param {Object} options - Share options
   * @returns {Promise<Object>} Share result
   */
  async handleShare(url, options = {}) {
    // Use mock service for consistent behavior
    return await mockShareService.handleShare(url, options);
  }
}

// Export singleton instance
export default new ShareService();
