import { BigNumber, Contract, Signer } from 'ethers'
import type { TransactionResponse } from '@ethersproject/abstract-provider'
import { FundingRound } from './abi'
import { factory, provider, recipientRegistryType, ipfsGatewayUrl } from './core'

import SimpleRegistry from './recipient-registry-simple'
import OptimisticRegistry from './recipient-registry-optimistic'
import KlerosRegistry from './recipient-registry-kleros'
import sdk from '@/graphql/sdk'
import { getLeaderboardData } from '@/api/leaderboard'

export interface LeaderboardProject {
  id: string // Address or another ID depending on registry implementation
  name: string
  index: number
  bannerImageUrl?: string
  thumbnailImageUrl?: string
  imageUrl?: string
  allocatedAmount: BigNumber
  votes: BigNumber
  donation: BigNumber
}

export interface Project {
  id: string // Address or another ID depending on registry implementation
  address: string
  requester?: string
  name: string
  tagline?: string
  description: string
  category?: string
  problemSpace?: string
  plans?: string
  teamName?: string
  teamDescription?: string
  githubUrl?: string
  radicleUrl?: string
  websiteUrl?: string
  twitterUrl?: string
  discordUrl?: string
  bannerImageUrl?: string
  thumbnailImageUrl?: string
  imageUrl?: string // TODO remove
  index: number
  isHidden: boolean // Hidden from the list (does not participate in round)
  isLocked: boolean // Visible, but contributions are not allowed
  extra?: any // Registry-specific data
}

//TODO: update anywhere this is called to take factory address as a parameter
//NOTE: why isn't this included in the vuex state schema?
export async function getRecipientRegistryAddress(roundAddress: string | null): Promise<string> {
  if (roundAddress !== null) {
    const fundingRound = new Contract(roundAddress, FundingRound, provider)
    return await fundingRound.recipientRegistry()
  } else {
    //TODO: upgrade factory to take it's address as a parameter
    return await factory.recipientRegistry()
  }
}

export async function getProjects(registryAddress: string, startTime?: number, endTime?: number): Promise<Project[]> {
  if (recipientRegistryType === 'simple') {
    return await SimpleRegistry.getProjects(registryAddress, startTime, endTime)
  } else if (recipientRegistryType === 'optimistic') {
    return await OptimisticRegistry.getProjects(registryAddress, startTime, endTime)
  } else if (recipientRegistryType === 'kleros') {
    return await KlerosRegistry.getProjects(registryAddress, startTime, endTime)
  } else {
    throw new Error('invalid recipient registry type')
  }
}

export async function getProject(registryAddress: string, recipientId: string): Promise<Project | null> {
  if (recipientRegistryType === 'simple') {
    return await SimpleRegistry.getProject(registryAddress, recipientId)
  } else if (recipientRegistryType === 'optimistic') {
    return await OptimisticRegistry.getProject(recipientId)
  } else if (recipientRegistryType === 'kleros') {
    return await KlerosRegistry.getProject(registryAddress, recipientId)
  } else {
    throw new Error('invalid recipient registry type')
  }
}

export async function registerProject(
  registryAddress: string,
  recipientId: string,
  signer: Signer,
): Promise<TransactionResponse> {
  if (recipientRegistryType === 'optimistic') {
    return await OptimisticRegistry.registerProject(registryAddress, recipientId, signer)
  } else if (recipientRegistryType === 'kleros') {
    return await KlerosRegistry.registerProject(registryAddress, recipientId, signer)
  } else {
    throw new Error('invalid recipient registry type')
  }
}

/**
 * Get project information by recipient index
 * @param registryAddress recipient registry contract address
 * @param recipientIndex recipient index
 * @returns Project | null
 */
export async function getProjectByIndex(
  registryAddress: string,
  recipientIndex: number,
): Promise<Partial<Project> | null> {
  const result = await sdk.GetRecipientByIndex({
    registryAddress: registryAddress.toLowerCase(),
    recipientIndex,
  })

  if (!result.recipients.length) {
    return null
  }

  const [recipient] = result.recipients
  let metadata
  try {
    metadata = JSON.parse(recipient.recipientMetadata || '')
  } catch {
    metadata = {}
  }

  const thumbnailImageUrl = metadata.thumbnailImageHash
    ? `${ipfsGatewayUrl}/ipfs/${metadata.thumbnailImageHash}`
    : `${ipfsGatewayUrl}/ipfs/${metadata.imageUrl}`

  return {
    id: recipient.id,
    address: recipient.recipientAddress || '',
    name: metadata.name,
    description: metadata.description,
    tagline: metadata.tagline,
    thumbnailImageUrl,
    index: recipient.recipientIndex,
  }
}

/**
 * Check if the recipient with the submission hash exists in the subgraph
 * @param transactionHash recipient submission hash
 * @returns true if recipients with the submission hash was found
 */
export async function recipientExists(transactionHash: string): Promise<boolean> {
  const data = await sdk.GetRecipientBySubmitHash({ transactionHash })
  return data.recipients.length > 0
}

/**
 * Return the recipient for the given submission hash
 * @param transactionHash recipient submission hash
 * @returns project or null for not found
 */
export async function getRecipientBySubmitHash(transactionHash: string): Promise<Project | null> {
  try {
    const data = await sdk.GetRecipientBySubmitHash({ transactionHash })
    const exists = data.recipients.length > 0
    return exists ? OptimisticRegistry.decodeProject(data.recipients[0]) : null
  } catch {
    return null
  }
}

export function toLeaderboardProject(project: any): LeaderboardProject {
  const imageUrl = `${ipfsGatewayUrl}/ipfs/${project.metadata.imageHash || project.metadata.thumbnailImageHash}`
  return {
    id: project.id,
    name: project.name,
    index: project.recipientIndex,
    imageUrl,
    allocatedAmount: BigNumber.from(project.allocatedAmount || '0'),
    votes: BigNumber.from(project.tallyResult || '0'),
    donation: BigNumber.from(project.spentVoiceCredits || '0'),
  }
}

export async function getLeaderboardProject(
  roundAddress: string,
  projectId: string,
  network: string,
): Promise<Project | null> {
  const data = await getLeaderboardData(roundAddress, network)
  if (!data) {
    return null
  }

  const project = data.projects.find(project => project.id === projectId)

  const metadata = project.metadata
  const thumbnailHash = metadata.imageHash
  const thumbnailImageUrl = thumbnailHash ? `${ipfsGatewayUrl}/ipfs/${thumbnailHash}` : undefined
  const bannerHash = metadata.imageHash
  const bannerImageUrl = bannerHash ? `${ipfsGatewayUrl}/ipfs/${bannerHash}` : undefined

  return {
    id: project.id,
    address: project.recipientAddress || '',
    name: project.name,
    description: metadata.description,
    tagline: metadata.tagline,
    thumbnailImageUrl,
    bannerImageUrl,
    index: project.recipientIndex,
    isHidden: false, // always show leaderboard project
    isLocked: true, // Visible, but contributions are not allowed
  }
}
