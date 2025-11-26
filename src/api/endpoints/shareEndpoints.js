/**
 * Backend API Endpoints Configuration for Visiting Card Sharing
 * 
 * This file documents the required backend endpoints for the new sharing system.
 * Backend developers should implement these endpoints with the specified request/response formats.
 */

export const SHARE_ENDPOINTS = {
  // Base path for all share endpoints
  BASE_PATH: '/api/share/visiting-card',

  // Individual endpoints
  CREATE_SHARE: '/api/share/visiting-card/create',
  GET_SHARE: '/api/share/visiting-card/:shareId',
  UPDATE_SHARE: '/api/share/visiting-card/:shareId',
  DELETE_SHARE: '/api/share/visiting-card/:shareId',
  USER_SHARES: '/api/share/visiting-card/user/shares',
  SHARE_ANALYTICS: '/api/share/visiting-card/:shareId/analytics'
};

/**
 * API Endpoint Specifications
 * 
 * These are the required endpoints that need to be implemented on the backend.
 * Each endpoint includes the HTTP method, request format, and expected response.
 */

export const API_SPECIFICATIONS = {
  /**
   * CREATE SHARE
   * POST /api/share/visiting-card/create
   * 
   * Creates a new shareable visiting card with a unique short ID
   */
  createShare: {
    method: 'POST',
    path: '/api/share/visiting-card/create',
    headers: ['Authorization: Bearer {token}'],
    requestBody: {
      templateId: 'number', // Template ID to use
      cardData: 'object',   // Sanitized card data
      expiresIn: 'string',  // Expiry duration (e.g., '30d', '90d', 'never')
      isPublic: 'boolean',  // Whether the card is publicly accessible
      allowDownload: 'boolean', // Whether downloads are allowed
      metadata: 'object'    // Additional metadata (optional)
    },
    responseSuccess: {
      success: true,
      shareId: 'string',    // Unique 8-12 character alphanumeric ID
      shortUrl: 'string',   // Full short URL (e.g., domain.com/card/abc123)
      fullUrl: 'string',    // Alternative full URL if needed
      expiresAt: 'string',  // ISO date string or null for never
      qrCode: 'string'      // Base64 QR code image (optional)
    },
    responseError: {
      success: false,
      message: 'string',
      code: 'string'        // Error code for client handling
    }
  },

  /**
   * GET SHARE
   * GET /api/share/visiting-card/:shareId
   * 
   * Retrieves a shared visiting card (public endpoint, no auth required)
   */
  getShare: {
    method: 'GET',
    path: '/api/share/visiting-card/:shareId',
    headers: [], // No authentication required
    responseSuccess: {
      success: true,
      templateId: 'number',
      cardData: 'object',   // The shared card data
      metadata: 'object',   // Share metadata
      isExpired: 'boolean', // Whether the share has expired
      allowDownload: 'boolean',
      viewCount: 'number'   // Optional: track views
    },
    responseError: {
      success: false,
      message: 'string',
      notFound: 'boolean'   // True if share doesn't exist
    }
  },

  /**
   * UPDATE SHARE
   * PATCH /api/share/visiting-card/:shareId
   * 
   * Updates share settings (only by creator)
   */
  updateShare: {
    method: 'PATCH',
    path: '/api/share/visiting-card/:shareId',
    headers: ['Authorization: Bearer {token}'],
    requestBody: {
      expiresIn: 'string',     // Optional: update expiry
      isPublic: 'boolean',     // Optional: update visibility
      allowDownload: 'boolean' // Optional: update download permission
    },
    responseSuccess: {
      success: true,
      message: 'Share updated successfully'
    },
    responseError: {
      success: false,
      message: 'string',
      forbidden: 'boolean'  // True if user doesn't own the share
    }
  },

  /**
   * DELETE SHARE
   * DELETE /api/share/visiting-card/:shareId
   * 
   * Deletes a share (only by creator)
   */
  deleteShare: {
    method: 'DELETE',
    path: '/api/share/visiting-card/:shareId',
    headers: ['Authorization: Bearer {token}'],
    responseSuccess: {
      success: true,
      message: 'Share deleted successfully'
    },
    responseError: {
      success: false,
      message: 'string',
      forbidden: 'boolean'
    }
  },

  /**
   * GET USER SHARES
   * GET /api/share/visiting-card/user/shares
   * 
   * Gets all shares created by the authenticated user
   */
  getUserShares: {
    method: 'GET',
    path: '/api/share/visiting-card/user/shares',
    headers: ['Authorization: Bearer {token}'],
    queryParams: {
      page: 'number',     // Page number (default: 1)
      limit: 'number',    // Items per page (default: 10)
      sortBy: 'string',   // Sort field (default: 'createdAt')
      sortOrder: 'string' // 'asc' or 'desc' (default: 'desc')
    },
    responseSuccess: {
      success: true,
      shares: [{
        shareId: 'string',
        shortUrl: 'string',
        templateId: 'number',
        createdAt: 'string',
        expiresAt: 'string',
        viewCount: 'number',
        isActive: 'boolean'
      }],
      pagination: {
        page: 'number',
        limit: 'number',
        total: 'number',
        totalPages: 'number'
      }
    }
  },

  /**
   * GET SHARE ANALYTICS
   * GET /api/share/visiting-card/:shareId/analytics
   * 
   * Gets analytics for a specific share (only by creator)
   */
  getShareAnalytics: {
    method: 'GET',
    path: '/api/share/visiting-card/:shareId/analytics',
    headers: ['Authorization: Bearer {token}'],
    responseSuccess: {
      success: true,
      analytics: {
        totalViews: 'number',
        uniqueViews: 'number',
        downloads: 'number',
        shares: 'number',
        viewsByDate: 'object', // Date-based view counts
        topReferrers: 'array', // Where views came from
        deviceTypes: 'object'  // Mobile/desktop breakdown
      }
    }
  }
};

/**
 * Database Schema Suggestions
 * 
 * Recommended database tables for implementing the sharing system
 */

export const DATABASE_SCHEMA = {
  // Main shares table
  visiting_card_shares: {
    id: 'PRIMARY KEY AUTO_INCREMENT',
    share_id: 'VARCHAR(12) UNIQUE NOT NULL', // The public share ID
    user_id: 'INT NOT NULL',                 // Creator's user ID
    template_id: 'INT NOT NULL',             // Template used
    card_data: 'JSON NOT NULL',              // Serialized card data
    metadata: 'JSON',                        // Additional metadata
    expires_at: 'DATETIME',                  // Expiry date (NULL for never)
    is_public: 'BOOLEAN DEFAULT TRUE',       // Public visibility
    allow_download: 'BOOLEAN DEFAULT TRUE',  // Download permission
    is_active: 'BOOLEAN DEFAULT TRUE',       // Soft delete flag
    created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    
    // Indexes
    indexes: [
      'INDEX idx_share_id (share_id)',
      'INDEX idx_user_id (user_id)',
      'INDEX idx_created_at (created_at)',
      'INDEX idx_expires_at (expires_at)'
    ]
  },

  // Analytics table (optional)
  visiting_card_share_views: {
    id: 'PRIMARY KEY AUTO_INCREMENT',
    share_id: 'VARCHAR(12) NOT NULL',
    ip_address: 'VARCHAR(45)',        // For unique view tracking
    user_agent: 'TEXT',
    referrer: 'VARCHAR(500)',
    country: 'VARCHAR(2)',            // Country code
    device_type: 'ENUM("mobile", "desktop", "tablet")',
    viewed_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    
    // Indexes
    indexes: [
      'INDEX idx_share_id (share_id)',
      'INDEX idx_viewed_at (viewed_at)',
      'INDEX idx_ip_share (ip_address, share_id)' // For unique views
    ]
  }
};

/**
 * Implementation Notes for Backend Developers
 */

export const IMPLEMENTATION_NOTES = {
  shareIdGeneration: `
    Generate unique 8-12 character alphanumeric share IDs.
    Recommended: Use crypto.randomBytes() and base36 encoding.
    Ensure uniqueness by checking against existing shares.
  `,
  
  security: `
    - Validate all input data
    - Sanitize card data before storing
    - Rate limit share creation (e.g., 10 shares per hour per user)
    - Implement CORS for public endpoints
    - Log suspicious activity
  `,
  
  performance: `
    - Cache frequently accessed shares
    - Use database indexes on share_id and user_id
    - Consider CDN for QR code images
    - Implement pagination for user shares
  `,
  
  expiry: `
    - Run daily cleanup job for expired shares
    - Soft delete initially, hard delete after 30 days
    - Send notifications before expiry (optional)
  `,
  
  analytics: `
    - Track views asynchronously to avoid slowing page loads
    - Use IP + User Agent for unique view detection
    - Consider using a separate analytics service
    - Respect privacy laws (GDPR, etc.)
  `
};

export default {
  SHARE_ENDPOINTS,
  API_SPECIFICATIONS,
  DATABASE_SCHEMA,
  IMPLEMENTATION_NOTES
};
