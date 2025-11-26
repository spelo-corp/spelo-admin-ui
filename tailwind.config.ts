// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import line from '@tailwindcss/line-clamp';

const config = {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {}
    },

    plugins: [
        line,
    ],
}
export default config
