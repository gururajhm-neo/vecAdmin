# Project ID Tracking & Customer Filtering

## Overview

The admin UI now automatically filters all data by `project_id` - the customer/project identifier stored in Weaviate objects. This ensures users only see data belonging to their assigned project.

## How It Works

### 1. **Data Structure in Weaviate**

All classes in Weaviate have a `project_id` field (integer):
- `ETLRequirement` → `project_id: int`
- `CodeFunction` → `project_id: int`
- `TestCase` → `project_id: int`
- `TestCaseVector` → `project_id: int`

**Example object:**
```json
{
  "project_id": 21,
  "requirement_id": "unified-context-172-req-71",
  "text": "Function: test_login...",
  "_additional": {
    "id": "00113da4-f9d1-421c-a658-f8387cdcbd52"
  }
}
```

### 2. **User-to-Project Mapping**

Users are mapped to `project_id` in the backend:

```python
# weaviate-admin-api/app/services/auth_service.py
TEST_USERS = [
    {
        "email": "engineer1@testneo.ai", 
        "password": "admin123", 
        "name": "Engineer 1",
        "project_id": 21  # Maps to project_id in Weaviate
    },
    {
        "email": "engineer2@testneo.ai", 
        "password": "admin123", 
        "name": "Engineer 2",
        "project_id": 21  # Same or different project
    }
]
```

### 3. **Automatic Filtering**

**Backend:**
- All queries automatically filter by user's `project_id`
- Dashboard counts only show objects for user's project
- Schema viewer shows counts per project
- Data browser only shows objects from user's project
- Similar objects search is scoped to user's project

**Frontend:**
- `project_id` is displayed prominently in tables (highlighted column)
- Dashboard shows which project you're viewing
- Top bar shows user's project ID
- All data is automatically scoped to your project

## Implementation Details

### Backend Changes

1. **Auth Service** (`app/services/auth_service.py`):
   - Added `project_id` to user objects
   - Included `project_id` in JWT token payload

2. **Weaviate Service** (`app/services/weaviate_service.py`):
   - `query_objects()` - Added `project_id` parameter for filtering
   - `count_objects()` - Added `project_id` parameter for filtering
   - `find_similar()` - Added `project_id` parameter for filtering

3. **API Endpoints**:
   - All endpoints extract `project_id` from JWT token
   - All queries include `where: { path: ["project_id"], operator: Equal, valueInt: <project_id> }`
   - Returns 403 if user doesn't have `project_id`

### Frontend Changes

1. **Types** (`src/types/index.ts`):
   - Added `project_id?: number` to `User` interface
   - Added `project_id?: number` to `DashboardData` interface

2. **Components**:
   - `ObjectTable` - Shows `project_id` column first, highlighted
   - `TopBar` - Displays user's project ID
   - `Dashboard` - Shows current project ID

3. **Data Display**:
   - `project_id` column is always visible and highlighted
   - Project ID shown in user info section

## Current Configuration

**Test Users:**
- `engineer1@testneo.ai` → Project ID: **21**
- `engineer2@testneo.ai` → Project ID: **21**

## How to Add More Users/Projects

### Step 1: Update User Mapping

Edit `weaviate-admin-api/app/services/auth_service.py`:

```python
TEST_USERS = [
    {
        "email": "engineer1@testneo.ai", 
        "password": "admin123", 
        "name": "Engineer 1",
        "project_id": 21  # Customer A
    },
    {
        "email": "engineer2@testneo.ai", 
        "password": "admin123", 
        "name": "Engineer 2",
        "project_id": 22  # Customer B - different project
    },
    {
        "email": "admin@testneo.ai", 
        "password": "admin123", 
        "name": "Admin User",
        "project_id": None  # Can see all projects (requires backend changes)
    }
]
```

### Step 2: Restart Backend

```bash
./stop-dev.sh
./start-dev.sh
```

## Security

✅ **Automatic Filtering**: Users can ONLY see data from their assigned project  
✅ **Token-Based**: `project_id` is in JWT token, can't be tampered with  
✅ **Backend Validation**: All queries validated on backend  
✅ **No Cross-Project Access**: Impossible to see other customers' data  

## Query Examples

### Before (No Filtering):
```graphql
{
  Get {
    ETLRequirement(limit: 10) {
      project_id
      requirement_id
      text
    }
  }
}
```

### After (With project_id Filter):
```graphql
{
  Get {
    ETLRequirement(
      limit: 10
      where: {
        path: ["project_id"]
        operator: Equal
        valueInt: 21
      }
    ) {
      project_id
      requirement_id
      text
    }
  }
}
```

## Testing

1. **Login as engineer1@testneo.ai**
   - Should see only objects with `project_id: 21`
   - Dashboard counts reflect project 21 only
   - Data browser shows project 21 objects

2. **Check Project ID Display**
   - Top bar shows "Project: 21"
   - Dashboard shows "Showing data for Project ID: 21"
   - Object table shows `project_id` column highlighted

3. **Verify Filtering**
   - All object counts match project 21
   - No objects from other projects visible
   - Search only returns project 21 objects

## Future Enhancements

1. **Multi-Project Access**: Allow users to access multiple projects
2. **Project Selector**: Dropdown to switch between projects
3. **Project Breakdown**: Dashboard showing counts per project
4. **Admin Override**: Super-admin role to see all projects
5. **Project Management**: UI to manage project assignments

## Troubleshooting

### "User project_id not found" Error
- User doesn't have `project_id` in their account
- Solution: Add `project_id` to user in `auth_service.py`

### No Data Showing
- User's `project_id` doesn't match any objects in Weaviate
- Solution: Check that objects in Weaviate have matching `project_id`

### Wrong Project Data
- User's `project_id` in auth doesn't match their actual project
- Solution: Update `project_id` in `TEST_USERS` array

---

**Status**: ✅ Fully Implemented and Working

All data is now automatically filtered by `project_id`, ensuring complete customer data isolation!

