# ETribe Main - API Documentation

## Overview
This document lists all the API endpoints used in the ETribe Main project with exact field names and data structures. The project uses Axios for HTTP requests with a custom configuration that includes authentication headers and base URL setup.

## Base Configuration
- **Base URL**: `/api` (proxy path in development)
- **Authentication**: Bearer token in Authorization header
- **Headers**: 
  - `Client-Service`: From environment variable `VITE_CLIENT_SERVICE`
  - `Auth-Key`: From environment variable `VITE_AUTH_KEY`
  - `rurl`: From environment variable `VITE_RURL`
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer ${token}` (when authenticated)

## API Endpoints

### Authentication & Common

#### POST `/common/login`
- **Purpose**: User authentication
- **Request Body**:
  ```json
  {
    "username": "string", // User email/username
    "password": "string"  // User password
  }
  ```
- **Response**: 
  ```json
  {
    "token": "string",
    "data": {
      "id": "string",
      "user_id": "string", 
      "email": "string",
      "name": "string",
      "role": "string",
      "user_type": "string",
      "is_admin": "boolean"
    }
  }
  ```
- **Used in**: `src/pages/shared/Login.jsx`

#### POST `/common/register`
- **Purpose**: User registration
- **Request Body**:
  ```json
  {
    "name": "string",           // Full name
    "email": "string",          // Email address
    "password": "string",       // Password
    "confirm_password": "string", // Password confirmation
    "phone_num": "string",      // Phone number
    "area_id": "string",        // State ID
    "address": "string",        // Address
    "district": "string",       // District
    "city": "string",           // City
    "pincode": "string"         // Pincode
  }
  ```
- **Response**: 
  ```json
  {
    "status": "success",
    "message": "string"
  }
  ```
- **Used in**: `src/pages/shared/Login.jsx`

#### POST `/common/countries`
- **Purpose**: Get list of countries
- **Request Body**: `{}`
- **Response**: 
  ```json
  {
    "data": [
      {
        "country": "string" // Country name
      }
    ]
  }
  ```
- **Used in**: `src/pages/shared/Login.jsx`, `src/pages/admin/MemberDetail_Admin.jsx`, `src/pages/admin/NewRegistration_Admin.jsx`

#### POST `/common/states`
- **Purpose**: Get list of states for a country
- **Request Body**:
  ```json
  {
    "country": "string" // Country name (e.g., "India")
  }
  ```
- **Response**: 
  ```json
  {
    "data": [
      {
        "id": "string",
        "state": "string" // State name
      }
    ]
  }
  ```
- **Used in**: `src/pages/shared/Login.jsx`, `src/pages/admin/MemberDetail_Admin.jsx`, `src/pages/admin/NewRegistration_Admin.jsx`

#### POST `/common/upload_excel_registration`
- **Purpose**: Upload Excel file for bulk registration
- **Request Body** (FormData):
  ```
  excel_file: File        // Excel file for bulk registration
  uid: string            // User ID
  ```
- **Headers**: 
  - Standard auth headers + `Authorization: Bearer ${token}`
  - `withCredentials: true`
- **Response**: 
  ```json
  {
    "status": "success",
    "message": "string"
  }
  ```
- **Used in**: `src/pages/admin/NewRegistration_Admin.jsx`

### User Management

#### POST `/userDetail/active_members`
- **Purpose**: Get list of active members
- **Request Body**:
  ```json
  {
    "uid": "string" // User ID
  }
  ```
- **Response**: 
  ```json
  {
    "data": [
      {
        "id": "string",
        "name": "string",
        "email": "string",
        "phone_num": "string",
        "address": "string",
        "city": "string",
        "district": "string",
        "state": "string",
        "country": "string",
        "pincode": "string",
        "role": "string",
        "is_active": "string",
        "lct": "string", // Last created/updated timestamp
        "profile_image": "string",
        "company_name": "string",
        "company_email": "string",
        "company_contact": "string",
        "company_address": "string"
      }
    ]
  }
  ```
- **Used in**: `src/context/DashboardContext.jsx`, `src/pages/admin/MemberDetail_Admin.jsx`

#### POST `/userDetail/not_members`
- **Purpose**: Get list of pending approval members
- **Parameters**:
  - `uid` (string): User ID
- **Response**: Array of pending members
- **Used in**: `src/context/DashboardContext.jsx`, `src/pages/admin/MemberDetail_Admin.jsx`

#### POST `/userDetail/membership_expired`
- **Purpose**: Get list of expired membership members
- **Parameters**:
  - `uid` (string): User ID
- **Response**: Array of expired members
- **Used in**: `src/context/DashboardContext.jsx`, `src/pages/admin/MembershipExpired_Admin.jsx`

#### GET `/userDetail/inactive_member`
- **Purpose**: Get list of inactive members
- **Parameters**: None
- **Response**: Array of inactive members
- **Used in**: `src/pages/admin/InactiveMembers_Admin.jsx`

#### POST `/userDetail/update_user`
- **Purpose**: Update user profile information
- **Request Body**:
  ```json
  {
    "id": "string",
    "role_id": "string",
    "name": "string",
    "email": "string",
    "password": "string",
    "temp_password": "string",
    "phone_num": "string",
    "address": "string",
    "area_id": "string", // State ID
    "district": "string",
    "city": "string",
    "pincode": "string",
    "is_active": "string",
    "profile_image": "string",
    "ad1": "string", // Additional field 1
    "ad2": "string", // Additional field 2
    "ad3": "string", // Additional field 3
    "ad4": "string", // Additional field 4
    "ad5": "string", // Additional field 5
    "ad6": "string", // Additional field 6
    "ad7": "string", // Additional field 7
    "ad8": "string", // Additional field 8
    "ad9": "string", // Additional field 9
    "ad10": "string", // Additional field 10
    "lct": "string",
    "company_detail_id": "string",
    "user_detail_id": "string"
  }
  ```
- **Response**: 
  ```json
  {
    "status": "success",
    "message": "string"
  }
  ```
- **Used in**: `src/pages/admin/MemberDetail_Admin.jsx`

#### POST `/userDetail/add_company`
- **Purpose**: Add company information for user
- **Request Body**:
  ```json
  {
    "company_name": "string",
    "user_detail_id": "string",
    "company_contact": "string",
    "company_email": "string",
    "company_address": "string",
    "city": "string",
    "district": "string",
    "state": "string",
    "country": "string",
    "pincode": "string"
  }
  ```
- **Response**: 
  ```json
  {
    "status": "success",
    "message": "string"
  }
  ```
- **Used in**: `src/pages/admin/MemberDetail_Admin.jsx`

#### POST `/userDetail/upload_profile_image`
- **Purpose**: Upload user profile image
- **Parameters**: FormData with image file
- **Response**: Upload status
- **Used in**: `src/pages/admin/MemberDetail_Admin.jsx`

#### POST `/userDetail/upload_company_logo`
- **Purpose**: Upload company logo
- **Parameters**: FormData with image file
- **Response**: Upload status
- **Used in**: `src/pages/admin/MemberDetail_Admin.jsx`

#### POST `/UserDetail/activate_membership`
- **Purpose**: Activate user membership
- **Request Body**:
  ```json
  {
    "company_detail_id": "string",
    "membership_plan_id": "string",
    "valid_upto": "string" // Date in YYYY-MM-DD format
  }
  ```
- **Response**: 
  ```json
  {
    "status": "success",
    "message": "string"
  }
  ```
- **Used in**: `src/pages/admin/MembershipExpired_Admin.jsx`

### Document Management

#### GET `/UserDetail/getDocType`
- **Purpose**: Get document types
- **Parameters**: None
- **Response**: Array of document types
- **Used in**: `src/pages/admin/MemberDetail_Admin.jsx`, `src/pages/admin/DocumentType_Admin.jsx`

#### GET `/UserDetail/getuserdocs/{memberId}`
- **Purpose**: Get user documents by member ID
- **Parameters**: 
  - `memberId` (path parameter): Member ID
- **Response**: Array of user documents
- **Used in**: `src/pages/admin/MemberDetail_Admin.jsx`, `src/pages/user/MemberDetail_User.jsx`

#### POST `/UserDetail/update_docs_status`
- **Purpose**: Update document approval status
- **Parameters**: Document status update data
- **Response**: Update status
- **Used in**: `src/pages/admin/MemberDetail_Admin.jsx`

#### POST `/userDetail/reject_document`
- **Purpose**: Reject a document
- **Parameters**: Document rejection data
- **Response**: Rejection status
- **Used in**: `src/pages/admin/MemberDetail_Admin.jsx`

#### POST `/GroupSettings/document_upload`
- **Purpose**: Upload company documents
- **Parameters**: FormData with document file
- **Response**: Upload status
- **Used in**: `src/pages/admin/MemberDetail_Admin.jsx`

#### POST `/GroupSettings/document_user_upload`
- **Purpose**: Upload personal documents
- **Parameters**: FormData with document file
- **Response**: Upload status
- **Used in**: `src/pages/admin/MemberDetail_Admin.jsx`

#### DELETE `/GroupSettings/delete_document/{docTypeId}`
- **Purpose**: Delete document type
- **Parameters**:
  - `docTypeId` (path parameter): Document type ID
- **Response**: Deletion status
- **Used in**: `src/pages/admin/DocumentType_Admin.jsx`

#### PUT `/GroupSettings/edit_document/{docTypeId}`
- **Purpose**: Edit document type
- **Parameters**:
  - `docTypeId` (path parameter): Document type ID
  - Document type data
- **Response**: Update status
- **Used in**: `src/pages/admin/DocumentType_Admin.jsx`

#### POST `/GroupSettings/documentType_upload`
- **Purpose**: Upload new document type
- **Parameters**: Document type data
- **Response**: Upload status
- **Used in**: `src/pages/admin/DocumentType_Admin.jsx`

### Group Settings

#### POST `/groupSettings`
- **Purpose**: Get group settings
- **Parameters**: None
- **Response**: Group settings data
- **Used in**: `src/context/DashboardContext.jsx`, `src/context/GroupDataContext.jsx`, `src/pages/admin/GroupData_Admin.jsx`

#### POST `/groupSettings/update`
- **Purpose**: Update group settings
- **Parameters**: Updated group settings data
- **Response**: Update status
- **Used in**: `src/context/GroupDataContext.jsx`

#### POST `/GroupSettings/upload_logo`
- **Purpose**: Upload group logo
- **Parameters**: FormData with logo file
- **Response**: Upload status
- **Used in**: `src/pages/admin/GroupData_Admin.jsx`

#### POST `/groupSettings/upload_signature`
- **Purpose**: Upload group signature
- **Parameters**: FormData with signature file
- **Response**: Upload status
- **Used in**: `src/pages/admin/GroupData_Admin.jsx`

#### POST `/groupSettings/master_data`
- **Purpose**: Update master data
- **Parameters**: Master data payload
- **Response**: Update status
- **Used in**: `src/pages/admin/GroupData_Admin.jsx`

#### POST `/groupSettings/get_user_additional_fields`
- **Purpose**: Get user additional fields
- **Parameters**: None
- **Response**: Array of user additional fields
- **Used in**: `src/pages/admin/MemberDetail_Admin.jsx`, `src/pages/admin/MembershipExpired_Admin.jsx`, `src/pages/admin/NewRegistration_Admin.jsx`

#### POST `/groupSettings/get_company_additional_fields`
- **Purpose**: Get company additional fields
- **Parameters**: None
- **Response**: Array of company additional fields
- **Used in**: `src/pages/admin/MemberDetail_Admin.jsx`, `src/pages/admin/NewRegistration_Admin.jsx`

#### GET `/groupSettings/get_membership_plans`
- **Purpose**: Get membership plans
- **Parameters**: None
- **Response**: Array of membership plans
- **Used in**: `src/pages/admin/MemberDetail_Admin.jsx`, `src/pages/admin/MembershipExpired_Admin.jsx`

### Events Management

#### POST `/event/index`
- **Purpose**: Get all events
- **Request Body**: `{}`
- **Response**: 
  ```json
  {
    "data": {
      "event": [
        {
          "id": "string",
          "event": "string", // Event title
          "agenda": "string",
          "venue": "string",
          "date": "string",
          "time": "string",
          "reminder": "string",
          "sendReminderTo": "string",
          "invitationImage": "string",
          "imageUrl": "string"
        }
      ]
    }
  }
  ```
- **Used in**: `src/context/DashboardContext.jsx`, `src/pages/admin/AllEvents_Admin.jsx`, `src/pages/admin/Calendar_Admin.jsx`, `src/pages/user/Calendar_User.jsx`

#### POST `/event/past`
- **Purpose**: Get past events
- **Parameters**: None
- **Response**: Array of past events
- **Used in**: `src/context/DashboardContext.jsx`, `src/pages/admin/PastEvents_Admin.jsx`, `src/pages/admin/Calendar_Admin.jsx`, `src/pages/user/Calendar_User.jsx`

#### POST `/event/future`
- **Purpose**: Get upcoming events
- **Parameters**: None
- **Response**: Array of upcoming events
- **Used in**: `src/context/DashboardContext.jsx`, `src/pages/admin/UpcomingEventsPage_Admin.jsx`, `src/pages/admin/Calendar_Admin.jsx`, `src/pages/user/Calendar_User.jsx`

#### POST `/event/remove`
- **Purpose**: Remove an event
- **Parameters**:
  - `id` (string): Event ID
- **Response**: Removal status
- **Used in**: `src/pages/admin/PastEvents_Admin.jsx`

#### DELETE `/event/{eventId}`
- **Purpose**: Delete an event
- **Parameters**:
  - `eventId` (path parameter): Event ID
- **Response**: Deletion status
- **Used in**: `src/pages/admin/PastEvents_Admin.jsx`

### Payment Management

#### POST `/payment_detail`
- **Purpose**: Get payment details
- **Parameters**: None
- **Response**: Array of payment details
- **Used in**: `src/pages/admin/MemberDetail_Admin.jsx`, `src/pages/admin/PaymentDetails_Admin.jsx`

#### POST `/payment_detail/getbankdetails`
- **Purpose**: Get bank details
- **Parameters**: None
- **Response**: Array of bank details
- **Used in**: `src/pages/admin/MemberDetail_Admin.jsx`, `src/pages/admin/PaymentDetails_Admin.jsx`

#### GET `/payment_detail/getmodes`
- **Purpose**: Get payment modes
- **Parameters**: None
- **Response**: Array of payment modes
- **Used in**: `src/pages/admin/MemberDetail_Admin.jsx`, `src/pages/admin/MembershipExpired_Admin.jsx`

#### POST `/payment_detail/add`
- **Purpose**: Add new payment
- **Request Body**:
  ```json
  {
    "company_detail_id": "string",
    "membership_plan_id": "string",
    "payment_mode": "string",
    "bank_name": "string",
    "cheque_amount": "string",
    "cheque_no": "string",
    "valid_upto": "string",
    "valid_till": "string",
    "price": "string",
    "plan": "string"
  }
  ```
- **Response**: 
  ```json
  {
    "status": "success",
    "message": "string"
  }
  ```
- **Used in**: `src/pages/admin/MemberDetail_Admin.jsx`, `src/pages/admin/MembershipExpired_Admin.jsx`

#### POST `/payment_detail/edit`
- **Purpose**: Edit payment details
- **Parameters**: Updated payment data
- **Response**: Update status
- **Used in**: `src/pages/admin/PaymentDetails_Admin.jsx`

#### POST `/payment_detail/delete`
- **Purpose**: Delete payment
- **Parameters**: Payment deletion data
- **Response**: Deletion status
- **Used in**: `src/pages/admin/MemberDetail_Admin.jsx`, `src/pages/admin/PaymentDetails_Admin.jsx`

### Product & Services

#### GET `/product/get_product_details_by_id/{memberId}`
- **Purpose**: Get product details by member ID
- **Parameters**:
  - `memberId` (path parameter): Member ID
- **Response**: Product details
- **Used in**: `src/pages/admin/MemberDetail_Admin.jsx`

#### POST `/product/add_product_by_admin/{memberId}`
- **Purpose**: Add product by admin for member
- **Path Parameters**:
  - `memberId` (string): Member ID
- **Request Body** (FormData):
  ```
  hsnCode: string
  productName: string
  productDescription: string
  productImage: File (optional)
  ```
- **Response**: 
  ```json
  {
    "status": "success",
    "message": "string"
  }
  ```
- **Used in**: `src/pages/admin/MemberDetail_Admin.jsx`

#### POST `/product/view_enquiry`
- **Purpose**: Get received enquiries
- **Parameters**: None
- **Response**: Array of received enquiries
- **Used in**: `src/context/DashboardContext.jsx`

#### POST `/product/enquiry_index`
- **Purpose**: Get completed enquiries
- **Parameters**: None
- **Response**: Array of completed enquiries
- **Used in**: `src/context/DashboardContext.jsx`

### Notifications & Circulars

#### POST `/notifications/get_all_circulars`
- **Purpose**: Get all circulars
- **Parameters**: None
- **Response**: Array of circulars
- **Used in**: `src/pages/admin/Circulars_Admin.jsx`

#### POST `/notifications/add_circular`
- **Purpose**: Add new circular
- **Parameters**: FormData with circular data
- **Response**: Add status
- **Used in**: `src/pages/admin/Circulars_Admin.jsx`

#### POST `/notifications/edit_circular`
- **Purpose**: Edit circular
- **Parameters**: FormData with updated circular data
- **Response**: Update status
- **Used in**: `src/pages/admin/Circulars_Admin.jsx`

#### DELETE `/notifications/delete_circular/{id}`
- **Purpose**: Delete circular
- **Parameters**:
  - `id` (path parameter): Circular ID
- **Response**: Deletion status
- **Used in**: `src/pages/admin/Circulars_Admin.jsx`

#### POST `/notifications/delete_circular/{id}`
- **Purpose**: Delete circular (alternative method)
- **Parameters**:
  - `id` (path parameter): Circular ID
  - FormData
- **Response**: Deletion status
- **Used in**: `src/pages/admin/Circulars_Admin.jsx`

### Grievances

#### GET `/grievances`
- **Purpose**: Get pending grievances
- **Parameters**: None
- **Response**: Array of pending grievances
- **Used in**: `src/pages/admin/GrievancesPending_Admin.jsx`

#### GET `/grievances/activegrievances`
- **Purpose**: Get active grievances
- **Parameters**: None
- **Response**: Array of active grievances
- **Used in**: `src/pages/admin/GrievancesActive_Admin.jsx`

#### GET `/grievances/closedGrievances`
- **Purpose**: Get closed grievances
- **Parameters**: None
- **Response**: Array of closed grievances
- **Used in**: `src/pages/admin/GrievancesClosed_Admin.jsx`

#### POST `grievances/update_status`
- **Purpose**: Update grievance status
- **Parameters**: Grievance status update data
- **Response**: Update status
- **Used in**: `src/pages/admin/GrievancesPending_Admin.jsx`, `src/pages/admin/GrievancesActive_Admin.jsx`, `src/pages/admin/GrievancesClosed_Admin.jsx`

### Feedback

#### POST `/attendance/get_feedback`
- **Purpose**: Get feedback data
- **Parameters**: None
- **Response**: Array of feedback
- **Used in**: `src/pages/admin/Feedbacks_Admin.jsx`

### Attendance

#### GET `/attendance/get_active_members`
- **Purpose**: Get active members for attendance
- **Parameters**: None
- **Response**: Array of active members
- **Used in**: `src/pages/admin/Attendance_Admin.jsx`

#### POST `/attendance/get_active_members_by_event`
- **Purpose**: Get active members by event
- **Parameters**: Event data
- **Response**: Array of active members for specific event
- **Used in**: `src/pages/admin/Attendance_Admin.jsx`, `src/pages/admin/AttendanceList_Admin.jsx`

#### POST `/attendance/add_attendance`
- **Purpose**: Add attendance record
- **Parameters**: Attendance data
- **Response**: Add status
- **Used in**: `src/pages/admin/Attendance_Admin.jsx`

#### POST `/attendance/add_all_attendance`
- **Purpose**: Add multiple attendance records
- **Parameters**: Multiple attendance data
- **Response**: Add status
- **Used in**: `src/pages/admin/Attendance_Admin.jsx`

#### POST `/attendance/uploadsheet`
- **Purpose**: Upload attendance sheet
- **Parameters**: FormData with attendance sheet
- **Response**: Upload status
- **Used in**: `src/components/admin/UploadAttendanceModal.jsx`

### Resume Management

#### POST `/resume`
- **Purpose**: Get resume data
- **Parameters**: None
- **Response**: Array of resume data
- **Used in**: `src/pages/admin/Resume_Admin.jsx`

#### POST `/resume/add`
- **Purpose**: Add resume
- **Parameters**: FormData with resume data
- **Response**: Add status
- **Used in**: `src/pages/admin/Resume_Admin.jsx`

#### POST `/resume/delete`
- **Purpose**: Delete resume
- **Parameters**:
  - `id` (string): Resume ID
- **Response**: Deletion status
- **Used in**: `src/pages/admin/Resume_Admin.jsx`

### User Roles

#### POST `/userRole`
- **Purpose**: Get user roles
- **Parameters**: None
- **Response**: Array of user roles
- **Used in**: `src/pages/admin/MemberDetail_Admin.jsx`, `src/pages/admin/UserRoles_Admin.jsx`

#### POST `/userRole/add_role`
- **Purpose**: Add new user role
- **Request Body**:
  ```json
  {
    "name": "string" // Role name
  }
  ```
- **Response**: 
  ```json
  {
    "status": "success",
    "message": "string"
  }
  ```
- **Used in**: `src/pages/admin/UserRoles_Admin.jsx`

### Contacts

#### GET `/contact`
- **Purpose**: Get important contacts
- **Parameters**: None
- **Response**: Array of contacts
- **Used in**: `src/context/DashboardContext.jsx`

### Event Management (Fetch API)

#### POST `/api/event/add`
- **Purpose**: Add new event (using fetch)
- **Parameters**: Event data
- **Response**: Add status
- **Used in**: `src/pages/admin/AllEvents_Admin.jsx`, `src/pages/admin/Calendar_Admin.jsx`, `src/pages/admin/PastEvents_Admin.jsx`, `src/pages/admin/UpcomingEventsPage_Admin.jsx`

#### POST `/api/event/edit`
- **Purpose**: Edit event (using fetch)
- **Parameters**: Updated event data
- **Response**: Update status
- **Used in**: `src/pages/admin/AllEvents_Admin.jsx`, `src/pages/admin/Calendar_Admin.jsx`, `src/pages/admin/PastEvents_Admin.jsx`, `src/pages/admin/UpcomingEventsPage_Admin.jsx`

#### POST `/api/event/remove`
- **Purpose**: Remove event (using fetch)
- **Parameters**: Event removal data
- **Response**: Removal status
- **Used in**: `src/pages/admin/AllEvents_Admin.jsx`, `src/pages/admin/Calendar_Admin.jsx`, `src/pages/admin/UpcomingEventsPage_Admin.jsx`

## Notes

1. **Authentication**: Most endpoints require authentication via Bearer token in the Authorization header.

2. **Headers**: All requests include standard headers from `getAuthHeaders()` utility function.

3. **File Uploads**: File upload endpoints use FormData and automatically remove Content-Type header to let the browser set it with boundary.

4. **Error Handling**: The project includes response interceptors to handle malformed responses that might contain PHP errors mixed with JSON.

5. **Base URL**: The API base URL is configured as `/api` which acts as a proxy in development.

6. **Environment Variables**: The following environment variables are required:
   - `VITE_CLIENT_SERVICE`
   - `VITE_AUTH_KEY`
   - `VITE_RURL`
   - `VITE_API_BASE_URL`

7. **Mixed API Usage**: The project uses both Axios (api instance) and native fetch for different endpoints, particularly for event management operations.

8. **Response Format**: Most endpoints return data in a consistent format with `data` property containing the actual response data.

9. **Caching**: The project implements caching mechanisms in the DashboardContext to optimize API calls and reduce server load.

10. **File Downloads**: Some endpoints are used for file downloads (like circulars) using fetch API for binary data handling.

## Field Mappings and Data Structures

### User Profile Fields
```json
{
  "id": "string",                    // User ID
  "name": "string",                  // Full name
  "email": "string",                 // Email address
  "phone_num": "string",             // Phone number
  "password": "string",              // Password (encrypted)
  "temp_password": "string",         // Temporary password
  "address": "string",               // Address
  "city": "string",                  // City
  "district": "string",              // District
  "state": "string",                 // State
  "country": "string",               // Country
  "pincode": "string",               // Pincode
  "area_id": "string",               // State ID (used in API)
  "role_id": "string",               // Role ID
  "user_role_id": "string",          // User role ID
  "is_active": "string",             // Active status ("1" or "0")
  "profile_image": "string",         // Profile image URL
  "lct": "string",                   // Last created/updated timestamp
  "company_detail_id": "string",     // Company detail ID
  "user_detail_id": "string",        // User detail ID
  "ad1": "string",                   // Additional field 1
  "ad2": "string",                   // Additional field 2
  "ad3": "string",                   // Additional field 3
  "ad4": "string",                   // Additional field 4
  "ad5": "string",                   // Additional field 5
  "ad6": "string",                   // Additional field 6
  "ad7": "string",                   // Additional field 7
  "ad8": "string",                   // Additional field 8
  "ad9": "string",                   // Additional field 9
  "ad10": "string"                   // Additional field 10
}
```

### Company Profile Fields
```json
{
  "company_name": "string",          // Company name
  "company_email": "string",         // Company email
  "company_contact": "string",       // Company contact number
  "company_address": "string",       // Company address
  "user_detail_id": "string",        // Associated user detail ID
  "city": "string",                  // City
  "district": "string",              // District
  "state": "string",                 // State
  "country": "string",               // Country
  "pincode": "string"                // Pincode
}
```

### Event Fields
```json
{
  "id": "string",                    // Event ID
  "event": "string",                 // Event title
  "agenda": "string",                // Event agenda
  "venue": "string",                 // Event venue
  "date": "string",                  // Event date
  "time": "string",                  // Event time
  "reminder": "string",              // Reminder setting ("Yes"/"No")
  "sendReminderTo": "string",        // Reminder recipient
  "invitationImage": "File",         // Invitation image file
  "imageUrl": "string"               // Invitation image URL
}
```

### Payment Fields
```json
{
  "id": "string",                    // Payment ID
  "company_detail_id": "string",     // Company detail ID
  "membership_plan_id": "string",    // Membership plan ID
  "payment_mode": "string",          // Payment mode
  "bank_name": "string",             // Bank name
  "cheque_amount": "string",         // Cheque amount
  "cheque_no": "string",             // Cheque number
  "valid_upto": "string",            // Valid until date
  "valid_till": "string",            // Valid till date
  "price": "string",                 // Price
  "plan": "string",                  // Plan name
  "date": "string",                  // Payment date
  "amount": "string",                // Amount
  "status": "string",                // Payment status
  "updated_date": "string",          // Last updated date
  "updated_by": "string"             // Updated by user
}
```

### Product Fields
```json
{
  "id": "string",                    // Product ID
  "hsnCode": "string",               // HSN code
  "hsn_code": "string",              // HSN code (backend field)
  "productName": "string",           // Product name
  "product": "string",               // Product name (backend field)
  "productDescription": "string",    // Product description
  "description": "string",           // Description (backend field)
  "productImage": "File",            // Product image file
  "dtime": "string"                  // Date time
}
```

### Document Fields
```json
{
  "id": "string",                    // Document ID
  "document_type": "string",         // Document type
  "document_for": "string",          // Document for ("company"/"personal")
  "description": "string",           // Document description
  "file": "File",                    // Document file
  "status": "string",                // Document status
  "uploaded_date": "string"          // Upload date
}
```

### Role Fields
```json
{
  "id": "string",                    // Role ID
  "role_id": "string",               // Role ID (alternative)
  "name": "string",                  // Role name
  "role": "string",                  // Role name (alternative)
  "role_name": "string"              // Role name (alternative)
}
```

### Group Settings Fields
```json
{
  "name": "string",                  // Group name
  "email": "string",                 // Group email
  "logo": "string",                  // Logo URL
  "signature": "string",             // Signature URL
  "address": "string",               // Group address
  "contact": "string",               // Group contact
  "website": "string"                // Group website
}
```

### Enquiry Fields
```json
{
  "id": "string",                    // Enquiry ID
  "product_name": "string",          // Product name
  "product": "string",               // Product (alternative)
  "name": "string",                  // Name (alternative)
  "title": "string",                 // Title (alternative)
  "product_description": "string",   // Product description
  "description": "string",           // Description (alternative)
  "details": "string",               // Details (alternative)
  "desc": "string",                  // Description (alternative)
  "hsn_code": "string",              // HSN code
  "hsn": "string",                   // HSN (alternative)
  "dtime": "string"                  // Date time
}
```

### Grievance Fields
```json
{
  "id": "string",                    // Grievance ID
  "title": "string",                 // Grievance title
  "description": "string",           // Grievance description
  "status": "string",                // Grievance status
  "priority": "string",              // Priority level
  "created_date": "string",          // Created date
  "updated_date": "string",          // Updated date
  "assigned_to": "string"            // Assigned to user
}
```

### Attendance Fields
```json
{
  "id": "string",                    // Attendance ID
  "event_id": "string",              // Event ID
  "member_id": "string",             // Member ID
  "status": "string",                // Attendance status
  "check_in_time": "string",         // Check-in time
  "check_out_time": "string",        // Check-out time
  "notes": "string"                  // Notes
}
```

### Resume Fields
```json
{
  "id": "string",                    // Resume ID
  "title": "string",                 // Resume title
  "description": "string",           // Resume description
  "file": "File",                    // Resume file
  "uploaded_date": "string"          // Upload date
}
```

### Circular Fields
```json
{
  "id": "string",                    // Circular ID
  "title": "string",                 // Circular title
  "content": "string",               // Circular content
  "attachment": "File",              // Circular attachment
  "created_date": "string",          // Created date
  "updated_date": "string"           // Updated date
}
```

### Contact Fields
```json
{
  "id": "string",                    // Contact ID
  "contact_id": "string",            // Contact ID (alternative)
  "name": "string",                  // Contact name
  "person_name": "string",           // Person name (alternative)
  "contact_name": "string",          // Contact name (alternative)
  "contactName": "string",           // Contact name (alternative)
  "contact": "string",               // Contact number
  "phone": "string",                 // Phone (alternative)
  "phone_number": "string",          // Phone number (alternative)
  "mobile": "string",                // Mobile (alternative)
  "contact_number": "string",        // Contact number (alternative)
  "contact_no": "string",            // Contact no (alternative)
  "email": "string",                 // Email
  "email_address": "string",         // Email address (alternative)
  "contact_email": "string",         // Contact email (alternative)
  "email_id": "string",              // Email ID (alternative)
  "address": "string",               // Address
  "location": "string",              // Location (alternative)
  "contact_address": "string",       // Contact address (alternative)
  "address_line": "string",          // Address line (alternative)
  "dept": "string",                  // Department
  "department": "string",            // Department (alternative)
  "role": "string",                  // Role (alternative)
  "contact_department": "string"     // Contact department (alternative)
}
```
