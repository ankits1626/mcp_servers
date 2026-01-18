declare module "chrome-cookies-secure" {
  type CookieFormat = "header" | "object" | "jar" | "set-cookie";

  interface CookieObject {
    [key: string]: string;
  }

  function getCookies(
    url: string,
    format?: CookieFormat,
    callback?: (err: Error | null, cookies: string | CookieObject) => void,
    profile?: string
  ): void;

  function getCookiesPromised(
    url: string,
    format?: CookieFormat,
    profile?: string
  ): Promise<string | CookieObject>;

  export { getCookies, getCookiesPromised };
  export default { getCookies, getCookiesPromised };
}
