"""Threads parser — OWNER: <threads engineer>.

Supports: Single Post URL, Profile URL (profile scan can be a later/advanced phase).
Your job: turn the URL into a SourceContent. The shared LLM step does extraction.

What to fill in `fetch()`:
  - post:    visible post text. Threads posts are short, situational write-ups —
             great for context_tags (適合讀書, 約會, 排隊久). Just give the LLM the
             text; it fills those tags.
  - profile: scan public posts, filter to food, merge.

Reference: like Instagram, public post import first; profile scan as advanced.
"""

from __future__ import annotations

import json
import re
from collections.abc import Iterable

import httpx
from bs4 import BeautifulSoup

from app.core.errors import ParseError
from app.integrations.base import SourceContent, SourceParser

POST_RE = re.compile(r"threads\.(?:net|com)/@(?P<author>[^/?#]+)/post/(?P<post_id>[^/?#]+)")
PROFILE_RE = re.compile(r"threads\.(?:net|com)/@(?P<author>[^/?#]+)(?:[/#?].*)?$")
FOOD_HINT_RE = re.compile(
    r"(restaurant|cafe|coffee|brunch|lunch|dinner|breakfast|bar|bakery|ramen|"
    r"sushi|noodle|burger|pizza|dessert|food|eat|drink)",
    re.IGNORECASE,
)


class ThreadsParser(SourceParser):
    platform = "threads"
    url_patterns = [r"threads\.(net|com)/"]
    # TODO(threads owner): tune this. You own extraction quality; not the format.
    extraction_guidance = (
        "Input is short situational write-ups. Be aggressive about context_tags "
        "(適合讀書, 約會, 排隊久, 安靜, CP值高) — that's Threads' strength. Keep "
        "summary to the one-line vibe; don't invent dishes that aren't mentioned."
    )

    @classmethod
    def detect_source_type(cls, url: str) -> str:
        # Post URLs look like threads.net/@user/post/<id>; bare @user is a profile.
        if re.search(r"/post/", url):
            return "post"
        return "profile"

    def fetch(self, url: str) -> list[SourceContent]:
        # post    -> [one SourceContent]
        # profile -> one SourceContent PER food post
        source_type = self.detect_source_type(url)
        if source_type == "profile":
            raise ParseError(
                "Threads profile import is not supported yet; paste a public Threads post URL."
            )

        html, final_url = self._fetch_html(url)
        content = self._parse_post(url=url, final_url=final_url, html=html)
        if not content.text.strip() and not content.image_urls:
            raise ParseError("Could not find visible text or images on this Threads post")
        return [content]

    def _fetch_html(self, url: str) -> tuple[str, str]:
        try:
            with httpx.Client(
                follow_redirects=True,
                timeout=10,
                headers={
                    "accept": "text/html,application/xhtml+xml",
                    "user-agent": (
                        "Mozilla/5.0 (compatible; TasteMapBot/0.1; "
                        "+https://github.com/jellyfish0316/TasteMap)"
                    ),
                },
            ) as client:
                response = client.get(url)
                response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise ParseError(f"Threads returned HTTP {exc.response.status_code}") from exc
        except httpx.HTTPError as exc:
            raise ParseError(f"Could not fetch Threads URL: {exc}") from exc
        return response.text, str(response.url)

    def _parse_post(self, url: str, final_url: str, html: str) -> SourceContent:
        soup = BeautifulSoup(html, "html.parser")
        canonical_url = self._canonical_url(soup) or final_url or url
        author = self._author_from_url(canonical_url) or self._author_from_url(url)
        title = self._meta_content(soup, "og:title") or self._meta_content(soup, "twitter:title")
        description = self._meta_content(soup, "og:description") or self._meta_content(
            soup, "twitter:description"
        )

        # Anchor on THIS post's embedded JSON node (code == the URL's post id). The
        # page also embeds other posts (the author's, recommended, replies), so a
        # whole-page text scan can pick the wrong post — only fall back to that
        # heuristic when we can't find the exact node.
        post_id = self._post_id_from_url(canonical_url) or self._post_id_from_url(url)
        node = self._find_post_node(soup, post_id) if post_id else None
        if node is not None:
            text = self._text_from_node(node) or self._best_text(soup, description)
            image_urls = self._images_from_node(node)
            author = self._username_from_node(node) or author
        else:
            text = self._best_text(soup, description)
            image_urls = self._image_urls(soup)

        return SourceContent(
            platform=self.platform,
            source_url=canonical_url,
            source_type="post",
            author=author,
            title=title,
            text=text,
            image_urls=image_urls,
            suggested_collection_name=(
                f"@{author} Threads food finds" if author else "Threads food finds"
            ),
            raw={
                "original_url": url,
                "final_url": final_url,
                "post_id": post_id,
            },
        )

    def _find_post_node(self, soup: BeautifulSoup, post_id: str) -> dict | None:
        """Return the embedded media object whose `code` matches this post's id.

        Threads server-renders many posts into `application/json` scripts; we want
        the one node that actually IS this post. A real media node carries a
        `caption` key (unlike lightweight references that only echo the code).
        """
        found: dict | None = None

        def walk(value: object) -> None:
            nonlocal found
            if found is not None:
                return
            if isinstance(value, dict):
                if value.get("code") == post_id and "caption" in value:
                    found = value
                    return
                for nested in value.values():
                    walk(nested)
            elif isinstance(value, list):
                for item in value:
                    walk(item)

        for script in soup.find_all("script", type="application/json"):
            raw = script.string
            if not raw or post_id not in raw:
                continue
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                continue
            walk(data)
            if found is not None:
                break
        return found

    def _text_from_node(self, node: dict) -> str:
        caption = node.get("caption")
        if isinstance(caption, dict):
            text = caption.get("text")
        elif isinstance(caption, str):
            text = caption
        else:
            text = None
        return text.strip() if isinstance(text, str) else ""

    def _username_from_node(self, node: dict) -> str | None:
        user = node.get("user")
        username = user.get("username") if isinstance(user, dict) else None
        return username if isinstance(username, str) and username else None

    def _images_from_node(self, node: dict) -> list[str]:
        """Real post photos from the matched node (carousel-aware), not the avatar."""

        def best_url(image_versions2: object) -> str | None:
            candidates = image_versions2.get("candidates") if isinstance(image_versions2, dict) else None
            if isinstance(candidates, list) and candidates:
                url = candidates[0].get("url") if isinstance(candidates[0], dict) else None
                return url if isinstance(url, str) else None
            return None

        urls: list[str] = []
        carousel = node.get("carousel_media")
        media_items = carousel if isinstance(carousel, list) and carousel else [node]
        for media in media_items:
            if not isinstance(media, dict):
                continue
            url = best_url(media.get("image_versions2"))
            if url and url not in urls:
                urls.append(url)
        return urls

    def _best_text(self, soup: BeautifulSoup, description: str | None) -> str:
        candidates = [description or ""]
        candidates.extend(self._texts_from_json_scripts(soup))
        candidates.extend(self._article_texts(soup))

        cleaned: list[str] = []
        seen: set[str] = set()
        for candidate in candidates:
            text = self._clean_text(candidate)
            if not text or text in seen:
                continue
            seen.add(text)
            cleaned.append(text)

        foodish = [text for text in cleaned if FOOD_HINT_RE.search(text)]
        if foodish:
            return max(foodish, key=len)
        return max(cleaned, key=len, default="")

    def _texts_from_json_scripts(self, soup: BeautifulSoup) -> list[str]:
        texts: list[str] = []
        for script in soup.find_all("script", type="application/json"):
            raw = script.string
            if not raw:
                continue
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                continue
            texts.extend(self._walk_text_values(data))
        return texts

    def _walk_text_values(self, value: object) -> Iterable[str]:
        if isinstance(value, dict):
            for key, nested in value.items():
                if key in {
                    "text",
                    "caption",
                    "description",
                    "accessibility_caption",
                } and isinstance(nested, str):
                    yield nested
                else:
                    yield from self._walk_text_values(nested)
        elif isinstance(value, list):
            for item in value:
                yield from self._walk_text_values(item)

    def _article_texts(self, soup: BeautifulSoup) -> list[str]:
        selectors = ["article", "[role='article']", "main"]
        texts: list[str] = []
        for selector in selectors:
            for element in soup.select(selector):
                texts.append(element.get_text(" ", strip=True))
        return texts

    def _image_urls(self, soup: BeautifulSoup) -> list[str]:
        urls: list[str] = []
        for prop in ("og:image", "twitter:image"):
            image = self._meta_content(soup, prop)
            if image and image not in urls:
                urls.append(image)
        return urls

    def _meta_content(self, soup: BeautifulSoup, name: str) -> str | None:
        tag = soup.find("meta", property=name) or soup.find("meta", attrs={"name": name})
        content = tag.get("content") if tag else None
        return self._clean_text(content) if isinstance(content, str) else None

    def _canonical_url(self, soup: BeautifulSoup) -> str | None:
        tag = soup.find("link", rel="canonical")
        href = tag.get("href") if tag else None
        return href if isinstance(href, str) and href else None

    def _author_from_url(self, url: str) -> str | None:
        match = POST_RE.search(url) or PROFILE_RE.search(url)
        if not match:
            return None
        return match.group("author")

    def _post_id_from_url(self, url: str) -> str | None:
        match = POST_RE.search(url)
        return match.group("post_id") if match else None

    def _clean_text(self, text: str | None) -> str:
        if not text:
            return ""
        text = re.sub(r"\s+", " ", text).strip()
        return text.removeprefix("Threads").strip()
