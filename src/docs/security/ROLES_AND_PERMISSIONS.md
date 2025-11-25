# WasteDB Roles and Permissions

## Overview

WasteDB now implements a role-based access control (RBAC) system to secure the API and manage user permissions.

## Roles

### User (Default)
- Can view all materials
- Can read material data
- Cannot create, update, or delete materials
- Cannot access user management

### Admin
- Full access to all features
- Can create, update, and delete materials
- Can access the "Manage Data" interface
- Can access the "User Admin" interface
- Can manage user roles and perform CRUD operations on users

## Special Admin Assignment

The user **Nao (natto@wastefull.org)** is automatically assigned the **Admin** role upon first login.

## User Management

Admins can access the User Management interface by:
1. Enabling ADMIN mode (button in top-right, only visible for @wastefull.org emails)
2. Clicking the "User Admin" button on the main materials page

### User Management Features

Admins can:
- **View all users**: See email, name, role, creation date, and last sign-in
- **Update user roles**: Change users between 'user' and 'admin' roles
- **Edit user details**: Update name, email, and password
- **Delete users**: Remove users from the system (cannot delete yourself)

## API Endpoints

### Protected Endpoints (Require Authentication)

- `GET /materials` - Read materials (all authenticated users)
- `GET /users/me/role` - Get current user's role (all authenticated users)

### Admin-Only Endpoints

Materials:
- `POST /materials` - Create material
- `POST /materials/batch` - Batch create materials
- `PUT /materials/:id` - Update material
- `DELETE /materials/:id` - Delete material
- `DELETE /materials` - Delete all materials

User Management:
- `GET /users` - List all users
- `PUT /users/:id/role` - Update user role
- `PUT /users/:id` - Update user details
- `DELETE /users/:id` - Delete user

## Technical Implementation

### Server-Side

The server implements two middleware functions:
1. `verifyAuth` - Verifies JWT token and extracts user information
2. `verifyAdmin` - Checks user role from KV store and ensures admin privileges

User roles are stored in the KV store with the key pattern: `user_role:{userId}`

### Client-Side

The frontend:
- Stores JWT access token in sessionStorage
- Sends the token in the Authorization header for all API requests
- Checks user email domain for @wastefull.org to show admin UI controls
- Fetches user role from server to determine permissions

## Security Notes

- All material CRUD operations (except Read) require admin role
- Users cannot delete their own accounts through the admin interface
- Role changes take effect immediately
- The public anon key is accepted for backward compatibility but should not be used for production
