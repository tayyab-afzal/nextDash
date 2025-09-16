import "./globals.css";
import Providers from "./providers";

export const metadata = {
	title: "nextDash",
	description: "nextJS Dashbaord for Azure Piepline testing",
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