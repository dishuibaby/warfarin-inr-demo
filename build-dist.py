from pathlib import Path
import json
import shutil

root = Path(__file__).resolve().parent
public_files = ['index.html', 'app.js', 'styles.css', 'markdown.js']
route_dirs = [
    'wechat/home', 'wechat/records', 'wechat/inr', 'wechat/me', 'wechat/login',
    'wechat/inr-settings', 'wechat/dose-settings', 'wechat/notifications', 'wechat/account', 'wechat/profile', 'wechat/help',
    'wechat/inr-methods', 'wechat/test-settings', 'wechat/after-dose-rule',
    'android/home', 'android/records', 'android/inr', 'android/me', 'android/login',
    'android/inr-settings', 'android/dose-settings', 'android/notifications', 'android/account', 'android/profile', 'android/help',
    'ios/home', 'ios/records', 'ios/inr', 'ios/me', 'ios/login',
    'ios/inr-settings', 'ios/dose-settings', 'ios/notifications', 'ios/account', 'ios/profile', 'ios/help',
]
markdown_docs = [
    'README.md',
    'docs/ui/README.md',
    'docs/product/module-feature-inventory.md',
    'docs/product/current-progress.md',
    'docs/tech/technical-proposal.md',
    'docs/tech/architecture-report.md',
    'docs/tech/database-and-cache-design.md',
    'docs/tech/base-data-and-schema-review.md',
    'docs/plans/2026-04-24-multiplatform-mvp.md',
    'docs/reports/2026-04-25-inr-refinement-implementation.md',
]

index = (root / 'index.html').read_text(encoding='utf-8')
dist = root / 'dist'
if dist.exists():
    shutil.rmtree(dist)
dist.mkdir()

for name in public_files:
    src = root / name
    if src.exists():
        shutil.copy2(src, dist / name)

for route in route_dirs:
    target = dist / route
    target.mkdir(parents=True, exist_ok=True)
    shutil.copy2(root / route / 'index.html' if (root / route / 'index.html').exists() else root / 'index.html', target / 'index.html')

def preview_route_for(md_path: str) -> str:
    without_ext = md_path[:-3]
    return without_ext

def make_preview_html(markdown: str) -> str:
    source = json.dumps(markdown, ensure_ascii=False)
    return index.replace('<script src="/markdown.js"></script>', f'<script id="md-source" type="application/json">{source}</script>\n    <script src="/markdown.js"></script>')

for name in markdown_docs:
    src = root / name
    if not src.exists():
        continue
    raw_dst = dist / name
    raw_dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, raw_dst)

    route = preview_route_for(name)
    preview_dir = dist / route
    preview_dir.mkdir(parents=True, exist_ok=True)
    preview_html = make_preview_html(src.read_text(encoding='utf-8'))
    (preview_dir / 'index.html').write_text(preview_html, encoding='utf-8')

print(f'built {dist}')
