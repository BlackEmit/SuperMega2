while true; do
    echo "Starting..."
    npx ts-node send_universal.ts --givers 1000 --gpu $1 --seed "none" 
done
