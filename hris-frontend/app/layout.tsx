import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App, ConfigProvider } from "antd";
import idID from "antd/locale/id_ID";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "HRIS",
  description: "Sistem Informasi HRIS",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface-page">
        <AntdRegistry>
          <ConfigProvider
            locale={idID}
            theme={{
              token: {
                colorPrimary: "#2563eb",
                colorSuccess: "#10b981",
                colorWarning: "#f59e0b",
                colorError: "#ef4444",
                colorInfo: "#0284c7",
                colorTextBase: "#0f172a",
                colorBorder: "#e2e8f0",
                borderRadius: 8,
                fontFamily: "var(--font-inter), Arial, Helvetica, sans-serif",
              },
              components: {
                Card: { borderRadiusLG: 12 },
                Button: { borderRadius: 8, controlHeight: 40 },
              },
            }}
          >
            <App>
              <AuthProvider>{children}</AuthProvider>
            </App>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
