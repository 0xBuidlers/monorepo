import { task } from 'hardhat/config'
import { Contract, utils } from 'ethers'
import fs from 'fs'

async function isVerifiedUser(
  registry: Contract,
  address: string
): Promise<boolean> {
  const isVerified = await registry.isVerifiedUser(address)
  return isVerified
}

async function loadFile(registry: Contract, filePath: string) {
  let content: string | null = null
  try {
    content = fs.readFileSync(filePath, 'utf8')
  } catch (err) {
    console.error('Failed to read file', filePath, err)
    return
  }

  const addresses: string[] = []
  content.split(/\r?\n/).forEach(async (address) => {
    addresses.push(address)
  })

  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i]
    const isValidAddress = Boolean(address) && utils.isAddress(address)
    if (isValidAddress) {
      console.log('Checking if address is verified:', address)
      try {
        const isVerified = await isVerifiedUser(registry, address)
        console.log(`Address ${address} is verified: ${isVerified}`)
      } catch (err: any) {
        console.error('Failed to check address', address, err)
      }
    } else {
      console.warn('Skipping invalid address', address)
    }
  }
}

task(
  'verified-users',
  'Check if addresses are verified in the simple user registry'
)
  .addParam('userRegistry', 'The simple user registry contract address')
  .addParam(
    'filePath',
    'The path of the file containing addresses separated by newline'
  )
  .setAction(async ({ userRegistry, filePath }, { ethers }) => {
    const registry = await ethers.getContractAt(
      'SimpleUserRegistry',
      userRegistry
    )

    await loadFile(registry, filePath)
  })
