import { NextResponse, type NextRequest } from 'next/server';

// BuildMaster Elite Tático v24
// Middleware neutralizado de propósito.
// Versões antigas redirecionavam para /login usando cookie da Vercel.
// O login atual é 100% local no navegador, então este arquivo apenas libera a navegação.
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
