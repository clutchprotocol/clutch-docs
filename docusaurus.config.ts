import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Clutch Protocol Docs',
  tagline: 'Decentralized ride-sharing blockchain - developer documentation',
  favicon: 'img/favicon.svg',

  future: {
    v4: true,
  },

  url: 'https://docs.clutchprotocol.io',
  baseUrl: '/',

  organizationName: 'clutchprotocol',
  projectName: 'clutch-docs',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },

  themes: ['@docusaurus/theme-mermaid'],

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
          editUrl: 'https://github.com/clutchprotocol/clutch-docs/tree/main/',
          // Needs fetch-depth: 0 in .github/workflows/deploy.yml, else every page
          // reports the deploy commit's date.
          showLastUpdateTime: true,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/clutch-social-card.jpg',
    metadata: [
      {
        name: 'keywords',
        content:
          'clutch protocol, ride-sharing blockchain, decentralized ride-sharing, aura consensus, graphql api, secp256k1, web3 mobility',
      },
    ],
    announcementBar: {
      id: 'alpha',
      content:
        'Alpha software on a live testnet — APIs may change without notice.',
      isCloseable: true,
    },
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Clutch Protocol',
      logo: {
        alt: 'Clutch Protocol',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://app-stage.clutchprotocol.io',
          label: 'Demo App',
          position: 'right',
        },
        {
          href: 'https://www.npmjs.com/package/clutch-hub-sdk-js',
          label: 'npm SDK',
          position: 'right',
        },
        {
          href: 'https://clutchprotocol.io',
          label: 'Website',
          position: 'right',
        },
        {
          href: 'https://github.com/clutchprotocol/clutch-deploy',
          label: 'Deploy',
          position: 'right',
        },
        {
          href: 'https://github.com/clutchprotocol',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {label: 'Introduction', to: '/intro'},
            {label: 'Quick Start', to: '/getting-started/quickstart'},
            {label: 'Ride Lifecycle', to: '/getting-started/ride-lifecycle'},
            {label: 'Architecture', to: '/getting-started/architecture'},
          ],
        },
        {
          title: 'Build',
          items: [
            {label: 'Hub API', to: '/clutch-hub-api/overview'},
            {label: 'SDK', to: '/clutch-hub-sdk-js/overview'},
            {label: 'Demo App', to: '/demo-app/overview'},
            {label: 'Explorer', to: '/clutch-explorer/overview'},
            {label: 'Treasury', to: '/clutch-treasury/overview'},
          ],
        },
        {
          title: 'Project',
          items: [
            {label: 'Website', href: 'https://clutchprotocol.io'},
            {label: 'Stage Demo', href: 'https://app-stage.clutchprotocol.io'},
            {label: 'GitHub', href: 'https://github.com/clutchprotocol'},
            {label: 'Deploy', href: 'https://github.com/clutchprotocol/clutch-deploy'},
          ],
        },
        {
          title: 'Community',
          items: [
            {label: 'Issues', href: 'https://github.com/clutchprotocol/clutch-node/issues'},
          ],
        },
      ],
      // Licensing is per-repo: clutch-node is Apache-2.0, the JS/TS repos are MIT.
      // Don't claim a single license here.
      copyright: `Copyright © ${new Date().getFullYear()} Clutch Protocol. Open source — see each repository for its license.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
