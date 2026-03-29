import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import svgr from "vite-plugin-svgr"

const configuredAllowedHosts = process.env.VITE_ALLOWED_HOSTS
    ?.split(',')
    .map((host) => host.trim())
    .filter(Boolean) ?? []

const allowedHosts = Array.from(new Set([
    '.ts.net',
    ...configuredAllowedHosts,
]))

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        svgr({
            // svgr options: https://react-svgr.com/docs/options/
            svgrOptions: {exportType: "default", ref: true, svgo: false, titleProp: true},
            include: "**/*.svg",
        }),
    ],
    server: {
        allowedHosts,
    },
    preview: {
        allowedHosts,
    },
})
