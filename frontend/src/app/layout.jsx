import '../index.css';
import Providers from '../components/Providers';
import Script from 'next/script';

export const metadata = {
  title: 'RPM App - Power Monitor System',
  description: 'ระบบตรวจสอบบำรุงรักษาตู้อุปกรณ์ไฟฟ้าและระบบโครงสร้างสถานีโทรคมนาคม',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'dark';
                  if (theme === 'light') {
                    document.documentElement.classList.add('light');
                  } else {
                    document.documentElement.classList.remove('light');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-dark-bg text-gray-100 min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
