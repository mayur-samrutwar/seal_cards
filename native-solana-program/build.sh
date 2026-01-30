#!/bin/bash
set -e

export PATH="$HOME/.local/share/solana/solana-install/bin:$PATH"

echo "🔨 Building native Solana program..."

rm -rf target
rm -f Cargo.lock

# Build - this will create Cargo.lock with version 4
cargo build-sbf 2>&1 | tee /tmp/build.log || true

sleep 1

# Fix lock file version
if [ -f Cargo.lock ]; then
    python3 << 'EOF'
import re
with open('Cargo.lock', 'r') as f:
    content = f.read()
content = re.sub(r'^version = 4$', 'version = 3', content, flags=re.MULTILINE)
with open('Cargo.lock', 'w') as f:
    f.write(content)
print('✅ Fixed Cargo.lock version')
EOF
    echo "🔨 Rebuilding..."
    cargo build-sbf
    echo "✅ Build successful!"
else
    echo "❌ Build failed"
    cat /tmp/build.log
    exit 1
fi
