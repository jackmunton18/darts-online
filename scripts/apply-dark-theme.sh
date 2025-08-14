#!/bin/bash

# Script to replace bg-white with panel-dark class in Vue files
# This will add the panel-dark class to elements with bg-white, but won't remove bg-white
# since our CSS overrides will handle that

echo "Updating Vue files to use dark theme classes..."

# Find all Vue files and apply the transformation
find ./pages ./components -name "*.vue" -exec sed -i '' 's/class="bg-white rounded-lg shadow-md p-[46]"/class="bg-white panel-dark p-4"/g' {} \;
find ./pages ./components -name "*.vue" -exec sed -i '' 's/class="bg-white rounded-lg shadow-md p-6"/class="bg-white panel-dark p-6"/g' {} \;
find ./pages ./components -name "*.vue" -exec sed -i '' 's/class="bg-white shadow-md rounded-lg p-[46]"/class="bg-white card-dark p-4"/g' {} \;
find ./pages ./components -name "*.vue" -exec sed -i '' 's/class="bg-white shadow-md rounded-lg p-6"/class="bg-white card-dark p-6"/g' {} \;

echo "Adding bg-dark-tertiary class to all modal backgrounds..."
find ./components -name "*.vue" -exec sed -i '' 's/class="bg-white dark:bg-gray-800/class="bg-white bg-dark-tertiary/g' {} \;

echo "Done updating files!"
