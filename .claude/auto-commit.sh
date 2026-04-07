#!/bin/bash
# Auto-commit and push hook for PostToolUse (Write|Edit)
cd /d/Projects/VegiAlter || exit 0

# Extract filename from stdin JSON
FILENAME=$(node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d);const f=j.tool_input?.file_path||j.tool_response?.filePath||'';if(f)console.log(require('path').basename(f))})" 2>/dev/null)

[ -z "$FILENAME" ] && exit 0

git add -A
git diff --cached --quiet && exit 0
git commit -m "Update ${FILENAME}" && git push origin main
