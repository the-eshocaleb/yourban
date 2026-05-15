import { Link } from "react-router-dom";
import Header from "./global/Header";
import Footer from "./global/Footer";

const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <Header />

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-6">
        <p className="text-6xl font-semibold tabular-nums tracking-tight text-zinc-900">
          404
        </p>
        <h1 className="mt-4 text-xl font-semibold text-zinc-900">
          Page not found
        </h1>
        <p className="mt-2 max-w-sm text-center text-sm text-zinc-500">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          to="/"
          className="mt-8 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
        >
          Back to movies
        </Link>
      </main>

      <Footer />
    </div>
  );
};


export default NotFound;
