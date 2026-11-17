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
  /** Spring's blossom petals or autumn's leaves drifting down. */
  falling?: 'petals' | 'leaves';
  /** What stands behind the ground and along its back edge: summer's hills and fence, spring's
   * little town across the park behind a flowering hedge, autumn's forest and its undergrowth
   * (winter has its town and snow bank). */
  land?: 'park' | 'woods';
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
  spring: {
    skyTop: '#cfe9f7',
    skyBottom: '#f3f8e8',
    hillFar: '#d3edbd',
    hillNear: '#bde5a6',
    ground: '#9ad67f',
    groundDark: '#86c46c',
    winter: false,
    falling: 'petals',
    land: 'park',
  },
  autumn: {
    skyTop: '#f6dcc0',
    skyBottom: '#fbeedd',
    hillFar: '#ecd2a8',
    hillNear: '#e1c08f',
    ground: '#cdb46e',
    groundDark: '#bca15d',
    winter: false,
    falling: 'leaves',
    land: 'woods',
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
