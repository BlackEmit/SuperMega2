import { Address, BitReader, BitString, Cell, TupleReader, internal, external, toNano, beginCell, storeMessage } from '@ton/core'
import { KeyPair, getSecureRandomBytes, mnemonicToWalletKey } from '@ton/crypto'
import { TonClient4 } from '@ton/ton';
import { execSync } from 'child_process';
import fs from 'fs'
import { WalletContractV4, TonClient } from '@ton/ton';
import arg from 'arg'
import { LiteClient, LiteSingleEngine, LiteRoundRobinEngine } from 'ton-lite-client';
import { OpenedContract } from '@ton/core';
import { Api, HttpClient } from 'tonapi-sdk-js';

let tonapiClient: any

const givers100 = [
    { address: 'EQCfwe95AJDfKuAoP1fBtu-un1yE7Mov-9BXaFM3lrJZwqg_', reward: 100 },
    { address: 'EQBoATvbIa9vA7y8EUQE4tlsrrt0EhSUK4mndp49V0z7Me3M', reward: 100 },
    { address: 'EQAV3tsPXau3VJanBw4KCFaMk3l_n3sX8NHZNgICFrR-9EGE', reward: 100 },
    { address: 'EQAR9DvLZMHo9FAVMHI1vHvL7Fi7jWgjKtUARZ2S_nopQRYz', reward: 100 },
    { address: 'EQC10L__G2SeEeM2Lw9osGyYxhoIPqJwE-8Pe7728JcmnJzW', reward: 100 },
    { address: 'EQDZJFkh12kw-zLGqKSGVDf1V2PRzedGZDFDcFml5_0QerST', reward: 100 },
    { address: 'EQCiLN0gEiZqthGy-dKl4pi4kqWJWjRzR3Jv4jmPOtQHveDN', reward: 100 },
    { address: 'EQDB8Mo9EviBkg_BxfNv6C2LO_foJRXcgEF41pmQvMvnB9Jn', reward: 100 },
    { address: 'EQAidDzp6v4oe-vKFWvsV8MQzY-4VaeUFnGM3ImrKIJUIid9', reward: 100 },
    { address: 'EQAFaPmLLhXveHcw3AYIGDlHbGAbfQWlH45WGf4K4D6DNZxY', reward: 100 }, // 100
]

const givers1000 = [
    { address: 'EQDSGvoktoIRTL6fBEK_ysS8YvLoq3cqW2TxB_xHviL33ex2', reward: 1000 },
    { address: 'EQCvMmHhSYStEtUAEDrpV39T2GWl-0K-iqCxSSZ7I96L4yow', reward: 1000 },
    { address: 'EQBvumwjKe7xlrjc22p2eLGT4UkdRnrmqmcEYT94J6ZCINmt', reward: 1000 },
    { address: 'EQDEume45yzDIdSy_Cdz7KIKZk0HyCFIr0yKdbtMyPfFUkbl', reward: 1000 },
    { address: 'EQAO7jXcX-fJJZl-kphbpdhbIDUqcAiYcAr9RvVlFl38Uatt', reward: 1000 },
    { address: 'EQAvheS_G-U57CE55UlwF-3M-cc4cljbLireYCmAMe_RHWGF', reward: 1000 },
    { address: 'EQCba5q9VoYGgiGykVazOUZ49UK-1RljUeZgU6E-bW0bqF2Z', reward: 1000 },
    { address: 'EQCzT8Pk1Z_aMpNukdV-Mqwc6LNaCNDt-HD6PiaSuEeCD0hV', reward: 1000 },
    { address: 'EQDglg3hI89dySlr-FR_d1GQCMirkLZH6TPF-NeojP-DbSgY', reward: 1000 },
    { address: 'EQDIDs45shbXRwhnXoFZg303PkG2CihbVvQXw1k0_yVIqxcA', reward: 1000 }, // 1000
]

let createLiteClient: Promise<void>
let lc: LiteClient | undefined = undefined

export async function getLiteClient(): Promise<LiteClient> {
    if (lc) {
      return lc
    }
  
    if (!createLiteClient) {
      createLiteClient = (async () => {
        const liteServers = [
            {
                "ip": 55052138,
                "port": 49150,
                "id": {
                    "@type": "pub.ed25519",
                    "key": "zbJmOSOm/vxME/2JqrGuTCnvX/p7VnS9LAUCPe1LMys="
                }
            }
        ]
        const engines: any[] = []
  
        for (const server of liteServers) {
          const ls = server
          engines.push(
            new LiteSingleEngine({
              host: `tcp://${intToIP(ls.ip)}:${ls.port}`,
              publicKey: Buffer.from(ls.id.key, 'base64'),
            })
          )
        }
  
        const engine = new LiteRoundRobinEngine(engines)
        lc = new LiteClient({
            engine,
            batchSize: 1,
          })
      })()
    }
  
    await createLiteClient
  
    return lc as any
  }

  export function intToIP(int: number) {
    const part1 = int & 255
    const part2 = (int >> 8) & 255
    const part3 = (int >> 16) & 255
    const part4 = (int >> 24) & 255
  
    return `${part4}.${part3}.${part2}.${part1}`
  }

import { getHttpV4Endpoint } from "@orbs-network/ton-access";

let lc4: TonClient4 | undefined = undefined

let lcOrbs: TonClient4 | undefined = undefined

let lcToncenter: TonClient| undefined = undefined

async function getTon4Client(_configUrl?: string): Promise<TonClient4> {
    if (lc4) {
        return lc4
    }

    lc4 = new TonClient4({ endpoint: _configUrl ?? await getHttpV4Endpoint() })
    return lc4 as TonClient4
}

async function getTon4ClientOrbs(_configUrl?: string): Promise<TonClient4> {
    if (lcOrbs) {
        return lcOrbs
    }

    lcOrbs = new TonClient4({ endpoint: _configUrl ?? await getHttpV4Endpoint() })
    return lcOrbs as TonClient4
}

async function getTonCenterClient(_configUrl?: string): Promise<TonClient> {
    if (lcToncenter) {
        return lcToncenter
    }

    lcToncenter = new TonClient({ endpoint: _configUrl ?? 'https://toncenter.com/api/v2/jsonRPC', apiKey: 'c3920bec886bc60ffd667cffb97991c0b612f1622cbd32e9867ad4cf39ab75aa' })
    return lcToncenter as TonClient
}

const args = arg({
    '--givers': Number, // 100 1000 10000
    // '--api': String, // lite, tonhub
    '--seed': String,
    '--bin': String, // cuda, opencl or path to miner
    '--gpu': Number, // gpu id, default 0
    '--timeout': Number, // Timeout for mining in seconds
    '--allow-shards': Boolean, // if true - allows mining to other shards
    '--api': String // if true - allows mining to other shards
})


let givers = givers1000
if (args['--givers']) {
    const val = args['--givers']
    const allowed = [100, 1000]
    if (!allowed.includes(val)) {
        throw new Error('Invalid --givers argument')
    }

    switch (val) {
        case 100:
            givers = givers100
            console.log('Using givers 100')
            break
        case 1000:
            givers = givers1000
            console.log('Using givers 1 000')
            break
    }
} else {
    console.log('Using givers 10 000')
}

const gpu = args['--gpu'] ?? 0
const timeout = args['--timeout'] ?? 3

const allowShards = args['--allow-shards'] ?? false

console.log('Using GPU', gpu)
console.log('Using timeout', timeout)

const mySeed = args['--seed'] as string
const totalDiff = BigInt('115792089237277217110272752943501742914102634520085823245724998868298727686144')



let bestGiver: { address: string, coins: number } = { address: '', coins: 0 }
async function updateBestGivers() {
    const giver = givers[Math.floor(Math.random() * givers.length)]
    bestGiver = {
        address: giver.address,
        coins: giver.reward,
    }
}

async function getNextMaster(liteClient: TonClient4 | LiteClient) {
    if (liteClient instanceof LiteClient) {
        const info = await liteClient.getMasterchainInfo()
        const nextInfo = await liteClient.getMasterchainInfo({ awaitSeqno: info.last.seqno + 1 })
        return nextInfo.last
    } else {
        const info = await liteClient.getLastBlock()

        while (true) {
            try {
                const nextInfo = await liteClient.getBlock(info.last.seqno + 1)
                return nextInfo.shards.find(s => s.workchain === -1)
            }
            catch (e) {
                //
            }
        }
        // const nextInfo = await liteClient.getBlock(info.last.seqno + 1)

        // return info.last.seqno + 1
    }
}

async function getPowInfo(liteClient: TonClient4 | LiteClient | TonClient, address: Address, lastInfoRoot?: any) : Promise<[bigint, bigint, bigint]> {
    if (liteClient instanceof TonClient4) {
        const lastInfo = lastInfoRoot ?? (await CallForSuccess(() => liteClient.getLastBlock())).last
        const powInfo = await CallForSuccess(() => liteClient.runMethod(lastInfo.seqno, address, 'get_pow_params', []))

        const reader = new TupleReader(powInfo.result)
        const seed = reader.readBigNumber()
        const complexity = reader.readBigNumber()
        const iterations = reader.readBigNumber()

        return [seed, complexity, iterations]
    } else if (liteClient instanceof TonClient) {
        const reader = (await liteClient.runMethod(address, 'get_pow_params', [])).stack
        const seed = reader.readBigNumber()
        const complexity = reader.readBigNumber()
        const iterations = reader.readBigNumber()

        return [seed, complexity, iterations]
    }

    throw new Error('invalid client')
}

async function getPowInfo2(liteClient: TonClient4 | LiteClient | TonClient, address: Address, nextMaster?: any): Promise<bigint> {
    if (liteClient instanceof TonClient4) {
        const powInfo = await CallForSuccess(() => liteClient.runMethod(nextMaster.seqno, address, 'get_pow_params', []))

        const reader = new TupleReader(powInfo.result)
        const seed = reader.readBigNumber()

        return seed
    } else if (liteClient instanceof TonClient) {
        const reader = (await liteClient.runMethod(address, 'get_pow_params', [])).stack
        const seed = reader.readBigNumber()

        return seed
    }

    throw new Error('invalid client')
}

let go = true
async function main() {
    let liteClient: TonClient4 | LiteClient | TonClient
    console.log('Using TonHub API')
    liteClient = await getTon4Client()
    // liteClient = await getLiteClient()

    const keyPair = await mnemonicToWalletKey(mySeed.split(' '))
    const wallet = WalletContractV4.create({
        workchain: 0,
        publicKey: keyPair.publicKey
    })

    console.log('Using v4r2 wallet', wallet.address.toString({ bounceable: false, urlSafe: true }))
    
    const opened = liteClient.open(wallet)
    
    await updateBestGivers()

    // let giverAddress = bestGiver.address
    // let nextMaster = await getNextMaster(liteClient)

    // const [seed, complexity, iterations] = await getPowInfo(liteClient, Address.parse(giverAddress), nextMaster)

    // let nonce = BigInt(
    //     '0x' + (await getSecureRandomBytes(16)).toString('hex')
    // );

    // const b = beginCell()
    //     .storeUint(0x4d696e65, 32) // Magic number for 'Mine'
    //     .storeInt(wallet.address.workChain * 4, 8)
    //     .storeUint(Math.floor(Date.now() / 1000) + 900, 32)
    //     .storeBuffer(wallet.address.hash);
        
    // const cell = beginCell()
    //     .storeBuilder(b)
    //     .storeUint(nonce, 256)
    //     .storeUint(seed, 128)
    //     .storeUint(nonce, 256)
    //     .endCell();

    setInterval(() => {
        updateBestGivers()
    }, 5000)

    while (go) {
        // const nextMaster = await getNextMaster(liteClient)

        const giverAddress = bestGiver.address
        const [seed, complexity, iterations] = await getPowInfo(liteClient, Address.parse(giverAddress))

        const randomName = (await getSecureRandomBytes(8)).toString('hex') + '.boc'
        const path = `bocs/${randomName}`
        
        try {
            console.log(`./pow-miner-cuda -g ${gpu} -F 2048 -t ${timeout} EQDjE804hwqDkXi6fwwFKCBuHSvau9CCTkzBYxz7DuLE5Dlq ${seed} ${complexity} ${iterations} ${giverAddress} ${path}`)
            execSync(`./pow-miner-cuda -g ${gpu} -F 2048 -t ${timeout} EQDjE804hwqDkXi6fwwFKCBuHSvau9CCTkzBYxz7DuLE5Dlq ${seed} ${complexity} ${iterations} ${giverAddress} ${path}`, { encoding: 'utf-8', stdio: "pipe" });  // the default is 'buffer'
        } catch (e) {
        }
        let mined: Buffer | undefined = undefined
        try {
            mined = fs.readFileSync(path)
            fs.rmSync(path)
        } catch (e) {
            //
        }
        if (mined) {
            console.log(`mined`)

            let w = opened as OpenedContract<WalletContractV4>
            let seqno = 0
            try {
                seqno = await CallForSuccess(() => w.getSeqno())
            } catch (e) {
                //
            }
            sendMinedBoc(wallet, seqno, keyPair, giverAddress, Cell.fromBoc(mined)[0].asSlice().loadRef())
            // for (let j = 0; j < 5; j++) {
            //     try {
            //         await CallForSuccess(() => {

            //             return w.sendTransfer({
            //                 seqno,
            //                 secretKey: keyPair.secretKey,
            //                 messages: [internal({
            //                     to: giverAddress,
            //                     value: toNano('0.05'),
            //                     bounce: true,
            //                     body: Cell.fromBoc(mined as Buffer)[0].asSlice().loadRef(),
            //                 })],
            //                 sendMode: 3 as any,
            //             })
            //         })
            //         break
            //     } catch (e) {
            //         if (j === 4) {
            //             throw e
            //         }
            //         //
            //     }
            // }
        }
    }
}
main()

async function getTonapiClient(): Promise<Api<unknown>> {
    if (tonapiClient) {
        return tonapiClient
    }

    const headers = {
        'Content-type': 'application/json',
        'Authorization': 'Bearer ' + args['--api']
    }

    const httpClient = new HttpClient({
        baseUrl: 'https://tonapi.io',
        baseApiParams: {
            headers,
        }
    });
    
    // Initialize the API client
    const client = new Api(httpClient);
    tonapiClient = client
    return client
}

async function sendMinedBoc(
    wallet: WalletContractV4,
    seqno: number,
    keyPair: KeyPair,
    giverAddress: string,
    boc: Cell
) {

    const tonapiClient = await getTonapiClient()

        const transfer = wallet.createTransfer({
            seqno,
            secretKey: keyPair.secretKey,
            messages: [internal({
                to: giverAddress,
                value: toNano('0.05'),
                bounce: true,
                body: boc,
            })],
            sendMode: 3 as any,
        })
        const msg = beginCell().store(storeMessage(external({
            to: wallet.address,
            body: transfer
        }))).endCell()

        let k = 0
        let lastError: unknown

        while (k < 20) {
            try {
                await tonapiClient.blockchain.sendBlockchainMessage({
                    boc: msg.toBoc().toString('base64'),
                })
                break
                // return res
            } catch (e: any) {
                // lastError = err
                k++

                if (e.status === 429) {
                    await delay(200)
                } else {
                    // console.log('tonapi error')
                    k = 20
                    break
                }

            }
        }

    const ton4Client = await getTon4Client()
    const toncenterClient = await getTonCenterClient()

    const w1 = ton4Client.open(wallet)
    const w2 = toncenterClient.open(wallet)

    const wallets = [w1, w2]


    // const transferBoc = w1.createTransfer({
    //     seqno,
    //     secretKey: keyPair.secretKey,
    //     messages: [internal({
    //         to: giverAddress,
    //         value: toNano('0.05'),
    //         bounce: true,
    //         body: boc,
    //     })],
    //     sendMode: 3 as any,
    // })


    // console.log('send seqno', seqno)
    // const ext = external({
    //     to: Address.parse(giverAddress),
    //     body: transferBoc
    // })
    // const dataBoc = beginCell().store(storeMessage(ext)).endCell()
    // toncenterClient.sendFile(dataBoc.toBoc()).then(() => {
    //     console.log('toncenter success')
    // }).catch(e => {
    //     //
    //     console.log('toncenter send error', e)
    // })
    // w4.sendTransfer({
    //     seqno,
    //     secretKey: keyPair.secretKey,
    //     messages: [internal({
    //         to: giverAddress,
    //         value: toNano('0.05'),
    //         bounce: true,
    //         body: boc,
    //     })],
    //     sendMode: 3 as any,
    // })

    for (let i = 0; i < 3; i++) {
        for (const w of wallets) {
            w.sendTransfer({
                seqno,
                secretKey: keyPair.secretKey,
                messages: [internal({
                    to: giverAddress,
                    value: toNano('0.05'),
                    bounce: true,
                    body: boc,
                })],
                sendMode: 3 as any,
            }).catch(e => {
                //
            })
        }
    }
}


// Function to call ton api untill we get response.
// Because testnet is pretty unstable we need to make sure response is final
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function CallForSuccess<T extends (...args: any[]) => any>(
    toCall: T,
    attempts = 20,
    delayMs = 100
): Promise<ReturnType<T>> {
    if (typeof toCall !== 'function') {
        throw new Error('unknown input')
    }

    let i = 0
    let lastError: unknown

    while (i < attempts) {
        try {
            const res = await toCall()
            return res
        } catch (err) {
            lastError = err
            i++
            await delay(delayMs)
        }
    }

    console.log('error after attempts', i)
    throw lastError
}

export function delay(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}