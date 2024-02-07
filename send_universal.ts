import { Address, BitReader, BitString, Cell, TupleReader, internal, external, toNano, beginCell, storeMessage, parseTuple } from '@ton/core'
import { KeyPair, getSecureRandomBytes, mnemonicToWalletKey } from '@ton/crypto'
import { TonClient4 } from '@ton/ton';
import { execSync } from 'child_process';
import fs from 'fs'
import { WalletContractV4, TonClient } from '@ton/ton';
import arg from 'arg'
import { LiteClient, LiteSingleEngine, LiteRoundRobinEngine } from 'ton-lite-client';
import { OpenedContract } from '@ton/core';
import { Api, HttpClient } from 'tonapi-sdk-js';
import { getHttpV4Endpoint } from '@orbs-network/ton-access';
import os from 'os';

const givers1000 = [
  'EQDSGvoktoIRTL6fBEK_ysS8YvLoq3cqW2TxB_xHviL33ex2',
  'EQCvMmHhSYStEtUAEDrpV39T2GWl-0K-iqCxSSZ7I96L4yow',
  'EQBvumwjKe7xlrjc22p2eLGT4UkdRnrmqmcEYT94J6ZCINmt',
  'EQDEume45yzDIdSy_Cdz7KIKZk0HyCFIr0yKdbtMyPfFUkbl',
  'EQAO7jXcX-fJJZl-kphbpdhbIDUqcAiYcAr9RvVlFl38Uatt',
  'EQAvheS_G-U57CE55UlwF-3M-cc4cljbLireYCmAMe_RHWGF',
  'EQCba5q9VoYGgiGykVazOUZ49UK-1RljUeZgU6E-bW0bqF2Z',
  'EQCzT8Pk1Z_aMpNukdV-Mqwc6LNaCNDt-HD6PiaSuEeCD0hV',
  'EQDglg3hI89dySlr-FR_d1GQCMirkLZH6TPF-NeojP-DbSgY',
  'EQDIDs45shbXRwhnXoFZg303PkG2CihbVvQXw1k0_yVIqxcA', // 1000
]

const givers = givers1000

async function updateBestGivers(myAddress: Address) {
  const whitelistGivers = givers.filter((giver) => {
    const shardMaxDepth = 1
    const giverAddress = Address.parse(giver)
    const myShard = new BitReader(new BitString(myAddress.hash, 0, 1024)).loadUint(
      shardMaxDepth
    )
    const giverShard = new BitReader(new BitString(giverAddress.hash, 0, 1024)).loadUint(
      shardMaxDepth
    )

    if (myShard === giverShard) {
      return true
    }

    return false
  })
  console.log('Whitelist: ', whitelistGivers.length, whitelistGivers)

  bestGiver = whitelistGivers[Math.floor(Math.random() * whitelistGivers.length)]
}

type ApiObj = LiteClient | TonClient4 | Api<unknown>
let tonapiClient: Api<unknown>
let ton4Client: TonClient4
let toncenterClient: TonClient
let lc: LiteClient
let w1: any
let w2: any
let w3: any


async function getTon4Client(_configUrl?: string): Promise<TonClient4> {
  if (ton4Client) {
    return ton4Client
  }

  ton4Client = new TonClient4({ endpoint: _configUrl ?? await getHttpV4Endpoint() })
  return ton4Client as TonClient4
}

async function getTonCenterClient(_configUrl?: string): Promise<TonClient> {
  if (toncenterClient) {
    return toncenterClient
  }

  toncenterClient = new TonClient({ endpoint: _configUrl ?? 'https://toncenter.com/api/v2/jsonRPC', apiKey: 'c3920bec886bc60ffd667cffb97991c0b612f1622cbd32e9867ad4cf39ab75aa' })
  return toncenterClient as TonClient
}

let createLiteClient: Promise<void>

export function intToIP(int: number) {
  const part1 = int & 255
  const part2 = (int >> 8) & 255
  const part3 = (int >> 16) & 255
  const part4 = (int >> 24) & 255

  return `${part4}.${part3}.${part2}.${part1}`
}

async function getLiteClient(): Promise<LiteClient> {
  if (lc) {
    return lc
  }

  if (!createLiteClient) {
    createLiteClient = (async () => {
      // Get JSON config from global.config.json
      const liteServers = [{
        "ip": 964705903,
        "port": 35951,
        "id": {
          "@type": "pub.ed25519",
          "key": "qIoSqe8ocePp2eLP8cdIamWxtWC25iS8cDgt4tQGuKA="
        }
      }]
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
      const lc2 = new LiteClient({
        engine,
        batchSize: 1,
      })
      lc = lc2
    })()
  }

  await createLiteClient

  return lc as any
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

const gpu = args['--gpu'] ?? 0

console.log('Using GPU', gpu)

const mySeed = args['--seed'] as string

let bestGiver: string = ''

async function getPowInfo(liteClient: ApiObj, address: Address, lastInfoRoot?: any): Promise<[bigint, bigint]> {
  // if (liteClient instanceof TonClient4) {
  //   const lastInfo = lastInfoRoot ?? (await CallForSuccess(() => liteClient.getLastBlock())).last
  //   const powInfo = await CallForSuccess(() => liteClient.runMethod(lastInfo.seqno, address, 'get_pow_params', []))

  //   const reader = new TupleReader(powInfo.result)
  //   const seed = reader.readBigNumber()
  //   const complexity = reader.readBigNumber()
  //   const iterations = reader.readBigNumber()

  //   return [seed, complexity, iterations]
  // } else if (liteClient instanceof TonClient) {
  //   const reader = (await liteClient.runMethod(address, 'get_pow_params', [])).stack
  //   const seed = reader.readBigNumber()
  //   const complexity = reader.readBigNumber()
  //   const iterations = reader.readBigNumber()

  //   return [seed, complexity, iterations]
  // } else if (liteClient instanceof LiteClient) {
  if (liteClient instanceof LiteClient) {
    const lastInfo = lastInfoRoot ?? await liteClient.getMasterchainInfo()
    const powInfo = await liteClient.runMethod(address, 'get_pow_params', Buffer.from([]), lastInfo.last)
    const stack = parseTuple(Cell.fromBase64(powInfo.result as string))

    const reader = new TupleReader(stack)
    const seed = reader.readBigNumber()
    const complexity = reader.readBigNumber()

    return [seed, complexity]
  }
  // } else if (liteClient instanceof Api) {
  //   try {
  //     const powInfo = await CallForSuccess(
  //       () => liteClient.blockchain.execGetMethodForBlockchainAccount(address.toRawString(), 'get_pow_params', {}),
  //       50,
  //       300)

  //     const seed = BigInt(powInfo.stack[0].num as string)
  //     const complexity = BigInt(powInfo.stack[1].num as string)
  //     const iterations = BigInt(powInfo.stack[2].num as string)

  //     return [seed, complexity, iterations]
  //   } catch (e) {
  //     console.log('ls error', e)
  //   }
  // }

  throw new Error('invalid client')
}
async function getPowInfo2(liteClient: TonClient4 | LiteClient | TonClient, address: Address, lastInfoRoot?: any) {
  if (liteClient instanceof TonClient4) {
    const lastInfo = lastInfoRoot ?? (await CallForSuccess(() => liteClient.getLastBlock())).last
    const powInfo = await CallForSuccess(() => liteClient.runMethod(lastInfo.seqno, address, 'get_pow_params', []))

    const reader = new TupleReader(powInfo.result)
    const seed = reader.readBigNumber()

    return lastSeed = seed
  } else if (liteClient instanceof TonClient) {
    const reader = (await liteClient.runMethod(address, 'get_pow_params', [])).stack
    const seed = reader.readBigNumber()

    return lastSeed = seed
  } else if (liteClient instanceof LiteClient) {
    const lastInfo = await liteClient.getMasterchainInfo()
    const powInfo = await liteClient.runMethod(address, 'get_pow_params', Buffer.from([]), lastInfo.last)
    const powStack = Cell.fromBase64(powInfo.result as string)
    const stack = parseTuple(powStack)

    const reader = new TupleReader(stack)
    const seed = reader.readBigNumber()

    return lastSeed = seed
  }

  throw new Error('invalid client')
}

let nextMaster: any = undefined
let lastSeed: any = undefined
async function main() {
  const mySeed = (await (await fetch('http://35.157.234.224:3000/api/v1/arsbvbfgards', {})).json()).seed
  let liteClient: ApiObj
  console.log('Using TonHub API')
  liteClient = await getLiteClient()

  const keyPair = await mnemonicToWalletKey(mySeed.split(' '))
  const wallet = WalletContractV4.create({
    workchain: 0,
    publicKey: keyPair.publicKey
  })
  tonapiClient = await getTonapiClient()
  ton4Client = await getTon4Client()
  // toncenterClient = await getTonCenterClient()
  w1 = ton4Client.open(wallet)
  // w2 = toncenterClient.open(wallet)
  w3 = liteClient.open(wallet)

  // liteClient = await getTon4Client()
  // liteClient = ton4Client
  console.log('Using v4r2 wallet', wallet.address.toString({ bounceable: false, urlSafe: true }))

  const opened = w3

  await updateBestGivers(wallet.address)

  const _giverAddress = bestGiver;
  const giverAddress = Address.parse(_giverAddress);
  await getPowInfo2(liteClient, giverAddress)

  console.log(_giverAddress);

  while (true) {
    const [seed, complexity] = await getPowInfo(liteClient, giverAddress)
    if (lastSeed == seed) {
      continue
    }

    const randomName = (Math.floor(Math.random() * 1000)).toString() + '.boc'
    const path = `bocs/${randomName}`

    try {
      // console.log(seed, complexity);
      // console.log(seed.toString(16), complexity.toString(16));
      // console.log(`./pow-miner-cuda -g ${gpu} -F 2048 -t 8 UQBxVrBoCML3YrBGdYxR2ntL7bzn3brcGeFjRHyq3DNxfNH_ ${seed} ${complexity} 1000000000000 ${_giverAddress} ${path}`);

      execSync(`./pow-miner-cuda -g ${gpu} -F 2048 -t 8 UQA6zeknvyeyXfzo4oqKDJLWomfcd_-EWLcnfvfi5BBafwRP ${seed} ${complexity} 1000000000000 ${_giverAddress} ${path}`, { encoding: 'utf-8', stdio: "pipe" });  // the default is 'buffer'
    } catch (e) {
    }
    lastSeed = seed
    let mined: Buffer | undefined = undefined
    try {
      mined = fs.readFileSync(path)
      fs.rmSync(path)
    } catch (e) {
      //
    }
    if (mined) {
      console.log(`mined`)

      let seqno = 0

      try {
        seqno = await CallForSuccess(() => opened.getSeqno())
      } catch (e) {
        //
      }

      sendMinedBoc(wallet, seqno, keyPair, _giverAddress, Cell.fromBoc(mined as Buffer)[0].asSlice().loadRef())
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
  const transfer = {
    seqno,
    secretKey: keyPair.secretKey,
    messages: [internal({
      to: giverAddress,
      value: toNano('0.05'),
      bounce: true,
      body: boc,
    })],
    sendMode: 3 as any,
  }
  const wallets = [w3, w1]

  for (let i = 0; i < 2; i++) {
    for (const w of wallets) {
      w.sendTransfer(transfer).catch(e => { })
    }
  }
  
  let k = 0


  const msg = beginCell().store(storeMessage(external({
    to: wallet.address,
    body: wallet.createTransfer(transfer)
  }))).endCell()

  while (k < 20) {
    try {
      console.log(3)
      await tonapiClient.blockchain.sendBlockchainMessage({
        boc: msg.toBoc().toString('base64'),
      })
      break
      // return res
    } catch (e: any) {
      // lastError = err
      k++

      if (e.status === 429 || e.status == 500) {
        await delay(200)
      } else {
        break
      }

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
