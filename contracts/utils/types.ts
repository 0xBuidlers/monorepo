export enum recipientRegistryType {
  simple = 0,
  kleros = 1,
  optimistic = 2,
}

export interface Project {
  id: string
  requester?: string
  recipientIndex?: number
  recipientAddress?: string
  name?: string
  state: string
  createdAt?: Date
  removedAt?: Date
  tallyIndex?: number
  tallyResult?: string
  spentVoiceCredits?: string
  formattedDonationAmount?: string
  allocatedAmount?: string
  metadata?: any
  rawMetadata?: string
}

export interface Token {
  symbol: string
  decimals: number
}

/**
 * Round interface
 * recipientDeposit is optional for non-optimistic recipient registries
 */
export interface Round {
  chainId: number
  operator: string
  address: string
  userRegistryAddress: string
  recipientRegistryAddress: string
  recipientDepositAmount?: string
  maciAddress: string
  contributorCount: number
  totalSpent: string
  matchingPoolSize: string
  voiceCreditFactor: string
  isFinalized: boolean
  isCancelled: boolean
  tallyHash: string
  nativeTokenAddress: string
  nativeTokenSymbol: string
  nativeTokenDecimals: number
  startTime: number
  endTime: number
  blogUrl?: string
}

export type EventType =
  | 'RequestSubmitted'
  | 'RequestResolved'
  | 'KlerosRecipientAdded'
  | 'KlerosRecipientRemoved'
  | 'RecipientRemoved'
  | 'RecipientAdded'
  | 'RecipientRemovedV1'
  | 'RecipientAddedV1'

export type AbiInfo = {
  type: EventType
  abi: string
}

export type RoundFileContent = {
  round: Round
  projects: Project[]
  tally: any
}

export type Tally = {
  results: {
    tally: string[]
  }
  totalVoiceCreditsPerVoteOption: {
    tally: string[]
  }
}
