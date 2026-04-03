import { toPng, toSvg } from 'html-to-image';
import { type ForwardedRef, forwardRef, type ReactNode, useCallback } from 'react';

type ExportTarget = HTMLElement | SVGSVGElement;

/**
 * Props for the image export trigger button.
 */
export interface ExportImageProps {
  /**
   * Custom icon or content rendered inside the button.
   */
  icon?: ReactNode;
  /**
   * File name used for the downloaded asset.
   * @default "download"
   */
  fileName?: string;
  /**
   * Export format for the generated file.
   * @default "svg"
   */
  fileFormat?: 'svg' | 'png';
}

const hasCurrentTarget = (
  ref: ForwardedRef<ExportTarget>,
): ref is { current: ExportTarget | null } => {
  return Boolean(ref) && typeof ref !== 'function';
};

/**
 * Renders a lightweight button that exports the attached chart element as an image.
 */
const ExportImage = (
  { icon = 'svg', fileName = 'download', fileFormat = 'svg' }: ExportImageProps,
  ref: ForwardedRef<ExportTarget>,
) => {
  const toImage = fileFormat === 'png' ? toPng : toSvg;

  const onClick = useCallback(async () => {
    if (!hasCurrentTarget(ref) || !ref.current) {
      return;
    }

    const image = await toImage(ref.current as unknown as HTMLElement);
    const link = document.createElement('a');
    link.download = `${fileName}.${fileFormat}`;
    link.href = image;
    link.click();
  }, [fileFormat, fileName, ref, toImage]);

  return (
    <button
      onClick={onClick}
      title={`Export as ${fileFormat.toUpperCase()}`}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      {icon}
    </button>
  );
};

export default forwardRef<ExportTarget, ExportImageProps>(ExportImage);
