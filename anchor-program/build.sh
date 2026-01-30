#!/bin/bash
# Build script that fixes Cargo.lock version compatibility

set -e

export PATH="$HOME/.local/share/solana/solana-install/bin:$PATH"

echo "🔨 Building Anchor program..."

# Remove old build artifacts and lock file
rm -rf target
rm -f Cargo.lock

# Use system Cargo for generating lock file (newer version)
export CARGO=$(which cargo)

# First, let Anchor generate the IDL and create Cargo.lock
echo "📝 Generating program ID and lock file..."
anchor build 2>&1 | tee /tmp/anchor-build.log || true

# Wait for Cargo.lock to be created
sleep 2

# Fix the lock file version if it exists
if [ -f Cargo.lock ]; then
    echo "🔧 Fixing Cargo.lock version from 4 to 3..."
    python3 << 'EOF'
import re
with open('Cargo.lock', 'r') as f:
    content = f.read()
# Replace version = 4 with version = 3
content = re.sub(r'^version = 4$', 'version = 3', content, flags=re.MULTILINE)
with open('Cargo.lock', 'w') as f:
    f.write(content)
print('✅ Fixed Cargo.lock version')
EOF
    
    # Clear the problematic crate from cache
    echo "🧹 Cleaning problematic crate cache..."
    rm -rf ~/.cargo/registry/src/index.crates.io-*/constant_time_eq-0.4.2 2>/dev/null || true
    
    # Now build with the fixed lock file
    echo "🔨 Building with fixed lock file..."
    anchor build
    echo "✅ Build successful!"
else
    echo "❌ Cargo.lock was not created"
    cat /tmp/anchor-build.log
    exit 1
fi
