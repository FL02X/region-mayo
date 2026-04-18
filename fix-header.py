import re

with open("components/app-header.tsx", "r") as f:
    text = f.read()

# Add imports
text = text.replace('import { usePathname, useRouter } from "next/navigation";', 'import { usePathname, useRouter } from "next/navigation";\nimport { useState, useRef } from "react";')

# Add hooks
hooks = """
  const pathname = usePathname();
  const router = useRouter();

  const [hoverStyle, setHoverStyle] = useState<{ left: number; width: number; opacity: number }>({ left: 0, width: 0, opacity: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverStyle({
      left: rect.left - containerRect.left,
      width: rect.width,
      opacity: 1
    });
  };

  const handleMouseLeave = () => {
    setHoverStyle(prev => ({ ...prev, opacity: 0 }));
  };
"""
text = re.sub(r'  const pathname = usePathname\(\);\s+const router = useRouter\(\);', hooks, text)

# Add container ref and mouse leave to desktop layout wrapper
# Desktop layout: <div className="hidden md:flex items-center h-full px-4 lg:px-6 gap-2">
desktop_container = """          <div 
            className="hidden md:flex items-center h-full px-4 lg:px-6 gap-2 relative"
            ref={containerRef}
            onMouseLeave={handleMouseLeave}
          >
            <div 
              className="absolute top-0 bottom-0 pointer-events-none transition-all duration-300 ease-out z-[-1]"
              style={{
                left: hoverStyle.left,
                width: hoverStyle.width,
                opacity: hoverStyle.opacity,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)',
                borderBottom: '2px solid rgba(135,185,250,0.6)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 8px 20px rgba(0,0,0,0.1)',
                backdropFilter: 'blur(4px)',
                borderRadius: '4px'
              }}
            />"""
text = re.sub(r'          <div className="hidden md:flex items-center h-full px-4 lg:px-6 gap-2">', desktop_container, text)

# Add onMouseEnter to Logo, NavItems, Socials.
# Logo
text = re.sub(
    r'<Link\n              href="/"\n              className="flex items-center gap-2\.5 shrink-0"\n              aria-label="Inicio — Region Mayo"\n            >',
    '<Link\n              href="/"\n              className="flex items-center gap-2.5 shrink-0 transition-transform hover:scale-105 header-hover-item"\n              aria-label="Inicio — Region Mayo"\n              onMouseEnter={handleMouseEnter}\n            >',
    text)

# Nav items
text = re.sub(
    r'className={cn\(\n                      "flex items-center gap-1\.5 h-full px-2\.5 lg:px-3 text-\[11px\] transition-colors font-medium whitespace-nowrap tracking-\[0\.04em\] uppercase border-b-2 border-transparent",\n                      isActive\n                        \? "text-white border-\[#2f5e93\] bg-\[#2f5e93\]"\n                        : "text-white/90 hover:text-white hover:border-white/30 hover:bg-white/5"\n                    \)}',
    'className={cn(\n                      "flex items-center gap-1.5 h-full px-2.5 lg:px-3 text-[11px] transition-colors font-medium whitespace-nowrap tracking-[0.04em] uppercase border-b-2 border-transparent header-hover-item",\n                      isActive\n                        ? "text-white border-[#2f5e93] bg-[#2f5e93]"\n                        : "text-white/90 hover:text-white hover:border-transparent"\n                    )}\n                    onMouseEnter={handleMouseEnter}',
    text)

# Search button (make icon turn blue) group-hover -> hover
text = text.replace(
    '<Search className="h-[17px] w-[17px] text-[#4a4a4a]" strokeWidth={1.6} />',
    '<Search className="h-[17px] w-[17px] text-[#4a4a4a] transition-all duration-300 group-hover:text-[#2f5e93] group-hover:rotate-90 no-shake" strokeWidth={1.6} />'
)
text = text.replace(
    'className="w-[40px] h-full flex items-center justify-center bg-[#f4f4f4] hover:bg-[#ececec] transition-colors cursor-pointer"',
    'className="w-[40px] h-full flex items-center justify-center bg-[#f4f4f4] hover:bg-[#e0eaf5] transition-colors cursor-pointer group"'
)

# Socials
text = re.sub(
    r'<a\n                href=\{instagramUrl\}\n                target="_blank"\n                rel="noopener noreferrer"\n                className="flex items-center justify-center h-9 w-9 text-white/90 hover:text-white transition-colors"',
    '<a\n                href={instagramUrl}\n                target="_blank"\n                rel="noopener noreferrer"\n                className="flex items-center justify-center h-9 w-9 text-white/90 hover:text-white transition-colors header-hover-item"\n                onMouseEnter={handleMouseEnter}',
    text)
text = re.sub(
    r'<a\n                href=\{facebookUrl\}\n                target="_blank"\n                rel="noopener noreferrer"\n                className="flex items-center justify-center h-9 w-9 text-white/90 hover:text-white transition-colors"',
    '<a\n                href={facebookUrl}\n                target="_blank"\n                rel="noopener noreferrer"\n                className="flex items-center justify-center h-9 w-9 text-white/90 hover:text-white transition-colors header-hover-item"\n                onMouseEnter={handleMouseEnter}',
    text)

with open("components/app-header.tsx", "w") as f:
    f.write(text)

