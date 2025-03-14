import { Poppins} from "next/font/google";
import "./globals.css";
// import PropTypes from 'prop-types';
import { AuthProvider } from "@/context/AuthContext";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight:["400","500","600","700"]
});

export const metadata = {
  title: "Social Internship",
  // description: "",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${poppins.variable}`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
