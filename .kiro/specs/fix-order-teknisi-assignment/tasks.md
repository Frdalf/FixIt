# Implementation Plan: Teknisi Assignment System Improvements

## Overview

This implementation plan addresses critical failures in the order-to-technician assignment system by introducing multi-tiered fallback strategies, manual assignment capabilities, and enhanced error handling. The tasks are organized into three priority phases: critical must-haves, important should-haves, and nice-to-have optional features.

## Tasks

### Phase 1: Critical - Must Have

- [x] 1. Refactor auto-assignment engine with fallback strategies
  - [x] 1.1 Enhance autoAssign.ts with multi-tiered filtering
    - Implement strict filter (status='tersedia', matching specializations, valid coordinates)
    - Implement status fallback (include all active statuses when no 'tersedia' technicians found)
    - Implement specialization fallback (remove specialization requirement when no matches)
    - Implement coordinate fallback (allow null/zero coordinates with maximum distance value)
    - Add detailed logging for each filtering step with technician counts
    - _Requirements: 1.1, 1.2, 1.3, 7.1, 7.2, 7.3, 7.4, 8.1, 8.2_
  
  - [x] 1.2 Enhance distance calculation function
    - Modify `calculateDistance` to handle null/zero coordinates
    - Return configurable maximum distance (999999 km) for invalid coordinates
    - Add logging for coordinate validation results
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [x] 1.3 Update autoAssignTechnician interface and return structure
    - Add `AutoAssignOptions` interface with orderId, enableFallbacks, maxDistance, logLevel
    - Add `AutoAssignResult` interface with success, message, assignedTechnicianId, distance, fallbacksUsed, techniciansConsidered, filterSteps
    - Add `FilterStep` interface for detailed logging
    - Return structured error information instead of throwing exceptions
    - _Requirements: 1.4, 1.5, 4.2, 4.3, 4.6_
  
  - [ ] 1.4 Write unit tests for autoAssign fallback logic
    - Test strict filter with matching technicians
    - Test status fallback triggers when no 'tersedia' technicians
    - Test specialization fallback triggers when no matching specializations
    - Test coordinate fallback handles null/zero coordinates
    - Test distance calculation with valid and invalid coordinates
    - Test final failure returns correct error structure
    - _Requirements: 1.1, 1.2, 1.3, 7.1, 7.2, 7.3, 7.4_

- [x] 2. Enhance payment webhook error handling
  - [x] 2.1 Wrap auto-assignment in try-catch block
    - Update `app/api/payments/webhook/route.ts`
    - Catch all exceptions from autoAssignTechnician call
    - Never throw errors that would fail the webhook
    - Always return HTTP 200 to prevent payment gateway retries
    - _Requirements: 5.1, 5.4_
  
  - [x] 2.2 Handle assignment failure gracefully in webhook
    - Set order status to 'menunggu' when auto-assignment fails (not 'dikonfirmasi')
    - Log assignment failure with detailed context (order ID, error message, fallback attempts)
    - Create system notification for admins when assignment fails
    - Include assignment result in webhook response body
    - _Requirements: 5.2, 5.3, 5.5_
  
  - [ ] 2.3 Write integration tests for webhook error handling
    - Test webhook continues after assignment failure
    - Test webhook creates admin notification on failure
    - Test webhook sets order to 'menunggu' on failure
    - Test webhook returns 200 even when assignment fails
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 3. Implement admin notification system for assignment failures
  - [x] 3.1 Create system notification on assignment failure
    - Insert notification with user_id=null (visible to all admins)
    - Set type='system' and include order ID in related_id
    - Include detailed error message from AutoAssignResult
    - Set title to 'Assignment Failed' or 'Assignment Error'
    - _Requirements: 4.4, 5.3_
  
  - [x] 3.2 Display system notifications in admin dashboard
    - Modify `app/admin/page.tsx` to query system notifications
    - Filter for notifications with user_id=null and type='system'
    - Display in notification panel with badge/alert styling
    - Sort by created_at descending
    - Limit to 50 most recent notifications
    - _Requirements: 4.4, 4.5_

- [~] 4. Checkpoint - Verify Phase 1 critical functionality
  - Test auto-assignment with various fallback scenarios
  - Test payment webhook continues after assignment failure
  - Verify admin notifications appear in dashboard
  - Ensure all tests pass, ask the user if questions arise

### Phase 2: Important - Should Have

- [ ] 5. Implement manual assignment UI in admin dashboard
  - [~] 5.1 Create ManualAssignmentPanel component
    - Build technician selection dropdown showing all active technicians
    - Display technician full_name, status badge, specializations list
    - Calculate and display distance from order location (if coordinates available)
    - Sort technicians by: status (tersedia first), distance, then name
    - Add filtering/search capability for large technician lists
    - _Requirements: 2.1, 2.2_
  
  - [~] 5.2 Create confirmation dialog for manual assignment
    - Display selected technician details (name, status, specializations)
    - Display order details for context (service type, location)
    - Show warning badge if technician status is not 'tersedia'
    - Add "Confirm Assignment" and "Cancel" buttons
    - _Requirements: 2.3_
  
  - [~] 5.3 Implement manual assignment backend logic
    - Update order: set teknisi_id, status='dikonfirmasi', scheduled_at=now
    - Update technician profile: set status='bertugas'
    - Create notifications for both customer and assigned technician
    - Initialize chat session between customer and technician
    - Log manual assignment attempt in assignment_logs (if table exists)
    - _Requirements: 2.4, 2.5, 2.6_
  
  - [~] 5.4 Integrate ManualAssignmentPanel into admin orders page
    - Add "Assign Technician" button for orders with status='menunggu'
    - Fetch all active technicians when button clicked
    - Show ManualAssignmentPanel in modal or expandable section
    - Display success/error toast notifications after assignment
    - Refresh orders list after successful assignment
    - _Requirements: 2.1, 2.5_
  
  - [ ] 5.5 Write unit tests for manual assignment
    - Test manual assignment updates order status to 'dikonfirmasi'
    - Test manual assignment updates technician status to 'bertugas'
    - Test manual assignment creates notifications
    - Test manual assignment initializes chat session
    - Test error handling for invalid order or technician ID
    - _Requirements: 2.4, 2.5, 2.6_

- [ ] 6. Create test-assign endpoint for debugging
  - [~] 6.1 Implement POST /api/admin/test-assign endpoint
    - Create new file: `app/api/admin/test-assign/route.ts`
    - Verify admin authentication using Supabase auth
    - Parse request body for orderId and enableFallbacks parameters
    - Validate order exists and has status='menunggu'
    - Return 401 for unauthenticated requests
    - Return 403 for non-admin users
    - Return 404 if order not found
    - Return 400 if order status is not 'menunggu'
    - _Requirements: 3.1, 3.2_
  
  - [~] 6.2 Trigger auto-assignment with detailed logging
    - Call autoAssignTechnician with logLevel='debug'
    - Return full AutoAssignResult including filterSteps array
    - Include techniciansConsidered, fallbacksUsed, and distance in response
    - Add timestamp to response
    - Log test-assign attempts for audit trail
    - _Requirements: 3.3, 3.4, 3.5_
  
  - [~] 6.3 Add "Debug Auto-Assign" button to admin orders UI
    - Add button next to manual assignment for 'menunggu' orders
    - Call /api/admin/test-assign endpoint when clicked
    - Display detailed debug information in console
    - Show success/failure toast notification
    - Refresh orders list after successful assignment
    - _Requirements: 3.3, 3.4, 3.5_
  
  - [ ] 6.4 Write tests for test-assign endpoint
    - Test endpoint requires admin authentication
    - Test endpoint requires valid order ID
    - Test endpoint only works with 'menunggu' orders
    - Test endpoint returns detailed debug information
    - Test endpoint triggers auto-assignment
    - _Requirements: 3.1, 3.2, 3.3_

- [~] 7. Checkpoint - Verify Phase 2 functionality
  - Test manual assignment from admin dashboard
  - Test debug auto-assign button shows detailed logs
  - Verify technician selection UI displays correctly
  - Ensure all tests pass, ask the user if questions arise

### Phase 3: Nice to Have - Optional

- [ ] 8. Create assignment_logs database table for audit trail
  - [~] 8.1 Write SQL migration for assignment_logs table
    - Create table with columns: id, order_id, assigned_technician_id, result, distance, fallbacks_used, filter_steps (jsonb), error_message, created_at
    - Add foreign key constraints to orders and profiles tables
    - Create indexes on order_id and assigned_technician_id
    - Enable row-level security (RLS)
    - Add RLS policy for admins to view all logs
    - Add RLS policy for system to insert logs
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [~] 8.2 Implement logAssignment function
    - Create function to insert assignment log records
    - Call from autoAssignTechnician on success and failure
    - Call from manual assignment handler
    - Include full filterSteps array as JSONB
    - Handle errors gracefully (don't fail assignment if logging fails)
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [ ] 8.3 Write tests for assignment logging
    - Test assignment_logs records all attempts
    - Test filter_steps JSONB structure is correct
    - Test logging doesn't break assignment on failure
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 9. Add debug logging UI to admin dashboard
  - [~] 9.1 Create AssignmentLogsTable component
    - Query assignment_logs table for recent attempts
    - Display table with columns: timestamp, order_id, result, technician, distance, fallbacks_used
    - Add expandable row to show full filter_steps details
    - Filter by order_id, result (success/failure), or date range
    - Paginate results (50 per page)
    - _Requirements: 4.1, 4.2, 4.3, 4.6_
  
  - [~] 9.2 Add assignment logs panel to admin dashboard
    - Add new tab or section in admin dashboard for assignment logs
    - Display AssignmentLogsTable component
    - Add export to CSV functionality for debugging
    - Link order_id to order detail page
    - Link technician to technician profile page
    - _Requirements: 4.1, 4.2, 4.3, 4.6_

- [~] 10. Final checkpoint - Verify all functionality
  - Test all fallback strategies with various scenarios
  - Test manual assignment end-to-end
  - Test debug endpoint returns detailed information
  - Verify assignment logs are created and viewable
  - Run full test suite
  - Ensure all tests pass, ask the user if questions arise

## Implementation Notes

### Phase Priority Rationale

**Phase 1 (Critical):**
- Fixes the core issue: orders getting stuck in 'menunggu' state
- Ensures no orders are lost due to assignment or webhook failures
- Provides immediate visibility to admins when problems occur

**Phase 2 (Important):**
- Provides workaround for edge cases via manual assignment
- Adds debugging tools for diagnosing assignment issues
- Improves admin workflow and reduces manual intervention time

**Phase 3 (Optional):**
- Adds comprehensive audit trail for long-term debugging and analytics
- Provides historical analysis capabilities
- Not required for immediate functionality but valuable for maintenance

### Key Technical Decisions

1. **TypeScript/Next.js**: All implementation uses TypeScript with Next.js App Router
2. **Supabase**: Database operations use Supabase client
3. **Error Handling**: Never throw errors in webhook context; always return structured results
4. **Logging**: Use console logging for development; optional database table for production
5. **Testing**: Property-based tests are not applicable here (no universal properties); use unit and integration tests

### Testing Strategy

- **Unit Tests**: Test individual functions (autoAssign logic, distance calculations, coordinate handling)
- **Integration Tests**: Test end-to-end flows (payment → assignment, manual assignment)
- **Manual Testing**: Verify UI components and admin dashboard interactions
- Tasks marked with `*` are optional and can be skipped for faster MVP delivery

### Backward Compatibility

All changes are non-breaking:
- Existing autoAssign function signature remains compatible
- No changes to customer-facing or technician-facing flows
- Database changes are additive (assignment_logs table is optional)
- Webhook continues to work with existing payment gateway integration
