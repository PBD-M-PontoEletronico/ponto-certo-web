import { ThemeToggle } from './ThemeToggle';

export function LoginNavbar() {
  return (
    <header className="flex items-center justify-between bg-primary px-6 py-4 dark:bg-primary-dark">
      <span className="text-lg font-semibold text-white">Ponto Certo</span>
      <ThemeToggle />
    </header>
  );
}