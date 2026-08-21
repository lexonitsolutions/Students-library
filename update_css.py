import re

with open('src/index.css', 'r') as f:
    content = f.read()

# Add html.mid after html.dark { ... } block
mid_theme = """
/* ============================
   MID THEME — Medium Brightness / Dim
   ============================ */
html.mid {
  /* Surface hierarchy */
  --color-surface: #33353D; 
  --color-surface-dim: #33353D;
  --color-surface-bright: #42454F;
  --color-surface-container-lowest: #33353D;
  --color-surface-container-low: #42454F; 
  --color-surface-container: #42454F;
  --color-surface-container-high: #4A4D57; 
  --color-surface-container-highest: #4A4D57; 
  --color-surface-variant: #52555F;
  --color-surface-soft: #3A3D46;

  /* Text */
  --color-on-surface: #F0F1F5; 
  --color-on-surface-variant: #C2C4CE; 
  --color-inverse-surface: #F0F1F5;
  --color-inverse-on-surface: #33353D;
  
  --color-outline: #9498A5; 
  --color-outline-variant: #52555F; 
  --color-card-border: #52555F; 

  /* Primary Accent */
  --color-primary: #6B84E8;
  --color-on-primary: #F0F1F5; 
  --color-primary-container: #4C5680; 
  --color-on-primary-container: #9FB0F5; 
  --color-inverse-primary: #6B84E8;
  --color-primary-fixed: #4C5680;
  --color-primary-fixed-dim: #6B84E8;
  --color-on-primary-fixed: #F0F1F5;
  --color-on-primary-fixed-variant: #6B84E8;

  /* Secondary */
  --color-secondary: #D5D7E0; 
  --color-on-secondary: #33353D;
  --color-secondary-container: #4A4D57; 
  --color-on-secondary-container: #F0F1F5; 
  --color-secondary-fixed: #D5D7E0;
  --color-secondary-fixed-dim: #9498A5;
  --color-on-secondary-fixed: #33353D;
  --color-on-secondary-fixed-variant: #4A4D57;

  /* Error / Badges */
  --color-error: #E2604D; 
  --color-on-error: #ffffff;
  --color-error-container: #E2604D;
  --color-on-error-container: #ffffff;

  /* Background */
  --color-background: #3A3D46; 
  --color-on-background: #F0F1F5;

  /* Brand accent tokens */
  --color-slate: #9498A5;
  --color-soft-grey: #3A3D46;
  --color-surface-tint: #6B84E8;

  /* Shadows — soft shadows */
  --shadow-card: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.15);
  --shadow-card-hover: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
}
"""

insert_pos = content.find('/* ============================\n   Dark mode — Component overrides')
content = content[:insert_pos] + mid_theme + '\n' + content[insert_pos:]

# Replace hardcoded html.dark overrides with CSS vars and :is(html.dark, html.mid)
content = content.replace('html.dark .bg-white {', ':is(html.dark, html.mid) .bg-white {')
content = content.replace('background-color: #1A1D26 !important;', 'background-color: var(--color-surface-container-low) !important;')

content = content.replace('html.dark .bg-white.shadow-card,', ':is(html.dark, html.mid) .bg-white.shadow-card,')
content = content.replace('html.dark [class*="rounded-xl"].bg-white {', ':is(html.dark, html.mid) [class*="rounded-xl"].bg-white {')
content = content.replace('background: #1A1D26 !important;', 'background: var(--color-surface-container-low) !important;')
content = content.replace('border-color: #2A2E3A !important;', 'border-color: var(--color-card-border) !important;')

content = content.replace('html.dark .bg-gray-50\\/50,', ':is(html.dark, html.mid) .bg-gray-50\\/50,')
content = content.replace('html.dark .bg-gray-50 {', ':is(html.dark, html.mid) .bg-gray-50 {')
content = content.replace('background-color: #171A22 !important;', 'background-color: var(--color-surface-soft) !important;')

content = content.replace('html.dark .border-gray-100,', ':is(html.dark, html.mid) .border-gray-100,')
content = content.replace('html.dark .border-gray-200 {', ':is(html.dark, html.mid) .border-gray-200 {')
content = content.replace('border-color: #2A2E3A !important;', 'border-color: var(--color-card-border) !important;')

content = content.replace('html.dark .text-slate-900,', ':is(html.dark, html.mid) .text-slate-900,')
content = content.replace('html.dark .text-slate-800,', ':is(html.dark, html.mid) .text-slate-800,')
content = content.replace('html.dark .text-gray-900,', ':is(html.dark, html.mid) .text-gray-900,')
content = content.replace('html.dark .text-gray-800 {', ':is(html.dark, html.mid) .text-gray-800 {')
content = content.replace('color: #F5F6FA !important;', 'color: var(--color-on-surface) !important;')

content = content.replace('html.dark .text-slate-700,', ':is(html.dark, html.mid) .text-slate-700,')
content = content.replace('html.dark .text-slate-600,', ':is(html.dark, html.mid) .text-slate-600,')
content = content.replace('html.dark .text-gray-700,', ':is(html.dark, html.mid) .text-gray-700,')
content = content.replace('html.dark .text-gray-600 {', ':is(html.dark, html.mid) .text-gray-600 {')
content = content.replace('color: #A0A4B8 !important;', 'color: var(--color-on-surface-variant) !important;')

content = content.replace('html.dark .text-slate-500,', ':is(html.dark, html.mid) .text-slate-500,')
content = content.replace('html.dark .text-slate-400,', ':is(html.dark, html.mid) .text-slate-400,')
content = content.replace('html.dark .text-gray-500,', ':is(html.dark, html.mid) .text-gray-500,')
content = content.replace('html.dark .text-gray-400 {', ':is(html.dark, html.mid) .text-gray-400 {')
content = content.replace('color: #6B7080 !important;', 'color: var(--color-outline) !important;')

content = content.replace('html.dark .bg-gray-50\\/50 input,', ':is(html.dark, html.mid) .bg-gray-50\\/50 input,')
content = content.replace('html.dark input.bg-gray-50\\/50 {', ':is(html.dark, html.mid) input.bg-gray-50\\/50 {')
content = content.replace('background-color: #1A1D26 !important;', 'background-color: var(--color-surface-container-low) !important;')

content = content.replace('html.dark input,', ':is(html.dark, html.mid) input,')
content = content.replace('html.dark textarea,', ':is(html.dark, html.mid) textarea,')
content = content.replace('html.dark select {', ':is(html.dark, html.mid) select {')
content = content.replace('background-color: #1A1D26;', 'background-color: var(--color-surface-container-low);')
content = content.replace('color: #F5F6FA;', 'color: var(--color-on-surface);')
content = content.replace('border-color: #2A2E3A;', 'border-color: var(--color-card-border);')

content = content.replace('html.dark input::placeholder,', ':is(html.dark, html.mid) input::placeholder,')
content = content.replace('html.dark textarea::placeholder {', ':is(html.dark, html.mid) textarea::placeholder {')
content = content.replace('color: #6B7080;', 'color: var(--color-outline);')

content = content.replace('html.dark input:focus,', ':is(html.dark, html.mid) input:focus,')
content = content.replace('html.dark textarea:focus,', ':is(html.dark, html.mid) textarea:focus,')
content = content.replace('html.dark select:focus {', ':is(html.dark, html.mid) select:focus {')
content = content.replace('border-color: #4C63D2 !important;', 'border-color: var(--color-primary) !important;')
content = content.replace('box-shadow: 0 0 0 3px rgba(76, 99, 210, 0.2) !important;', 'box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 20%, transparent) !important;')

content = content.replace('html.dark .shadow-\\[0_8px_30px_rgb\\(0\\,0\\,0\\,0\\.04\\)\\] {', ':is(html.dark, html.mid) .shadow-\\[0_8px_30px_rgb\\(0\\,0\\,0\\,0\\.04\\)\\] {')
content = content.replace('0 0 0 1px #2A2E3A !important;', '0 0 0 1px var(--color-card-border) !important;')

# Replace remaining `html.dark` globally
content = re.sub(r'html\.dark', ':is(html.dark, html.mid)', content)

# Glass styles updates
content = content.replace('rgba(11, 13, 18, 0.85) !important;', 'color-mix(in srgb, var(--color-surface) 85%, transparent) !important;')
content = content.replace('rgba(26, 29, 38, 0.85) !important;', 'color-mix(in srgb, var(--color-surface-container-low) 85%, transparent) !important;')
content = content.replace('background: #232A4D !important;', 'background: var(--color-primary-container) !important;')
content = content.replace('border: 1px solid #4C63D2 !important;', 'border: 1px solid var(--color-primary) !important;')
content = content.replace('rgba(76, 99, 210, 0.2)', 'color-mix(in srgb, var(--color-primary) 20%, transparent)')

content = content.replace('rgba(76, 99, 210, 0.12)', 'color-mix(in srgb, var(--color-primary) 12%, transparent)')
content = content.replace('rgba(76, 99, 210, 0.18)', 'color-mix(in srgb, var(--color-primary) 18%, transparent)')
content = content.replace('rgba(76, 99, 210, 0.15)', 'color-mix(in srgb, var(--color-primary) 15%, transparent)')
content = content.replace('rgba(76, 99, 210, 0.22)', 'color-mix(in srgb, var(--color-primary) 22%, transparent)')
content = content.replace('rgba(76, 99, 210, 0.08)', 'color-mix(in srgb, var(--color-primary) 8%, transparent)')
content = content.replace('rgba(76, 99, 210, 0.05)', 'color-mix(in srgb, var(--color-primary) 5%, transparent)')
content = content.replace('rgba(76, 99, 210, 0.03)', 'color-mix(in srgb, var(--color-primary) 3%, transparent)')

# Fix light mode gradient
content = content.replace('rgba(79, 131, 255, 0.08)', 'color-mix(in srgb, var(--color-primary) 8%, transparent)')
content = content.replace('rgba(79, 131, 255, 0.05)', 'color-mix(in srgb, var(--color-primary) 5%, transparent)')

content = content.replace('color: #4C63D2 !important;', 'color: var(--color-primary) !important;')

content = content.replace('rgba(15, 17, 23, 0.95) !important;', 'color-mix(in srgb, var(--color-surface) 95%, transparent) !important;')

content = content.replace('background: #3A3E4C;', 'background: var(--color-outline-variant);')
content = content.replace('background: #6B7080;', 'background: var(--color-outline);')

with open('src/index.css', 'w') as f:
    f.write(content)
