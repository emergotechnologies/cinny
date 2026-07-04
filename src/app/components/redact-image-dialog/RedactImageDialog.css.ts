import { style } from '@vanilla-extract/css';
import { DefaultReset, color } from 'folds';

export const RedactImageDialog = style([
  DefaultReset,
  {
    width: 'min(90vw, 1200px)',
    maxWidth: 'min(90vw, 1200px)',
  },
]);

export const ImageContainer = style([
  DefaultReset,
  {
    position: 'relative',
    height: '60vh',
    backgroundColor: color.Background.Container,
    color: color.Background.OnContainer,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
]);

export const Image = style([
  DefaultReset,
  {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    display: 'block',
    pointerEvents: 'none',
    userSelect: 'none',
  },
]);

export const Canvas = style([
  DefaultReset,
  {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    cursor: 'crosshair',
  },
]);
