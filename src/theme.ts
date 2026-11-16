import { palette } from './config';

/** A level's colours: the sky (top, bottom), the far and near backdrop, and the ground (top, lower). */
export interface Theme {
  skyTop: string;
  skyBottom: string;
  hillFar: string;
  hillNear: string;
  ground: string;
  groundDark: string;
  /** Winter: a snowy town behind instead of hills and a fence, and snow falling softly. */
  winter: boolean;
}

export const THEMES = {
  summer: {
    skyTop: palette.skyTop,
    skyBottom: palette.skyBottom,
    hillFar: palette.hillFar,
    hillNear: palette.hillNear,
    ground: palette.ground,
    groundDark: palette.groundDark,
    winter: false,
  },
  winter: {
    skyTop: '#a9c8ea',
    skyBottom: '#e6eff8',
    hillFar: '#dde8f4',
    hillNear: '#cfdff0',
    ground: '#f4f8fc',
    groundDark: '#e3ecf6',
    winter: true,
  },
} satisfies Record<string, Theme>;

export type ThemeName = keyof typeof THEMES;
