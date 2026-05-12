import type { ActiveToolLayoutProps, LayoutProps } from 'sanity'

const sharedStyle = `
  .studio-shell {
    --studio-scale: 1.1;
    transform: scale(var(--studio-scale));
    transform-origin: top left;
    width: calc(100% / var(--studio-scale));
    min-height: calc(100dvh / var(--studio-scale));
  }

  @media (max-width: 768px) {
    .studio-shell {
      --studio-scale: 1;
      display: contents;
      transform: none;
    }
  }

  .studio-shell :focus-visible {
    outline: 2px solid #2f5e93;
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .studio-shell *,
    .studio-shell *::before,
    .studio-shell *::after {
      animation: none !important;
      transition: none !important;
      scroll-behavior: auto !important;
    }
  }
`

function StudioShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="studio-shell">
      <style>{sharedStyle}</style>
      {children}
    </div>
  )
}

export function StudioLayout(props: LayoutProps) {
  return <StudioShell>{props.renderDefault(props)}</StudioShell>
}

export function StudioActiveToolLayout(props: ActiveToolLayoutProps) {
  return props.renderDefault(props)
}