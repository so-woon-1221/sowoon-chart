// export default class CanvasText {
//   private text: string;
//   private x: number;
//   private y: number;
//   private fontSize: number;
//   private fontStyle: string;
//   private color: string;
//   private align: string;
//   private baseline: string;

//   constructor({
//     text,
//     x,
//     y,
//     fontSize,
//     fontStyle = 'Impact',
//     color,
//     align = 'center',
//     baseline = 'middle',
//   }: {
//     text: string;
//     x: number;
//     y: number;
//     fontSize: number;
//     fontStyle?: string;
//     color: string;
//     align?: string;
//     baseline?: string;
//   }) {
//     this.text = text;
//     this.x = x;
//     this.y = y;
//     this.fontSize = fontSize;
//     this.fontStyle = fontStyle;
//     this.color = color;
//     this.align = align;
//     this.baseline = baseline;
//   }

//   public draw(ctx: CanvasRenderingContext2D) {
//     ctx.save();
//     ctx.font = `${this.fontSize}px ${this.fontStyle}`;
//     ctx.fillStyle = this.color;
//     ctx.textAlign = this.align as CanvasTextAlign;
//     ctx.textBaseline = this.baseline as CanvasTextBaseline;
//     ctx.fillText(this.text, this.x, this.y);
//     ctx.restore();
//   }

//   // public hitText(x: number, y: number) {
//   //   const dx = this.font;
//   //   const dy = this.y2 - this.y1;

//   //   const dist =
//   //     Math.abs(dy * x - dx * y + this.x2 * this.y1 - this.y2 * this.x1) /
//   //     Math.sqrt(dx * dx + dy * dy);

//   //   return dist < 5;
//   // }
// }

import cloud from 'd3-cloud';

interface Word {
  text: string;
  value: number;
}

globalThis.addEventListener('message', event => {
  const { data } = event;
  const { words, width, height, padding } = data;

  const layout = cloud()
    .size([width, height])
    .words(words)
    .padding(padding)
    .rotate(() => 0)
    .font('Impact')
    .fontSize((d: Word) => d.value)
    .on('end', (w: Word[]) => {
      globalThis.postMessage(w);
    });

  layout.start();
});
