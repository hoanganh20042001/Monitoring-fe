import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { webcrypto } from 'node:crypto'

// Bổ sung Web Crypto cho môi trường Node khi Vite khởi động
if (!globalThis.crypto || typeof globalThis.crypto.getRandomValues !== 'function') {
  globalThis.crypto = webcrypto
}

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // ✅ cho phép truy cập từ IP khác (điện thoại, máy khác trong LAN)
    port: 4000,      // ✅ đổi port (bạn muốn bao nhiêu thì sửa ở đây)
    strictPort: true // ✅ nếu port bị chiếm thì không tự nhảy sang port khác
  }
})
