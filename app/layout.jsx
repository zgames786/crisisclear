import CrisisClearApp from '@/components/CrisisClearApp'
import './globals.css'

export const metadata = {
  title: 'CrisisClear',
  description: 'Turn confusing notices into clear, actionable guidance.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <CrisisClearApp />
        {children}
      </body>
    </html>
  )
}
