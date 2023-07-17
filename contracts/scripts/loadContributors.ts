import { ethers } from 'hardhat'

async function main() {
  try {
    // We're hardcoding factory address due to a buidler limitation:
    // https://github.com/nomiclabs/buidler/issues/651
    const factoryAddress = '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707'
    const [, contributor1, contributor2] = await ethers.getSigners()

    // Configure factory
    const factory = await ethers.getContractAt(
      'FundingRoundFactory',
      factoryAddress
    )

    // Add contributors
    const userRegistryType = process.env.USER_REGISTRY_TYPE || 'simple'
    if (userRegistryType === 'simple') {
      const userRegistryAddress = await factory.userRegistry()
      const userRegistry = await ethers.getContractAt(
        'SimpleUserRegistry',
        userRegistryAddress
      )

      const users = [contributor1, contributor2]

      let addUserTx
      for (const account of users) {
        try {
          addUserTx = await userRegistry.addUser(account.getAddress())
          addUserTx.wait()
          console.log(
            `User ${account.getAddress()} added successfully to the registry.`
          )
        } catch (err: any) {
          console.error(
            `Failed to add user ${account.getAddress()} to the registry:`,
            err
          )
        }
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
