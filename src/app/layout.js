export const metadata = {
  title: 'XRP Command Pro — Professional Trading Terminal',
  description: 'Institutional-grade XRP trading intelligence',
}
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#050c14' }}>{children}</body>
    </html>
  )
}
