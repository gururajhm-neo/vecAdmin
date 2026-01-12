# Project Selector Feature

## Overview

You can now **view data for any project** using the Project Selector dropdown! This allows you to:
- Switch between different projects (9, 21, 24, etc.)
- View all projects at once (no filter)
- See which project you're currently viewing

## How It Works

### Backend Changes

1. **All API endpoints now accept optional `project_id` query parameter:**
   - `GET /api/v1/dashboard/overview?project_id=21`
   - `GET /api/v1/data/{class_name}/objects?project_id=21`
   - `GET /api/v1/schema?project_id=21`

2. **Priority logic:**
   - If `project_id` is provided in query → Use that
   - If not provided → Use `project_id` from user's JWT token
   - If neither exists → Show all data (no filtering)

3. **New endpoint to get all available projects:**
   - `GET /api/v1/projects/available`
   - Returns list of all unique `project_id` values in Weaviate
   - Uses efficient GraphQL Aggregate queries

### Frontend Changes

1. **New `ProjectSelector` component:**
   - Dropdown showing all available projects
   - "All Projects" option to see everything
   - Shows "(Your Project)" next to user's assigned project
   - Auto-loads available projects from API

2. **Added to Dashboard:**
   - Project selector in header area
   - Updates all cards when project changes
   - Shows current project in subtitle

3. **Added to Data Browser:**
   - Project selector in filter bar
   - Filters objects by selected project
   - Resets pagination when project changes

## Usage

### Dashboard

1. Open Dashboard page
2. See Project Selector dropdown at top
3. Select a project (e.g., "Project 21", "Project 9", "All Projects")
4. All cards update to show data for that project

### Data Browser

1. Open Data Browser page
2. See Project Selector in the filter bar
3. Select a project
4. Table shows only objects from that project
5. Object counts update accordingly

## Example API Calls

### Get Dashboard for Project 21
```bash
GET /api/v1/dashboard/overview?project_id=21
```

### Get All Projects
```bash
GET /api/v1/projects/available
# Response:
{
  "projects": [9, 21, 24],
  "total_projects": 3
}
```

### Get Objects for Project 9
```bash
GET /api/v1/data/CodeFunction/objects?project_id=9&limit=50
```

## Current Projects in Your Weaviate

Based on the data:
- **Project 9**: CodeFunction objects
- **Project 21**: ETLRequirement objects (and possibly others)
- **Project 24**: CodeFunction objects

## Features

✅ **Switch between projects** - View any project's data  
✅ **View all projects** - "All Projects" option shows everything  
✅ **Auto-detection** - Automatically finds all project_ids in Weaviate  
✅ **User context** - Shows which project is assigned to you  
✅ **Real-time updates** - All data updates when project changes  
✅ **Persistent selection** - Remembers your selection during session  

## Security

- **Authentication required** - Must be logged in to use
- **Token-based** - Still uses JWT token for authentication
- **Optional filtering** - Can view all projects if needed
- **No data modification** - Read-only access

## Future Enhancements

1. **Project permissions** - Restrict which projects users can view
2. **Project favorites** - Save frequently viewed projects
3. **Project comparison** - Compare data across projects
4. **Project analytics** - Stats per project
5. **Multi-project selection** - View multiple projects at once

---

**Status**: ✅ Fully Implemented and Ready to Use!

Just restart your backend and frontend, then use the Project Selector dropdown to switch between projects!

