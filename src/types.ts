export type HommVersion = "homm2" | "homm3";

export type CharInfo = {
    width?: number,
    height?: number,
    x?: number,
    y?: number,
    extraHeightDown?: number,
    extraHeightUp?: number,
    marginRight?: number,
    marginLeft?: number,
    translateY?: number,
    sameAs?: string,
}

export type LettersInfo = { [key: string]: CharInfo };

export type Homm2Theme = "good" | "evil";

type Homm3Line = {
    half?: number,
    resize?: number,
}

export type Homm3PlayerColor = "red" | "blue" | "orange" | "green" | "brown" | "violet" | "teal" | "pink";

type Homm3SizePadding = {
    top?: number,
    right?: number,
    left?: number,
}

export type Homm3Size = {
    width: number,
    height: number,
    maxTextLines: number,
    lastLineWidth?: number,
    padding?: Homm3SizePadding,
    lines?: { [k: string]: Homm3Line },
    scroll?: boolean,
}

export type ColorInfo = {
    cornersOffset: [number, number],
    horizontalsOffset: number,
    verticalsOffset: number,
}

export type ColorsInfo = { [k in Homm3PlayerColor]: ColorInfo }

export type Homm2SectionsInfo = { [k in Homm2Theme]: Homm2SectionInfo };

export type Homm2SectionInfo = {
    width: number,
    shadowWidth: number,
    padding: Homm2SectionPadding,
    buttons: Homm2Buttons,
    top: Homm2DirectionSection,
    middle: Homm2DirectionSection,
    bottom: Homm2DirectionSection,
}

type Homm2Shadow = {
    offset: [number, number],
    size: [number, number],
    parentOffset: [number, number],
}

type Homm2DirectionSection = {
    offset: [number, number],
    size: [number, number],
    shadows: Homm2Shadow[],
}

export type Homm2PaddingDirections = "top" | "right" | "bottom" | "bottomWithButtons" | "left";

type Homm2SectionPadding = {
    top?: number,
    right?: number,
    bottom?: number,
    bottomWithButtons?: number,
    left?: number,
}

type Homm2Buttons = {
    [k in Homm2Languages]: Homm2Button
}

type Homm2Languages = "eng" | "rus";

type Homm2Button = {
    [k in Homm2ButtonType]: {
        offsetX: number,
        offsetY: number,
    }
}

type Homm2ButtonType = "ok" | "cancel";

