import type { Config } from 'tailwindcss';

// 컬러 토큰은 디자인 핸드오프(졸업학점계산기.dc.html) 기준.
// 구현 방식.md 2.4 매핑표 참고 — 임의값(arbitrary value) 남발 대신 여기서 등록해 재사용한다.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        'brand-blue': '#3182F6',
        'brand-blue-dark': '#1B64DA',
        'brand-success': '#12B76A',
        'brand-error': '#F04452',
        'brand-warning': '#FF8B48',
        'brand-bg': '#F2F4F6',
        'brand-border': '#EDEFF2',
        'brand-text': '#191F28',
        'brand-text-muted': '#8B95A1',
      },
      borderRadius: {
        card: '20px',
      },
      boxShadow: {
        card: '0 2px 10px rgba(17,24,39,0.05)',
      },
    },
  },
  plugins: [],
};

export default config;
