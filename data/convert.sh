#!/bin/bash

if [ $# -ne 1 ]; then
  echo "Usage: $0 input_file"
  exit 1
fi

input_file="$1"
output_file="output.json"
id_start=1381

if [ ! -f "$input_file" ]; then
  echo "Error: File '$input_file' not found!"
  exit 1
fi

echo "[" > "$output_file"

line_num=0
while IFS= read -r line || [ -n "$line" ]; do
  id=$((id_start + line_num))
  
  # Escape double quotes and backslashes in text
  escaped_text=$(printf '%s' "$line" | sed 's/\\/\\\\/g; s/"/\\"/g')
  
  # Add comma before all except first element
  if [ "$line_num" -gt 0 ]; then
    echo "," >> "$output_file"
  fi
  
  echo "  {" >> "$output_file"
  echo "    \"id\": \"$id\"," >> "$output_file"
  echo "    \"text\": \"$escaped_text\"," >> "$output_file"
  echo "    \"statuses\": [false, false, false, false]" >> "$output_file"
  echo -n "  }" >> "$output_file"
  
  ((line_num++))
done < "$input_file"

echo "" >> "$output_file"
echo "]" >> "$output_file"

echo "JSON file created: $output_file"
