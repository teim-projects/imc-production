import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },


  server: {
    host: true,
    port: 5173,

    watch: {
      usePolling: true,
    },

  },
})


// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwindcss from '@tailwindcss/vite'
// import { Server } from 'http'
// import { watch } from 'fs'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react(), tailwindcss() ],

// resolve: {
//   alias: {
//     '@': path.resolve(__dirname, 'src'),
//     },
// },

//   Server:{
//     host: true,
//     port:5173,
//     watch:{
//       usePolling:true,
//     },
//   },
// })

