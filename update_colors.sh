#!/bin/bash
find src/ -type f -name "*.tsx" -exec sed -i \
  -e 's/text-gray-100/text-text-main/g' \
  -e 's/text-gray-200/text-text-main/g' \
  -e 's/text-gray-300/text-text-main/g' \
  -e 's/text-gray-400/text-text-muted/g' \
  -e 's/text-gray-500/text-text-muted/g' \
  -e 's/border-gray-800\/50/border-border/g' \
  -e 's/border-gray-800/border-border/g' \
  -e 's/border-gray-600/border-text-muted/g' \
  -e 's/bg-gray-800\/50/bg-hover/g' \
  -e 's/bg-gray-800\/30/bg-hover/g' \
  -e 's/bg-gray-800/bg-border/g' \
  {} +
