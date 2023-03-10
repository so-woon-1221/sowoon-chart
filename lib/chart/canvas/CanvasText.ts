export default class CanvasText {
  private text: string;
  private x: number;
  private y: number;
  private fontSize: number;
  private fontStyle: string;
  private color: string;
  private align: string;
  private baseline: string;

  constructor({
    text,
    x,
    y,
    fontSize,
    fontStyle = 'Impact',
    color,
    align = 'center',
    baseline = 'middle',
  }: {
    text: string;
    x: number;
    y: number;
    fontSize: number;
    fontStyle?: string;
    color: string;
    align?: string;
    baseline?: string;
  }) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.fontSize = fontSize;
    this.fontStyle = fontStyle;
    this.color = color;
    this.align = align;
    this.baseline = baseline;
  }

  public draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.font = `${this.fontSize}px ${this.fontStyle}`;
    ctx.fillStyle = this.color;
    ctx.textAlign = this.align as CanvasTextAlign;
    ctx.textBaseline = this.baseline as CanvasTextBaseline;
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }

  public hitText(x: number, y: number, ctx: CanvasRenderingContext2D) {
    if (x > this.x && x < x + ctx.measureText(this.text).width) {
      if (y > this.y && y < y + this.fontSize) {
        return true;
      }
    }
    return false;
  }
}
