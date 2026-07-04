import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FocusTrap from 'focus-trap-react';
import {
  Box,
  Button,
  Dialog,
  Header,
  Icon,
  IconButton,
  Icons,
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
  Spinner,
  Text,
  color,
  config,
} from 'folds';
import { Room } from 'matrix-js-sdk';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { AsyncStatus, useAsyncCallback, useAsyncCallbackValue } from '../../hooks/useAsyncCallback';
import { useMediaAuthentication } from '../../hooks/useMediaAuthentication';
import { useClientConfig } from '../../hooks/useClientConfig';
import { useElementSizeObserver } from '../../hooks/useElementSizeObserver';
import { stopPropagation } from '../../utils/keyboard';
import { getImageFileUrl } from '../../utils/dom';
import { downloadMedia, encryptFile, mxcUrlToHttp } from '../../utils/matrix';
import {
  RedactionBox,
  compositeRedactionBoxes,
  uploadRedactedMedia,
} from '../../utils/aipulseRedaction';
import { getImageMsgContent } from '../../features/room/msgContent';
import { TUploadItem } from '../../state/room/roomInputDrafts';
import * as css from './RedactImageDialog.css';

type RedactedImage = {
  mxc: string;
  blob: Blob;
  url: string;
};

type Point = {
  x: number;
  y: number;
};

type RedactImageDialogProps = {
  room: Room;
  file: File;
  extraImagesNotice?: boolean;
  onComplete: () => void;
  onCancel: () => void;
};

export function RedactImageDialog({
  room,
  file,
  extraImagesNotice,
  onComplete,
  onCancel,
}: RedactImageDialogProps) {
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();
  const { aipulse } = useClientConfig();
  const mediaRedactionUrl = aipulse?.mediaRedactionUrl;

  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const objectUrlsRef = useRef<string[]>([]);

  const [boxes, setBoxes] = useState<RedactionBox[]>([]);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [dragCurrent, setDragCurrent] = useState<Point | null>(null);

  const [redactState, retryRedact] = useAsyncCallbackValue<RedactedImage, Error>(
    useCallback(async () => {
      if (!mediaRedactionUrl) throw new Error('Redaction service is not configured.');
      const accessToken = mx.getAccessToken();
      if (!accessToken) throw new Error('Not authenticated.');
      const mxc = await uploadRedactedMedia(mediaRedactionUrl, accessToken, file);
      const httpUrl = mxcUrlToHttp(mx, mxc, useAuthentication);
      if (!httpUrl) throw new Error('Failed to resolve redacted image URL.');
      const blob = await downloadMedia(httpUrl);
      const url = URL.createObjectURL(blob);
      objectUrlsRef.current.push(url);
      return { mxc, blob, url };
    }, [mx, file, mediaRedactionUrl, useAuthentication])
  );
  const redactedImage = redactState.status === AsyncStatus.Success ? redactState.data : undefined;
  const redactionFailed = redactState.status === AsyncStatus.Error;
  // When automatic redaction fails, fall back to the original image so the
  // user can still redact manually before uploading.
  const originalUrl = useMemo(() => getImageFileUrl(file), [file]);
  const displayUrl = redactedImage?.url ?? (redactionFailed ? originalUrl : undefined);
  const canEdit = redactedImage !== undefined || redactionFailed;

  useEffect(
    () => () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    },
    []
  );

  useEffect(() => () => URL.revokeObjectURL(originalUrl), [originalUrl]);

  // Returns the rendered image rect within the container
  // (accounts for objectFit: contain letterboxing).
  const getImageRect = useCallback(() => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container || !img.naturalWidth || !img.naturalHeight) return null;

    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;

    const scale = Math.min(cw / nw, ch / nh);
    const rw = nw * scale;
    const rh = nh * scale;
    const rx = (cw - rw) / 2;
    const ry = (ch - rh) / 2;

    return { rx, ry, rw, rh };
  }, []);

  // Convert canvas-relative pixel coords to image fraction coords (0-1).
  const toFraction = useCallback(
    (cx: number, cy: number) => {
      const rect = getImageRect();
      if (!rect) return null;
      const { rx, ry, rw, rh } = rect;
      return {
        x: Math.max(0, Math.min(1, (cx - rx) / rw)),
        y: Math.max(0, Math.min(1, (cy - ry) / rh)),
      };
    },
    [getImageRect]
  );

  // Redraws all committed boxes + current drag preview onto the canvas.
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = getImageRect();
    if (!rect) return;
    const { rx, ry, rw, rh } = rect;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    boxes.forEach((box) => {
      ctx.fillRect(rx + box.x * rw, ry + box.y * rh, box.width * rw, box.height * rh);
    });

    if (dragStart && dragCurrent) {
      const x = Math.min(dragStart.x, dragCurrent.x);
      const y = Math.min(dragStart.y, dragCurrent.y);
      const w = Math.abs(dragCurrent.x - dragStart.x);
      const h = Math.abs(dragCurrent.y - dragStart.y);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, w, h);
    }
  }, [boxes, dragStart, dragCurrent, getImageRect]);

  useEffect(() => {
    if (canEdit) redraw();
  }, [canEdit, redraw]);

  useElementSizeObserver(
    useCallback(() => containerRef.current, []),
    useCallback(() => redraw(), [redraw])
  );

  const getCanvasCoords = (evt: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const r = canvas.getBoundingClientRect();
    return { x: evt.clientX - r.left, y: evt.clientY - r.top };
  };

  const [sendState, sendImage] = useAsyncCallback<undefined, Error, []>(
    useCallback(async () => {
      if (!redactedImage && !redactionFailed) throw new Error('Image is not redacted yet.');
      const baseBlob: Blob = redactedImage?.blob ?? file;
      const finalBlob =
        boxes.length > 0 ? await compositeRedactionBoxes(baseBlob, file.type, boxes) : baseBlob;
      const finalFile = new File([finalBlob], file.name, { type: file.type });

      let item: TUploadItem;
      let mxc: string;
      if (room.hasEncryptionStateEvent()) {
        const encrypted = await encryptFile(finalFile);
        item = { ...encrypted, metadata: { markedAsSpoiler: false } };
        const res = await mx.uploadContent(encrypted.file, { includeFilename: false });
        mxc = res.content_uri;
      } else {
        item = {
          file: finalFile,
          originalFile: finalFile,
          encInfo: undefined,
          metadata: { markedAsSpoiler: false },
        };
        if (redactedImage && boxes.length === 0) {
          // The redaction endpoint already uploaded this exact content.
          mxc = redactedImage.mxc;
        } else {
          const res = await mx.uploadContent(finalFile);
          mxc = res.content_uri;
        }
      }

      const content = await getImageMsgContent(mx, item, mxc);
      await mx.sendMessage(room.roomId, content as any);
      return undefined;
    }, [mx, room, file, boxes, redactedImage, redactionFailed])
  );
  const uploading = sendState.status === AsyncStatus.Loading;
  const sent = sendState.status === AsyncStatus.Success;

  useEffect(() => {
    if (sent) onComplete();
  }, [sent, onComplete]);

  const handleMouseDown = (evt: React.MouseEvent<HTMLCanvasElement>) => {
    if (uploading || sent) return;
    const coords = getCanvasCoords(evt);
    setDragStart(coords);
    setDragCurrent(coords);
  };

  const handleMouseMove = (evt: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragStart) return;
    setDragCurrent(getCanvasCoords(evt));
  };

  const handleMouseUp = (evt: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragStart) return;
    const end = getCanvasCoords(evt);

    const x0 = Math.min(dragStart.x, end.x);
    const y0 = Math.min(dragStart.y, end.y);
    const x1 = Math.max(dragStart.x, end.x);
    const y1 = Math.max(dragStart.y, end.y);

    // Ignore tiny accidental clicks
    if (x1 - x0 > 5 && y1 - y0 > 5) {
      const frac0 = toFraction(x0, y0);
      const frac1 = toFraction(x1, y1);
      if (frac0 && frac1) {
        setBoxes((prev) => [
          ...prev,
          {
            x: frac0.x,
            y: frac0.y,
            width: frac1.x - frac0.x,
            height: frac1.y - frac0.y,
          },
        ]);
      }
    }

    setDragStart(null);
    setDragCurrent(null);
  };

  const handleMouseLeave = () => {
    if (dragStart) {
      setDragStart(null);
      setDragCurrent(null);
    }
  };

  const handleUpload = () => {
    if (!canEdit || uploading || sent) return;
    sendImage();
  };

  return (
    <Overlay open backdrop={<OverlayBackdrop />}>
      <OverlayCenter>
        <FocusTrap
          focusTrapOptions={{
            initialFocus: false,
            onDeactivate: onCancel,
            clickOutsideDeactivates: false,
            escapeDeactivates: stopPropagation,
          }}
        >
          <Dialog variant="Surface" className={css.RedactImageDialog}>
            <Header
              style={{
                padding: `0 ${config.space.S200} 0 ${config.space.S400}`,
                borderBottomWidth: config.borderWidth.B300,
              }}
              variant="Surface"
              size="500"
            >
              <Box grow="Yes">
                <Text size="H4">Redact Image</Text>
              </Box>
              <IconButton size="300" onClick={onCancel} radii="300">
                <Icon src={Icons.Cross} />
              </IconButton>
            </Header>
            <Box style={{ padding: config.space.S400 }} direction="Column" gap="400">
              <div className={css.ImageContainer} ref={containerRef}>
                {redactState.status === AsyncStatus.Loading && (
                  <Box direction="Column" alignItems="Center" gap="300">
                    <Spinner variant="Secondary" size="600" />
                    <Text size="T300" priority="300">
                      Anonymizing image...
                    </Text>
                  </Box>
                )}
                {displayUrl && (
                  <>
                    <img
                      className={css.Image}
                      ref={imgRef}
                      src={displayUrl}
                      alt={file.name}
                      onLoad={redraw}
                    />
                    <canvas
                      className={css.Canvas}
                      ref={canvasRef}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseLeave}
                    />
                  </>
                )}
              </div>
              {extraImagesNotice && (
                <Text size="T200" style={{ color: color.Warning.Main }}>
                  Multiple images were selected; only the first one is used.
                </Text>
              )}
              {redactionFailed && (
                <Box alignItems="Center" justifyContent="SpaceBetween" gap="200">
                  <Text style={{ color: color.Critical.Main }} size="T300">
                    Automatic anonymization failed — redact sensitive areas manually before
                    uploading. ({redactState.error.message})
                  </Text>
                  <Box shrink="No">
                    <Button
                      size="300"
                      variant="Secondary"
                      fill="Soft"
                      onClick={() => {
                        if (!uploading && !sent) retryRedact();
                      }}
                      aria-disabled={uploading || sent}
                    >
                      <Text size="B300">Retry</Text>
                    </Button>
                  </Box>
                </Box>
              )}
              {sendState.status === AsyncStatus.Error && (
                <Text style={{ color: color.Critical.Main }} size="T300">
                  Failed to upload image! {sendState.error.message}
                </Text>
              )}
              <Box alignItems="Center" justifyContent="SpaceBetween" gap="200">
                <Text size="T200" priority="300">
                  {boxes.length > 0 &&
                    `${boxes.length} redaction ${boxes.length === 1 ? 'box' : 'boxes'}`}
                  {boxes.length === 0 &&
                    (redactionFailed
                      ? 'Draw boxes over anything sensitive.'
                      : 'Draw boxes over anything the AI missed.')}
                </Text>
                <Box gap="200" shrink="No">
                  <Button
                    size="300"
                    variant="Secondary"
                    fill="Soft"
                    onClick={() => setBoxes([])}
                    aria-disabled={boxes.length === 0 || uploading || sent}
                  >
                    <Text size="B300">Clear boxes</Text>
                  </Button>
                  <Button
                    size="300"
                    variant="Primary"
                    onClick={handleUpload}
                    before={uploading ? <Spinner fill="Solid" size="200" /> : undefined}
                    aria-disabled={!canEdit || uploading || sent}
                  >
                    <Text size="B300">{uploading ? 'Uploading...' : 'Upload'}</Text>
                  </Button>
                </Box>
              </Box>
            </Box>
          </Dialog>
        </FocusTrap>
      </OverlayCenter>
    </Overlay>
  );
}
