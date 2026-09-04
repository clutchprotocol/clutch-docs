import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/quickstart',
        'getting-started/docker-deploy',
        'getting-started/architecture',
        'getting-started/ride-lifecycle',
        'getting-started/app-developer-incentives',
        'getting-started/environments',
      ],
    },
    {
      type: 'category',
      label: 'Clutch Node',
      items: [
        'clutch-node/overview',
        'clutch-node/configuration',
        'clutch-node/running',
        'clutch-node/transaction-types',
        'clutch-node/clt-economics',
        'clutch-node/json-rpc',
      ],
    },
    {
      type: 'category',
      label: 'Clutch Treasury',
      items: [
        'clutch-treasury/overview',
        'clutch-treasury/deposits',
        'clutch-treasury/reserves-and-reconciliation',
        'clutch-treasury/redemptions',
        'clutch-treasury/operations',
      ],
    },
    {
      type: 'category',
      label: 'Clutch Hub API',
      items: [
        'clutch-hub-api/overview',
        'clutch-hub-api/authentication',
        'clutch-hub-api/graphql',
        'clutch-hub-api/errors',
        'clutch-hub-api/subscriptions',
        'clutch-hub-api/faucet',
        'clutch-hub-api/configuration',
      ],
    },
    {
      type: 'category',
      label: 'Clutch Hub SDK',
      items: [
        'clutch-hub-sdk-js/overview',
        'clutch-hub-sdk-js/installation',
        'clutch-hub-sdk-js/usage',
        'clutch-hub-sdk-js/api-reference',
        'clutch-hub-sdk-js/subscriptions',
      ],
    },
    {
      type: 'category',
      label: 'Demo App',
      items: [
        'demo-app/overview',
        'demo-app/getting-started',
        'demo-app/user-flows',
      ],
    },
    {
      type: 'category',
      label: 'Clutch Explorer',
      items: [
        'clutch-explorer/overview',
        'clutch-explorer/getting-started',
        'clutch-explorer/api-reference',
      ],
    },
    {
      type: 'category',
      label: 'Deployment',
      items: [
        'deployment/clutch-deploy',
        'deployment/monitoring',
        'deployment/nginx',
        'deployment/treasury-stack',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      items: [
        'reference/security',
        'reference/transaction-flow',
        'reference/signing-and-encoding',
        'reference/docker-images',
        'reference/faq',
      ],
    },
  ],
};

export default sidebars;
