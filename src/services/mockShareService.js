/**
 * Mock Share Service for Development and Testing
 * 
 * This service provides a localStorage-based implementation of the sharing system
 * for development and testing purposes. It simulates the backend API behavior
 * and can be used until the real backend endpoints are implemented.
 */

class MockShareService {
  constructor() {
    this.storageKey = 'etribe_mock_shares';
    this.analyticsKey = 'etribe_mock_analytics';
  }

  /**
   * Generate a random share ID
   */
  generateShareId() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Get all shares from localStorage
   */
  getAllShares() {
    try {
      const shares = localStorage.getItem(this.storageKey);
      return shares ? JSON.parse(shares) : {};
    } catch (error) {
      console.error('Error reading shares from localStorage:', error);
      return {};
    }
  }

  /**
   * Save shares to localStorage
   */
  saveShares(shares) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(shares));
      return true;
    } catch (error) {
      console.error('Error saving shares to localStorage:', error);
      return false;
    }
  }

  /**
   * Get analytics from localStorage
   */
  getAnalytics() {
    try {
      const analytics = localStorage.getItem(this.analyticsKey);
      return analytics ? JSON.parse(analytics) : {};
    } catch (error) {
      console.error('Error reading analytics from localStorage:', error);
      return {};
    }
  }

  /**
   * Save analytics to localStorage
   */
  saveAnalytics(analytics) {
    try {
      localStorage.setItem(this.analyticsKey, JSON.stringify(analytics));
      return true;
    } catch (error) {
      console.error('Error saving analytics to localStorage:', error);
      return false;
    }
  }

  /**
   * Create a shareable visiting card
   */
  async createShare(cardData, templateId, options = {}) {
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(() => {
        try {
          const shareId = this.generateShareId();
          const now = new Date();
          const expiresAt = options.expiresIn === 'never' 
            ? null 
            : new Date(now.getTime() + this.parseExpiry(options.expiresIn || '30d'));

          const shareData = {
            shareId,
            templateId: templateId || 1,
            cardData: this.sanitizeCardData(cardData),
            expiresAt: expiresAt ? expiresAt.toISOString() : null,
            isPublic: options.isPublic !== false,
            allowDownload: options.allowDownload !== false,
            metadata: {
              sharedAt: now.toISOString(),
              userAgent: navigator.userAgent,
              ...options.metadata
            },
            createdBy: this.getCurrentUserId(),
            viewCount: 0,
            isActive: true
          };

          const shares = this.getAllShares();
          shares[shareId] = shareData;
          
          if (this.saveShares(shares)) {
            const shortUrl = this.generateShortUrl(shareId);
            
            resolve({
              success: true,
              shareId,
              shortUrl,
              fullUrl: shortUrl,
              expiresAt: shareData.expiresAt
            });
          } else {
            resolve({
              success: false,
              error: 'Failed to save share data'
            });
          }
        } catch (error) {
          resolve({
            success: false,
            error: error.message || 'Failed to create share'
          });
        }
      }, 500); // Simulate 500ms API delay
    });
  }

  /**
   * Retrieve a shared visiting card
   */
  async getShare(shareId) {
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(() => {
        try {
          if (!this.isValidShareId(shareId)) {
            resolve({
              success: false,
              error: 'Invalid share ID',
              notFound: true
            });
            return;
          }

          const shares = this.getAllShares();
          const share = shares[shareId];

          if (!share || !share.isActive) {
            resolve({
              success: false,
              error: 'Share not found',
              notFound: true
            });
            return;
          }

          // Check if expired
          const isExpired = share.expiresAt && new Date(share.expiresAt) < new Date();

          if (isExpired) {
            resolve({
              success: true,
              templateId: share.templateId,
              cardData: share.cardData,
              metadata: share.metadata,
              isExpired: true,
              allowDownload: false
            });
            return;
          }

          // Increment view count
          share.viewCount = (share.viewCount || 0) + 1;
          shares[shareId] = share;
          this.saveShares(shares);

          // Track analytics
          this.trackView(shareId);

          resolve({
            success: true,
            templateId: share.templateId,
            cardData: share.cardData,
            metadata: share.metadata,
            isExpired: false,
            allowDownload: share.allowDownload
          });
        } catch (error) {
          resolve({
            success: false,
            error: error.message || 'Failed to retrieve share'
          });
        }
      }, 300); // Simulate 300ms API delay
    });
  }

  /**
   * Update share settings
   */
  async updateShare(shareId, updates) {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const shares = this.getAllShares();
          const share = shares[shareId];

          if (!share || share.createdBy !== this.getCurrentUserId()) {
            resolve({
              success: false,
              error: 'Share not found or access denied'
            });
            return;
          }

          // Apply updates
          if (updates.expiresIn !== undefined) {
            share.expiresAt = updates.expiresIn === 'never' 
              ? null 
              : new Date(Date.now() + this.parseExpiry(updates.expiresIn)).toISOString();
          }
          if (updates.isPublic !== undefined) {
            share.isPublic = updates.isPublic;
          }
          if (updates.allowDownload !== undefined) {
            share.allowDownload = updates.allowDownload;
          }

          shares[shareId] = share;
          this.saveShares(shares);

          resolve({
            success: true,
            message: 'Share updated successfully'
          });
        } catch (error) {
          resolve({
            success: false,
            error: error.message || 'Failed to update share'
          });
        }
      }, 400);
    });
  }

  /**
   * Delete a share
   */
  async deleteShare(shareId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const shares = this.getAllShares();
          const share = shares[shareId];

          if (!share || share.createdBy !== this.getCurrentUserId()) {
            resolve({
              success: false,
              error: 'Share not found or access denied'
            });
            return;
          }

          // Soft delete
          share.isActive = false;
          shares[shareId] = share;
          this.saveShares(shares);

          resolve({
            success: true,
            message: 'Share deleted successfully'
          });
        } catch (error) {
          resolve({
            success: false,
            error: error.message || 'Failed to delete share'
          });
        }
      }, 300);
    });
  }

  /**
   * Get user's shares
   */
  async getUserShares(options = {}) {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const shares = this.getAllShares();
          const userId = this.getCurrentUserId();
          
          // Filter user's active shares
          const userShares = Object.values(shares)
            .filter(share => share.createdBy === userId && share.isActive)
            .map(share => ({
              shareId: share.shareId,
              shortUrl: this.generateShortUrl(share.shareId),
              templateId: share.templateId,
              createdAt: share.metadata.sharedAt,
              expiresAt: share.expiresAt,
              viewCount: share.viewCount || 0,
              isActive: share.isActive
            }))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

          // Simple pagination
          const page = options.page || 1;
          const limit = options.limit || 10;
          const startIndex = (page - 1) * limit;
          const endIndex = startIndex + limit;
          const paginatedShares = userShares.slice(startIndex, endIndex);

          resolve({
            success: true,
            shares: paginatedShares,
            pagination: {
              page,
              limit,
              total: userShares.length,
              totalPages: Math.ceil(userShares.length / limit)
            }
          });
        } catch (error) {
          resolve({
            success: false,
            error: error.message || 'Failed to get shares'
          });
        }
      }, 400);
    });
  }

  /**
   * Get share analytics
   */
  async getShareAnalytics(shareId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const shares = this.getAllShares();
          const share = shares[shareId];

          if (!share || share.createdBy !== this.getCurrentUserId()) {
            resolve({
              success: false,
              error: 'Share not found or access denied'
            });
            return;
          }

          const analytics = this.getAnalytics();
          const shareAnalytics = analytics[shareId] || {
            totalViews: share.viewCount || 0,
            uniqueViews: Math.max(1, Math.floor((share.viewCount || 0) * 0.7)),
            downloads: Math.floor((share.viewCount || 0) * 0.1),
            shares: Math.floor((share.viewCount || 0) * 0.05),
            viewsByDate: {},
            topReferrers: ['Direct', 'Social Media', 'Email'],
            deviceTypes: { mobile: 60, desktop: 35, tablet: 5 }
          };

          resolve({
            success: true,
            analytics: shareAnalytics
          });
        } catch (error) {
          resolve({
            success: false,
            error: error.message || 'Failed to get analytics'
          });
        }
      }, 300);
    });
  }

  /**
   * Helper methods
   */
  
  sanitizeCardData(cardData) {
    if (!cardData || typeof cardData !== 'object') {
      return {};
    }

    const allowedFields = [
      'memberName', 'email', 'phone', 'companyName', 'companyTagline',
      'title', 'address', 'memberPhoto', 'companyLogo', 'facebookUrl',
      'instagramUrl', 'linkedinUrl', 'youtubeUrl', 'twitterUrl', 'xUrl',
      'pinterestUrl', 'website', 'membershipId', 'issuedUpto'
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

  generateShortUrl(shareId) {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/card/${shareId}`;
  }

  isValidShareId(shareId) {
    if (!shareId || typeof shareId !== 'string') return false;
    return /^[a-zA-Z0-9]{8,12}$/.test(shareId);
  }

  parseExpiry(expiryString) {
    const match = expiryString.match(/^(\d+)([dhm])$/);
    if (!match) return 30 * 24 * 60 * 60 * 1000; // Default 30 days

    const [, amount, unit] = match;
    const multipliers = {
      'm': 60 * 1000,           // minutes
      'h': 60 * 60 * 1000,      // hours
      'd': 24 * 60 * 60 * 1000  // days
    };

    return parseInt(amount) * (multipliers[unit] || multipliers.d);
  }

  getCurrentUserId() {
    // Get user ID from localStorage or return a default
    return localStorage.getItem('uid') || 'mock_user_1';
  }

  trackView(shareId) {
    try {
      const analytics = this.getAnalytics();
      if (!analytics[shareId]) {
        analytics[shareId] = {
          views: [],
          totalViews: 0
        };
      }

      analytics[shareId].views.push({
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        referrer: document.referrer
      });
      analytics[shareId].totalViews++;

      this.saveAnalytics(analytics);
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  }

  /**
   * Handle share via native sharing or clipboard
   */
  async handleShare(url, options = {}) {
    if (!url) {
      return { success: false, error: 'No URL to share' };
    }

    const shareData = {
      title: options.title || 'Visiting Card',
      text: options.text || 'Check out my visiting card',
      url: url
    };

    // Try native sharing first (mobile devices)
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return { success: true, method: 'native' };
      } catch (error) {
        if (error.name === 'AbortError') {
          return { success: false, error: 'Share cancelled', cancelled: true };
        }
        // Fall through to clipboard
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(url);
      return { success: true, method: 'clipboard' };
    } catch (error) {
      return { success: false, error: 'Failed to copy to clipboard' };
    }
  }
}

// Export singleton instance
export default new MockShareService();
