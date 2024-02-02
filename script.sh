while true; do
    echo "heny bithes"
    npx ts-node send_universal.ts --givers $1 --gpu $2 --seed "$3" --api $4
done
