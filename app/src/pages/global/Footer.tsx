const Footer = () => {
  return (
    <footer className="mt-auto border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
        <p className="text-center text-xs text-zinc-500">
          © {new Date().getFullYear()} Yourban
        </p>
      </div>
    </footer>
  );
};

export default Footer;
