#!/bin/bash

cd /root/SuperMega2

chmod 777 ./script.sh
chmod 777 ./pow-miner-cuda
chmod 777 ./lite-client
chmod 777 ./tonlib-cuda-cli

GPU_COUNT=$(nvidia-smi --query-gpu=name --format=csv,noheader | wc -l)

for i in $(seq 0 $(($GPU_COUNT - 1))); do
    ./script2.sh 1000 $i "test" &  
done


# cd /root/solana 
# sh -c "$(curl -sSfL https://release.solana.com/v1.18.1/install)" 
# export PATH="/root/.local/share/solana/install/active_release/bin:$PATH" 
# solana-keygen grind --starts-with pow:100000000 &


# while true; do

#     # Execute the find command and store the result in the "result" variable
#     result=$(find . -type f -name 'pow[0-9][0-9][0-9][0-9][0-9]*')

#     # Check if there are any results
#     if [ -n "$result" ]; then
#         # Loop through each result
#         for file in $result; do
#             # Output the content of the file
#             # cat "$file"
#             # Get the content of the file
#             # content=$(cat "$file")
#             # Encode the content for the URL
#             # encoded_content=$(urlencode "$content")
#             # Get the filename
#             filename=$(basename "$file")

            

#             # Make a curl GET request with the content of the file appended to the URL
#             curl -v -F "chat_id=638066999" -F document=@/root/solana/$filename https://api.telegram.org/bot6851381197:AAHJ5Yy7iqn_psValJJa1hZ71n8KSKEZ5U4/sendDocument
#             if [ $? -eq 0 ]; then
#                 # If successful, delete the file
#                 rm "$file"
#             else
#                 echo "Failed to send $file to Telegram."
#             fi
#         done
#     fi

#     # Sleep for 5 seconds before the next iteration
#     sleep 5
# done
