"""Extract key sections from Game8 Champions guides for rules doc."""
import json
import re
import requests
from bs4 import BeautifulSoup

HEADERS = {"User-Agent": "Mozilla/5.0"}
BASE = "https://game8.co/games/Pokemon-Champions/archives"

PAGES = {
    "battle_formats": "589274",  # guess - need to find
    "beginner": "588876",
    "regulation_mb": "605482",
    "ranked": "588878",
}

# Find battle format page from beginner guide links
r = requests.get(f"{BASE}/588876", headers=HEADERS, timeout=30)
soup = BeautifulSoup(r.text, "html.parser")
links = {}
for a in soup.select("a"):
    t = a.get_text(strip=True)
    h = a.get("href", "")
    if any(k in t for k in ("Battle Format", "Ranked", "Weather", "Stat Alignment", "Timer", "Mechanic", "Mega Evol")):
        if "/archives/" in h:
            links[t] = h if h.startswith("http") else "https://game8.co" + h

out = {"links_from_beginner": links, "sections": {}}

for name, url in list(links.items())[:12]:
    try:
        rs = requests.get(url, headers=HEADERS, timeout=30)
        sp = BeautifulSoup(rs.text, "html.parser")
        sections = []
        for h in sp.select("h2, h3"):
            title = h.get_text(strip=True)
            if not title or "free member" in title.lower():
                continue
            body = []
            for sib in h.find_next_siblings():
                if sib.name in ("h2", "h3"):
                    break
                text = sib.get_text("\n", strip=True)
                if text:
                    body.append(text[:800])
            if body:
                sections.append({"title": title, "body": body[:3]})
        out["sections"][name] = {"url": url, "content": sections[:15]}
    except Exception as e:
        out["sections"][name] = {"error": str(e)}

# Also scrape specific known IDs
for label, aid in [
    ("battle_formats", "589339"),
    ("mechanics", "593893"),
    ("weather", "589276"),
    ("stat_alignment", "589278"),
    ("timers", "595376"),
]:
    url = f"{BASE}/{aid}"
    try:
        sp = BeautifulSoup(requests.get(url, headers=HEADERS, timeout=30).text, "html.parser")
        title = sp.title.string if sp.title else aid
        sections = []
        for h in sp.select("h2, h3"):
            ht = h.get_text(strip=True)
            if not ht or len(ht) > 100:
                continue
            block = []
            for sib in h.find_next_siblings():
                if sib.name in ("h2", "h3"):
                    break
                t = sib.get_text(" ", strip=True)
                if t and len(t) > 20:
                    block.append(t[:600])
            if block:
                sections.append({"title": ht, "body": block[0]})
        out["sections"][label] = {"url": url, "page_title": title, "content": sections[:20]}
    except Exception as e:
        out["sections"][label] = {"error": str(e)}

with open(r"c:\Proyectos\personales\PokemonChampions\scripts\rules_scrape.json", "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)
print("written", len(out["sections"]))
