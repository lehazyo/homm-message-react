import React from "react";
import { observer } from "mobx-react-lite";
import { HommButton } from "../HommButton/HommButton";
import { settingsStore } from "../App/App";
import styles from "./Download.module.css";

export const Download = observer(() => {
    return (
        <div className={styles.wrapper}>
            <HommButton>
                <a
                    className={styles.download}
                    id="download"
                    download={settingsStore.downloadFileName}
                    href={settingsStore.downloadData}
                >
                    Download current image
                </a>
            </HommButton>
        </div>
    )
});
