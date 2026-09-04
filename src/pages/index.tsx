import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

import styles from './index.module.css';

type Feature = {
  title: string;
  icon: string;
  description: string;
  to: string;
};

const features: Feature[] = [
  {
    title: 'Clutch Node',
    icon: '🧱',
    description: 'Blockchain core with Aura consensus, custom RLP transactions, non-EVM design.',
    to: '/clutch-node/overview',
  },
  {
    title: 'Hub API',
    icon: '🔌',
    description: 'GraphQL bridge between apps and the node, with wallet JWT auth and a testnet faucet.',
    to: '/clutch-hub-api/overview',
  },
  {
    title: 'JavaScript SDK',
    icon: '📦',
    description: 'Client-side signing, RLP encoding, and live subscriptions over WebSocket.',
    to: '/clutch-hub-sdk-js/overview',
  },
  {
    title: 'Block Explorer',
    icon: '🔍',
    description: 'Read-only chain indexer, REST API, and web UI for blocks, transactions, and accounts.',
    to: '/clutch-explorer/overview',
  },
  {
    title: 'Demo App',
    icon: '🚗',
    description: 'Reference React app showing the passenger and driver ride flow end to end.',
    to: '/demo-app/overview',
  },
  {
    title: 'CLT Economics',
    icon: '💰',
    description: 'Fully-reserved CLT, referrer fees on ride payments, and a flat per-transaction fee to the block author.',
    to: '/clutch-node/clt-economics',
  },
  {
    title: 'Clutch Treasury',
    icon: '🏦',
    description: 'USDT deposits and redemptions split across three services, so no single one can both decide to mint and move the money behind it.',
    to: '/clutch-treasury/overview',
  },
];

function Hero(): ReactNode {
  return (
    <header className={styles.heroBanner}>
      <div className={styles.heroInner}>
        <h1 className={styles.heroTitle}>Clutch Protocol</h1>
        <p className={styles.heroSubtitle}>
          Decentralized ride-sharing blockchain
        </p>
        <p className={styles.heroTagline}>
          Open-source stack for on-chain ride lifecycle, client-side signing,
          and instant CLT payouts to drivers.
        </p>
        <div className={styles.buttons}>
          <Link className={styles.heroButtonPrimary} to="/intro">
            Get Started
          </Link>
          <Link
            className={styles.heroButtonOutline}
            href="https://app-stage.clutchprotocol.io"
          >
            Try Stage Demo →
          </Link>
        </div>
        <div className={styles.alphaBadge}>Alpha Software · Testnet Live</div>
      </div>
    </header>
  );
}

function Features(): ReactNode {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Explore the stack</h2>
      <div className={styles.featureGrid}>
        {features.map((f) => (
          <Link key={f.title} to={f.to} className={styles.featureCard}>
            <span className={styles.featureIcon}>{f.icon}</span>
            <h3 className={styles.featureTitle}>{f.title}</h3>
            <p className={styles.featureDesc}>{f.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ArchitectureSteps(): ReactNode {
  const steps = [
    'Build unsigned tx — the app asks the Hub API for an unsigned transaction payload',
    'Sign client-side — the user signs the hash locally (keys never sent to server)',
    'Submit signed tx — the app sends signed RLP hex to the Hub, which forwards to the node',
    'Validate & mine — the node verifies signature/nonce, applies state, includes in a block',
  ];
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>How it fits together</h2>
      <div className={styles.archBlock}>
        <p>
          <strong>Demo App / Your dApp + SDK</strong> → <strong>Clutch Hub API</strong>{' '}
          (GraphQL / WS + faucet) → <strong>Clutch Node</strong> (blockchain,
          WebSocket RPC) → <strong>Clutch Explorer</strong> (indexer + UI)
        </p>
        <ol>
          {steps.map((s) => (
            <li key={s.slice(0, 24)}>{s}</li>
          ))}
        </ol>
        <p>
          See the full{' '}
          <Link to="/getting-started/architecture">architecture overview</Link>{' '}
          and <Link to="/getting-started/ride-lifecycle">ride lifecycle</Link>.
        </p>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <Hero />
      <main>
        <Features />
        <ArchitectureSteps />
      </main>
    </Layout>
  );
}
