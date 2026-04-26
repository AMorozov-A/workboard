import 'styled-components'

declare module 'styled-components' {
  export interface DefaultTheme extends Record<string, never> {}
}
