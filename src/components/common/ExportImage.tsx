import { toPng, toSvg } from 'html-to-image';
import { type ForwardedRef, forwardRef, type ReactNode, useCallback } from 'react';

type ExportTarget = HTMLElement | SVGSVGElement;

export interface ExportImageProps {
  icon?: ReactNode;
  fileName?: string;
  fileFormat?: 'svg' | 'png';
}

const hasCurrentTarget = (
  ref: ForwardedRef<ExportTarget>,
): ref is { current: ExportTarget | null } => {
  return Boolean(ref) && typeof ref !== 'function';
};

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
