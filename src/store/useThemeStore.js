/**
 * Theme store — 4 themes, persisted to localStorage.
 */
import { create } from 'zustand';

export const THEMES = {
  cyber: {
    id: 'cyber',
    name: 'Cyber Dark',
    emoji: '🔵',
    desc: 'Navy + Neon Cyan',
    vars: {
      '--bg':           '#080f1b',
      '--bg2':          '#0c1526',
      '--panel':        'rgba(10,20,40,0.88)',
      '--border':       'rgba(0,217,255,0.15)',
      '--border2':      'rgba(0,217,255,0.08)',
      '--input-bg':     'rgba(4,10,20,0.9)',
      '--cyan':         '#00d9ff',
      '--cyan-dim':     'rgba(0,217,255,0.12)',
      '--cyan-glow':    'rgba(0,217,255,0.35)',
      '--yellow':       '#ffd000',
      '--green':        '#00e676',
      '--red':          '#ff4466',
      '--text1':        '#e8f4ff',
      '--text2':        '#7ab0d0',
      '--text3':        '#3a6080',
      '--accent':       '#00d9ff',
      '--accent-soft':  'rgba(0,217,255,0.12)',
      '--accent-glow':  'rgba(0,217,255,0.35)',
      '--safe':         '#00e676',
      '--warning':      '#ffc107',
      '--error':        '#ff4466',
      '--canvas-bg':    '#050c17',
    },
  },

  amber: {
    id: 'amber',
    name: 'Amber Lab',
    emoji: '🟠',
    desc: 'Dark + Gold',
    vars: {
      '--bg':           '#0c0a06',
      '--bg2':          '#141009',
      '--panel':        'rgba(20,15,8,0.9)',
      '--border':       'rgba(240,168,0,0.18)',
      '--border2':      'rgba(240,168,0,0.08)',
      '--input-bg':     'rgba(8,6,2,0.9)',
      '--cyan':         '#f0a800',
      '--cyan-dim':     'rgba(240,168,0,0.12)',
      '--cyan-glow':    'rgba(240,168,0,0.40)',
      '--yellow':       '#ff8c00',
      '--green':        '#40ff80',
      '--red':          '#ff4455',
      '--text1':        '#f5e8c0',
      '--text2':        '#c0a060',
      '--text3':        '#6a5030',
      '--accent':       '#f0a800',
      '--accent-soft':  'rgba(240,168,0,0.12)',
      '--accent-glow':  'rgba(240,168,0,0.40)',
      '--safe':         '#40ff80',
      '--warning':      '#ff8c00',
      '--error':        '#ff4455',
      '--canvas-bg':    '#090703',
    },
  },

  matrix: {
    id: 'matrix',
    name: 'Matrix Green',
    emoji: '🟢',
    desc: 'Black + Terminal Green',
    vars: {
      '--bg':           '#020a02',
      '--bg2':          '#051005',
      '--panel':        'rgba(4,14,4,0.92)',
      '--border':       'rgba(0,255,80,0.15)',
      '--border2':      'rgba(0,255,80,0.07)',
      '--input-bg':     'rgba(2,8,2,0.95)',
      '--cyan':         '#00ff50',
      '--cyan-dim':     'rgba(0,255,80,0.12)',
      '--cyan-glow':    'rgba(0,255,80,0.35)',
      '--yellow':       '#ccff00',
      '--green':        '#00ff50',
      '--red':          '#ff3333',
      '--text1':        '#ccffcc',
      '--text2':        '#60c060',
      '--text3':        '#286028',
      '--accent':       '#00ff50',
      '--accent-soft':  'rgba(0,255,80,0.12)',
      '--accent-glow':  'rgba(0,255,80,0.35)',
      '--safe':         '#00ff50',
      '--warning':      '#ccff00',
      '--error':        '#ff3333',
      '--canvas-bg':    '#010601',
    },
  },

  violet: {
    id: 'violet',
    name: 'Violet Storm',
    emoji: '🟣',
    desc: 'Deep Purple + Magenta',
    vars: {
      '--bg':           '#0a0414',
      '--bg2':          '#0f0820',
      '--panel':        'rgba(16,8,30,0.92)',
      '--border':       'rgba(200,80,255,0.18)',
      '--border2':      'rgba(200,80,255,0.08)',
      '--input-bg':     'rgba(6,2,12,0.95)',
      '--cyan':         '#cc44ff',
      '--cyan-dim':     'rgba(200,80,255,0.12)',
      '--cyan-glow':    'rgba(200,80,255,0.4)',
      '--yellow':       '#ff88ff',
      '--green':        '#44ffcc',
      '--red':          '#ff4477',
      '--text1':        '#f0e0ff',
      '--text2':        '#a070c0',
      '--text3':        '#503060',
      '--accent':       '#cc44ff',
      '--accent-soft':  'rgba(200,80,255,0.12)',
      '--accent-glow':  'rgba(200,80,255,0.4)',
      '--safe':         '#44ffcc',
      '--warning':      '#ffcc44',
      '--error':        '#ff4477',
      '--canvas-bg':    '#060210',
    },
  },

  light: {
    id: 'light',
    name: 'Light Mode',
    emoji: '☀️',
    desc: 'Soft Dark + Lighter panels',
    vars: {
      '--bg':           '#1a2030',
      '--bg2':          '#222840',
      '--panel':        'rgba(30,38,58,0.95)',
      '--border':       'rgba(100,160,255,0.2)',
      '--border2':      'rgba(100,160,255,0.09)',
      '--input-bg':     'rgba(20,28,48,0.9)',
      '--cyan':         '#60aaff',
      '--cyan-dim':     'rgba(96,170,255,0.12)',
      '--cyan-glow':    'rgba(96,170,255,0.3)',
      '--yellow':       '#ffd060',
      '--green':        '#40e080',
      '--red':          '#ff5577',
      '--text1':        '#ddeeff',
      '--text2':        '#90b8d8',
      '--text3':        '#506888',
      '--accent':       '#60aaff',
      '--accent-soft':  'rgba(96,170,255,0.12)',
      '--accent-glow':  'rgba(96,170,255,0.3)',
      '--safe':         '#40e080',
      '--warning':      '#ffd060',
      '--error':        '#ff5577',
      '--canvas-bg':    '#141c2e',
      '--border-subtle':'rgba(100,160,255,0.06)',
    },
  },
};

const STORAGE_KEY = 'dsp_theme';

function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([key, val]) => {
    root.style.setProperty(key, val);
  });
}

const savedId = (() => {
  try { return localStorage.getItem(STORAGE_KEY) || 'cyber'; } catch { return 'cyber'; }
})();

export const useThemeStore = create((set) => {
  const initial = THEMES[savedId] || THEMES.cyber;
  // Apply on load — only in browser
  if (typeof window !== 'undefined') {
    // defer slightly so DOM is ready
    setTimeout(() => applyTheme(initial), 0);
  }

  return {
    currentTheme: initial,
    setTheme(themeId) {
      const theme = THEMES[themeId];
      if (!theme) return;
      applyTheme(theme);
      try { localStorage.setItem(STORAGE_KEY, themeId); } catch {}
      set({ currentTheme: theme });
    },
  };
});
