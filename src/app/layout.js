import "./globals.css";
import Providers from "./providers";

export const metadata = {
	title: "MyApp",
	description: "Secure Next.js app",
};

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body className="bg-slate-50 text-slate-900">
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}