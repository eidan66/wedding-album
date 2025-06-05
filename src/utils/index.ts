export const createPageUrl = (pageName: string): string => {
  const basePath = '/wedding-album';
  const routes: Record<string, string> = {
    'Gallery': '/gallery',
    'Upload': '/upload',
    'Home': '/'
  };
  
  return `${basePath}${routes[pageName] || '/'}`;
}; 