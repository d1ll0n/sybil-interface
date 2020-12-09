import React, { useState, useMemo } from 'react'
import { AutoColumn } from '../Column'

import { TYPE, ExternalLink, StyledInternalLink } from '../../theme'
import Row, { AutoRow, RowFixed } from '../Row'
import EmptyProfile from '../../assets/images/emptyprofile.png'
import { shortenAddress, getTwitterProfileLink, isAddress } from '../../utils'
import { DelegateData, useActiveProtocol, useGlobalData, useGovernanceToken } from '../../state/governance/hooks'
import { WrappedListLogo, RoundedProfileImage } from './styled'
import { GreyCard } from '../Card'
import { useActiveWeb3React } from '../../hooks'
import { ButtonBlue } from '../Button'
import styled from 'styled-components'
import { useModalOpen, useToggleModal } from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/actions'
import DelegateModal from '../vote/DelegateModal'
import { Percent, JSBI } from '@uniswap/sdk'
import Loader from '../Loader'
import TwitterIcon from '../../assets/images/Twitter_Logo_Blue.png'
import { BIG_INT_ZERO } from '../../constants'
import { useTokenBalance } from '../../state/wallet/hooks'
import { useAllUncategorizedNames } from '../../state/social/hooks'

const ColumnLabel = styled(TYPE.darkGray)`
  white-space: no-wrap;
`

const NoWrap = styled(TYPE.black)`
  white-space: no-wrap;
`

const FixedAddressSize = styled(AutoColumn)`
  width: 140px;
`

const TwitterLogo = styled.img`
  height: 24px;
  width: 24px;
  margin-left: 4px;
`

const OnlyAboveLarge = styled.div`
  display: initial;

  ${({ theme }) => theme.mediaWidth.upToExtraLarge`
  display: none;
  `};
`

const OnlyAboveSmall = styled.div`
  display: initial;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `};
`

const DataRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 140px 100px 160px;
  grid-column-gap: 1rem;
  padding: 0 2rem;

  margin: 6px 0;
  border-left: 3px solid transparent;

  :hover {
    border-left: 3px solid ${({ theme }) => theme.primary1};
  }

  &:first-child {
    :hover {
      border-left: 3px solid transparent;
      cursor: initial;
    }
  }

  ${({ theme }) => theme.mediaWidth.upToExtraLarge`
    grid-template-columns: 1fr 160px;
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
  grid-template-columns: 1fr 160px;
    margin: 0;
    padding: 0 1.5rem;
  `};
`

const DelegateButton = styled(ButtonBlue)<{ disabled: boolean }>`
  ${({ theme }) => theme.mediaWidth.upToMedium`
    font-size: 12px;
    margin-top: 0px !important;
  `};

  background-color: ${({ disabled, theme }) => disabled && theme.bg3};
  color: ${({ disabled, theme }) => disabled && theme.text2};
`

const VoteText = styled(NoWrap)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 12px;
  `};
`

export default function DelegateList({ topDelegates }: { topDelegates: DelegateData[] | undefined }) {
  const { chainId, account } = useActiveWeb3React()

  // toggle for showing delegation modal
  const showDelegateModal = useModalOpen(ApplicationModal.DELEGATE)
  const toggelDelegateModal = useToggleModal(ApplicationModal.DELEGATE)

  // used to prefil modal with delegate address
  const [prefilledDelegate, setPrefilledDelegate] = useState<string | undefined>()

  // used to calculate % ownership of votes
  const [activeProtocol] = useActiveProtocol()

  // get global data to calculate vote %
  const globalData = useGlobalData()

  const govToken = useGovernanceToken()
  const govTokenBalance = useTokenBalance(account ?? undefined, govToken)

  // show delegate button if they have available votes or if theyve delegated to someone else
  const showDelegateButton = Boolean(govTokenBalance && JSBI.greaterThan(govTokenBalance.raw, BIG_INT_ZERO))

  // get uncategorized names
  const uncategorizedNames = useAllUncategorizedNames()

  const delegateList = useMemo(() => {
    return chainId && topDelegates && activeProtocol
      ? topDelegates.map((d, i) => {
          const formattedAddress = isAddress(d.id)
          const formattedUncategorizedName = formattedAddress && uncategorizedNames?.[formattedAddress]?.name
          const contentLink =
            !d.handle && formattedAddress && uncategorizedNames && uncategorizedNames[formattedAddress]?.contentURL

          return (
            <DataRow key={d.id}>
              <AutoRow gap="10px">
                <OnlyAboveSmall>
                  <NoWrap>{i + 1}</NoWrap>
                </OnlyAboveSmall>
                <OnlyAboveSmall>
                  {d.imageURL ? (
                    <RoundedProfileImage>
                      <img src={d.imageURL} alt="profile" />
                    </RoundedProfileImage>
                  ) : (
                    <WrappedListLogo src={EmptyProfile} />
                  )}
                </OnlyAboveSmall>
                <FixedAddressSize gap="6px">
                  <RowFixed>
                    {d.handle ? (
                      // getEtherscanLink(chainId, d.id, 'address')}
                      <ExternalLink href={getTwitterProfileLink(d.handle)}>
                        <TYPE.black>{`@${d.handle}`}</TYPE.black>
                      </ExternalLink>
                    ) : (
                      <StyledInternalLink to={activeProtocol?.id + '/' + d.id}>
                        <TYPE.black>{shortenAddress(d.id)}</TYPE.black>
                      </StyledInternalLink>
                    )}

                    {d.handle && <TwitterLogo src={TwitterIcon} />}
                  </RowFixed>
                  {d.handle ? (
                    <StyledInternalLink to={activeProtocol?.id + '/' + d.id}>
                      <TYPE.black fontSize="12px">{shortenAddress(d.id)}</TYPE.black>
                    </StyledInternalLink>
                  ) : formattedUncategorizedName && contentLink ? (
                    <ExternalLink href={contentLink}>
                      <TYPE.black fontSize="12px">
                        {formattedUncategorizedName} {' ' + d.EOA ? '📜' : ''}
                      </TYPE.black>
                    </ExternalLink>
                  ) : (
                    <TYPE.black fontSize="12px">{d.EOA ? 'EOA' : 'Smart Contract 📜'}</TYPE.black>
                  )}
                </FixedAddressSize>
                <DelegateButton
                  width="fit-content"
                  disabled={!showDelegateButton}
                  onClick={() => {
                    setPrefilledDelegate(d.id)
                    toggelDelegateModal()
                  }}
                >
                  Delegate
                </DelegateButton>
              </AutoRow>
              <OnlyAboveLarge>
                <NoWrap textAlign="end">{d.votes.length}</NoWrap>
              </OnlyAboveLarge>
              <OnlyAboveLarge>
                <NoWrap textAlign="end">
                  {globalData
                    ? new Percent(JSBI.BigInt(d.delegatedVotesRaw), JSBI.BigInt(globalData.delegatedVotesRaw)).toFixed(
                        3
                      ) + '%'
                    : '-'}
                </NoWrap>
              </OnlyAboveLarge>
              <VoteText textAlign="end">
                {parseFloat(parseFloat(d.delegatedVotes.toString()).toFixed(0)).toLocaleString()} Votes
              </VoteText>
            </DataRow>
          )
        })
      : null
  }, [activeProtocol, chainId, globalData, showDelegateButton, toggelDelegateModal, topDelegates, uncategorizedNames])

  return (
    <GreyCard padding="2rem 0">
      <DelegateModal
        isOpen={showDelegateModal}
        onDismiss={() => {
          setPrefilledDelegate(undefined)
          toggelDelegateModal()
        }}
        title="Delegate Votes"
        prefilledDelegate={prefilledDelegate}
      />
      <AutoColumn gap="lg">
        <DataRow>
          <ColumnLabel>Rank</ColumnLabel>
          <OnlyAboveLarge>
            <ColumnLabel textAlign="end">Proposals Voted</ColumnLabel>
          </OnlyAboveLarge>
          <OnlyAboveLarge>
            <ColumnLabel textAlign="end">Vote Weight</ColumnLabel>
          </OnlyAboveLarge>
          <ColumnLabel textAlign="end">Total Votes</ColumnLabel>
        </DataRow>
        {delegateList ?? (
          <Row justify="center">
            <Loader />
          </Row>
        )}
      </AutoColumn>
    </GreyCard>
  )
}