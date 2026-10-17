import { Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import type { ComponentProps } from 'react';
import { Platform } from 'react-native';

export function ExternalLink(props: ComponentProps<typeof Link>) {
  const { href, onPress, ...rest } = props;

  return (
    <Link
      target="_blank"
      href={href}
      {...rest}
      onPress={(e) => {
        onPress?.(e);
        if (Platform.OS !== 'web') {
          e.preventDefault();
          const url = typeof href === 'string' ? href : '';
          if (url) {
            WebBrowser.openBrowserAsync(url);
          }
        }
      }}
    />
  );
}
