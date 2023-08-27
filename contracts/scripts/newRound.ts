import { ethers } from 'hardhat'
import { utils, constants } from 'ethers'

async function main() {
  console.log('*******************')
  console.log('Start a new funding round!')
  console.log('*******************')
  const [deployer] = await ethers.getSigners()
  console.log('deployer.address: ', deployer.address)

  const fundingRoundFactoryAddress = process.env.FACTORY_ADDRESS

  if (!fundingRoundFactoryAddress) {
    throw new Error('Environment variable FACTORY_ADDRESS is not setup')
  }

  const factory = await ethers.getContractAt(
    'FundingRoundFactory',
    fundingRoundFactoryAddress
  )
  console.log('funding round factory address ', factory.address)

  // check if the current round is finalized before starting a new round to avoid revert
  const currentRoundAddress = await factory.getCurrentRound()
  if (currentRoundAddress !== constants.AddressZero) {
    const currentRound = await ethers.getContractAt(
      'FundingRound',
      currentRoundAddress
    )
    const isFinalized = await currentRound.isFinalized()
    if (!isFinalized) {
      throw new Error(
        'Cannot start a new round as the current round is not finalized'
      )
    }
  }

  const tx = await factory.deployNewRound()
  console.log('Deployed new round, tx hash: ', tx.hash)
  await tx.wait()
  console.log('New funding round address: ', await factory.getCurrentRound())

  console.log('*******************')
  console.log('Script complete!')
  console.log('*******************')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
