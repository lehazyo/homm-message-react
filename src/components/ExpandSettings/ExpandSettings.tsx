import React from "react";
import { observer } from "mobx-react-lite";
import { settingsStore } from "../App/App";
import { HommButton } from "../HommButton/HommButton";
import styles from "./ExpandSettings.module.css";

export const ExpandSettings = observer(() => {
    return (
        <HommButton className={styles.button} onClick={() => { settingsStore.setExpandSettings(!settingsStore.expandSettings) }}>
            {settingsStore.expandSettings ? "Collapse settings" : "Expand settings"}
        </HommButton>
    )
});
