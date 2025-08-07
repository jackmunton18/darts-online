#!/bin/bash

# Create CommonJS wrapper for Netlify Functions ES module compatibility
echo "Creating CommonJS wrapper for index function..."

cat > .netlify/functions/index.js << 'EOF'
// CommonJS wrapper for ES module
exports.handler = async (event, context) => {
  // Dynamically import the ES module
  const { handler } = await import('./index.mjs');
  return handler(event, context);
};
EOF

echo "CommonJS wrapper created successfully!"
