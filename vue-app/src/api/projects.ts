import { Contract, Signer } from 'ethers'
import type { TransactionResponse } from '@ethersproject/abstract-provider'
import { FundingRound } from './abi'
import { factory, provider, recipientRegistryType } from './core'

import SimpleRegistry from './recipient-registry-simple'
import OptimisticRegistry from './recipient-registry-optimistic'
import KlerosRegistry from './recipient-registry-kleros'

import sdk from '@/graphql/sdk'

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
