import { useWindowDimensions } from 'react-native';

export function useBreakpoint() {
  const { width } = useWindowDimensions();

  return {
    width,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    columns: width >= 1024 ? 3 : width >= 768 ? 2 : 1,
    contentMaxWidth: width >= 1024 ? 960 : width >= 768 ? 720 : '100%' as const,
  };
}
