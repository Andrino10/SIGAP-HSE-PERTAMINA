import hashlib
from copy import deepcopy
from utils.text_normalizer import normalize_text

class CacheService:
    def __init__(self, max_size=200):
        self.cache = {}
        self.max_size = max_size

    def _hash_query(self, query, category=None, version=None):
        norm = normalize_text(query)
        if isinstance(category, (list, tuple)):
            cat_str = "|".join(
                normalize_text(item)
                for item in category
                if isinstance(item, str) and item.strip()
            )
        else:
            cat_str = normalize_text(category or "")
        raw_key = f"{version or 'no-version'}:{cat_str}:{norm}"
        return hashlib.md5(raw_key.encode('utf-8')).hexdigest()

    def get(self, query, category=None, version=None):
        key = self._hash_query(query, category, version)
        if key in self.cache:
            print(f"[CacheService] Cache HIT for query: '{query[:30]}...'")
            return deepcopy(self.cache[key])
        return None

    def set(self, query, category, payload, version=None):
        if len(self.cache) >= self.max_size:
            # Remove oldest entry
            oldest_key = next(iter(self.cache))
            del self.cache[oldest_key]

        key = self._hash_query(query, category, version)
        self.cache[key] = deepcopy(payload)
        print(f"[CacheService] Cached response for query: '{query[:30]}...'")

    def clear(self):
        self.cache.clear()

cache_service = CacheService()
