import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/90 bg-zinc-950/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          to="/"
          className="text-[15px] font-semibold tracking-tight text-white transition-colors hover:text-zinc-300"
        >
          Yourban
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            to="/"
            className="rounded-md px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800/80 hover:text-zinc-100"
          >
            Movies
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
