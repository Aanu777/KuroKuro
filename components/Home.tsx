import Link from "next/link";
import SearchBox from "@/components/SearchBox";

export default function Home() {
  return (
    <div className="page-shell">
      <main className="home-main">
        <div className="home-inner">
          <div className="wordmark">KUROKURO</div>
          <p className="tagline">Search the web.</p>
          <SearchBox />
          <p className="privacy-note">Private by design. Your local history stays on your device.</p>
        </div>
      </main>
      <footer className="home-footer">
        <Link href="/history">History</Link>
        <Link href="/bookmarks">Bookmarks</Link>
        <Link href="/settings">Settings</Link>
      </footer>
    </div>
  );
}
