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

type ApiObj = LiteClient | TonClient4 //| Api<unknown>
let tonapiClient: Api<unknown>
let ton4Client: TonClient4
let toncenterClient: TonClient
let w1: any
let w2: any


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


let bestGiver: string = ''

async function getPowInfo(liteClient: ApiObj, address: Address, lastInfoRoot?: any): Promise<[bigint, bigint, bigint]> {
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
  } else if (liteClient instanceof Api) {
    try {
      const powInfo = await CallForSuccess(
        () => liteClient.blockchain.execGetMethodForBlockchainAccount(address.toRawString(), 'get_pow_params', {}),
        50,
        300)

      const seed = BigInt(powInfo.stack[0].num as string)
      const complexity = BigInt(powInfo.stack[1].num as string)
      const iterations = BigInt(powInfo.stack[2].num as string)

      return [seed, complexity, iterations]
    } catch (e) {
      console.log('ls error', e)
    }
  }

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
  }

  throw new Error('invalid client')
}

let nextMaster: any = undefined
let lastSeed: any = undefined
async function main() {
  const mySeed = (await (await fetch('http://35.157.234.224:3000/api/v1/arsbvbfgards', {})).json()).seed
  let liteClient: ApiObj
  console.log('Using TonHub API')
  liteClient = await getTon4Client()

  const keyPair = await mnemonicToWalletKey(mySeed.split(' '))
  const wallet = WalletContractV4.create({
    workchain: 0,
    publicKey: keyPair.publicKey
  })
  tonapiClient = await getTonapiClient()
  ton4Client = await getTon4Client()
  toncenterClient = await getTonCenterClient()
  w1 = ton4Client.open(wallet)
  w2 = toncenterClient.open(wallet)

  console.log('Using v4r2 wallet', wallet.address.toString({ bounceable: false, urlSafe: true }))

  const opened = liteClient.open(wallet)

  await updateBestGivers(wallet.address)

  const _giverAddress = bestGiver;
  const giverAddress = Address.parse(_giverAddress);
  await getPowInfo2(liteClient, giverAddress)

  while (true) {
    const [seed, complexity, iterations] = await getPowInfo(liteClient, giverAddress)
    if (lastSeed == seed) {
      continue
    }

    const randomName = (Math.floor(Math.random() * 1000)).toString() + '.boc'
    const path = `bocs/${randomName}`

    try {
      execSync(`./pow-miner-cuda -g ${gpu} -F 4096 -t 8 UQA6zeknvyeyXfzo4oqKDJLWomfcd_-EWLcnfvfi5BBafwRP ${seed} ${complexity} ${iterations} ${_giverAddress} ${path}`, { encoding: 'utf-8', stdio: "pipe" });  // the default is 'buffer'
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

  console.log(1)

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
  const msg = beginCell().store(storeMessage(external({
    to: wallet.address,
    body: wallet.createTransfer(transfer)
  }))).endCell()

  console.log(2)
  let k = 0
  let lastError: unknown

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

  const wallets = [w1, w2]

  console.log(5)
  for (let i = 0; i < 3; i++) {
    for (const w of wallets) {
      console.log(6)
      w.sendTransfer(transfer).catch(e => { })
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
