/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" }
        ],
      },
    ]
  },
  // Ajout de la configuration du serveur
  server: {
    host: '0.0.0.0',
    port: 3000
  },
  // Désactiver le strict mode pour le développement
  reactStrictMode: false,
}

module.exports = nextConfig