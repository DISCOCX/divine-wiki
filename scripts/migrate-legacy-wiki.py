#!/usr/bin/env python3
"""
One-shot migration of the legacy Divine Academy wiki (Supabase) into this repo.

- Reads fresh wiki_pages export from the MCP tool-result file
- Rewrites Supabase image URLs to local /wiki-images/<name>
- Converts Obsidian-style `![alt | 500](url)` → `<img src=... alt=... width={500} />`
- Normalizes double-dash paths (vfx--bins -> vfx-bins, rigging--uvs -> rigging-uvs)
- Writes .mdx files to content/
- Downloads every image in the wiki-images bucket to public/wiki-images/ (parallel)
"""

from __future__ import annotations

import json
import re
import shutil
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

WIKI_ROOT = Path("/Users/mike/Desktop/Wiki")
CONTENT_DIR = WIKI_ROOT / "content"
IMAGES_DIR = WIKI_ROOT / "public" / "wiki-images"

TOOL_RESULT = Path(
    "/Users/mike/.claude/projects/-Users-mike-Desktop-Wiki/"
    "43a76dae-d75f-4050-8d27-fa5d27c0593b/tool-results/"
    "mcp-plugin_supabase_supabase-execute_sql-1776528396716.txt"
)

SUPABASE_PREFIX = (
    "https://pfwmnakbanolwjnemtti.supabase.co/storage/v1/object/public/wiki-images/"
)

SKIP_PATHS = {
    "/wiki/testtt",
    "/wiki/guided-walkthrough/test",
    "/wiki/YOUR_LINK_HERE",
}

# Full image manifest from storage.objects query
IMAGE_NAMES = [
    "1767011401010-nnkxd1.jpg", "1767019072359-dfx5or.png", "1767020686074-2f9h4.png",
    "1767020804202-vv4sh.png", "1767108135326-nyct1a.png", "1767108155362-3n6wzr.png",
    "1767108174480-9ghj4eg.png", "1767108195951-qwxim.gif", "1767108208069-z1qffc.png",
    "1767108223105-k5cqfc.gif", "1767108229276-5l6rr.png", "1767108233963-87tpbv.png",
    "1767108240116-sli2y6.png", "1767108249814-9jfts4.png", "1767108262747-cebtuf.gif",
    "1767144407963-tirda.png", "1767144425989-xwnqx.png", "1767144434365-intqh.png",
    "1767144441978-tah6ci.png", "1767144551218-v6av.png", "1767144562410-rrnb9j.png",
    "1767144573354-a6v29.png", "1767144600881-bv30ng.png", "1767144612727-ph426e.png",
    "1767144626049-x7hzvi.png", "1767144644078-45dlz.png", "1767144656841-5as1an.png",
    "1767144695651-85ub3m.png", "1767144720591-55e5he.png", "1767144735003-2rkaij.png",
    "1767144759348-fv3b58.png", "1767144795547-p3osns.png", "1767144808288-1sa9ya.png",
    "1767144847600-zz1npe.gif", "1767144861083-0bbgh.png", "1767144866892-5ov3wq.gif",
    "1767145646958-37lcw.png", "1767145658279-q2fe1k.png", "1767145838288-dit6s9.png",
    "1767145879520-hstznl.png", "1767146011457-n4y4xn.png", "1767146058191-p47ap.png",
    "1767146063211-rh626f.png", "1767146098137-0kfjp.png", "1767146109516-brjqcp.png",
    "1767146144586-3z25vn.png", "1767146157874-buswuj.png", "1767146166101-ajvkvb.png",
    "1767146179052-z4hk9c.png", "1767146185172-7lewvd.png", "1767146198483-5k0ae.png",
    "1767146233766-gxzbj.png", "1767146238999-n11n14.png", "1767146242759-dx73al.png",
    "1767146246511-68brzq.png", "1767146259378-b1tf5.png", "1767147062141-8qgzh.gif",
    "1767147539214-dhjbp7.png", "1767147886867-x4kafe.png", "1767147902024-j5s8m.png",
    "1767147916490-msprgc.png", "1767147931233-ste8fj.png", "1767147939520-owvpfu.png",
    "1767147949870-57eit9.png", "1767147956921-v0mbfx.png", "1767148331768-2yzkru.png",
    "1767148361519-bry0a.png", "1767148371509-odd2n.png", "1767149443636-vvzsnj.png",
    "1767149464084-1r81lr.png", "1767149506632-k9q8d.png", "1767151360153-0iain8.png",
    "1767184247636-1e3u5i.png", "1767184262493-9i38e.png", "1767184270638-cqtjkt.png",
    "1767184306219-ckug5.png", "1767184313643-sk8s8.png", "1767184322096-b307i.png",
    "1767185228356-6fun2k.png", "1768001486509-o4wnhm.png", "1768001551000-3q6i4i.png",
    "1768738872871-6jo9in.png", "1768738897687-iknswq.png", "1768738971018-am18ih.png",
    "1768739020944-23h6dv.png", "1768739336655-6mggq.png", "1768739510869-uxmh9.png",
    "1768739558165-jpsxo.png", "1768739569367-b9oiaw.png", "1768739708348-3wx76a.png",
    "1768739771507-yn3w3j.png", "1768739904291-lle6hg.png", "1768739963121-r7xh8.png",
    "1768740740602-3ws0r86.png", "1768740885313-m3oqya.png", "1768741016350-5ad5t.png",
    "1768741066298-t6pn.png", "1768741108530-wihx3n.png", "1768741185080-h69aki.png",
    "1768741227212-2agmm.png", "1768742994803-5oevgk.png", "1768743573280-9m5v1.png",
    "1768743909642-ady2ej.png", "1768744036388-2d5f2.png", "1769132598561-dnp7mk.png",
    "1769132679719-x7qanf.png", "1769132694153-e5g8c2.png", "1769132701264-5grdr.png",
    "1769132720262-0d010j.png", "1769132745363-l0cm4s.png", "1769132778060-ufd3d4.png",
    "1769132794191-1luwqa.png", "1769132799839-vw26fb.png", "1769132818310-gyw49l.png",
    "1769132826453-dvots5.png", "1769132846178-bcemql.png", "1769132861515-sfa39.png",
    "1769132867613-zffs1n.png", "1769132889330-6y5jzd.png", "1769132912369-jb8tlr.png",
    "1769133429180-hdk1d.gif", "1769133650731-8zdz6u.gif", "1774321805697-zoe5nl.png",
    "1774322132344-7oqnj.png", "1774323618655-wzqsmk.png", "1774544749638-eptf8i.png",
    "1774545399727-9l279p.png", "1774545645311-0pcwda.png", "1774545855523-xe5n5.png",
    "1774546036659-1oenou.png", "1774546224536-vl2ujo.png",
]


# ---------- page extraction ----------

def load_pages() -> list[dict]:
    # Outer: [{type: "text", text: <json-string>}]
    # text, once parsed, is {result: "...<untrusted-data>...</untrusted-data>..."}
    wrapper = json.loads(TOOL_RESULT.read_text())
    inner = json.loads(wrapper[0]["text"])
    result_str = inner["result"]
    # The first `<untrusted-data-...>` mention is inside the prose intro.
    # The real block is on its own line. Require a preceding newline.
    m = re.search(
        r"\n<untrusted-data-[^>]+>\n(.+?)\n</untrusted-data-[^>]+>",
        result_str,
        re.DOTALL,
    )
    if not m:
        raise SystemExit("couldn't find payload boundaries in tool result")
    rows = json.loads(m.group(1))
    return rows[0]["pages"]


# ---------- path mapping ----------

def page_to_mdx_path(wiki_path: str) -> Path:
    parts = wiki_path.removeprefix("/wiki/").split("/")
    parts = [p.replace("--", "-") for p in parts]
    if len(parts) == 1:
        return CONTENT_DIR / parts[0] / "index.mdx"
    return CONTENT_DIR / Path(*parts[:-1]) / f"{parts[-1]}.mdx"


# ---------- content transforms ----------

IMG_MD_RE = re.compile(
    r"!\[([^\]]*)\]\("
    + re.escape(SUPABASE_PREFIX)
    + r"([^)]+)\)"
)
BARE_URL_RE = re.compile(re.escape(SUPABASE_PREFIX) + r"([A-Za-z0-9._-]+)")
WIDTH_SUFFIX_RE = re.compile(r"^(.*?)\s*\|\s*(\d+)\s*$")


def transform_image(m: re.Match) -> str:
    alt_raw = m.group(1).strip()
    filename = m.group(2).strip()
    w = WIDTH_SUFFIX_RE.match(alt_raw)
    if w:
        alt = w.group(1).strip().replace('"', "'")
        width = w.group(2)
        return f'<img src="/wiki-images/{filename}" alt="{alt}" width={{{width}}} />'
    alt = alt_raw.replace('"', "'")
    return f"![{alt}](/wiki-images/{filename})"


def rewrite_content(content: str) -> str:
    content = IMG_MD_RE.sub(transform_image, content)
    content = BARE_URL_RE.sub(lambda m: f"/wiki-images/{m.group(1)}", content)
    return content


# ---------- page writing ----------

def write_pages(pages: list[dict]) -> int:
    if CONTENT_DIR.exists():
        shutil.rmtree(CONTENT_DIR)
    count = 0
    for page in pages:
        path = page["path"]
        if path in SKIP_PATHS:
            continue
        title = (page["title"] or "").strip()
        content = rewrite_content(page["content"] or "")
        target = page_to_mdx_path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        escaped_title = title.replace("\\", "\\\\").replace('"', '\\"')
        body = f'---\ntitle: "{escaped_title}"\n---\n\n{content}\n'
        target.write_text(body)
        count += 1
    return count


# ---------- image downloads ----------

def download_one(name: str) -> tuple[str, str]:
    dest = IMAGES_DIR / name
    if dest.exists() and dest.stat().st_size > 0:
        return name, "cached"
    url = SUPABASE_PREFIX + name
    try:
        urllib.request.urlretrieve(url, dest)
        return name, "ok"
    except Exception as exc:  # noqa: BLE001
        return name, f"fail: {exc}"


def download_images() -> dict[str, int]:
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    stats = {"ok": 0, "cached": 0, "fail": 0}
    with ThreadPoolExecutor(max_workers=12) as pool:
        futures = [pool.submit(download_one, n) for n in IMAGE_NAMES]
        for f in as_completed(futures):
            _, status = f.result()
            if status == "ok":
                stats["ok"] += 1
            elif status == "cached":
                stats["cached"] += 1
            else:
                stats["fail"] += 1
                print(f"  [fail] {status}", file=sys.stderr)
    return stats


# ---------- reporting ----------

def find_referenced_images() -> set[str]:
    pattern = re.compile(r"/wiki-images/([A-Za-z0-9._-]+)")
    seen: set[str] = set()
    for mdx in CONTENT_DIR.rglob("*.mdx"):
        for m in pattern.finditer(mdx.read_text()):
            seen.add(m.group(1))
    return seen


def main() -> None:
    pages = load_pages()
    written = write_pages(pages)
    print(f"wrote {written} mdx files to {CONTENT_DIR}")

    stats = download_images()
    print(
        f"images: {stats['ok']} downloaded, {stats['cached']} cached, "
        f"{stats['fail']} failed (of {len(IMAGE_NAMES)} total)"
    )

    referenced = find_referenced_images()
    on_disk = {p.name for p in IMAGES_DIR.iterdir() if p.is_file()}
    missing = referenced - on_disk
    orphans = on_disk - referenced
    print(f"referenced: {len(referenced)}, on disk: {len(on_disk)}")
    if missing:
        print(f"  MISSING ({len(missing)}): {sorted(missing)[:5]}...")
    if orphans:
        print(f"  orphan (downloaded but unused): {len(orphans)}")


if __name__ == "__main__":
    main()
