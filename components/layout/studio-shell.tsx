import type { ActiveToolLayoutProps, LayoutProps } from 'sanity'

const sharedStyle = `
  .studio-shell {
    display: block;
    width: 100%;
    height: 100dvh;
    min-height: 100dvh;
    overflow: hidden;
  }

  @media (max-width: 768px) {
    .studio-shell {
      height: 100dvh;
      min-height: 100svh;
    }

    .studio-shell [data-ui='PaneLayout'],
    .studio-shell [data-ui='Pane'],
    .studio-shell [data-testid='pane-content'],
    .studio-shell [data-ui='Scroller'] {
      -webkit-overflow-scrolling: touch;
      overscroll-behavior-y: contain;
      touch-action: pan-y;
    }

    .studio-shell [data-testid='pane-content'] {
      padding-bottom: max(4rem, env(safe-area-inset-bottom));
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
