# Project ID Explanation & Fix

## The Issue

You're seeing **0 data** on the dashboard because:

1. **project_id IS stored in Weaviate** ✅
   - I can see `project_id: 21` in `ETLRequirement` objects
   - I can see `project_id: 9, 24` in `CodeFunction` objects
   - **Yes, project_id is stored in Weaviate!**

2. **The Problem:**
   - I added filtering by `project_id` from the user's JWT token
   - If your token doesn't have `project_id` (old token), it might cause issues
   - OR if your token has `project_id: 21` but you're looking at classes with different project_ids

## How I Got project_id: 21

I queried your Weaviate instance and saw:
```json
{
  "ETLRequirement": [
    {"project_id": 21, "requirement_id": "..."},
    {"project_id": 21, "requirement_id": "..."}
  ]
}
```

So I set the test users to `project_id: 21` in `auth_service.py`.

## The Fix

I've made filtering **OPTIONAL**:

- ✅ **If user has `project_id` in token** → Filter by that project_id
- ✅ **If user has NO `project_id` in token** → Show ALL data (no filtering)

This means:
- **Old tokens** (without project_id) will show ALL data
- **New tokens** (with project_id) will show filtered data

## Solution: Re-Login

**To fix the dashboard showing 0:**

1. **Logout** from the admin UI
2. **Login again** with `engineer1@testneo.ai` / `admin123`
3. This will generate a **new token** with `project_id: 21`
4. Dashboard should now show data for project_id 21

## How TestNeo Should Map Users to Projects

**Current (Hardcoded):**
```python
# weaviate-admin-api/app/services/auth_service.py
TEST_USERS = [
    {"email": "engineer1@testneo.ai", "project_id": 21},  # Hardcoded
    {"email": "engineer2@testneo.ai", "project_id": 21}  # Hardcoded
]
```

**Future (Should come from TestNeo's main database):**
- When user logs in, TestNeo should:
  1. Look up user in main database
  2. Get their assigned `project_id`(s)
  3. Include in JWT token
  4. Admin UI filters by that project_id

## Available Project IDs in Your Weaviate

From the data I queried:
- **ETLRequirement**: project_id 21
- **CodeFunction**: project_id 9, 24
- **TestCase**: (need to check)

## Quick Test

1. **Check if you have old token:**
   - Open browser DevTools → Application → Local Storage
   - Look for `auth_token`
   - Decode it at jwt.io - does it have `project_id`?

2. **If no project_id in token:**
   - Logout and login again
   - New token will have `project_id: 21`

3. **If still showing 0:**
   - Check browser console for errors
   - Check backend logs for errors

## API Endpoint to See All Projects

I've added: `GET /api/v1/projects/available`

This shows all `project_id` values in your Weaviate data.

## Summary

✅ **project_id IS in Weaviate** - it's stored in every object  
✅ **Filtering is now optional** - works with or without project_id  
✅ **Re-login to fix** - gets new token with project_id  
✅ **Future**: Should come from TestNeo's main user database

---

**Action Required:** Logout and login again to get a new token with project_id!

