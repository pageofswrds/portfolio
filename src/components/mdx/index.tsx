import type { ComponentPropsWithoutRef, ReactNode } from 'react'

// VideoPlayer - renders video with gif fallback
interface VideoPlayerProps {
  videoUrl: string
  gifUrl?: string
  width?: string | number
  height?: string | number
}

export function VideoPlayer({ videoUrl, gifUrl, width = '100%', height = 'auto' }: VideoPlayerProps) {
  return (
    <video
      src={videoUrl}
      poster={gifUrl}
      autoPlay
      loop
      muted
      playsInline
      style={{
        width,
        height,
        maxWidth: '100%',
        borderRadius: '8px',
        margin: '1rem 0',
      }}
    />
  )
}

// DemoButton - styled link button for demos
interface DemoButtonProps {
  href: string
  children: ReactNode
}

export function DemoButton({ href, children }: DemoButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-block',
        padding: '0.75rem 1.5rem',
        background: 'var(--bg-button)',
        color: 'var(--tx-button)',
        borderRadius: '8px',
        textDecoration: 'none',
        fontWeight: 500,
        marginTop: '1rem',
      }}
    >
      {children}
    </a>
  )
}

// Button - generic styled button wrapper
interface ButtonProps {
  variant?: 'primary' | 'secondary'
  className?: string
  asChild?: boolean
  children: ReactNode
}

export function Button({ children, className }: ButtonProps) {
  return (
    <div className={className} style={{ marginTop: '1rem' }}>
      {children}
    </div>
  )
}

// Link - styled anchor tag
interface LinkProps {
  href: string
  target?: string
  children: ReactNode
}

export function Link({ href, target, children }: LinkProps) {
  return (
    <a
      href={href}
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      style={{
        display: 'inline-block',
        padding: '0.75rem 1.5rem',
        background: 'var(--bg-button)',
        color: 'var(--tx-button)',
        borderRadius: '8px',
        textDecoration: 'none',
        fontWeight: 500,
      }}
    >
      {children}
    </a>
  )
}

// MDX component overrides
export const mdxComponents = {
  VideoPlayer,
  DemoButton,
  Button,
  Link,
  // Override default elements for consistent styling
  img: (props: ComponentPropsWithoutRef<'img'>) => (
    <img
      {...props}
      loading="lazy"
      style={{
        width: '100%',
        height: 'auto',
        borderRadius: '8px',
        margin: '1rem 0',
      }}
    />
  ),
  h2: (props: ComponentPropsWithoutRef<'h2'>) => (
    <h2
      {...props}
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.5rem',
        fontWeight: 400,
        marginTop: '2rem',
        marginBottom: '1rem',
      }}
    />
  ),
  h3: (props: ComponentPropsWithoutRef<'h3'>) => (
    <h3
      {...props}
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.25rem',
        fontWeight: 400,
        marginTop: '1.5rem',
        marginBottom: '0.75rem',
      }}
    />
  ),
  h6: (props: ComponentPropsWithoutRef<'h6'>) => (
    <p
      {...props}
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.8rem',
        color: 'var(--tx-tertiary)',
        marginTop: '-0.5rem',
        marginBottom: '1.5rem',
      }}
    />
  ),
  p: (props: ComponentPropsWithoutRef<'p'>) => (
    <p
      {...props}
      style={{
        lineHeight: 1.7,
        marginBottom: '1rem',
      }}
    />
  ),
  ul: (props: ComponentPropsWithoutRef<'ul'>) => (
    <ul
      {...props}
      style={{
        paddingLeft: '1.5rem',
        marginBottom: '1rem',
        lineHeight: 1.7,
      }}
    />
  ),
  li: (props: ComponentPropsWithoutRef<'li'>) => (
    <li
      {...props}
      style={{
        marginBottom: '0.5rem',
      }}
    />
  ),
  blockquote: (props: ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote
      {...props}
      style={{
        borderLeft: '3px solid var(--bd-primary)',
        paddingLeft: '1rem',
        marginLeft: 0,
        marginBottom: '1rem',
        color: 'var(--tx-secondary)',
        fontStyle: 'italic',
      }}
    />
  ),
  hr: () => (
    <hr
      style={{
        border: 'none',
        borderTop: '1px solid var(--bd-primary)',
        margin: '2rem 0',
      }}
    />
  ),
}
