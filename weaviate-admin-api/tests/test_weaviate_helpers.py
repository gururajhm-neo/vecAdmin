from app.utils.weaviate_helpers import (
    build_aggregate_query,
    build_get_query,
    extract_count_from_aggregate,
    get_memory_stats,
    get_version_from_meta,
    parse_uptime,
)


def test_build_aggregate_query_contains_class_name():
    query = build_aggregate_query("Requirement")
    assert "Aggregate" in query
    assert "Requirement" in query


def test_extract_count_from_aggregate_returns_expected_count():
    payload = {
        "data": {
            "Aggregate": {
                "Requirement": [
                    {"meta": {"count": 42}}
                ]
            }
        }
    }
    assert extract_count_from_aggregate(payload, "Requirement") == 42


def test_extract_count_from_aggregate_handles_missing_data():
    assert extract_count_from_aggregate({}, "Requirement") == 0


def test_parse_uptime_running_with_valid_node_stats():
    nodes_status = {"nodes": [{"stats": {"shardCount": 1}}]}
    assert parse_uptime(nodes_status) == "Running"


def test_get_memory_stats_returns_default_shape():
    stats = get_memory_stats({"nodes": [{"stats": {}}]})
    assert set(stats.keys()) == {"used", "total", "percent"}
    assert stats["total"] == 16.0


def test_get_version_from_meta_handles_missing_version():
    assert get_version_from_meta({}) == "Unknown"


def test_build_get_query_contains_properties_and_pagination():
    query = build_get_query("Requirement", ["name", "status"], limit=10, offset=20)
    assert "Requirement(limit: 10, offset: 20)" in query
    assert "name" in query
    assert "status" in query
