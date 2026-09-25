import type { ReactNode, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = 'h-5 w-5 shrink-0';

function Icone(props: IconProps & { children: ReactNode }) {
  const { children, className, ...rest } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className ?? base}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function IconeInicio(props: IconProps) {
  return (
    <Icone {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </Icone>
  );
}

export function IconeEmpresas(props: IconProps) {
  return (
    <Icone {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 21h18M5 21V7a1 1 0 011-1h5a1 1 0 011 1v14M15 21V4a1 1 0 011-1h3a1 1 0 011 1v17M8 9h1m-1 4h1m5-8h1m-1 4h1m-1 4h1" />
    </Icone>
  );
}

export function IconeUsuarios(props: IconProps) {
  return (
    <Icone {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </Icone>
  );
}

export function IconeSetores(props: IconProps) {
  return (
    <Icone {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </Icone>
  );
}

export function IconeAlocacoes(props: IconProps) {
  return (
    <Icone {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </Icone>
  );
}

export function IconeEscalas(props: IconProps) {
  return (
    <Icone {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </Icone>
  );
}

export function IconeFeriados(props: IconProps) {
  return (
    <Icone {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </Icone>
  );
}

export function IconeAfastamentos(props: IconProps) {
  return (
    <Icone {...props}>
      <circle cx="9" cy="7" r="3" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h4" />
    </Icone>
  );
}

export function IconeSair(props: IconProps) {
  return (
    <Icone {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 16l4-4m0 0l-4-4m4 4H7m0-9H5a2 2 0 00-2 2v14a2 2 0 002 2h2" />
    </Icone>
  );
}

export function IconeMenu(props: IconProps) {
  return (
    <Icone {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </Icone>
  );
}

export function IconeFechar(props: IconProps) {
  return (
    <Icone {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </Icone>
  );
}
