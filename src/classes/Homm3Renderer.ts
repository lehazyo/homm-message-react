import homm3Letters from "../json/homm3Symbols.json";
import homm3Colors from "../json/homm3Colors.json";
import homm3Sizes from "../json/homm3Sizes.json";
import { Controller } from "./Controller";
import { CharInfo, ColorInfo, ColorsInfo, Homm3Size, LettersInfo } from "../types";

export class Homm3Renderer {
  controller: Controller;

  messageSize: Homm3Size;
  forcedWidth: number = 0;
  forcedHeight: number = 0;

  borderSize: number = 64;
  bgSize: number = 256;
  lineHeight: number = 18;
  letterSpacing: number = 1;
  raiseByHalfLine: boolean = false;
  
  horizontalBorderHeight: number = 15;
  verticalBorderHeight: number = 14;
  horizontalColorHeight: number = 5;
  verticalColorWidth: number = 4;

  colorCornerSize: number = 56;
  
  buttonSize: [number, number] = [66, 32];
  buttonMargin: number = 16;

  // Offset of both two levels of shadow
  shadowOffset: [number, number] = [8, 8];

  static letters: LettersInfo = homm3Letters as LettersInfo;
  static colors: ColorsInfo = homm3Colors as ColorsInfo;
  static sizes: Homm3Size[] = homm3Sizes as Homm3Size[];

  // Paddings in pixels
  padding: Record<"top" | "bottom" | "right" | "left", number> = {
    top: 11,
    bottom: 15,
    right: 11,
    left: 10,
  };

  scrollSide = 16;
  scroll_margins: Record<"top" | "bottom" | "right", number> = {
    top: 20,
    right: 11,
    bottom: 23
  };
  scrollVisible: boolean = false;

  // how many lines of text you need for scroll to appear
  linesNeededToShowScroll: number = 12;

  // text split into lines
  textByLines: string[][] = [];

  readyToRender: boolean = false;
  renderInterval: NodeJS.Timeout | null = null;
  sprite: HTMLImageElement;

  constructor(controller: Controller) {
    this.controller = controller;

    this.sprite = new Image();
    this.sprite.src = "img/homm3-sprite.png";
    this.sprite.onload = () => {
      this.readyToRender = true;
      this.controller.render();
    };

    this.messageSize = Homm3Renderer.sizes[0];
  }

  render(): void {
    if (!this.readyToRender) {
      return;
    }

    this.setDefaults();
    this.checkForcedWidth();
    this.splitTextToLines();
    this.setCanvasSize();
    this.drawMessageWindow();
    this.drawText();
  }

  splitTextToLines(): void {
    let suitableSizeFound = false;

    let currentLine: string[] = [];
    let currentSpaceString = "";
    let isNewLine = false;
    let isSpaceBlock = false;
    let block = "";
    let isLineLast = false;
    let halfAt: number | undefined;
    let resizeAt: number | undefined;
    let currentLineWithBlock = "";
    let currentLineWithBlockWidth = 0;
    let lastLineWidth = 0;

    // cycling through all possible sizes
    for (let i = 0; i < Homm3Renderer.sizes.length; i++) {
      this.textByLines = [];

      this.messageSize = Homm3Renderer.sizes[i];
      this.scrollVisible = !!this.messageSize?.scroll;

      if (this.controller.getSplitWords().length === 0) {
        break;
      }

      currentLine = [];
      currentSpaceString = "";
      isNewLine = false;
      isSpaceBlock = false;
      block = "";

      for (let i = 0; i < this.controller.getSplitWords().length; i++) {
        this.raiseByHalfLine = false;

        halfAt = this.getHalfAt();
        resizeAt = this.getResizeAt();

        isLineLast = (this.textByLines.length == this.messageSize.maxTextLines);

        suitableSizeFound = true;

        block = this.controller.getSplitWords()[i];
        isNewLine = (block.match(/^[\n\r]+$/) !== null);
        isSpaceBlock = (block.match(/^\s+$/) !== null && !isNewLine);

        currentLineWithBlock = currentLine.join("") + block;
        currentLineWithBlockWidth = this.getStringWidth(currentLineWithBlock);

        if (isNewLine) { // new line
          this.textByLines.push(currentLine);
          currentLine = [];
          currentSpaceString = "";
          continue;
        } else if (isSpaceBlock) { // space block
          for (let j = 0; j < block.length; j++) {
            const spaceChar = block[j];
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

        // if width with space block is enough to trigger resize, let's trigger it
        if (resizeAt && (currentLineWithBlockWidth >= resizeAt || currentLineWithBlockWidth >= resizeAt)) {
          break;
        }

        if (halfAt && (currentLineWithBlockWidth >= halfAt || currentLineWithBlockWidth >= halfAt)) {
          this.raiseByHalfLine = true;
        }
      }

      // line remainder makes the new line
      if (currentLine.length) {
        this.textByLines.push(currentLine);

        lastLineWidth = this.getStringWidth(currentLine.join(""));

        resizeAt = this.getResizeAt();
        if (resizeAt && lastLineWidth >= resizeAt) {
          continue; // trying next message size
        }

        halfAt = this.getHalfAt();
        this.raiseByHalfLine = (halfAt !== undefined && lastLineWidth >= halfAt);
      }

      if (this.messageSize.maxTextLines !== undefined && this.textByLines.length > this.messageSize.maxTextLines) {
        suitableSizeFound = false;

        this.textByLines.splice(this.messageSize.maxTextLines, this.textByLines.length - this.messageSize.maxTextLines);
      }

      if (suitableSizeFound) {
        // if suitable size is found, we don't need to search bigger sizes
        break;
      }
    }
  }

  drawText(): void {
    const context = this.getContext();
    if (context === null) {
      return;
    }

    for (let lineIndex = 0; lineIndex < this.textByLines.length; lineIndex++) {
      const textLine = this.textByLines[lineIndex];
      let currentX = 0;

      if (!this.scrollVisible) { // text align: center
        const jointLine = textLine.join("");
        const jointLineWidth = this.getStringWidth(jointLine);
        currentX = Math.floor((this.getPopupWidthWithoutPadding() - jointLineWidth) / 2);
      } else {
        // render scroll
        this.drawScroll();
      }

      for (let wordIndex = 0; wordIndex < textLine.length; wordIndex++) {
        const word = textLine[wordIndex];
        if (word === " " && wordIndex + 1 == textLine.length) {
          continue;
        }
        for (let charIndex = 0; charIndex < word.length; charIndex++) {
          const char = word[charIndex];
          if (typeof Homm3Renderer.letters[char] === "undefined") {
            continue;
          }
          const charInfo = this.getCharInfo(char);
          if (charInfo === undefined) {
            continue;
          }

          if (charInfo.marginLeft !== undefined && (wordIndex != 0 || charIndex != 0 || charInfo.marginLeft > 0)) {
            currentX += charInfo.marginLeft;
          }

          if (typeof charInfo.width !== "undefined" && typeof charInfo.height !== "undefined") {
            const xToDraw = this.getPadding("left") + currentX;
            const yToDraw = this.getLetterY(lineIndex, charInfo);

            context.drawImage(
              this.sprite, 
              charInfo.x ?? 0, 
              charInfo.y ?? 0,
              charInfo.width,
              charInfo.height,
              xToDraw,
              yToDraw,
              charInfo.width, 
              charInfo.height,
            );
          }

          currentX += (charInfo.width ?? 0);
          currentX += this.letterSpacing;
          if (typeof charInfo.marginRight !== "undefined") {
            currentX += charInfo.marginRight;
          }
        }
      }
    }
  }

  /** Check if there is a line that has no word-breaks and forces window to become wider */
  checkForcedWidth(): void {
    let maximumStringWidth = 0;

    for (let i = 0; i < this.controller.getSplitWords().length; i++) {
      const block = this.controller.getSplitWords()[i];
      // Only string of spaces performs word-break, so we don't check it
      if (block.match(/^\s+$/)) {
        continue;
      }

      if (maximumStringWidth < this.getStringWidth(block)) {
        maximumStringWidth = this.getStringWidth(block);
      }
    }

    for (let i = 0; i < 99; i++) {
      const proposedWidth = i * this.borderSize;
      if (proposedWidth > maximumStringWidth) {
        this.forcedWidth = i;
        break;
      }
    }
  }

  getCharInfo(char: string): CharInfo | undefined {
    return this.controller.getCharInfo(Homm3Renderer.letters, char);
  }

  getStringWidth(string: string): number {
    let width: number = 0;
    for (let i = 0; i < string.length; i++) {
      const char = string[i];
      const charInfo = this.getCharInfo(char);
      if (charInfo === undefined) {
        continue;
      }

      // trim only single last space in line
      if (char === " " && i + 1 == string.length) {
        continue;
      }
      if (width) {
        width += this.letterSpacing;
      }

      width += (charInfo.width ?? 0);
      if (charInfo.marginLeft !== undefined && i != 0) {
        width += charInfo.marginLeft;
      }
      if (charInfo.marginRight !== undefined) {
        width += charInfo.marginRight;
      }
    }
    return width;
  }

  /** Sets canvas element dimensions */
  setCanvasSize(): void {
    this.controller.setCanvasSize(this.getCanvasWidth(), this.getCanvasHeight());
  }


  /** Returns canvas width (message window + shadow) */
  getCanvasWidth(): number {
    return this.getPopupWidth() + (this.controller.hasShadow() ? this.shadowOffset[0] : 0);
  }

  /** Returns canvas height (message window + shadow) */
  getCanvasHeight(): number {
    return this.getPopupHeight() + (this.controller.hasShadow() ? this.shadowOffset[1] : 0);
  }

  /** Returns full message window width in pixels */
  getPopupWidth(): number {
    return this.getMessageSizeWidth() * this.borderSize;
  }

  /** Returns free horizontal space for text in pixels */
  getPopupWidthWithoutPadding(): number {
    return this.getPopupWidth() - this.getPadding("left") - this.getPadding("right");
  }

  /** Returns full message window height in pixels */
  getPopupHeight(): number {
    return this.getMessageSizeHeight() * this.borderSize;
  }

  /** Returns free vertical space for text in pixels */
  getPopupHeightWithoutPadding() {
    return this.getPopupHeight() - this.getPadding("top") - this.getPadding("bottom");
  }

  /** Renders message window's shadow on canvas */
  drawShadow(): void {
    const context = this.getContext();
    if (context === null) {
      return;
    }
    
    context.beginPath();
    context.fillStyle = "rgba(0,0,0,.1)";
    context.rect(
      this.shadowOffset[0],
      this.shadowOffset[1],
      this.getPopupWidth(),
      this.getPopupHeight()
    );
    context.fill();

    context.beginPath();
    context.fillStyle = "rgba(0,0,0,.1)";
    context.rect(
      this.shadowOffset[0] + 1,
      this.shadowOffset[1] + 1,
      this.getPopupWidth() - 2,
      this.getPopupHeight() - 2
    );
    context.fill();
  }

  /** Renders background on canvas */
  drawBackground(): void {
    const context = this.getContext();
    if (context === null) {
      return;
    }

    const xCycles = Math.ceil(this.getMessageSizeWidth() * this.borderSize / this.bgSize);
    const yCycles = Math.ceil(this.getMessageSizeHeight() * this.borderSize / this.bgSize);
    for (let y = 0; y < yCycles; y++) {
      for (let x = 0; x < xCycles; x++) {
        let width = this.bgSize;
        let height = this.bgSize;
        if (x + 1 === xCycles) {
          width = this.getPopupWidth() - x * this.bgSize;
        }
        if (y + 1 === yCycles) {
          height = this.getPopupHeight() - y * this.bgSize;
        }

        context.drawImage(
          this.sprite, 
          648, 
          0, 
          width,
          height,
          x * this.bgSize,
          y * this.bgSize,
          width,
          height
        );
      }
    }
  }

  /** Visually renders message window on canvas */
  drawMessageWindow(): void {
    if (this.controller.hasShadow()) {
      this.drawShadow();
    }

    const colorInfo: ColorInfo = Homm3Renderer.colors[this.controller.getColor()];

    this.drawBackground();
    this.drawCorners(colorInfo);
    this.drawHorizontalBorders(colorInfo);
    this.drawVerticalBorders(colorInfo);

    if (this.controller.isButtonsVisible()) {
      this.drawButtons();
    }
  }

  drawButtons(): void {
    const context = this.getContext();
    if (context === null) {
      return;
    }

    const buttonsCount = ((this.controller.hasButtonOk()) ? 1 : 0) + ((this.controller.hasButtonCancel()) ? 1 : 0);
    const buttonY = this.getPopupHeight() - this.buttonSize[1] - this.getPadding("bottom");
    if (this.controller.hasButtonOk()) {
      let okX: number = 0;
      if (buttonsCount == 1) {
        okX = (this.getPopupWidth() - this.buttonSize[0]) / 2;
      }
      if (buttonsCount == 2) {
        okX = this.getPopupWidth() / 2 - (this.buttonSize[0] + this.buttonMargin / 2);
      }
      context.drawImage(
        this.sprite, 
        516,
        228,
        this.buttonSize[0],
        this.buttonSize[1],
        okX,
        buttonY,
        this.buttonSize[0],
        this.buttonSize[1]
      );
    }

    if (this.controller.hasButtonCancel()) {
      let cancelX = 0;
      if (buttonsCount == 2) {
        cancelX = (this.getPopupWidth() + this.buttonMargin) / 2;
      }
      if (buttonsCount == 1) {
        cancelX = (this.getPopupWidth() - this.buttonSize[0]) / 2;
      }
      context.drawImage(
        this.sprite, 
        516,
        259,
        this.buttonSize[0],
        this.buttonSize[1],
        cancelX,
        buttonY,
        this.buttonSize[0],
        this.buttonSize[1]
      );
    }
  }

  drawVerticalBorders(colorInfo: ColorInfo): void {
    const context = this.getContext();
    if (context === null) {
      return;
    }

    for (let i = 1; i < this.getMessageSizeHeight() - 1; i++) {
      const x = this.getCanvasWidth() - this.verticalBorderHeight - (this.controller.hasShadow() ? this.shadowOffset[0] : 0);
      const y = i * this.borderSize;
      // left
      context.drawImage(
        this.sprite, 
        this.borderSize * 2,
        this.horizontalBorderHeight,
        this.verticalBorderHeight, 
        this.borderSize,
        0,
        y,
        this.verticalBorderHeight, 
        this.borderSize
      );

      // right
      context.drawImage(
        this.sprite, 
        this.borderSize * 3 - this.verticalBorderHeight,
        this.horizontalBorderHeight,
        this.verticalBorderHeight,
        this.borderSize, 
        x,
        y,
        this.verticalBorderHeight,
        this.borderSize
      );

      // colors
      if (colorInfo) {
        // left
        context.drawImage(
          this.sprite,
          colorInfo.verticalsOffset,
          this.borderSize * 2,
          this.verticalColorWidth,
          this.borderSize, 
          8,
          y,
          this.verticalColorWidth,
          this.borderSize
        );

        // right
        context.drawImage(
          this.sprite, 
          colorInfo.verticalsOffset,
          this.borderSize * 2,
          this.verticalColorWidth,
          this.borderSize, 
          x + 2,
          y,
          this.verticalColorWidth,
          this.borderSize
        );
      }
    }
  }

  drawHorizontalBorders(colorInfo: ColorInfo): void {
    const context = this.getContext();
    if (context === null) {
      return;
    }

    for (let i = 1; i < this.getMessageSizeWidth() - 1; i++) {
      const x = i * this.borderSize;
      const y = this.getCanvasHeight() - this.horizontalBorderHeight - (this.controller.hasShadow() ? this.shadowOffset[1] : 0);
      // upper
      context.drawImage(
        this.sprite, 
        this.borderSize * 2,
        0,
        this.borderSize, 
        this.horizontalBorderHeight,
        x,
        0,
        this.borderSize, 
        this.horizontalBorderHeight
      );

      // lower
      context.drawImage(
        this.sprite, 
        this.borderSize * 2,
        this.horizontalBorderHeight + this.borderSize,
        this.borderSize, 
        this.horizontalBorderHeight,
        x,
        y,
        this.borderSize, 
        this.horizontalBorderHeight
      );

      // colors
      if (colorInfo) {
        // upper
        context.drawImage(
          this.sprite, 
          this.borderSize * 2,
          colorInfo.horizontalsOffset,
          this.borderSize, 
          this.horizontalColorHeight,
          x,
          8,
          this.borderSize, 
          this.horizontalColorHeight
        );

        // lower
        context.drawImage(
          this.sprite, 
          this.borderSize * 2,
          colorInfo.horizontalsOffset + 1 + this.horizontalColorHeight,
          this.borderSize, 
          this.horizontalColorHeight,
          x,
          y + 2,
          this.borderSize, 
          this.horizontalColorHeight
        );
      }
    }
  }

  drawCorners(colorInfo: ColorInfo): void {
    const context = this.getContext();
    if (context === null) {
      return;
    }

    for (let y = 0; y < 2; y++) {
      for (let x = 0; x < 2; x++) {
        let xToSet = 0;
        let xToCut = 0;
        let colorX = 8;
        if (x === 1) {
          xToSet = this.getPopupWidth() - this.borderSize;
          xToCut = this.borderSize;
          colorX = this.getPopupWidth() - 8 - this.colorCornerSize;
        }

        let yToSet = 0;
        let yToCut = 0;
        let colorY = 8;
        if (y === 1) {
          yToSet = this.getPopupHeight() - this.borderSize;
          yToCut = this.borderSize;
          colorY = this.getPopupHeight() - 8 - this.colorCornerSize;
        }

        context.drawImage(
          this.sprite, 
          xToCut,
          yToCut,
          this.borderSize, 
          this.borderSize,
          xToSet,
          yToSet,
          this.borderSize, 
          this.borderSize,
        );

        // color
        if (colorInfo) {
          context.drawImage(
            this.sprite, 
            colorInfo.cornersOffset[0] + (1 + this.colorCornerSize) * x,
            colorInfo.cornersOffset[1] + (1 + this.colorCornerSize) * y,
            this.colorCornerSize, 
            this.colorCornerSize,
            colorX,
            colorY,
            this.colorCornerSize, 
            this.colorCornerSize
          );
        }
      }
    }
  }

  /** Gets padding from single direction plus border size */
  getPadding(direction: "top" | "right" | "bottom" | "left"): number {
    if (direction === "bottom" && !this.controller.isButtonsVisible()) {
      return this.getPadding("top");
    }

    let padding = this.padding[direction];
    if (direction !== "bottom") {
      padding = this.messageSize?.padding?.[direction] ?? padding;
    }
    const borderSize = (direction === "top" || direction === "bottom")
      ? this.horizontalBorderHeight
      : this.verticalBorderHeight;
    return padding + borderSize;
  }

  /** Draws scrollbar on canvas */
  drawScroll(): void {
    const context = this.getContext();
    if (context === null) {
      return;
    }

    const scrollX = this.getPopupWidth() - this.verticalBorderHeight - this.scrollSide - this.scroll_margins.right;
    const scrollStartY = this.horizontalBorderHeight + this.scroll_margins.top;
    const scrollEndY = this.getPopupHeight() - this.getPadding("bottom") - (this.controller.isButtonsVisible() ? (this.buttonSize[1] + this.scroll_margins.bottom) : 0);

    // top arrow
    context.drawImage(
      this.sprite, 
      714, 
      257,
      this.scrollSide, 
      this.scrollSide,
      scrollX,
      scrollStartY,
      this.scrollSide, 
      this.scrollSide
    );

    // scroll handle
    context.drawImage(
      this.sprite, 
      731, 
      257,
      this.scrollSide, 
      this.scrollSide,
      scrollX,
      scrollStartY + this.scrollSide,
      this.scrollSide, 
      this.scrollSide
    );

    // bottom arrow
    context.drawImage(
      this.sprite, 
      748, 
      257,
      this.scrollSide, 
      this.scrollSide,
      scrollX,
      scrollEndY - this.scrollSide,
      this.scrollSide, 
      this.scrollSide
    );

    // scroll track
    context.fillStyle = "#000";
    context.beginPath();
    context.rect(
      scrollX,
      scrollStartY + 32,
      this.scrollSide,
      scrollEndY - scrollStartY - 48
    );
    context.fill();
  }

  /** Clears canvas and sets defaults where necessary */
  setDefaults(): void {
    const context = this.getContext();
    if (context === null) {
      return;
    }

    this.forcedWidth = 0;
    this.forcedHeight = 0;
    this.scrollVisible = false;
    context.clearRect(0, 0, 999999, 999999);
  }

  getHalfAt(): number | undefined {
    return this.messageSize?.lines?.[this.textByLines.length.toString()]?.half;
  }

  getResizeAt(): number | undefined {
    return this.messageSize?.lines?.[this.textByLines.length.toString()]?.resize;
  }

  /** Returns Y position of letter on canvas for rendering */
  getLetterY(lineIndex: number, charInfo: CharInfo): number {
    let y = 0;

    // positioning regular char relative to line
    y = lineIndex * this.lineHeight + (this.lineHeight - (charInfo.height ?? 0));

    // special char y position
    if (typeof charInfo.translateY !== "undefined") {
      y += charInfo.translateY;
    }

    if (!this.controller.isButtonsVisible()) {
      y += Math.round((this.getPopupHeight() - this.textByLines.length * this.lineHeight)/2) - 7; // dunno what is 7 but it works :[
      return y;
    }

    // text moves up half-line every line (first line does not move)
    y += this.getPadding("top") - (this.textByLines.length - 1) * (this.lineHeight / 2);

    if (this.getMessageSizeHeight() > 2) {
      y += 14 + (this.getMessageSizeHeight() - 2) * this.lineHeight;
    }

    // sorry, I don't care anymore.............
    if (this.messageSize.width == 5) {
      if (this.textByLines.length >= 9) {
        y += this.lineHeight;
      } else if (this.textByLines.length >= 5) {
        y += this.lineHeight / 2;
      }
    } else if (this.messageSize.width == 7) {
      if (this.textByLines.length >= 9) {
        y += this.lineHeight;
      } else if (this.textByLines.length >= 7) {
        y += this.lineHeight / 2;
      }
    } else if (this.messageSize.width == 10) {
      if (this.textByLines.length >= 9) {
        y += this.lineHeight / 2;
      }
    }

    // raise by half-line
    if (this.raiseByHalfLine) {
      y -= this.lineHeight / 2;
    }

    return y;
  }

  getMessageSizeWidth(): number {
    return this.messageSize.width ?? 0;
  }
  
  getMessageSizeHeight(): number {
    return this.messageSize.height ?? 0;
  }

  getContext(): CanvasRenderingContext2D | null {
    return this.controller.getContext();
  }
}