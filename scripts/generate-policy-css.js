const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const cache = new Map();

function loadTsModule(filePath) {
  const normalized = path.resolve(filePath);
  if (cache.has(normalized)) {
    return cache.get(normalized);
  }

  const source = fs.readFileSync(normalized, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  });

  const module = { exports: {} };
  const dir = path.dirname(normalized);
  const localRequire = (request) => {
    if (request === '@shopify/restyle') {
      return { createTheme: (config) => config };
    }
    if (!request.startsWith('.')) return require(request);
    const resolved = path.resolve(dir, request.endsWith('.ts') ? request : `${request}.ts`);
    return loadTsModule(resolved);
  };

  const runner = new Function('require', 'module', 'exports', transpiled.outputText);
  runner(localRequire, module, module.exports);

  cache.set(normalized, module.exports);
  return module.exports;
}

function cssVars(name, theme) {
  const c = theme.colors;
  const shadow =
    name === 'dark' ? '0 14px 40px rgba(0,0,0,0.28)' : '0 14px 40px rgba(17,34,68,0.08)';

  return `:root[data-theme='${name}'] {
  --bg: ${c.background};
  --bg-alt: ${c.backgroundAlt};
  --card: ${c.card};
  --card-border: ${c.borderSubtle};
  --text: ${c.text};
  --text-secondary: ${c.textSecondary};
  --muted: ${c.muted};
  --accent: ${c.accent};
  --primary: ${c.primary};
  --shadow: ${shadow};
}
`;
}

function buildCss(lightTheme, darkTheme) {
  const baseStyles = `
:root {
  color-scheme: light;
}
:root[data-theme='dark'] {
  color-scheme: dark;
}
* {
  box-sizing: border-box;
}
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  margin: 0;
  background: radial-gradient(circle at 10% 10%, var(--bg-alt), var(--bg));
  color: var(--text);
}
.page {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px 40px;
}
.card {
  width: min(880px, 100%);
  background: var(--card);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  box-shadow: var(--shadow);
  padding: 28px 32px 32px;
}
header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 18px;
  gap: 12px;
}
h1 {
  font-size: 26px;
  letter-spacing: 0.2px;
  margin: 0;
  color: var(--text-secondary);
}
h2 {
  font-size: 20px;
  margin: 28px 0 10px;
  color: var(--accent);
}
p,
ul {
  margin: 0 0 14px;
  line-height: 1.6;
  color: var(--text);
}
ul {
  padding-left: 20px;
}
li {
  margin-bottom: 6px;
  color: var(--text-secondary);
}
.meta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--muted);
}
.toggle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--card-border);
  background: var(--bg-alt);
  color: var(--text);
  padding: 10px 14px;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 700;
  letter-spacing: 0.2px;
  transition: transform 120ms ease, opacity 120ms ease;
  text-decoration: none;
  user-select: none;
}
.toggle:hover {
  transform: translateY(-1px);
}
.toggle:active {
  transform: translateY(0);
  opacity: 0.92;
}
footer {
  margin-top: 26px;
  font-size: 13px;
  color: var(--muted);
}
a {
  color: var(--accent);
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
}
`;

  return cssVars('light', lightTheme) + cssVars('dark', darkTheme) + baseStyles;
}

function indentLines(text, indent) {
  return text
    .split('\n')
    .map((line) => (line.length ? `${indent}${line}` : line))
    .join('\n');
}

function writeCssIntoHtml(htmlPath, css) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const styleTag = `  <style id="policy-styles">\n${indentLines(
    css.trim(),
    '    ',
  )}\n  </style>`;

  let updated = html;
  if (html.includes('id="policy-styles"')) {
    updated = html.replace(
      /<style id="policy-styles">[\s\S]*?<\/style>/,
      styleTag,
    );
  } else if (html.includes('rel="stylesheet"')) {
    updated = html.replace(/<link[^>]*rel="stylesheet"[^>]*>/, styleTag);
  } else if (html.includes('</head>')) {
    updated = html.replace('</head>', `${styleTag}\n  </head>`);
  }

  if (updated !== html) {
    fs.writeFileSync(htmlPath, updated, 'utf8');
  }
}

function main() {
  const { lightTheme, darkTheme } = loadTsModule(
    path.join(__dirname, '..', 'src', 'theme', 'themes.ts'),
  );

  if (!lightTheme || !darkTheme) {
    throw new Error('Could not load themes from src/theme/themes.ts');
  }

  const css = buildCss(lightTheme, darkTheme);
  const htmlPath = path.join(__dirname, '..', 'docs', 'privacy-policy.html');
  writeCssIntoHtml(htmlPath, css);
  console.log(`Inlined policy styles into ${htmlPath}`);
}

main();
