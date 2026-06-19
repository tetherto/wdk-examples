import React from 'react';
import { useAccount, useProtocol } from '@tetherto/wdk-react-native-core';
import type { WalletAccountEvmErc4337 } from '@tetherto/wdk-wallet-evm-erc-4337';
import { FeatureLayout } from '@/components/FeatureLayout';
import { ActionCard } from '@/components/ActionCard';
import { NETWORK_NAME } from '@/config/chain';
import BigNumber from 'bignumber.js';

const USDT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
const USDT_DECIMALS = 6;
const PROTOCOL_NAME = 'usdt0Evm';

interface BridgeOptions {
  targetChain: string;
  recipient: string;
  token: string;
  amount: string;
  oftContractAddress?: string;
}

interface BridgeQuoteResult {
  fee: string;
  bridgeFee: string;
}

interface BridgeResult extends BridgeQuoteResult {
  hash: string;
}

interface Usdt0BridgeProtocol {
  quoteBridge(options: BridgeOptions): Promise<BridgeQuoteResult>;
  bridge(options: BridgeOptions): Promise<BridgeResult>;
}

export default function Usdt0BridgeScreen() {
  const accountIndex = 0;

  const account = useAccount({
    network: NETWORK_NAME.ETHEREUM,
    accountIndex,
  });

  const usdt0Bridge = useProtocol<Usdt0BridgeProtocol>({
    network: NETWORK_NAME.ETHEREUM,
    accountIndex,
    protocolType: 'bridge',
    protocolName: PROTOCOL_NAME,
  });

  return (
    <FeatureLayout
      title="USDT0 Bridge"
      description="Bridge USDT0 tokens cross-chain using the LayerZero protocol."
    >
      <ActionCard
        title="Quote Bridge"
        description="Estimate the fee for a cross-chain bridge before executing."
        fields={[
          {
            id: 'targetChain',
            type: 'text',
            label: 'Target Chain',
            placeholder: 'arbitrum',
          },
          {
            id: 'recipient',
            type: 'text',
            label: 'Recipient Address',
            placeholder: '0x...',
          },
          {
            id: 'token',
            type: 'text',
            label: 'Token Address',
            defaultValue: USDT_ADDRESS,
          },
          {
            id: 'amount',
            type: 'number',
            label: 'Amount (USDT)',
            placeholder: '1.0',
          },
        ]}
        action={async ({ targetChain, recipient, token, amount }) => {
          const amountInBaseUnit = new BigNumber(amount)
            .shiftedBy(USDT_DECIMALS)
            .toFixed(0);

          const quote = await usdt0Bridge.quoteBridge({
            targetChain,
            recipient,
            token,
            amount: amountInBaseUnit,
          });

          return {
            fee: quote.fee,
            bridgeFee: quote.bridgeFee,
          };
        }}
        actionLabel="Get Quote"
      />

      <ActionCard
        title="Bridge Tokens"
        description="Approve the OFT contract and bridge USDT0 to the target chain."
        fields={[
          {
            id: 'targetChain',
            type: 'text',
            label: 'Target Chain',
            placeholder: 'arbitrum',
          },
          {
            id: 'recipient',
            type: 'text',
            label: 'Recipient Address',
            placeholder: '0x...',
          },
          {
            id: 'token',
            type: 'text',
            label: 'Token Address',
            defaultValue: USDT_ADDRESS,
          },
          {
            id: 'oftContractAddress',
            type: 'text',
            label: 'OFT Contract Address',
            placeholder: '0x...',
          },
          {
            id: 'amount',
            type: 'number',
            label: 'Amount (USDT)',
            placeholder: '1.0',
          },
        ]}
        action={async ({ targetChain, recipient, token, oftContractAddress, amount }) => {
          const amountInBaseUnit = new BigNumber(amount)
            .shiftedBy(USDT_DECIMALS)
            .toFixed(0);

          await (account.extension() as WalletAccountEvmErc4337).approve({
            token,
            spender: oftContractAddress,
            amount: amountInBaseUnit,
          });

          const result = await usdt0Bridge.bridge({
            targetChain,
            recipient,
            token,
            oftContractAddress,
            amount: amountInBaseUnit,
          });

          return {
            hash: result.hash,
            fee: result.fee,
            bridgeFee: result.bridgeFee,
          };
        }}
        actionLabel="Approve & Bridge"
      />
    </FeatureLayout>
  );
}
