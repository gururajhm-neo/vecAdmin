# Real Project Data in Your Weaviate Instance

## Actual Project IDs Found

Here's what's **actually in your Weaviate database** (not test data):

### Project 21 (Your Main Project) 🎯
- **ETLRequirement**: 2,040 objects
- **CodeFunction**: 350 objects
- **Description**: This is your primary project with the most data

### Project 1
- **ETLRequirement**: 63 objects
- **CodeFunction**: 350 objects

### Project 9
- **CodeFunction**: 350 objects
- **ETLRequirement**: 60 objects

### Project 10
- **CodeFunction**: 350 objects

### Project 22
- **CodeFunction**: 46 objects

### Project 23
- **CodeFunction**: 350 objects

### Project 24
- **CodeFunction**: 350 objects

## Sample Real Data

### From Project 21 (ETLRequirement)
```json
{
  "project_id": 21,
  "requirement_id": "unified-context-172-req-71",
  "text": "Function: test_login. Test login functionality. Signature: test_login(). Defined in test_login_ec2.py."
}
```

### From Project 9 (CodeFunction)
```json
{
  "project_id": 9,
  "function_name": "uploadFiles",
  "file_path": "...",
  "signature": "..."
}
```

### From Project 24 (CodeFunction)
```json
{
  "project_id": 24,
  "function_name": "removeIframe",
  "file_path": "...",
  "signature": "..."
}
```

## Updated Project Metadata

The system now uses these **real project IDs**:

```python
PROJECT_METADATA = {
    1: {"name": "Project 1", "org_id": None},
    9: {"name": "Project 9", "org_id": None},
    10: {"name": "Project 10", "org_id": None},
    21: {"name": "Project 21 (Main)", "org_id": None},  # Most data
    22: {"name": "Project 22", "org_id": None},
    23: {"name": "Project 23", "org_id": None},
    24: {"name": "Project 24", "org_id": None},
}
```

## How to Customize Project Names

Edit `weaviate-admin-api/app/services/project_service.py`:

```python
PROJECT_METADATA = {
    21: {"name": "My Main Project - Production", "org_id": None},
    9: {"name": "Customer ABC - Alpha Project", "org_id": 1},
    24: {"name": "Customer XYZ - Beta Project", "org_id": 2},
    # Add more as needed
}
```

Then restart the backend:
```bash
./stop-dev.sh
./start-dev.sh
```

## Testing Queries

### Quick Test: Get data from Project 21
```graphql
{
  Get {
    ETLRequirement(
      where: {
        path: ["project_id"]
        operator: Equal
        valueInt: 21
      }
      limit: 5
    ) {
      requirement_id
      project_id
      text
    }
  }
}
```

### Quick Test: Get data from Project 9
```graphql
{
  Get {
    CodeFunction(
      where: {
        path: ["project_id"]
        operator: Equal
        valueInt: 9
      }
      limit: 5
    ) {
      function_name
      project_id
    }
  }
}
```

## What You'll See in the UI

### Dashboard
- Select "Project 21" → See 2,040 ETLRequirements + 350 CodeFunctions
- Select "Project 9" → See 350 CodeFunctions
- Select "All Projects" → See everything

### Data Browser
- Select "ETLRequirement" + "Project 21" → 2,040 objects
- Select "CodeFunction" + "Project 9" → 350 objects

### Schema Viewer
- Object counts update based on selected project
- Shows how many objects each class has per project

## Summary

✅ **Your main data is in Project 21**  
✅ **7 total projects found** (1, 9, 10, 21, 22, 23, 24)  
✅ **Project metadata updated** to match real data  
✅ **Ready to test** with sample queries  

Most of your ETLRequirements are in **Project 21**, so start there for testing!

