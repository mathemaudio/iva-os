import { defineConfig } from 'vite'
import path from 'node:path'

export default defineConfig({
	base: './',
	resolve: {
		alias: {
			'@shared': path.resolve(__dirname, '../shared/src')
		}
	},
	server: {
		port: 26761,
		proxy: {
			'/api': 'http://localhost:26762'
		}
	}
})
