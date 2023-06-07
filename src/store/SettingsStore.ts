import { makeAutoObservable, observable } from "mobx";
import type { Homm2Theme, Homm3PlayerColor, HommVersion } from "../types";
import { Controller } from "../classes/Controller";

export class SettingsStore {
    hommVersion: HommVersion = "homm3";
    homm2Theme: Homm2Theme = "good";
    homm3PlayerColor: Homm3PlayerColor = "red";
    text: string = "Write your text in the left panel";

    buttonOkay: boolean = true;
    buttonCancel: boolean = false;
    showShadow: boolean = false;

    renderController = new Controller(this);

    downloadFileName: string = "";
    downloadData: string = "";

    canvas: HTMLCanvasElement | null = null;
    context: CanvasRenderingContext2D | null = null;

    expandSettings: boolean = false;

    shareData: ShareData | undefined;

    constructor() {
        makeAutoObservable(this, {
            hommVersion: observable,
            homm2Theme: observable,
            homm3PlayerColor: observable,
            buttonOkay: observable,
            buttonCancel: observable,
            showShadow: observable,
            text: observable,
            downloadFileName: observable,
            downloadData: observable,
        });
    }

    setHommVersion(version: HommVersion): void {
        this.hommVersion = version;
        this.renderController.setRenderer(version);
    }

    setHomm2Theme(theme: Homm2Theme): void {
        this.homm2Theme = theme;
        this.render();
    }

    setText(text: string): void {
        this.text = text;
        this.render();
    }

    setControlOkay(value: boolean): void {
        this.buttonOkay = value;
        this.render();
    }

    setControlCancel(value: boolean): void {
        this.buttonCancel = value;
        this.render();
    }

    setControlShadow(value: boolean): void {
        this.showShadow = value;
        this.render();
    }

    setPlayerColor(color: Homm3PlayerColor): void {
        this.homm3PlayerColor = color;
        this.render();
    }

    render(): void {
        this.renderController.render();
        this.prepareShareData();
    }

    /** Prepares object for Web Share API */
    async prepareShareData(): Promise<void> {
        if (this.canvas === null) {
            return;
        }

        const dataUrl = this.canvas.toDataURL();
        const blob = await (await fetch(dataUrl)).blob();
        const filesArray = [
            new File(
                [blob],
                this.downloadFileName,
                {
                    type: blob.type,
                    lastModified: new Date().getTime()
                }
            )
        ];

        this.shareData = {
            files: filesArray,
        };
    }

    setDownloadFileName(link: string): void {
        this.downloadFileName = link;
    }

    setDownloadData(data: string): void {
        this.downloadData = data;
    }

    setCanvas(canvas: HTMLCanvasElement): void {
        this.canvas = canvas;
        const context = canvas.getContext("2d");
        if (context === null) {
            return;
        }
        this.setContext(context);
    }

    setContext(context: CanvasRenderingContext2D): void {
        this.context = context;
        this.renderController.render();
    }

    setExpandSettings(expand: boolean): void {
        this.expandSettings = expand;
    }
}
