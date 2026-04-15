from app.utils.query_validator import (
    find_placeholder_token,
    is_read_only_query,
    sanitize_query,
    validate_query_syntax,
)


def test_is_read_only_query_accepts_get():
    query = "{ Get { ExampleClass { name } } }"
    assert is_read_only_query(query) is True


def test_is_read_only_query_rejects_mutation_keywords():
    query = "mutation { create { ExampleClass { name: \"x\" } } }"
    assert is_read_only_query(query) is False


def test_validate_query_syntax_rejects_unbalanced_braces():
    query = "{ Get { ExampleClass { name } }"
    assert validate_query_syntax(query) == "Unbalanced braces in query"


def test_validate_query_syntax_rejects_empty_query():
    assert validate_query_syntax("   ") == "Query cannot be empty"


def test_sanitize_query_removes_comments_and_extra_whitespace():
    query = """
    # top comment
    {
      Get {
        ExampleClass {
          name # inline comment
        }
      }
    }
    """
    sanitized = sanitize_query(query)
    assert "#" not in sanitized
    assert "  " not in sanitized
    assert "Get" in sanitized


def test_find_placeholder_token_detects_default_json_placeholder():
    query = '{"collection":"YourCollection","limit":10}'
    assert find_placeholder_token(query) == "YourCollection"


def test_find_placeholder_token_returns_none_for_real_collection():
    query = '{"collection":"Articles","limit":10}'
    assert find_placeholder_token(query) is None
