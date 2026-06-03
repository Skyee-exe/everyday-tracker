import React from 'react';
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

/**
 * Home page component.
 * Uses Next.js Server Components and Clerk's server-side auth() helper
 * to determine user authentication state and dynamically render the Header actions
 * and Hero Call-To-Action buttons without layout shift.
 */
export default async function Home() {
  const { userId } = await auth();

  return (
    <main style={styles.container}>
      {/* Top Header */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={{ fontSize: '1.5rem' }}>🎯</span> Everyday Tracker
        </div>
        <div style={styles.navActions}>
          {!userId ? (
            <>
              <SignInButton mode="modal">
                <button style={styles.navButton}>Sign In</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button style={styles.primaryButton}>Sign Up</button>
              </SignUpButton>
            </>
          ) : (
            <UserButton />
          )}
        </div>
      </header>

      <div style={styles.hero}>
        <div style={styles.badge}>Next.js Boilerplate CLI 🚀</div>
        <h1 style={styles.title}>
          Your Premium SaaS Stack <span style={styles.gradient}>Is Ready</span>
        </h1>
        <p style={styles.subtitle}>
          Congratulations! Your customized Next.js boilerplate has been successfully scaffolded with all your selected databases, components, and authentication configurations.
        </p>
        
        <div style={styles.ctaGroup}>
          {!userId ? (
            <>
              <SignUpButton mode="modal">
                <button style={styles.heroPrimaryCta}>Get Started for Free</button>
              </SignUpButton>
              <a href="#features" style={styles.secondaryCta}>
                Explore Stack Files
              </a>
            </>
          ) : (
            <>
              <button style={styles.heroPrimaryCta}>Go to Dashboard</button>
              <a href="#features" style={styles.secondaryCta}>
                Explore Stack Files
              </a>
            </>
          )}
        </div>
      </div>

      <section id="features" style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.icon}>⚡</div>
          <h3 style={styles.cardTitle}>App Router Ready</h3>
          <p style={styles.cardText}>Built using modern Next.js 15 App Router with full Server Components and safe SEO presets.</p>
        </div>
        
        <div style={styles.card}>
          <div style={styles.icon}>🔒</div>
          <h3 style={styles.cardTitle}>Modular Auth</h3>
          <p style={styles.cardText}>Pre-configured middleware rules and pages for secure, lightning-fast session validation.</p>
        </div>

        <div style={styles.card}>
          <div style={styles.icon}>🗄️</div>
          <h3 style={styles.cardTitle}>Database Integration</h3>
          <p style={styles.cardText}>Configured connections, client instances, schemas, and live migration configurations.</p>
        </div>
      </section>

      <footer style={styles.footer}>
        Created with <span style={{ color: '#ec4899' }}>♥</span> by{' '}
        <a
          href="https://www.instagram.com/sohaam.exe?igsh=NmhhNWVkdmk2N3A0"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#71717a', textDecoration: 'underline', transition: 'color 0.2s' }}
        >
          Soham
        </a>
      </footer>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#09090b',
    color: '#fafafa',
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif",
    padding: '6rem 2rem 2rem 2rem', // increased top padding for absolute header
    boxSizing: 'border-box',
    position: 'relative',
  },
  header: {
    width: '100%',
    maxWidth: '1000px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 0',
    position: 'absolute',
    top: 0,
    boxSizing: 'border-box',
  },
  logo: {
    fontSize: '1.25rem',
    fontWeight: 700,
    letterSpacing: '-0.025em',
    color: '#fafafa',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  navActions: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
  },
  navButton: {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    color: '#fafafa',
    border: '1px solid #27272a',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '0.875rem',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
  },
  primaryButton: {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    backgroundColor: '#fafafa',
    color: '#09090b',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.875rem',
    fontFamily: 'inherit',
    transition: 'opacity 0.2s',
  },
  hero: {
    textAlign: 'center',
    maxWidth: '800px',
    marginBottom: '4rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  badge: {
    display: 'inline-block',
    padding: '0.5rem 1rem',
    borderRadius: '9999px',
    backgroundColor: '#27272a',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#38bdf8',
    marginBottom: '1.5rem',
    border: '1px solid #3f3f46',
  },
  title: {
    fontSize: '3rem',
    fontWeight: 800,
    letterSpacing: '-0.025em',
    lineHeight: 1.2,
    margin: '0 0 1rem 0',
  },
  gradient: {
    background: 'linear-gradient(to right, #38bdf8, #818cf8, #c084fc)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '1.125rem',
    color: '#a1a1aa',
    lineHeight: 1.6,
    margin: '0 0 2rem 0',
    maxWidth: '600px',
  },
  ctaGroup: {
    display: 'flex',
    gap: '1rem',
  },
  heroPrimaryCta: {
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    backgroundColor: '#38bdf8',
    color: '#09090b',
    fontWeight: 600,
    fontSize: '1rem',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'opacity 0.2s',
  },
  secondaryCta: {
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    color: '#fafafa',
    fontWeight: 600,
    textDecoration: 'none',
    border: '1px solid #3f3f46',
    transition: 'background-color 0.2s',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '2rem',
    width: '100%',
    maxWidth: '1000px',
    marginBottom: '4rem',
  },
  card: {
    backgroundColor: '#18181b',
    border: '1px solid #27272a',
    borderRadius: '12px',
    padding: '1.5rem',
    transition: 'transform 0.2s, border-color 0.2s',
  },
  icon: {
    fontSize: '2rem',
    marginBottom: '1rem',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    margin: '0 0 0.5rem 0',
  },
  cardText: {
    fontSize: '0.875rem',
    color: '#a1a1aa',
    lineHeight: 1.5,
    margin: 0,
  },
  footer: {
    fontSize: '0.875rem',
    color: '#71717a',
    marginTop: 'auto',
  },
};
