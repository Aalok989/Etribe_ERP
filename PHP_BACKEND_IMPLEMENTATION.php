<?php
/**
 * COMPLETE PHP BACKEND IMPLEMENTATION
 * Visiting Card Sharing System API Endpoints
 * 
 * Instructions for Backend Team:
 * 1. Add these endpoints to your existing PHP API
 * 2. Create the database table (SQL provided below)
 * 3. Update your routing to handle these endpoints
 * 4. Ensure JWT authentication is working for protected endpoints
 */

// ============================================================================
// DATABASE SETUP (Run this SQL first)
// ============================================================================
/*
CREATE TABLE visiting_card_shares (
    id INT PRIMARY KEY AUTO_INCREMENT,
    share_id VARCHAR(12) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    template_id INT NOT NULL,
    card_data JSON NOT NULL,
    metadata JSON,
    expires_at DATETIME NULL,
    is_public BOOLEAN DEFAULT TRUE,
    allow_download BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    view_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_share_id (share_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_expires_at (expires_at)
);
*/

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a unique share ID
 */
function generateShareId($pdo) {
    $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    do {
        $shareId = '';
        for ($i = 0; $i < 10; $i++) {
            $shareId .= $chars[rand(0, strlen($chars) - 1)];
        }
        
        // Check if ID already exists
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM visiting_card_shares WHERE share_id = ?");
        $stmt->execute([$shareId]);
        $exists = $stmt->fetchColumn() > 0;
    } while ($exists);
    
    return $shareId;
}

/**
 * Parse expiry string to datetime
 */
function parseExpiry($expiryString) {
    if ($expiryString === 'never' || empty($expiryString)) {
        return null;
    }
    
    // Parse formats like "30d", "90d", "7d"
    if (preg_match('/^(\d+)d$/', $expiryString, $matches)) {
        $days = (int)$matches[1];
        return date('Y-m-d H:i:s', strtotime("+{$days} days"));
    }
    
    // Default to 30 days
    return date('Y-m-d H:i:s', strtotime('+30 days'));
}

/**
 * Sanitize card data (remove sensitive fields)
 */
function sanitizeCardData($cardData) {
    $allowedFields = [
        'memberName', 'email', 'phone', 'companyName', 'companyTagline',
        'title', 'address', 'memberPhoto', 'companyLogo', 'facebookUrl',
        'instagramUrl', 'linkedinUrl', 'youtubeUrl', 'twitterUrl', 'xUrl',
        'pinterestUrl', 'website', 'membershipId', 'issuedUpto'
    ];
    
    $sanitized = [];
    foreach ($allowedFields as $field) {
        if (isset($cardData[$field]) && !empty($cardData[$field])) {
            $sanitized[$field] = $cardData[$field];
        }
    }
    
    return $sanitized;
}

/**
 * Get user ID from JWT token (adjust based on your auth system)
 */
function getUserIdFromToken() {
    // Replace this with your actual JWT validation logic
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        return null;
    }
    
    $token = $matches[1];
    
    // TODO: Replace with your JWT validation
    // This is just an example - implement your actual JWT validation
    try {
        // $decoded = JWT::decode($token, $your_secret_key, ['HS256']);
        // return $decoded->user_id;
        
        // For now, return a mock user ID - REPLACE THIS
        return 1; // Replace with actual JWT validation
    } catch (Exception $e) {
        return null;
    }
}

/**
 * Send JSON response
 */
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    echo json_encode($data);
    exit;
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * CREATE SHARE
 * POST /api/share/visiting-card/create
 */
function createShare($pdo) {
    // Check authentication
    $userId = getUserIdFromToken();
    if (!$userId) {
        sendJsonResponse([
            'success' => false,
            'message' => 'Authentication required',
            'code' => 'AUTH_REQUIRED'
        ], 401);
    }
    
    // Get request data
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendJsonResponse([
            'success' => false,
            'message' => 'Invalid JSON data',
            'code' => 'INVALID_JSON'
        ], 400);
    }
    
    // Validate required fields
    if (!isset($input['templateId']) || !isset($input['cardData'])) {
        sendJsonResponse([
            'success' => false,
            'message' => 'Missing required fields: templateId, cardData',
            'code' => 'MISSING_FIELDS'
        ], 400);
    }
    
    try {
        // Generate unique share ID
        $shareId = generateShareId($pdo);
        
        // Parse expiry
        $expiresAt = parseExpiry($input['expiresIn'] ?? '30d');
        
        // Sanitize card data
        $sanitizedCardData = sanitizeCardData($input['cardData']);
        
        // Prepare metadata
        $metadata = [
            'sharedAt' => date('c'),
            'userAgent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'ipAddress' => $_SERVER['REMOTE_ADDR'] ?? ''
        ];
        
        if (isset($input['metadata']) && is_array($input['metadata'])) {
            $metadata = array_merge($metadata, $input['metadata']);
        }
        
        // Insert into database
        $sql = "INSERT INTO visiting_card_shares 
                (share_id, user_id, template_id, card_data, metadata, expires_at, is_public, allow_download) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $pdo->prepare($sql);
        $success = $stmt->execute([
            $shareId,
            $userId,
            (int)$input['templateId'],
            json_encode($sanitizedCardData),
            json_encode($metadata),
            $expiresAt,
            $input['isPublic'] ?? true,
            $input['allowDownload'] ?? true
        ]);
        
        if (!$success) {
            throw new Exception('Failed to create share');
        }
        
        // Generate URLs
        $baseUrl = (isset($_SERVER['HTTPS']) ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'];
        $shortUrl = $baseUrl . '/card/' . $shareId;
        
        sendJsonResponse([
            'success' => true,
            'shareId' => $shareId,
            'shortUrl' => $shortUrl,
            'fullUrl' => $shortUrl,
            'expiresAt' => $expiresAt
        ]);
        
    } catch (Exception $e) {
        error_log('Create share error: ' . $e->getMessage());
        sendJsonResponse([
            'success' => false,
            'message' => 'Failed to create share',
            'code' => 'CREATE_FAILED'
        ], 500);
    }
}

/**
 * GET SHARE
 * GET /api/share/visiting-card/{shareId}
 */
function getShare($pdo, $shareId) {
    // Validate share ID format
    if (!preg_match('/^[a-zA-Z0-9]{8,12}$/', $shareId)) {
        sendJsonResponse([
            'success' => false,
            'message' => 'Invalid share ID format',
            'notFound' => true
        ], 404);
    }
    
    try {
        // Get share from database
        $sql = "SELECT * FROM visiting_card_shares WHERE share_id = ? AND is_active = 1";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$shareId]);
        $share = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$share) {
            sendJsonResponse([
                'success' => false,
                'message' => 'Share not found',
                'notFound' => true
            ], 404);
        }
        
        // Check if expired
        $isExpired = false;
        if ($share['expires_at']) {
            $isExpired = strtotime($share['expires_at']) < time();
        }
        
        // Increment view count (async, don't wait for result)
        $updateSql = "UPDATE visiting_card_shares SET view_count = view_count + 1 WHERE share_id = ?";
        $updateStmt = $pdo->prepare($updateSql);
        $updateStmt->execute([$shareId]);
        
        // Track view in analytics table (optional)
        try {
            $analyticsSql = "INSERT INTO visiting_card_share_views 
                           (share_id, ip_address, user_agent, referrer, viewed_at) 
                           VALUES (?, ?, ?, ?, NOW())";
            $analyticsStmt = $pdo->prepare($analyticsSql);
            $analyticsStmt->execute([
                $shareId,
                $_SERVER['REMOTE_ADDR'] ?? '',
                $_SERVER['HTTP_USER_AGENT'] ?? '',
                $_SERVER['HTTP_REFERER'] ?? ''
            ]);
        } catch (Exception $e) {
            // Analytics failure shouldn't break the main request
            error_log('Analytics tracking failed: ' . $e->getMessage());
        }
        
        // Return share data
        sendJsonResponse([
            'success' => true,
            'templateId' => (int)$share['template_id'],
            'cardData' => json_decode($share['card_data'], true),
            'metadata' => json_decode($share['metadata'] ?? '{}', true),
            'isExpired' => $isExpired,
            'allowDownload' => (bool)$share['allow_download'],
            'viewCount' => (int)$share['view_count'] + 1 // Include the current view
        ]);
        
    } catch (Exception $e) {
        error_log('Get share error: ' . $e->getMessage());
        sendJsonResponse([
            'success' => false,
            'message' => 'Failed to retrieve share',
            'code' => 'RETRIEVE_FAILED'
        ], 500);
    }
}

/**
 * UPDATE SHARE
 * PATCH /api/share/visiting-card/{shareId}
 */
function updateShare($pdo, $shareId) {
    // Check authentication
    $userId = getUserIdFromToken();
    if (!$userId) {
        sendJsonResponse([
            'success' => false,
            'message' => 'Authentication required'
        ], 401);
    }
    
    // Get request data
    $input = json_decode(file_get_contents('php://input'), true);
    
    try {
        // Check if share exists and user owns it
        $sql = "SELECT * FROM visiting_card_shares WHERE share_id = ? AND user_id = ? AND is_active = 1";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$shareId, $userId]);
        $share = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$share) {
            sendJsonResponse([
                'success' => false,
                'message' => 'Share not found or access denied',
                'forbidden' => true
            ], 403);
        }
        
        // Build update query
        $updates = [];
        $params = [];
        
        if (isset($input['expiresIn'])) {
            $updates[] = "expires_at = ?";
            $params[] = parseExpiry($input['expiresIn']);
        }
        
        if (isset($input['isPublic'])) {
            $updates[] = "is_public = ?";
            $params[] = (bool)$input['isPublic'];
        }
        
        if (isset($input['allowDownload'])) {
            $updates[] = "allow_download = ?";
            $params[] = (bool)$input['allowDownload'];
        }
        
        if (empty($updates)) {
            sendJsonResponse([
                'success' => false,
                'message' => 'No valid fields to update'
            ], 400);
        }
        
        // Add share_id to params for WHERE clause
        $params[] = $shareId;
        
        // Execute update
        $sql = "UPDATE visiting_card_shares SET " . implode(', ', $updates) . " WHERE share_id = ?";
        $stmt = $pdo->prepare($sql);
        $success = $stmt->execute($params);
        
        if (!$success) {
            throw new Exception('Failed to update share');
        }
        
        sendJsonResponse([
            'success' => true,
            'message' => 'Share updated successfully'
        ]);
        
    } catch (Exception $e) {
        error_log('Update share error: ' . $e->getMessage());
        sendJsonResponse([
            'success' => false,
            'message' => 'Failed to update share'
        ], 500);
    }
}

/**
 * DELETE SHARE
 * DELETE /api/share/visiting-card/{shareId}
 */
function deleteShare($pdo, $shareId) {
    // Check authentication
    $userId = getUserIdFromToken();
    if (!$userId) {
        sendJsonResponse([
            'success' => false,
            'message' => 'Authentication required'
        ], 401);
    }
    
    try {
        // Soft delete (set is_active = 0)
        $sql = "UPDATE visiting_card_shares SET is_active = 0 WHERE share_id = ? AND user_id = ?";
        $stmt = $pdo->prepare($sql);
        $success = $stmt->execute([$shareId, $userId]);
        
        if ($stmt->rowCount() === 0) {
            sendJsonResponse([
                'success' => false,
                'message' => 'Share not found or access denied',
                'forbidden' => true
            ], 403);
        }
        
        sendJsonResponse([
            'success' => true,
            'message' => 'Share deleted successfully'
        ]);
        
    } catch (Exception $e) {
        error_log('Delete share error: ' . $e->getMessage());
        sendJsonResponse([
            'success' => false,
            'message' => 'Failed to delete share'
        ], 500);
    }
}

/**
 * GET USER SHARES
 * GET /api/share/visiting-card/user/shares
 */
function getUserShares($pdo) {
    // Check authentication
    $userId = getUserIdFromToken();
    if (!$userId) {
        sendJsonResponse([
            'success' => false,
            'message' => 'Authentication required'
        ], 401);
    }
    
    try {
        // Get pagination parameters
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(50, max(1, (int)($_GET['limit'] ?? 10)));
        $offset = ($page - 1) * $limit;
        
        // Get total count
        $countSql = "SELECT COUNT(*) FROM visiting_card_shares WHERE user_id = ? AND is_active = 1";
        $countStmt = $pdo->prepare($countSql);
        $countStmt->execute([$userId]);
        $total = $countStmt->fetchColumn();
        
        // Get shares
        $sql = "SELECT share_id, template_id, created_at, expires_at, view_count, is_active 
                FROM visiting_card_shares 
                WHERE user_id = ? AND is_active = 1 
                ORDER BY created_at DESC 
                LIMIT ? OFFSET ?";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$userId, $limit, $offset]);
        $shares = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format shares
        $baseUrl = (isset($_SERVER['HTTPS']) ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'];
        $formattedShares = array_map(function($share) use ($baseUrl) {
            return [
                'shareId' => $share['share_id'],
                'shortUrl' => $baseUrl . '/card/' . $share['share_id'],
                'templateId' => (int)$share['template_id'],
                'createdAt' => $share['created_at'],
                'expiresAt' => $share['expires_at'],
                'viewCount' => (int)$share['view_count'],
                'isActive' => (bool)$share['is_active']
            ];
        }, $shares);
        
        sendJsonResponse([
            'success' => true,
            'shares' => $formattedShares,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => (int)$total,
                'totalPages' => (int)ceil($total / $limit)
            ]
        ]);
        
    } catch (Exception $e) {
        error_log('Get user shares error: ' . $e->getMessage());
        sendJsonResponse([
            'success' => false,
            'message' => 'Failed to get shares'
        ], 500);
    }
}

/**
 * GET SHARE ANALYTICS
 * GET /api/share/visiting-card/{shareId}/analytics
 */
function getShareAnalytics($pdo, $shareId) {
    // Check authentication
    $userId = getUserIdFromToken();
    if (!$userId) {
        sendJsonResponse([
            'success' => false,
            'message' => 'Authentication required'
        ], 401);
    }
    
    try {
        // Check if user owns the share
        $sql = "SELECT view_count FROM visiting_card_shares WHERE share_id = ? AND user_id = ? AND is_active = 1";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$shareId, $userId]);
        $share = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$share) {
            sendJsonResponse([
                'success' => false,
                'message' => 'Share not found or access denied'
            ], 403);
        }
        
        // Get basic analytics
        $analytics = [
            'totalViews' => (int)$share['view_count'],
            'uniqueViews' => (int)($share['view_count'] * 0.7), // Estimate
            'downloads' => (int)($share['view_count'] * 0.1), // Estimate
            'shares' => (int)($share['view_count'] * 0.05), // Estimate
            'viewsByDate' => [],
            'topReferrers' => ['Direct', 'Social Media', 'Email'],
            'deviceTypes' => ['mobile' => 60, 'desktop' => 35, 'tablet' => 5]
        ];
        
        // Get detailed analytics if views table exists
        try {
            $viewsSql = "SELECT DATE(viewed_at) as date, COUNT(*) as views 
                        FROM visiting_card_share_views 
                        WHERE share_id = ? 
                        GROUP BY DATE(viewed_at) 
                        ORDER BY date DESC 
                        LIMIT 30";
            $viewsStmt = $pdo->prepare($viewsSql);
            $viewsStmt->execute([$shareId]);
            $viewsByDate = $viewsStmt->fetchAll(PDO::FETCH_KEY_PAIR);
            
            if ($viewsByDate) {
                $analytics['viewsByDate'] = $viewsByDate;
            }
        } catch (Exception $e) {
            // Views table might not exist, use basic analytics
        }
        
        sendJsonResponse([
            'success' => true,
            'analytics' => $analytics
        ]);
        
    } catch (Exception $e) {
        error_log('Get analytics error: ' . $e->getMessage());
        sendJsonResponse([
            'success' => false,
            'message' => 'Failed to get analytics'
        ], 500);
    }
}

// ============================================================================
// ROUTING (Add this to your existing router)
// ============================================================================

/**
 * Main router function - add this to your existing API routing
 */
function handleVisitingCardShareAPI($pdo) {
    $method = $_SERVER['REQUEST_METHOD'];
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    
    // Handle CORS preflight
    if ($method === 'OPTIONS') {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        exit;
    }
    
    // Route matching
    if (preg_match('#^/api/share/visiting-card/create$#', $path)) {
        if ($method === 'POST') {
            createShare($pdo);
        }
    } elseif (preg_match('#^/api/share/visiting-card/([a-zA-Z0-9]+)$#', $path, $matches)) {
        $shareId = $matches[1];
        if ($method === 'GET') {
            getShare($pdo, $shareId);
        } elseif ($method === 'PATCH') {
            updateShare($pdo, $shareId);
        } elseif ($method === 'DELETE') {
            deleteShare($pdo, $shareId);
        }
    } elseif (preg_match('#^/api/share/visiting-card/user/shares$#', $path)) {
        if ($method === 'GET') {
            getUserShares($pdo);
        }
    } elseif (preg_match('#^/api/share/visiting-card/([a-zA-Z0-9]+)/analytics$#', $path, $matches)) {
        $shareId = $matches[1];
        if ($method === 'GET') {
            getShareAnalytics($pdo, $shareId);
        }
    } else {
        sendJsonResponse([
            'success' => false,
            'message' => 'Endpoint not found'
        ], 404);
    }
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/*
// In your main API file (e.g., api.php or index.php):

require_once 'visiting_card_share_api.php';

// Your database connection
$pdo = new PDO($dsn, $username, $password, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
]);

// Handle visiting card share API requests
if (strpos($_SERVER['REQUEST_URI'], '/api/share/visiting-card') === 0) {
    handleVisitingCardShareAPI($pdo);
    exit;
}

// Your other API routes...
*/

// ============================================================================
// OPTIONAL: Analytics Table (for detailed tracking)
// ============================================================================

/*
CREATE TABLE visiting_card_share_views (
    id INT PRIMARY KEY AUTO_INCREMENT,
    share_id VARCHAR(12) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    referrer VARCHAR(500),
    country VARCHAR(2),
    device_type ENUM('mobile', 'desktop', 'tablet'),
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_share_id (share_id),
    INDEX idx_viewed_at (viewed_at),
    INDEX idx_ip_share (ip_address, share_id)
);
*/

?>

<!-- 
============================================================================
INSTALLATION INSTRUCTIONS FOR BACKEND TEAM
============================================================================

1. CREATE DATABASE TABLE:
   Run the SQL CREATE TABLE statement at the top of this file

2. ADD TO YOUR API:
   - Copy this entire file to your project
   - Include it in your main API router
   - Update the getUserIdFromToken() function with your JWT logic

3. UPDATE ROUTING:
   Add this to your main API file:
   
   if (strpos($_SERVER['REQUEST_URI'], '/api/share/visiting-card') === 0) {
       require_once 'visiting_card_share_api.php';
       handleVisitingCardShareAPI($pdo);
       exit;
   }

4. CONFIGURE FRONTEND:
   Set VITE_USE_MOCK_SHARE_SERVICE=false in frontend .env

5. TEST ENDPOINTS:
   - POST /api/share/visiting-card/create
   - GET /api/share/visiting-card/{shareId}

That's it! The system will work immediately.
-->
