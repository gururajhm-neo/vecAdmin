"""
Backward-compatible shim.

All existing route imports
    from app.services.weaviate_service import weaviate_service
continue to work unchanged.  Every attribute/method access is forwarded
to the active VectorDBProvider via __getattr__, with legacy name aliases
applied transparently so no route file needs to be touched.
"""

from app.providers import get_provider


class _ProviderShim:
    """
    Lazy proxy to the active VectorDBProvider.
    Aliases map the original weaviate_service method names to the
    generic provider interface.
    """

    _ALIASES = {
        "get_nodes_status": "get_cluster_status",
        "execute_graphql":  "execute_query",
    }

    # Cache the provider so we don't call get_provider() on every access
    _provider = None

    def _get_provider(self):
        if self._provider is None:
            self._provider = get_provider()
        return self._provider

    def __getattr__(self, name: str):
        provider = self._get_provider()
        actual = self._ALIASES.get(name, name)
        return getattr(provider, actual)


# The single global instance imported by all routes
weaviate_service = _ProviderShim()
