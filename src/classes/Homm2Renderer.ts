import homm2SectionsInfo from "../json/homm2SectionsInfo.json";
import homm2Symbols from "../json/homm2Symbols.json";
import { Controller } from "./Controller";
import { CharInfo, Homm2PaddingDirections, Homm2SectionInfo, Homm2SectionsInfo, LettersInfo } from "../types";

export class Homm2Renderer {
  controller: Controller;
  language: "eng" | "rus" = "eng";

  // number of middle sections
  middlesCount: number;

  sprite: HTMLImageElement;

  readyToRender: boolean = false;
  renderInterval: NodeJS.Timeout | null = null;

  textByLines: string[][] = [];

  static lineHeight: number = 16;
  static buttonSize: [number, number] = [95, 25];
  static buttonMargin: number = 28;
  static letterContainerWidth = 19;
  static lettersOffsetX = 1;
  static lettersOffsetY = 313;
  static lettersShadowOffsetY = 499;
  static letterSpacing = 2;

  static sectionsInfo: Homm2SectionsInfo = homm2SectionsInfo as Homm2SectionsInfo;
  static letters: LettersInfo = homm2Symbols as LettersInfo;

  constructor(controller: Controller) {
    this.controller = controller;

    this.middlesCount = 0;

    this.sprite = new Image();
    this.sprite.src = "img/homm2-sprite.png";
    this.sprite.onload = () => {
      this.readyToRender = true;
      this.controller.render();
    };
  }

  render() {
    if (!this.readyToRender) {
      return;
    }

    this.setDefaults();
    this.splitTextToLines();
    this.setCanvasSize();
    this.drawMessageWindow();
    this.drawText();
  }

  /** Clears canvas and sets defaults where necessary */
  setDefaults(): void {
    const context = this.getContext();
    if (context === null) {
      return;
    }
    context.clearRect(0, 0, 999999, 999999);
    this.middlesCount = 0;
  }

  /** Renders message window on canvas */
  drawMessageWindow(): void {
    const themeSection = this.getSectionInfo();

    this.drawMessageSections(themeSection);
    if (this.controller.isButtonsVisible()) {
      this.drawButtons(themeSection);
    }
  }

  setCanvasSize(): void {
    const textHeight = this.textByLines.length * Homm2Renderer.lineHeight;
    const sections = this.getSectionInfo();
    let spare_height: number = sections.top.size[1] - this.getPadding("top") + sections.bottom.size[1] - this.getPadding("bottom");

    for (let i = 0; i < 10; i++) {
      if (i) {
        spare_height += sections.middle.size[1];
      }
      if (spare_height >= textHeight) {
        this.middlesCount = i;
        break;
      }
    }
    let width: number = sections.width;
    let height: number = sections.top.size[1] + sections.bottom.size[1] + this.middlesCount * sections.middle.size[1];
    if (this.controller.hasShadow()) {
      width += sections.shadowWidth;
      height += sections.bottom.shadows[1].size[1];
    }
    this.controller.setCanvasSize(width, height);
  }

  /** Gets padding from single direction */
  getPadding(direction: Homm2PaddingDirections | "leftWithShadow"): number {
    let padding: number = 0;
    const sectionsInfo = this.getSectionInfo();
    let refinedDirection = direction;
    if (direction == "bottom" && this.controller.isButtonsVisible()) {
      refinedDirection = "bottomWithButtons";
    } else if (direction === "leftWithShadow") {
      if (this.controller.hasShadow()) {
        padding += sectionsInfo.shadowWidth;
      }
      refinedDirection = "left";
    }
    padding += (sectionsInfo.padding[(refinedDirection as Homm2PaddingDirections)] ?? 0);
    return padding;
  }


  splitTextToLines() {
    let currentLine: string[] = [];
    let currentSpaceString: string = "";
    let isNewLine: boolean = false;
    let isSpaceBlock: boolean = false;
    let block: string = "";
    let currentLineWithBlock = "";
    let currentLineWithBlockWidth = 0;

    this.textByLines = [];

    if (this.controller.getSplitWords().length === 0) {
      return;
    }

    for (let i = 0; i < this.controller.getSplitWords().length; i++) {
      block = this.controller.getSplitWords()[i];
      isNewLine = (block.match(/^[\n\r]+$/) !== null);
      isSpaceBlock = (block.match(/^\s+$/) !== null && !isNewLine);

      currentLineWithBlock = currentLine.join("") + block;
      currentLineWithBlockWidth = this.getStringWidth(currentLineWithBlock);

      if (isNewLine) { // new line
        this.textByLines.push(currentLine);
        currentLine = [];
        currentSpaceString = "";
      } else if (isSpaceBlock) { // space block
        for (let j = 0; j < block.length; j++) {
          const spaceChar: string = block[j];
          currentSpaceString += spaceChar;
          const currentLineWithSpaceBlock = currentLine.join("") + currentSpaceString;
          const currentLineWithSpaceBlockWidth = this.getStringWidth(currentLineWithSpaceBlock);
          if (currentLineWithSpaceBlockWidth > this.getPopupWidthWithoutPadding()) {
            currentLine.push(currentSpaceString);
            this.textByLines.push(currentLine);
            currentLine = [];
            currentSpaceString = "";
          }
        }
        if (currentSpaceString !== "") {
          currentLine.push(currentSpaceString);
          currentSpaceString = "";
        }
      } else { // regular word
        if (currentLineWithBlockWidth < this.getPopupWidthWithoutPadding()) {
          currentLine.push(block);
        } else {
          if (currentLine.length) {
            this.textByLines.push(currentLine);
          }
          currentLine = [block];
        }
      }
    }

    if (currentLine.length) {
      this.textByLines.push(currentLine);
    }
  }

  getStringWidth(string: string) {
    let width: number = 0;
    for (let i = 0; i < string.length; i++) {
      const char = string[i];
      if (typeof Homm2Renderer.letters[char] === "undefined") {
        continue;
      }

      if (char === " " && i + 1 == string.length) { // trim only single last space on line
        continue;
      }
      if (width) {
        width += Homm2Renderer.letterSpacing;
      }
      const charInfo = this.getCharInfo(char);

      width += (charInfo?.width ?? 0);
    }
    return width;
  }

  getCharInfo(char: string): CharInfo | undefined {
    return this.controller.getCharInfo(Homm2Renderer.letters, char);
  }

  /** Returns full message window width in pixels */
  getPopupWidth(): number {
    return this.getSectionInfo().width;
  }

  /** Returns free horizontal space for text in pixels */
  getPopupWidthWithoutPadding(): number {
    return this.getPopupWidth() - this.getPadding("left") - this.getPadding("right");
  }

  /** Returns full message window height in pixels */
  getPopupHeight(): number {
    const sectionInfo = this.getSectionInfo();
    return sectionInfo.top.size[1] + (sectionInfo.middle.size[1] * this.middlesCount) + sectionInfo.bottom.size[1];
  }

  /** Returns free vertical space for text in pixels */
  getPopupHeightWithoutPadding(): number {
    return this.getPopupHeight() - this.getPadding("top") - this.getPadding("bottom");
  }

  drawText(): void {
    for (let lineIndex = 0; lineIndex < this.textByLines.length; lineIndex++) {
      this.drawLine(lineIndex);
    }
  }

  drawLine(lineIndex: number): void {
    const textLine = this.textByLines[lineIndex];
    let x: number = 0;

    const jointLine = textLine.join("");
    const jointLineWidth = this.getStringWidth(jointLine);
    x = Math.floor((this.getPopupWidthWithoutPadding() - jointLineWidth) / 2);

    for (let wordIndex = 0; wordIndex < textLine.length; wordIndex++) {
      x = this.drawWord(lineIndex, textLine, wordIndex, x);
    }
  }

  drawWord(lineIndex: number, textLine: string[], wordIndex: number, currentX: number): number {
    const word = textLine[wordIndex];
    if (word === " " && wordIndex + 1 == textLine.length) {
      return currentX;
    }
    for (let charIndex = 0; charIndex < word.length; charIndex++) {
      currentX = this.drawChar(lineIndex, word, charIndex, currentX);
    }

    return currentX;
  }

  drawChar(lineIndex: number, word: string, charIndex: number, currentX: number): number {
    const context = this.getContext();
    if (context === null) {
      return currentX;
    }

    const char = word[charIndex];

    const charInfo = this.getCharInfo(char);
    if (charInfo === undefined) {
      return currentX;
    }

    if (charInfo.marginLeft !== undefined && (charIndex != 0 || charInfo.marginLeft > 0)) {
      currentX += charInfo.marginLeft;
    }

    if (char !== " " && charInfo.width !== undefined) {
      const x = this.getPadding("leftWithShadow") + currentX;
      const y = this.getLetterY(lineIndex);
      const charX = this.getCharX(charInfo);
      const charY = this.getCharY(charInfo);

      const extraHeightUp = charInfo.extraHeightUp ?? 0;
      const extraHeightDown = charInfo.extraHeightDown ?? 0;

      const charOffset = Homm2Renderer.lineHeight + extraHeightUp + extraHeightDown;
      context.drawImage(
        this.sprite, 
        charX,
        charY - extraHeightUp,
        charInfo.width,
          charOffset,
        x,
        y - extraHeightUp,
        charInfo.width,
          charOffset,
      );
      context.drawImage(
        this.sprite, 
        charX - 1,
        this.getCharShadowY(charInfo) - extraHeightUp + 1,
        charInfo.width,
          charOffset - 1,
        x - 1,
        y - extraHeightUp + 1,
        charInfo.width,
          charOffset - 1,
      );
    }

    currentX += (charInfo.width ?? 0);
    currentX += Homm2Renderer.letterSpacing;

    return currentX;
  }

  getLetterY(lineIndex: number) {
    if (!this.controller.isButtonsVisible()) {
      return lineIndex * Homm2Renderer.lineHeight + this.getPadding("top") + Math.round((this.getPopupHeightWithoutPadding() - this.textByLines.length * Homm2Renderer.lineHeight)/2);
    }
    return this.getPadding("top") + lineIndex * Homm2Renderer.lineHeight;
  }

  getCharX(charInfo: CharInfo) {
    return Homm2Renderer.lettersOffsetX + (charInfo.x ?? 0) * Homm2Renderer.letterContainerWidth;
  }

  getCharY(charInfo: CharInfo) {
    return Homm2Renderer.lettersOffsetY + (charInfo.y ?? 0) * Homm2Renderer.lineHeight;
  }

  getCharShadowY(charInfo: CharInfo) {
    return Homm2Renderer.lettersShadowOffsetY + (charInfo?.y ?? 0) * Homm2Renderer.lineHeight;
  }

  drawMessageSections(sectionInfo: Homm2SectionInfo): void {
    const context = this.getContext();
    if (context === null) {
      return;
    }

    const sectionsName = ["top", "middle", "bottom"] as const;

    let y = 0;
    for (let i = 0; i < sectionsName.length; i++) {
      const sectionName = sectionsName[i];
      const currentSection = sectionInfo[sectionName];
      const repetitions = (sectionName === "middle") ? this.middlesCount : 1;
      const x = this.controller.hasShadow()
        ? sectionInfo.shadowWidth
        : 0;
      for (let j = 0; j < repetitions; j++) {
        context.drawImage(
          this.sprite, 
          currentSection.offset[0],
          currentSection.offset[1],
          currentSection.size[0],
          currentSection.size[1],
          x,
          y,
          currentSection.size[0],
          currentSection.size[1]
        );
        if (this.controller.hasShadow()) {
          for (let k = 0; k < currentSection.shadows.length; k++) {
            const shadow = currentSection.shadows[k];
            context.drawImage(
              this.sprite, 
              shadow.offset[0],
              shadow.offset[1],
              shadow.size[0],
              shadow.size[1],
              x + shadow.parentOffset[0],
              y + shadow.parentOffset[1],
              shadow.size[0],
              shadow.size[1]
            );
          }
        }
        y += currentSection.size[1];
      }
    }
  }

  drawButtons(sectionInfo: Homm2SectionInfo) {
    const context = this.getContext();
    if (context === null) {
      return;
    }

    const buttonsInfo = sectionInfo.buttons[this.language];
    const buttonsCount = ((this.controller.hasButtonOk()) ? 1 : 0) + ((this.controller.hasButtonCancel()) ? 1 : 0);
    const buttonY = this.getPopupHeight() - this.getPadding("bottom");
    if (this.controller.hasButtonOk()) {
      let ok_x: number = 0;
      if (buttonsCount == 1) {
        ok_x = (this.controller.hasShadow() ? sectionInfo.shadowWidth : 0) + (this.getPopupWidth() - Homm2Renderer.buttonSize[0]) / 2;
      }
      if (buttonsCount == 2) {
        ok_x = (this.controller.hasShadow() ? sectionInfo.shadowWidth : 0) + this.getPopupWidth() / 2 - (Homm2Renderer.buttonSize[0] + Homm2Renderer.buttonMargin / 2);
      }

      context.drawImage(
        this.sprite, 
        buttonsInfo.ok.offsetX,
        buttonsInfo.ok.offsetY,
        Homm2Renderer.buttonSize[0],
        Homm2Renderer.buttonSize[1],
        ok_x,
        buttonY,
        Homm2Renderer.buttonSize[0],
        Homm2Renderer.buttonSize[1]
      );
    }

    if (this.controller.hasButtonCancel()) {
      let cancel_x: number = 0;
      if (buttonsCount == 2) {
        cancel_x = (this.controller.hasShadow() ? sectionInfo.shadowWidth : 0) + (this.getPopupWidth() + Homm2Renderer.buttonMargin) / 2;
      }
      if (buttonsCount == 1) {
        cancel_x = ((this.controller.hasShadow() ? sectionInfo.shadowWidth : 0) + this.getPopupWidth() - Homm2Renderer.buttonSize[0]) / 2;
      }

      context.drawImage(
        this.sprite, 
        buttonsInfo.cancel.offsetX,
        buttonsInfo.cancel.offsetY,
        Homm2Renderer.buttonSize[0],
        Homm2Renderer.buttonSize[1],
        cancel_x,
        buttonY,
        Homm2Renderer.buttonSize[0],
        Homm2Renderer.buttonSize[1]
      );
    }
  }

  getSectionInfo(): Homm2SectionInfo {
    return Homm2Renderer.sectionsInfo[this.controller.getHomm2Theme()];
  }

  getContext(): CanvasRenderingContext2D | null {
    return this.controller.getContext();
  }
}