import os
import re

files = [
    "components/app-header.tsx",
    "components/directorio-content.tsx",
    "components/events-feed.tsx",
    "components/templos-content.tsx",
    "components/coros-content.tsx",
    "components/directiva-content.tsx",
    "components/search-content.tsx",
    "components/hero-section.tsx",
    "components/album-content.tsx"
]

patterns = [
    r"shadow-\[0_8px_24px_rgba\(47,94,147,0\.06\)\] dark:shadow-none",
    r"shadow-\[0_0_10px_rgba\(0,0,0,0\.045\)\] dark:shadow-none",
    r"shadow-\[0_0_15px_1px_rgba\(0,0,0,0\.07\)\] dark:shadow-none",
    r"shadow-\[0_4px_16px_rgba\(47,94,147,0\.08\)\]"
]

for f in files:
    try:
        with open(f, 'r') as file:
            content = file.read()
        
        for p in patterns:
            content = re.sub(p, "paper-layout-shadow", content)
            
        with open(f, 'w') as file:
            file.write(content)
            
        print(f"Updated {f}")
    except Exception as e:
        print(f"Error {f}: {e}")
