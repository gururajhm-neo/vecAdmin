# Organization ID Isolation & Multi-Tenant Support

## Problem Statement

If 10 users from different organizations are using the same Weaviate backend and they happen to have the same `project_id`, there's a risk of data leakage. We need an additional isolation layer using `org_id` (organization identifier).

## Solution: Two-Level Isolation

### Current Implementation: `project_id` Only
- ✅ Users filtered by `project_id` from JWT token
- ⚠️ **Risk**: If two organizations have same `project_id`, they see each other's data

### Future Implementation: `project_id` + `org_id`
- ✅ Users filtered by both `project_id` AND `org_id`
- ✅ Complete data isolation between organizations
- ✅ Same `project_id` across orgs is safe

## How It Works

### 1. **User Authentication**

Users are assigned both `project_id` and `org_id`:

```python
# weaviate-admin-api/app/services/auth_service.py
TEST_USERS = [
    {
        "email": "engineer1@org1.com",
        "password": "admin123",
        "name": "Engineer 1",
        "project_id": 21,
        "org_id": 1  # Organization 1
    },
    {
        "email": "engineer2@org2.com",
        "password": "admin123",
        "name": "Engineer 2",
        "project_id": 21,  # Same project_id as org1
        "org_id": 2  # But different org_id - complete isolation!
    }
]
```

### 2. **JWT Token**

Both `project_id` and `org_id` are included in the token:

```json
{
  "email": "engineer1@org1.com",
  "name": "Engineer 1",
  "project_id": 21,
  "org_id": 1,
  "exp": 1234567890
}
```

### 3. **Data Filtering**

**Current (project_id only):**
```graphql
{
  Get {
    ETLRequirement(
      where: {
        path: ["project_id"]
        operator: Equal
        valueInt: 21
      }
    ) {
      ...
    }
  }
}
```

**Future (project_id + org_id):**
```graphql
{
  Get {
    ETLRequirement(
      where: {
        operator: And
        operands: [
          {
            path: ["project_id"]
            operator: Equal
            valueInt: 21
          },
          {
            path: ["org_id"]
            operator: Equal
            valueInt: 1
          }
        ]
      }
    ) {
      ...
    }
  }
}
```

## Implementation Status

### ✅ Completed
- [x] `org_id` added to user authentication
- [x] `org_id` included in JWT token
- [x] Project metadata service with name mapping
- [x] Project selector shows project names
- [x] Backend structure ready for `org_id` filtering

### 🔄 Pending (When Weaviate has `org_id` field)
- [ ] Add `org_id` field to Weaviate schema (if not exists)
- [ ] Update `weaviate_service.py` to filter by `org_id`
- [ ] Update all API endpoints to use `org_id` filtering
- [ ] Test multi-tenant isolation

## Project Name Mapping

Projects now have friendly names displayed in the UI:

```python
# weaviate-admin-api/app/services/project_service.py
PROJECT_METADATA = {
    1: {"name": "Default Project", "org_id": None},
    9: {"name": "Customer A - Project Alpha", "org_id": None},
    21: {"name": "Main Project", "org_id": None},
    24: {"name": "Customer B - Project Beta", "org_id": None},
    999: {"name": "Test Project", "org_id": None},
}
```

**UI Display:**
- Before: "Project ID: 21"
- After: "ID: 21 - Main Project"

## Migration Path

### Step 1: Add `org_id` to Weaviate Schema (If Needed)

If your Weaviate objects don't have `org_id` yet:

1. **Option A**: Add `org_id` to existing classes
   ```python
   # Add org_id property to all classes
   client.schema.property.create("ETLRequirement", {
       "name": "org_id",
       "dataType": ["int"]
   })
   ```

2. **Option B**: Use existing field (if you have one)
   - Check if you have `customer_id`, `tenant_id`, or similar
   - Map that to `org_id` in the service layer

### Step 2: Update Weaviate Data

Backfill `org_id` for existing objects:
```python
# Example: Set org_id for all objects
# This should be done carefully based on your data model
```

### Step 3: Enable `org_id` Filtering

Once `org_id` exists in Weaviate:

1. Update `weaviate_service.py`:
   ```python
   def query_objects(
       self,
       class_name: str,
       project_id: Optional[int] = None,
       org_id: Optional[int] = None  # Add this
   ):
       where_conditions = []
       
       if project_id is not None:
           where_conditions.append(...)
       
       if org_id is not None:  # Add org_id filtering
           where_conditions.append(f'''
           {{
               path: ["org_id"]
               operator: Equal
               valueInt: {org_id}
           }}
           ''')
   ```

2. Update API endpoints to extract `org_id` from token and pass to service

## Current Behavior

**Without `org_id` in Weaviate:**
- ✅ Users filtered by `project_id` only
- ✅ Project names shown in UI
- ⚠️ If two orgs have same `project_id`, they see each other's data

**With `org_id` in Weaviate (Future):**
- ✅ Users filtered by both `project_id` AND `org_id`
- ✅ Complete isolation between organizations
- ✅ Same `project_id` across orgs is safe

## Best Practices

1. **Always assign `org_id` to users** - Even if not used yet, it's in the token
2. **Use unique `project_id` per organization** - If possible, avoid collisions
3. **Monitor for `org_id` collisions** - Log when same `project_id` used by different orgs
4. **Plan migration** - When ready, add `org_id` to Weaviate schema

## Example Scenarios

### Scenario 1: Same Project ID, Different Orgs
- **Org 1**: `project_id: 21`, `org_id: 1`
- **Org 2**: `project_id: 21`, `org_id: 2`
- **Result**: Complete isolation (when `org_id` filtering enabled)

### Scenario 2: Different Project IDs, Same Org
- **Org 1**: `project_id: 21`, `org_id: 1`
- **Org 1**: `project_id: 22`, `org_id: 1`
- **Result**: Same org can have multiple projects

### Scenario 3: Admin User
- **Admin**: `project_id: None`, `org_id: None`
- **Result**: Can see all projects (requires special handling)

---

**Status**: ✅ Structure Ready | 🔄 Waiting for `org_id` in Weaviate Schema

The infrastructure is ready. Once `org_id` is added to Weaviate objects, enable filtering by uncommenting the `org_id` filtering code.

