declare module 'emoji-toolkit' {
  interface JoyPixels {
    toImage(str: string): string;
    shortnameToUnicode(str: string): string;
    unicodeToShortname(str: string): string;
    shortnameToImage(str: string): string;
    ascii: boolean;
    imagePathPNG: string;
    imagePathSVG: string;
    imageType: 'png' | 'svg';
    assets: {
      png: string;
      svg: string;
    };
  }
  const joypixels: JoyPixels;
  export default joypixels;
}
