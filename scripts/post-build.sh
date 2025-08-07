#!/bin/bash

# Create CommonJS wrapper for Netlify Functions ES module compatibility
echo "Creating CommonJS wrapper for server function..."

cat > .netlify/functions/server.js << 'EOF'
// CommonJS wrapper for ES module
exports.handler = async (event, context) => {
  // Dynamically import the ES module
  const { handler } = await import('./server.mjs');
  return handler(event, context);
};
EOF

echo "CommonJS wrapper created successfully!"
