import { SettingsStore } from "../store/SettingsStore";
import { Homm2Renderer } from "./Homm2Renderer";
import { Homm3Renderer } from "./Homm3Renderer";
import { CharInfo, Homm2Theme, Homm3PlayerColor, LettersInfo } from "../types";

export class Controller {
  private store: SettingsStore;
  private renderer: Homm2Renderer | Homm3Renderer;
  private readonly homm2: Homm2Renderer;
  private readonly homm3: Homm3Renderer;
  // text split into separate words and spaces blocks
  private splitWords: string[] = [];

  constructor(store: SettingsStore) {
    this.store = store;

    this.homm3 = new Homm3Renderer(this);
    this.homm2 = new Homm2Renderer(this);
    this.renderer = this.homm3;

    this.render();
  }

  setRenderer(rendererId: "homm2" | "homm3"): void {
    this.renderer = rendererId === "homm2" ? this.homm2 : this.homm3;
    this.render();
  }

  render(): void {
    if (this.store.context === null) {
      return;
    }
    this.breakInputIntoWordsAndSpaces();
    this.renderer.render();
    this.prepareCurrentImageDownload();
  }

  /** Sets canvas dataUrl as a download link */
  prepareCurrentImageDownload(): void {
    const canvas = this.getCanvas();
    if (canvas === null || canvas === undefined) {
      return;
    }
    const version = this.renderer === this.homm2 ? "2" : "3";
    this.store.setDownloadFileName(`HoMM${version}-message-${(new Date()).getTime()}.png`);
    this.store.setDownloadData(canvas.toDataURL());
  }

  isButtonsVisible() {
    return this.store.buttonOkay || this.store.buttonCancel;
  }

  getInputValue() {
    return this.store.getImageText();
  }

  getInputValueLength() {
    return this.store.getImageText().length;
  }

  breakInputIntoWordsAndSpaces() {
    const output: string[] = [];

    let currentPhase = "";
    let currentSequence = "";

    for (let i = 0; i < this.getInputValueLength(); i++) {
      const char = this.getInputValue()[i];
      let charType = "";
      if(char.match(/^[\n\r]$/)) {
        charType = "break";
      } else if(char.match(/^\s$/)) {
        charType = "space";
      } else {
        charType = "symbol";
      }
      if(currentPhase !== charType) {
        if(currentSequence !== "") {
          output.push(currentSequence);
          currentSequence = "";
        }
        currentPhase = charType;
      }
      currentSequence += char;
      if(charType == "break") {
        output.push(char);
        currentPhase = charType;
        currentSequence = "";
      }
    }
    if(currentSequence !== "") {
      output.push(currentSequence);
    }

    this.splitWords = output;
  }

  getCanvas(): HTMLCanvasElement | null | undefined {
    return this.store.canvas;
  }

  getContext(): CanvasRenderingContext2D | null {
    return this.store.context;
  }

  getCharInfo(letters: LettersInfo, char: string): CharInfo | undefined {
    const originalChar = letters[char]?.sameAs;
    return originalChar ? letters[originalChar] : letters[char];
  }

  getSplitWords(): string[] {
    return this.splitWords;
  }

  hasButtonOk(): boolean {
    return this.store.buttonOkay;
  }

  hasButtonCancel(): boolean {
    return this.store.buttonCancel;
  }

  hasShadow(): boolean {
    return this.store.showShadow;
  }

  getColor(): Homm3PlayerColor {
    return this.store.homm3PlayerColor;
  }

  getHomm2Theme(): Homm2Theme {
    return this.store.homm2Theme;
  }

  setCanvasSize(width: number, height: number): void {
    const canvas = this.getCanvas();
    if (canvas === null || canvas === undefined) {
      return;
    }
    canvas.width = width;
    canvas.height = height;
  }
}