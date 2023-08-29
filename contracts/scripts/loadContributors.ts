import { ethers } from 'hardhat'
import fs from 'fs'

async function main() {
  try {
    console.log('Iniciando..')
    let filePath = 'contributors.txt'

    let content: string | null = null
    try {
      content = fs.readFileSync(filePath, 'utf8')
    } catch (err) {
      console.error('Failed to read file', filePath, err)
      return
    }

    const contributorAddresses: string[] = []
    content.split(/\r?\n/).forEach(async (address) => {
      contributorAddresses.push(address)
    })

    // Configure factory
    const factoryAddress = process.env.FACTORY_ADDRESS!
    const factory = await ethers.getContractAt(
      'FundingRoundFactory',
      factoryAddress
    )

    // Add contributors
    const userRegistryAddress = await factory.userRegistry()
    const userRegistry = await ethers.getContractAt(
      'SimpleUserRegistry',
      userRegistryAddress
    )
    for (const contributor of contributorAddresses) {
      try {
        let addUserTx = await userRegistry.addUser(contributor)
        addUserTx.wait()
        console.log(`User ${contributor} added successfully to the registry.`)
      } catch (err: any) {
        console.error(`Failed to add user ${contributor} to the registry:`, err)
      }
    }
  } catch (err: any) {
    console.error('Failed to add users to the registry:', err)
    process.exit(1)
  }
}

main()
  .then(() => {
    console.log('Done')
    process.exit(0)
  })
  .catch((error) => {
    console.error('An unexpected error occurred:', error)
    process.exit(1)
  })
