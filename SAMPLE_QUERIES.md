# Sample GraphQL Queries for Query Playground

Test these queries in the **Query Playground** page of the Weaviate Admin UI.

## 1. Get All Classes (Schema Overview)

```graphql
{
  __schema {
    types {
      name
      kind
    }
  }
}
```

## 2. Count Objects per Project ID

### ETLRequirement by Project
```graphql
{
  Aggregate {
    ETLRequirement(groupBy: ["project_id"]) {
      groupedBy {
        value
      }
      meta {
        count
      }
    }
  }
}
```

### CodeFunction by Project
```graphql
{
  Aggregate {
    CodeFunction(groupBy: ["project_id"]) {
      groupedBy {
        value
      }
      meta {
        count
      }
    }
  }
}
```

### All Classes by Project (Combined)
```graphql
{
  Aggregate {
    ETLRequirement(groupBy: ["project_id"]) {
      groupedBy { value }
      meta { count }
    }
    CodeFunction(groupBy: ["project_id"]) {
      groupedBy { value }
      meta { count }
    }
    TestCase(groupBy: ["project_id"]) {
      groupedBy { value }
      meta { count }
    }
    TestCaseVector(groupBy: ["project_id"]) {
      groupedBy { value }
      meta { count }
    }
  }
}
```

## 3. Get Sample Data

### Get 5 ETLRequirements
```graphql
{
  Get {
    ETLRequirement(limit: 5) {
      requirement_id
      project_id
      text
      req_type
      priority
    }
  }
}
```

### Get 5 CodeFunctions
```graphql
{
  Get {
    CodeFunction(limit: 5) {
      function_name
      project_id
      file_path
      signature
      docstring
      class_name
    }
  }
}
```

### Get 5 TestCases
```graphql
{
  Get {
    TestCase(limit: 5) {
      test_case_id
      project_id
      test_name
      description
    }
  }
}
```

## 4. Filter by Project ID

### Get ETLRequirements for Project 21
```graphql
{
  Get {
    ETLRequirement(
      where: {
        path: ["project_id"]
        operator: Equal
        valueInt: 21
      }
      limit: 10
    ) {
      requirement_id
      project_id
      text
      req_type
    }
  }
}
```

### Get CodeFunctions for Project 9
```graphql
{
  Get {
    CodeFunction(
      where: {
        path: ["project_id"]
        operator: Equal
        valueInt: 9
      }
      limit: 10
    ) {
      function_name
      project_id
      file_path
      signature
    }
  }
}
```

## 5. Search and Filter Combined

### Search ETLRequirements containing "login" in Project 21
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
          }
          {
            path: ["text"]
            operator: Like
            valueText: "*login*"
          }
        ]
      }
      limit: 10
    ) {
      requirement_id
      project_id
      text
      req_type
    }
  }
}
```

## 6. Aggregate Statistics

### Total Object Count per Class
```graphql
{
  Aggregate {
    ETLRequirement {
      meta {
        count
      }
    }
    CodeFunction {
      meta {
        count
      }
    }
    TestCase {
      meta {
        count
      }
    }
    TestCaseVector {
      meta {
        count
      }
    }
  }
}
```

### Get Statistics for Project 21
```graphql
{
  Aggregate {
    ETLRequirement(
      where: {
        path: ["project_id"]
        operator: Equal
        valueInt: 21
      }
    ) {
      meta {
        count
      }
      req_type {
        count
      }
    }
  }
}
```

## 7. Vector Search (Semantic Search)

### Find Similar Requirements (if vector search is enabled)
```graphql
{
  Get {
    ETLRequirement(
      nearText: {
        concepts: ["user authentication login"]
      }
      limit: 5
    ) {
      requirement_id
      project_id
      text
      _additional {
        distance
        certainty
      }
    }
  }
}
```

### Find Similar Code Functions
```graphql
{
  Get {
    CodeFunction(
      nearText: {
        concepts: ["file upload"]
      }
      limit: 5
    ) {
      function_name
      project_id
      signature
      docstring
      _additional {
        distance
        certainty
      }
    }
  }
}
```

## 8. Get Object with Additional Metadata

### Get Requirements with IDs and Creation Time
```graphql
{
  Get {
    ETLRequirement(
      limit: 5
      where: {
        path: ["project_id"]
        operator: Equal
        valueInt: 21
      }
    ) {
      requirement_id
      project_id
      text
      _additional {
        id
        creationTimeUnix
        lastUpdateTimeUnix
      }
    }
  }
}
```

## 9. Complex Filtering

### Get Functions from Specific File Path Pattern
```graphql
{
  Get {
    CodeFunction(
      where: {
        operator: And
        operands: [
          {
            path: ["project_id"]
            operator: Equal
            valueInt: 21
          }
          {
            path: ["file_path"]
            operator: Like
            valueText: "*test*"
          }
        ]
      }
      limit: 10
    ) {
      function_name
      file_path
      project_id
      signature
    }
  }
}
```

## 10. Count Objects by Multiple Fields

### Count Requirements by Type and Priority
```graphql
{
  Aggregate {
    ETLRequirement(
      where: {
        path: ["project_id"]
        operator: Equal
        valueInt: 21
      }
    ) {
      meta {
        count
      }
      req_type {
        count
      }
      priority {
        count
      }
    }
  }
}
```

## Your Current Project IDs

Based on your Weaviate data:

- **Project 1**: 63 ETLRequirements, 350 CodeFunctions
- **Project 9**: 350 CodeFunctions
- **Project 10**: 350 CodeFunctions
- **Project 21**: 2,040 ETLRequirements, 350 CodeFunctions (Most data!)
- **Project 22**: 46 CodeFunctions
- **Project 23**: 350 CodeFunctions
- **Project 24**: 350 CodeFunctions

## Tips for Query Playground

1. **Start Simple**: Try the basic Get queries first
2. **Add Filters**: Once you see data, add `where` clauses to filter
3. **Limit Results**: Always use `limit` to avoid overwhelming the UI
4. **Check Errors**: If a query fails, check the error message at the bottom
5. **Use Your Project ID**: Replace `21` with your user's project_id for testing

## Common Errors

### Error: "Cannot query field X"
- The field doesn't exist in the schema
- Check available fields with the schema overview query

### Error: "Timeout"
- Query is too complex or returning too much data
- Add a `limit` parameter or more specific filters

### Error: "No results"
- The project_id might not have data in that class
- Try a different project_id or remove the filter

