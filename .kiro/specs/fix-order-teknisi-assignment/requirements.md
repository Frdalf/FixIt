# Requirements Document

## Introduction

This document specifies requirements for fixing the technician assignment system in the FixIT application. The current system fails to assign technicians to customer orders when the payment webhook fails or when no technicians match the strict filtering criteria. This results in orders being stuck in the "menunggu" (waiting) state with no technician assigned, causing poor customer experience.

## Glossary

- **Auto_Assign_System**: The automated system that matches and assigns technicians to customer orders based on availability, specialization, and location
- **Assignment_Engine**: The core algorithm that filters and ranks technicians for order assignment
- **Admin_Dashboard**: The web interface used by administrators to monitor and manage orders
- **Payment_Webhook**: The external callback from Midtrans payment gateway that triggers order processing
- **Teknisi_Profile**: The database record containing technician information including status, specializations, and location coordinates
- **Order**: A customer service request requiring technician assignment
- **Manual_Assignment**: The process where an administrator explicitly assigns a specific technician to an order
- **Fallback_Strategy**: A set of progressively relaxed filtering criteria used when strict filtering returns no results
- **Test_Endpoint**: An API endpoint used by administrators to trigger and debug auto-assignment logic
- **Assignment_Log**: Detailed logging output showing each step of the assignment process
- **Status_Notification**: A message sent to administrators when assignment operations fail

## Requirements

### Requirement 1: Flexible Auto-Assignment Logic

**User Story:** As a system, I want to use fallback strategies when strict filtering fails, so that orders have a higher chance of being assigned to a technician

#### Acceptance Criteria

1. WHEN no technicians have status "tersedia", THEN THE Assignment_Engine SHALL query all technicians with any active status
2. WHEN no technicians match the required specializations, THEN THE Assignment_Engine SHALL query all active technicians regardless of specialization
3. WHEN technician coordinates are null or zero, THEN THE Assignment_Engine SHALL assign a maximum distance value for distance calculations
4. WHEN assignment fails, THEN THE Assignment_Engine SHALL return a detailed error message indicating which filtering criteria failed
5. WHEN multiple fallback strategies are applied, THEN THE Assignment_Engine SHALL log each fallback attempt with its results

### Requirement 2: Manual Technician Assignment Interface

**User Story:** As an administrator, I want to manually assign technicians to orders, so that I can override automatic assignment when necessary

#### Acceptance Criteria

1. WHEN viewing an order with status "menunggu", THEN THE Admin_Dashboard SHALL display a list of all available technicians
2. WHEN displaying available technicians, THEN THE Admin_Dashboard SHALL show technician name, status, and specializations
3. WHEN an administrator clicks a technician selection, THEN THE Admin_Dashboard SHALL display a confirmation dialog before assignment
4. WHEN manual assignment is confirmed, THEN THE Assignment_Engine SHALL update the order status to "dikonfirmasi" and assign the selected technician
5. WHEN manual assignment completes successfully, THEN THE Admin_Dashboard SHALL refresh the order list and display a success notification
6. WHEN manual assignment is triggered, THEN THE Assignment_Engine SHALL update the assigned technician status to "bertugas"

### Requirement 3: Test and Debug Endpoint

**User Story:** As an administrator, I want to manually trigger auto-assignment for testing, so that I can debug assignment failures

#### Acceptance Criteria

1. THE Test_Endpoint SHALL accept POST requests to `/api/admin/test-assign`
2. WHEN a test-assign request is received, THEN THE Test_Endpoint SHALL require an orderId in the request body
3. WHEN the orderId is valid, THEN THE Test_Endpoint SHALL trigger the auto-assignment logic for that order
4. WHEN auto-assignment completes, THEN THE Test_Endpoint SHALL return a detailed response including success status, assigned technician ID, and error messages
5. WHEN auto-assignment fails, THEN THE Test_Endpoint SHALL return the specific reason for failure

### Requirement 4: Enhanced Logging and Notifications

**User Story:** As an administrator, I want detailed logs and notifications for assignment failures, so that I can diagnose and resolve issues quickly

#### Acceptance Criteria

1. WHEN auto-assignment starts, THEN THE Assignment_Engine SHALL log the order ID and required specializations
2. WHEN technicians are filtered, THEN THE Assignment_Engine SHALL log the count of technicians after each filtering step
3. WHEN distance calculations are performed, THEN THE Assignment_Engine SHALL log each technician's calculated distance
4. WHEN assignment fails, THEN THE Assignment_Engine SHALL create a notification record in the notifications table for administrators
5. WHEN assignment fails, THEN THE Admin_Dashboard SHALL display a toast notification with the failure reason
6. WHEN fallback strategies are used, THEN THE Assignment_Engine SHALL log which fallback was applied and why

### Requirement 5: Robust Payment Webhook Processing

**User Story:** As a system, I want to handle payment webhook failures gracefully, so that orders are not lost when webhooks fail

#### Acceptance Criteria

1. WHEN payment webhook triggers auto-assignment, THEN THE Payment_Webhook SHALL catch and log any exceptions from the auto-assignment process
2. WHEN auto-assignment fails during webhook processing, THEN THE Payment_Webhook SHALL set order status to "menunggu" instead of "dikonfirmasi"
3. WHEN auto-assignment fails during webhook processing, THEN THE Payment_Webhook SHALL create an admin notification with error details
4. WHEN auto-assignment fails, THEN THE Payment_Webhook SHALL return a successful webhook response to prevent payment gateway retries
5. IF auto-assignment fails, THEN THE Payment_Webhook SHALL log the failure reason for later manual resolution

### Requirement 6: Assignment Status Tracking

**User Story:** As a system, I want to track assignment attempts and their outcomes, so that administrators can review assignment history

#### Acceptance Criteria

1. WHEN auto-assignment is triggered, THEN THE Assignment_Engine SHALL record the attempt in the Assignment_Log
2. WHEN assignment succeeds, THEN THE Assignment_Log SHALL record the assigned technician ID and distance
3. WHEN assignment fails, THEN THE Assignment_Log SHALL record the failure reason and which filtering criteria were applied
4. WHEN fallback strategies are used, THEN THE Assignment_Log SHALL record which strategies were attempted

### Requirement 7: Coordinate Validation and Handling

**User Story:** As a system, I want to handle missing or invalid coordinates gracefully, so that technicians with incomplete location data can still be considered for assignment

#### Acceptance Criteria

1. WHEN a technician has null latitude or longitude, THEN THE Assignment_Engine SHALL treat the distance as a configurable maximum value
2. WHEN an order has null latitude or longitude, THEN THE Assignment_Engine SHALL treat the distance as a configurable maximum value
3. WHEN both technician and order coordinates are null, THEN THE Assignment_Engine SHALL allow the match but log a warning
4. WHEN coordinates are zero, THEN THE Assignment_Engine SHALL treat them the same as null coordinates

### Requirement 8: Specialization Matching Logic

**User Story:** As a system, I want to prioritize technicians with matching specializations but still consider non-matching technicians as a fallback, so that more orders can be successfully assigned

#### Acceptance Criteria

1. WHEN filtering technicians, THEN THE Assignment_Engine SHALL first query technicians matching required specializations
2. WHEN no technicians match required specializations, THEN THE Assignment_Engine SHALL query all active technicians as a fallback
3. WHEN multiple technicians are available, THEN THE Assignment_Engine SHALL sort by distance ascending regardless of specialization match
4. WHEN specialization fallback is used, THEN THE Assignment_Engine SHALL log which specializations were required and which technicians were ultimately considered
