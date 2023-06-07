import React from "react";
import { settingsStore } from "../App/App";
import styles from "./Canvas.module.css";

export const Canvas = () => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        if (canvasRef.current !== null) {
            settingsStore.setCanvas(canvasRef.current);
            settingsStore.prepareShareData();
        }
    }, [canvasRef.current]);

    return (
        <div className={styles.canvasWrapper}>
            <canvas className={styles.canvas} ref={canvasRef} />
        </div>
    )
}