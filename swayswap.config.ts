import dotenv from 'dotenv';
import { createConfig, replaceEventOnEnv } from 'swayswap-scripts';

const { NODE_ENV = 'development', OUTPUT_ENV } = process.env;

function getEnvName() {
  return NODE_ENV === 'test' ? '.env.test' : '.env';
}

dotenv.config({
  path: `./docker/${getEnvName()}`,
});

const getDeployOptions = () => ({
  gasPrice: parseFloat(process.env.GAS_PRICE || '0'),
});

export default createConfig({
  types: {
    artifacts: './packages/contracts/**/out/debug/**-abi.json',
    output: './packages/app/src/types/contracts',
  },
  contracts: [
    {
      name: 'VITE_TOKEN_ID1',
      path: './packages/contracts/token_contract',
      options: getDeployOptions,
    },
    {
      name: 'VITE_TOKEN_ID2',
      path: './packages/contracts/token_contract',
      options: getDeployOptions,
    },
    {
      name: 'VITE_CONTRACT_ID',
      path: './packages/contracts/exchange_contract',
      options: (contracts) => {
        const tokenContract1 = contracts.find((c) => c.name === 'VITE_TOKEN_ID1');
        const tokenContract2 = contracts.find((c) => c.name === 'VITE_TOKEN_ID2');

        if (!tokenContract1 || !tokenContract2) {
          throw new Error('Token contracts not found');
        }

        return {
          ...getDeployOptions(),
          storageSlots: [
            {
              key: '0x0000000000000000000000000000000000000000000000000000000000000001',
              value: tokenContract1.contractId,
            },
            {
              key: '0x0000000000000000000000000000000000000000000000000000000000000002',
              value: tokenContract2.contractId,
            },
          ],
        };
      },
    },
  ],
  onSuccess: (event) => {
    const envFilePath = `./packages/app/${OUTPUT_ENV || getEnvName()}`;
    replaceEventOnEnv(envFilePath, event);
  },
});
