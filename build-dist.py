from pathlib import Path
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
doc_dirs = ['README', 'docs/ui/README', 'docs/tech/technical-proposal']

index = (root / 'index.html').read_text()
dist = root / 'dist'
if dist.exists():
    shutil.rmtree(dist)
dist.mkdir()

for name in public_files:
    src = root / name
    if src.exists():
        shutil.copy2(src, dist / name)

for route in route_dirs + doc_dirs:
    target = dist / route
    target.mkdir(parents=True, exist_ok=True)
    shutil.copy2(root / route / 'index.html' if (root / route / 'index.html').exists() else root / 'index.html', target / 'index.html')

# Markdown/raw docs remain intentional public assets for ?raw=1 and preview source fallback.
for name in ['README.md']:
    if (root / name).exists():
        shutil.copy2(root / name, dist / name)
for name in ['docs/ui/README.md', 'docs/tech/technical-proposal.md']:
    src = root / name
    if src.exists():
        dst = dist / name
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)

print(f'built {dist}')
